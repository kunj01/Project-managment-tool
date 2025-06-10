const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  eventDate: {
    type: Date,
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  attendees: [
    {
      email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true,
      },
      status: {
        type: String,
        enum: ["yes", "no", "maybe"],
        default: "maybe",
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for better query performance
eventSchema.index({ createdBy: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ isPublic: 1 });

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
