const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema({
  slug: {
    type: String,
    required: true,
    lowercase: true,
    unique: true,
  },
  roleName: {
    type: String,
    required: true,
  },

  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
});

module.exports = mongoose.model("Role", RoleSchema);
