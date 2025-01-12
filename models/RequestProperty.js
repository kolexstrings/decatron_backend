const mongoose = require("mongoose");
const RequestPropertySchema = new mongoose.Schema({
  agentId: {
    type: String,
    required: true,
  },
  propertyListingId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  ownerId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    required: true,
    default: new Date(),
  },
});
module.exports = mongoose.model("RequestProperty", RequestPropertySchema);
