const express = require("express");
const router = express.Router();

const {
  createAssignment,
  getAssignments,
  getAssignmentById,
  getAssignmentSummary,
} = require("../controllers/assignment.controller");

router.post("/", createAssignment);
router.get("/", getAssignments);
router.get("/:id/summary", getAssignmentSummary);
router.get("/:id", getAssignmentById);

module.exports = router;