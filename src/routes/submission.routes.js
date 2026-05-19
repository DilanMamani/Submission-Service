const express = require("express");
const router = express.Router();

const {
  createSubmission,
  getSubmissionById,
  getSubmissionsByStudent,
  getSubmissionsByAssignment,
  getSubmissionsByAssignmentAndStudent,
  updateSubmissionStatus,
} = require("../controllers/submission.controller");

router.post("/", createSubmission);

router.get("/student/:studentId", getSubmissionsByStudent);
router.get("/assignment/:assignmentId/student/:studentId", getSubmissionsByAssignmentAndStudent);
router.get("/assignment/:assignmentId", getSubmissionsByAssignment);

router.patch("/:id/status", updateSubmissionStatus);

router.get("/:id", getSubmissionById);

module.exports = router;