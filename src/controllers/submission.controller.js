const { pool } = require("../config/db");

const createSubmission = async (req, res) => {
  try {
    const { assignment_id, student_id, source_code, language } = req.body;

    if (!assignment_id || !student_id || !source_code || !language) {
      return res.status(400).json({
        ok: false,
        message:
          "assignment_id, student_id, source_code y language son obligatorios",
      });
    }

    const assignmentResult = await pool.query(
      `select id, title, language, deadline
       from assignments
       where id = $1`,
      [assignment_id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "La tarea no existe",
      });
    }

    const assignment = assignmentResult.rows[0];

    const studentResult = await pool.query(
      `select id, full_name, email, role
       from users_app
       where id = $1 and role = 'student'`,
      [student_id]
    );

    if (studentResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Estudiante no encontrado o el usuario no tiene rol student",
      });
    }

    const now = new Date();
    const deadline = new Date(assignment.deadline);

    if (now > deadline) {
      await pool.query(
        `insert into audit_logs
         (user_id, service_name, action, entity_name, entity_id, description)
         values ($1, $2, $3, $4, $5, $6)`,
        [
          student_id,
          "submission-service",
          "SUBMISSION_REJECTED_BY_DEADLINE",
          "assignments",
          assignment_id,
          `El estudiante intentó enviar código fuera de fecha para la tarea: ${assignment.title}`,
        ]
      );

      return res.status(400).json({
        ok: false,
        message: "La fecha límite ya pasó. El envío fue rechazado.",
        deadline: assignment.deadline,
        current_time: now,
      });
    }

    if (language.toLowerCase() !== assignment.language.toLowerCase()) {
      return res.status(400).json({
        ok: false,
        message: `Lenguaje inválido. La tarea requiere ${assignment.language}`,
      });
    }

    const attemptResult = await pool.query(
      `select coalesce(max(attempt_number), 0) + 1 as next_attempt
       from submissions
       where assignment_id = $1 and student_id = $2`,
      [assignment_id, student_id]
    );

    const attemptNumber = Number(attemptResult.rows[0].next_attempt);

    const submissionResult = await pool.query(
      `insert into submissions
       (assignment_id, student_id, source_code, language, attempt_number, status)
       values ($1, $2, $3, $4, $5, 'submitted')
       returning *`,
      [assignment_id, student_id, source_code, language, attemptNumber]
    );

    const submission = submissionResult.rows[0];

    await pool.query(
      `insert into audit_logs
       (user_id, service_name, action, entity_name, entity_id, new_value, description)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        student_id,
        "submission-service",
        "SUBMISSION_CREATED",
        "submissions",
        submission.id,
        submission,
        `El estudiante envió código correctamente. Intento número ${attemptNumber}.`,
      ]
    );

    return res.status(201).json({
      ok: true,
      message: "Código enviado correctamente",
      submission,
      attempt_number: attemptNumber,
    });
  } catch (error) {
    console.error("Error creando envío:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al crear envío",
      error: error.message,
    });
  }
};

const getSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `select
        s.id,
        s.assignment_id,
        a.title as assignment_title,
        s.student_id,
        u.full_name as student_name,
        u.email as student_email,
        s.source_code,
        s.language,
        s.attempt_number,
        s.status,
        s.submitted_at
       from submissions s
       join assignments a on a.id = s.assignment_id
       join users_app u on u.id = s.student_id
       where s.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Envío no encontrado",
      });
    }

    return res.json({
      ok: true,
      submission: result.rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo envío:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener envío",
      error: error.message,
    });
  }
};

const getSubmissionsByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;

    const result = await pool.query(
      `select
        s.id,
        s.assignment_id,
        a.title as assignment_title,
        s.student_id,
        s.language,
        s.attempt_number,
        s.status,
        s.submitted_at
       from submissions s
       join assignments a on a.id = s.assignment_id
       where s.student_id = $1
       order by s.submitted_at desc`,
      [studentId]
    );

    return res.json({
      ok: true,
      total: result.rows.length,
      submissions: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo envíos del estudiante:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener envíos del estudiante",
      error: error.message,
    });
  }
};

const getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const result = await pool.query(
      `select
        s.id,
        s.assignment_id,
        s.student_id,
        u.full_name as student_name,
        u.email as student_email,
        s.language,
        s.attempt_number,
        s.status,
        s.submitted_at
       from submissions s
       join users_app u on u.id = s.student_id
       where s.assignment_id = $1
       order by s.submitted_at desc`,
      [assignmentId]
    );

    return res.json({
      ok: true,
      total: result.rows.length,
      submissions: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo envíos de la tarea:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener envíos de la tarea",
      error: error.message,
    });
  }
};
const getSubmissionsByAssignmentAndStudent = async (req, res) => {
  try {
    const { assignmentId, studentId } = req.params;

    const result = await pool.query(
      `select
        s.id,
        s.assignment_id,
        a.title as assignment_title,
        s.student_id,
        u.full_name as student_name,
        s.language,
        s.attempt_number,
        s.status,
        s.submitted_at
       from submissions s
       join assignments a on a.id = s.assignment_id
       join users_app u on u.id = s.student_id
       where s.assignment_id = $1
       and s.student_id = $2
       order by s.attempt_number desc`,
      [assignmentId, studentId]
    );

    return res.json({
      ok: true,
      total: result.rows.length,
      submissions: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo intentos:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener intentos",
      error: error.message,
    });
  }
};

const updateSubmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, user_id } = req.body;

    const validStatuses = [
      "submitted",
      "graded",
      "rejected",
      "plagiarism_review",
    ];

    if (!status) {
      return res.status(400).json({
        ok: false,
        message: "El campo status es obligatorio",
      });
    }

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        ok: false,
        message: "Estado inválido",
        valid_statuses: validStatuses,
      });
    }

    const oldResult = await pool.query(
      "select * from submissions where id = $1",
      [id]
    );

    if (oldResult.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Envío no encontrado",
      });
    }

    const oldSubmission = oldResult.rows[0];

    const result = await pool.query(
      `update submissions
       set status = $1
       where id = $2
       returning *`,
      [status, id]
    );

    const updatedSubmission = result.rows[0];

    await pool.query(
      `insert into audit_logs
       (user_id, service_name, action, entity_name, entity_id, old_value, new_value, description)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        user_id || oldSubmission.student_id,
        "submission-service",
        "SUBMISSION_STATUS_UPDATED",
        "submissions",
        id,
        oldSubmission,
        updatedSubmission,
        `El estado del envío cambió de ${oldSubmission.status} a ${status}.`,
      ]
    );

    return res.json({
      ok: true,
      message: "Estado del envío actualizado correctamente",
      submission: updatedSubmission,
    });
  } catch (error) {
    console.error("Error actualizando estado:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al actualizar estado",
      error: error.message,
    });
  }
};
module.exports = {
  createSubmission,
  getSubmissionById,
  getSubmissionsByStudent,
  getSubmissionsByAssignment,
  getSubmissionsByAssignmentAndStudent,
  updateSubmissionStatus,
};