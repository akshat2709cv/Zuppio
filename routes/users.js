const express = require("express");
const router = express.Router();

router.get("/", function (_req, res) {
  res.json({ message: "Users route ready for future login or leaderboard APIs." });
});

module.exports = router;
