const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Task = require("../models/Task");
const Project = require("../models/Project");
const { auth, checkRole } = require("../middleware/auth");

// Middleware for validating task input
const validateTaskInput = (req, res, next) => {
  const { title, description, projectId, assignedTo, dueDate, priority } =
    req.body;

  if (!title || !description || !projectId) {
    return res
      .status(400)
      .json({ message: "Title, description, and project ID are required" });
  }

  if (assignedTo && !Array.isArray(assignedTo)) {
    return res
      .status(400)
      .json({ message: "Assigned to must be an array of user IDs" });
  }

  if (priority && !["Low", "Medium", "High"].includes(priority)) {
    return res
      .status(400)
      .json({ message: "Invalid priority. Must be Low, Medium, or High." });
  }

  if (dueDate && isNaN(new Date(dueDate).getTime())) {
    return res.status(400).json({ message: "Invalid due date format." });
  }

  next();
};

// Create Task (Project Managers Only)
router.post(
  "/",
  auth,
  checkRole(["project-manager"]),
  validateTaskInput,
  async (req, res) => {
    try {
      const { title, description, projectId, assignedTo, dueDate, priority } =
        req.body;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if the project manager is the creator of the project
      if (project.createdBy.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to create tasks for this project" });
      }

      const task = new Task({
        title,
        description,
        projectId,
        assignedTo,
        dueDate,
        priority,
      });

      await task.save();
      await task.populate("assignedTo", "name email");
      res.status(201).json(task);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating task", error: error.message });
    }
  }
);

// Get Tasks for a specific Project (Accessible by project members)
router.get("/project/:projectId", auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const project = await Project.findById(projectId);

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user is creator or team member of the project
    const hasAccess = 
      project.createdBy.toString() === req.user.id ||
      project.teamMembers.some((memberId) => memberId.toString() === req.user.id);

    if (!hasAccess) {
      return res
        .status(403)
        .json({ message: "Not authorized to view tasks for this project" });
    }

    const tasks = await Task.find({ projectId }).populate(
      "assignedTo",
      "name email"
    );
    res.json(tasks);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching tasks for project",
      error: error.message,
    });
  }
});

// Get My Tasks (Tasks assigned to the current user)
router.get("/my", auth, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.user.id }).populate(
      "assignedTo",
      "name email"
    );
    res.json(tasks);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching my tasks", error: error.message });
  }
});

// Update Task Status (Team Members and Project Managers)
router.put(
  "/:taskId/status",
  auth,
  async (req, res) => {
    try {
      const { taskId } = req.params;
      const { status } = req.body;

      if (!status || !["To Do", "In Progress", "Done"].includes(status)) {
        return res.status(400).json({
          message:
            "Invalid status provided. Must be To Do, In Progress, or Done.",
        });
      }

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const project = await Project.findById(task.projectId);
      if (!project) {
        return res
          .status(404)
          .json({ message: "Associated project not found" });
      }

      // Check if the user is a project manager, team member, or assigned to the task
      const isProjectManager = project.createdBy.toString() === req.user.id;
      const isTeamMember = project.teamMembers.some((memberId) => memberId.toString() === req.user.id);
      const isAssignedToTask = task.assignedTo.some((assigneeId) => assigneeId.toString() === req.user.id);

      if (!isProjectManager && !isTeamMember && !isAssignedToTask) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this task status" });
      }

      task.status = status;
      await task.save();
      await task.populate("assignedTo", "name email");
      res.json(task);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating task status", error: error.message });
    }
  }
);

// Update Task (Project Managers Only)
router.put(
  "/:taskId",
  auth,
  checkRole(["project-manager"]),
  validateTaskInput,
  async (req, res) => {
    try {
      const { taskId } = req.params;
      const updates = req.body;

      const task = await Task.findById(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const project = await Project.findById(task.projectId);
      if (!project) {
        return res
          .status(404)
          .json({ message: "Associated project not found" });
      }

      // Check if the user is the project manager
      if (project.createdBy.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this task" });
      }

      // Apply updates
      Object.assign(task, updates);
      await task.save();
      await task.populate("assignedTo", "name email");
      res.json(task);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating task", error: error.message });
    }
  }
);

// Delete Task (Project Managers Only)
router.delete(
  "/:taskId",
  auth,
  checkRole(["project-manager"]),
  async (req, res) => {
    try {
      const { taskId } = req.params;
      const task = await Task.findById(taskId);

      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const project = await Project.findById(task.projectId);
      if (!project) {
        return res
          .status(404)
          .json({ message: "Associated project not found" });
      }

      // Check if the user is the project manager
      if (project.createdBy.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this task" });
      }

      await Task.findByIdAndDelete(task._id);
      res.json({ message: "Task deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting task", error: error.message });
    }
  }
);

module.exports = router;