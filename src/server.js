require("dotenv").config();

const app = require("./app");
const { testConnection } = require("./config/db");

const PORT = process.env.PORT || 4002;

app.listen(PORT, async () => {
  console.log(`Submission Service running on port ${PORT}`);
  await testConnection();
});