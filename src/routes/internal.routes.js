const express = require("express");
const router = express.Router();

const {
  getSubmissionForGrading,
  getSubmissionsForPlagiarism,
  getSubmissionSummary,
} = require("../controllers/internal.controller");

router.get("/grading/submission/:submissionId", getSubmissionForGrading);
router.get("/plagiarism/assignment/:assignmentId", getSubmissionsForPlagiarism);
router.get("/summary/submission/:submissionId", getSubmissionSummary);

module.exports = router;