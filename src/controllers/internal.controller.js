const { pool } = require("../config/db");

const getSubmissionForGrading = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const result = await pool.query(
      `select
        s.id as submission_id,
        s.source_code,
        s.language,
        s.attempt_number,
        s.status,
        s.submitted_at,
        a.id as assignment_id,
        a.title as assignment_title,
        a.description as assignment_description,
        a.deadline,
        u.id as student_id,
        u.full_name as student_name,
        u.email as student_email
       from submissions s
       join assignments a on a.id = s.assignment_id
       join users_app u on u.id = s.student_id
       where s.id = $1`,
      [submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Envío no encontrado",
      });
    }

    return res.json({
      ok: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo envío para calificación:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener envío para calificación",
      error: error.message,
    });
  }
};

const getSubmissionsForPlagiarism = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const result = await pool.query(
      `select
        s.id as submission_id,
        s.student_id,
        u.full_name as student_name,
        s.source_code,
        s.language,
        s.attempt_number,
        s.submitted_at
       from submissions s
       join users_app u on u.id = s.student_id
       where s.assignment_id = $1
       order by s.submitted_at asc`,
      [assignmentId]
    );

    return res.json({
      ok: true,
      total: result.rows.length,
      submissions: result.rows,
    });
  } catch (error) {
    console.error("Error obteniendo envíos para plagio:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener envíos para plagio",
      error: error.message,
    });
  }
};

const getSubmissionSummary = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const result = await pool.query(
      `select
        s.id as submission_id,
        a.title as assignment_title,
        u.full_name as student_name,
        s.language,
        s.attempt_number,
        s.status,
        s.submitted_at,
        gr.final_score,
        gr.execution_status,
        pr.internal_similarity,
        pr.external_similarity,
        pr.result as plagiarism_result
       from submissions s
       join assignments a on a.id = s.assignment_id
       join users_app u on u.id = s.student_id
       left join grading_results gr on gr.submission_id = s.id
       left join plagiarism_reports pr on pr.submission_id = s.id
       where s.id = $1`,
      [submissionId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        ok: false,
        message: "Resumen no encontrado",
      });
    }

    return res.json({
      ok: true,
      summary: result.rows[0],
    });
  } catch (error) {
    console.error("Error obteniendo resumen del envío:", error);

    return res.status(500).json({
      ok: false,
      message: "Error interno al obtener resumen del envío",
      error: error.message,
    });
  }
};

module.exports = {
  getSubmissionForGrading,
  getSubmissionsForPlagiarism,
  getSubmissionSummary,
};