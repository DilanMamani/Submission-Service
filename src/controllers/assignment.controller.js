const { pool } = require("../config/db");

const createAssignment = async (req, res) => {
  try {
    const { title, description, language, deadline, professor_id } = req.body;

    if (!title || !language || !deadline || !professor_id) {
      return res.status(400).json({
        ok: false,
        message: "title, language, deadline y professor_id son obligatorios",
      });
    }

    const professorResult = await pool.query(
      "select id, full_name, email, role from users_app where id = $1 and role = 'professor'",
      [professor_id]
    );

    if (professorResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Profesor no encontrado o el usuario no tiene rol professor",
      });
    }

    const result = await pool.query(
      `insert into assignments
       (title, description, language, deadline, professor_id)
       values ($1, $2, $3, $4, $5)
       returning *`,
      [title, description || null, language, deadline, professor_id]
    );

    const assignment = result.rows[0];

    await pool.query(
      `insert into audit_logs
       (user_id, service_name, action, entity_name, entity_id, new_value, description)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        professor_id,
        "submission-service",
        "ASSIGNMENT_CREATED",
        "assignments",
        assignment.id,
        assignment,
        "El profesor creó una nueva tarea con fecha límite.",
      ]
    );

    return res.status(201).json({
      ok: true,
      message: "Tarea creada correctamente",
      assignment,
    });
  } catch (error) {
    console.error("Error creando tarea:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al crear tarea",
      error: error.message,
    });
  }
};

const getAssignments = async (req, res) => {
  try {
    const result = await pool.query(
      `select
        a.id,
        a.title,
        a.description,
        a.language,
        a.deadline,
        a.professor_id,
        u.full_name as professor_name,
        a.created_at
       from assignments a
       join users_app u on u.id = a.professor_id
       order by a.created_at desc`
    );

    return res.json({
      ok: true,
      total: result.rows.length,
      assignments: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo tareas:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener tareas",
      error: error.message,
    });
  }
};

const getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `select
        a.id,
        a.title,
        a.description,
        a.language,
        a.deadline,
        a.professor_id,
        u.full_name as professor_name,
        a.created_at
       from assignments a
       join users_app u on u.id = a.professor_id
       where a.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Tarea no encontrada",
      });
    }

    return res.json({
      ok: true,
      assignment: result.rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo tarea:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener tarea",
      error: error.message,
    });
  }
};
const getAssignmentSummary = async (req, res) => {
  try {
    const { id } = req.params;

    const assignmentResult = await pool.query(
      `select
        a.id,
        a.title,
        a.description,
        a.language,
        a.deadline,
        a.created_at,
        u.full_name as professor_name,
        case
          when a.deadline < current_timestamp then 'closed'
          else 'open'
        end as assignment_status
       from assignments a
       join users_app u on u.id = a.professor_id
       where a.id = $1`,
      [id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Tarea no encontrada",
      });
    }

    const statsResult = await pool.query(
      `select
        count(*)::int as total_submissions,
        count(distinct student_id)::int as total_students,
        coalesce(max(attempt_number), 0)::int as max_attempts,
        max(submitted_at) as last_submission_at
       from submissions
       where assignment_id = $1`,
      [id]
    );

    const statusResult = await pool.query(
      `select
        status,
        count(*)::int as total
       from submissions
       where assignment_id = $1
       group by status`,
      [id]
    );

    return res.json({
      ok: true,
      assignment: assignmentResult.rows[0],
      stats: statsResult.rows[0],
      submissions_by_status: statusResult.rows,
    });
  } catch (error) {
    console.error("Error obteniendo resumen de tarea:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener resumen de tarea",
      error: error.message,
    });
  }
};
module.exports = {
  createAssignment,
  getAssignments,
  getAssignmentById,
  getAssignmentSummary,
};