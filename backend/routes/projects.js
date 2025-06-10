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

      const { name, description, teamMembers } = req.body;
      const project = new Project({
        name,
        description,
        createdBy: req.user.id,
        teamMembers,
      });

      await project.save();
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
    if (
      !project.createdBy.equals(req.user._id) &&
      !project.teamMembers.some((member) => member._id.equals(req.user._id))
    ) {
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
  validateProject,
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const project = await Project.findById(req.params.id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user is the creator
      if (!project.createdBy.equals(req.user._id)) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this project" });
      }

      const { name, description, teamMembers } = req.body;
      project.name = name;
      project.description = description;
      project.teamMembers = teamMembers;

      await project.save();
      res.json(project);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating project", error: error.message });
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

      // Check if user is the creator
      if (!project.createdBy.equals(req.user._id)) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this project" });
      }

      // Delete all tasks associated with the project
      await Task.deleteMany({ projectId: project._id });

      // Delete the project
      await project.remove();
      res.json({ message: "Project deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting project", error: error.message });
    }
  }
);

module.exports = router;
