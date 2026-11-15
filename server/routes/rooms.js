const express = require("express");
const Message = require("../models/Message");
const auth = require("../middleware/auth");
const ROOMS = require("../rooms");

const router = express.Router();
router.use(auth);

router.get("/", (req, res) => res.json(ROOMS));

router.get("/:room/messages", async (req, res) => {
  try {
    if (!ROOMS.includes(req.params.room))
      return res.status(404).json({ message: "Room not found" });
    const msgs = await Message.find({ room: req.params.room })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(msgs.reverse());
  } catch {
    res.status(500).json({ message: "Could not load messages" });
  }
});

module.exports = router;