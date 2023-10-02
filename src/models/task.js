const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const OPEN_STATUS = "open";
const INPROGRESS_STATUS = "inprogress";
const COMPLETED_STATUS = "completed";
const TASK_STATUSES = [OPEN_STATUS, INPROGRESS_STATUS, COMPLETED_STATUS];

const Task = sequelize.define("Task", {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  description: DataTypes.STRING,
  status: {
    type: DataTypes.ENUM(...TASK_STATUSES),
    allowNull: false,
    defaultValue: "open",
    validate: {
      isIn: {
        args: [TASK_STATUSES],
        msg: "Invalid status provided",
      },
    },
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
});

module.exports = {
  OPEN_STATUS,
  INPROGRESS_STATUS,
  COMPLETED_STATUS,
  Task,
};
