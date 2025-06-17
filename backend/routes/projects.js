const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const Project = require("../models/Project");
const Task = require("../models/Task");
const { auth, checkRole } = require("../middleware/auth");

// Validation middleware
const validateProject = [
  body("name").trim().notEmpty().withMessage("Title is required"),
  body("description").trim().notEmpty().withMessage("Description is required"),
  body("teamMembers").isArray().withMessage("Team members must be an array"),
];

// Create project (Project Manager only)
router.post(
  "/",
  auth,
  checkRole(["project-manager"]),
  validateProject,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { name, description, teamMembers, status } = req.body;
      const project = new Project({
        name,
        description,
        createdBy: req.user.id,
        teamMembers,
        status: status || "Planning",
      });

      await project.save();
      await project.populate("createdBy", "name email");
      await project.populate("teamMembers", "name email");
      res.status(201).json(project);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating project", error: error.message });
    }
  }
);

// Get all projects (for project manager and team members)
router.get("/", auth, async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ createdBy: req.user.id }, { teamMembers: req.user.id }],
    })
      .populate("createdBy", "name email")
      .populate("teamMembers", "name email")
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching projects", error: error.message });
  }
});

// Get project by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("createdBy", "name email")
      .populate("teamMembers", "name email");

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    // Check if user has access to the project
    const hasAccess = 
      project.createdBy._id.toString() === req.user.id ||
      project.teamMembers.some((member) => member._id.toString() === req.user.id);

    if (!hasAccess) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this project" });
    }

    res.json(project);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching project", error: error.message });
  }
});

// Update project (Project Manager only)
router.patch(
  "/:id",
  auth,
  checkRole(["project-manager"]),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is the creator - Fix: Convert ObjectId to string
      if (project.createdBy.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this project" });
      }

      const { name, description, teamMembers, status } = req.body;
      if (name) project.name = name;
      if (description) project.description = description;
      if (teamMembers) project.teamMembers = teamMembers;
      if (status) project.status = status;

      await project.save();
      await project.populate("createdBy", "name email");
      await project.populate("teamMembers", "name email");
      res.json(project);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating project", error: error.message });
    }
  }
);

// Update project status (Project Manager only)
router.patch(
  "/:id/status",
  auth,
  checkRole(["project-manager"]),
  async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!["Planning", "Active", "On Hold", "Completed"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is the creator - Fix: Convert ObjectId to string
      if (project.createdBy.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this project" });
      }

      project.status = status;
      await project.save();
      await project.populate("createdBy", "name email");
      await project.populate("teamMembers", "name email");
      res.json(project);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating project status", error: error.message });
    }
  }
);

// Delete project (Project Manager only)
router.delete(
  "/:id",
  auth,
  checkRole(["project-manager"]),
  async (req, res) => {
    try {
      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is the creator - Fix: Convert ObjectId to string
      if (project.createdBy.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this project" });
      }

      // Delete all tasks associated with the project
      await Task.deleteMany({ projectId: project._id });

      // Delete the project
      await Project.findByIdAndDelete(project._id);
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting project", error: error.message });
    }
  }
);

module.exports = router;