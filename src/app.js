const express = require("express");
const cors = require("cors");

const assignmentRoutes = require("./routes/assignment.routes");
const submissionRoutes = require("./routes/submission.routes");
const internalRoutes = require("./routes/internal.routes");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

app.get("/", (req, res) => {
  res.json({
    service: "submission-service",
    company: "Frog Software Ltda.",
    status: "running",
    description: "Microservicio de tareas, envíos, intentos y fechas límite",
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "submission-service",
    timestamp: new Date(),
  });
});

app.use("/assignments", assignmentRoutes);
app.use("/submissions", submissionRoutes);
app.use("/internal", internalRoutes);

module.exports = app;