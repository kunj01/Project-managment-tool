const express = require("express");
const router = express.Router();
const Event = require("../models/Event");
const { auth, checkRole } = require("../middleware/auth");

// Validation middleware
const validateEventData = (req, res, next) => {
  const { title, description, location, eventDate } = req.body;
  if (!title || !description || !location || !eventDate) {
    return res.status(400).json({ message: "All fields are required" });
  }
  next();
};

// Create event (event organizers only)
router.post(
  "/",
  auth,
  checkRole(["event-organizer"]),
  validateEventData,
  async (req, res) => {
    try {
      const event = new Event({
        ...req.body,
        createdBy: req.user.id,
      });
      await event.save();
      res.status(201).json(event);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating event", error: error.message });
    }
  }
);

// Get all events (public events + user's events)
router.get("/", auth, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [{ isPublic: true }, { createdBy: req.user.id }],
    }).sort({ eventDate: 1 });
    res.json(events);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching events", error: error.message });
  }
});

// Get event by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }
    if (!event.isPublic && event.createdBy.toString() !== req.user.id) {
      return res
        .status(403)
        .json({ message: "Not authorized to view this event" });
    }
    res.json(event);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching event", error: error.message });
  }
});

// Update event (event organizers only)
router.put(
  "/:id",
  auth,
  checkRole(["event-organizer"]),
  validateEventData,
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.createdBy.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to update this event" });
      }
      Object.assign(event, req.body);
      await event.save();
      res.json(event);
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error updating event", error: error.message });
    }
  }
);

// Delete event (event organizers only)
router.delete(
  "/:id",
  auth,
  checkRole(["event-organizer"]),
  async (req, res) => {
    try {
      const event = await Event.findById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      if (event.createdBy.toString() !== req.user.id) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this event" });
      }
      await event.remove();
      res.json({ message: "Event deleted successfully" });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error deleting event", error: error.message });
    }
  }
);

// RSVP to event
router.post("/:id/rsvp", auth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["yes", "no", "maybe"].includes(status)) {
      return res.status(400).json({ message: "Invalid RSVP status" });
    }

    const event = await Event.findById(req.params.id);
    if (!event) {
      return res.status(404).json({ message: "Event not found" });
    }

    const attendeeIndex = event.attendees.findIndex(
      (a) => a.email === req.user.email
    );

    if (attendeeIndex > -1) {
      event.attendees[attendeeIndex].status = status;
    } else {
      event.attendees.push({
        email: req.user.email,
        status,
      });
    }

    await event.save();
    res.json(event);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating RSVP", error: error.message });
  }
});

module.exports = router;
