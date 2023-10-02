const express = require("express");
const router = express.Router();
const {
  OPEN_STATUS,
  INPROGRESS_STATUS,
  COMPLETED_STATUS,
  Task,
} = require("../models/task");
const sequelize = require("../config/database");
const { STATUS_CODES, PAGINATION_OPTIONS } = require("../constants");

router.post("/", async (req, res) => {
  try {
    const task = await Task.create(req.body);
    return res.status(STATUS_CODES.CREATED).json(task);
  } catch (error) {
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ error: "Error creating task" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const [updatedRows] = await Task.update(req.body, {
      where: { id: req.params.id },
    });
    if (updatedRows === 0) {
      return res
        .status(STATUS_CODES.NOT_FOUND)
        .json({ error: "Task not found" });
    }
    return res
      .status(STATUS_CODES.OK)
      .json({ message: "Task updated successfully" });
  } catch (error) {
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ error: "Error updating task" });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page || PAGINATION_OPTIONS.PAGE);
    const limit = parseInt(req.query.limit || PAGINATION_OPTIONS.LIMIT);
    const offset = (page - 1) * limit;
    const task = await Task.findAndCountAll({
      limit,
      offset,
    });
    return res.status(STATUS_CODES.OK).json(task);
  } catch (error) {
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ error: "Error fetching tasks" });
  }
});

router.get("/metrics", async (req, res) => {
  try {
    const { date } = req.query;
    const metrics = date
      ? await calculateTaskMetricsByDate()
      : await calculateTaskMetricsByStatus();
    return res.status(STATUS_CODES.OK).json(metrics);
  } catch (error) {
    return res
      .status(STATUS_CODES.SERVER_ERROR)
      .json({ error: "Error fetching task metrics" });
  }
});

async function calculateTaskMetricsByStatus() {
  const metrics = await Task.findAll({
    attributes: [
      [sequelize.fn("count", sequelize.col("status")), "count"],
      "status",
    ],
    group: ["status"],
    raw: true,
  });

  const metricsObject = {
    open_tasks: 0,
    inprogress_tasks: 0,
    completed_tasks: 0,
  };

  metrics.forEach((metric) => {
    const { status, count } = metric;
    if (status === OPEN_STATUS) {
      metricsObject.open_tasks = count;
    } else if (status === INPROGRESS_STATUS) {
      metricsObject.inprogress_tasks = count;
    } else if (status === COMPLETED_STATUS) {
      metricsObject.completed_tasks = count;
    }
  });

  return metricsObject;
}

async function calculateTaskMetricsByDate() {
  const metrics = await Task.findAll({
    attributes: [
      [sequelize.fn("strftime", "%Y-%m", sequelize.col("createdAt")), "month"],
      [sequelize.fn("count", "*"), "count"],
      "status",
    ],
    group: ["month", "status"],
    raw: true,
  });

  const metricsByDate = new Map();

  metrics.forEach((metric) => {
    const formattedDate = new Date(metric.month).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });

    if (!metricsByDate.has(formattedDate)) {
      metricsByDate.set(formattedDate, {
        open_tasks: 0,
        inprogress_tasks: 0,
        completed_tasks: 0,
      });
    }

    metricsByDate.get(formattedDate)[`${metric.status}_tasks`] = metric.count;
  });

  const formattedMetrics = Array.from(metricsByDate, ([date, metrics]) => ({
    date: date,
    metrics: metrics,
  }));

  return formattedMetrics;
}

module.exports = router;
