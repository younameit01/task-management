const express = require("express");
const bodyParser = require("body-parser");
const taskRoutes = require("./routes/tasks");
const sequelize = require("./config/database");

require("dotenv").config();

const app = express();
app.use(bodyParser.json());
app.use("/tasks", taskRoutes);

sequelize.sync().then(() => {
  console.log("Database synced");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
