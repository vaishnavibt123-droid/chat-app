const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    room: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    text: { type: String, required: true, maxlength: 500 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);