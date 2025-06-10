const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["project-manager", "event-organizer", "team-member"],
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Remove any pre-save hooks that might exist
userSchema.pre("save", function (next) {
  next();
});

const User = mongoose.model("User", userSchema);

module.exports = User;
