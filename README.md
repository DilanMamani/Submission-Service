# Submission Service - Frog Software Ltda.

Microservicio encargado de:

- Gestión de tareas
- Recepción de código fuente
- Control de intentos
- Validación de fecha límite
- Auditoría de envíos

## Tecnologías

- Node.js
- Express
- PostgreSQL
- Neon Database

## Endpoints principales

### Assignments

- POST /assignments
- GET /assignments
- GET /assignments/:id
- GET /assignments/:id/summary

### Submissions

- POST /submissions
- GET /submissions/:id
- GET /submissions/student/:studentId
- GET /submissions/assignment/:assignmentId
- GET /submissions/assignment/:assignmentId/student/:studentId
- PATCH /submissions/:id/status

### Internal endpoints

- GET /internal/grading/submission/:submissionId
- GET /internal/plagiarism/assignment/:assignmentId
- GET /internal/summary/submission/:submissionId

## Variables de entorno

```env
PORT=4004
DATABASE_URL=YOUR_DATABASE_URL
```

## Ejecutar proyecto

```bash
npm install
npm run dev
```