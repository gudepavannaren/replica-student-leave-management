// backend/routes/rectorRoutes.js
const express = require("express");
const router = express.Router();

const {
  approveLeave,
  rejectLeave,
} = require("../controllers/rectorleaveController");

const authMiddleware = require("../middleware/authMiddleware");
const rectorOnly = require("../middleware/rectorOnly");
const LeaveApplication = require("../models/LeaveApplication");

router.get("/leaves/pending", authMiddleware, rectorOnly, async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({
      status: "pending",
    }).populate("studentId", "name email");

    return res.status(200).json({ leaves });
  } catch (err) {
    console.error("Rector pending leaves error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

router.patch("/approve/:leaveId", authMiddleware, rectorOnly, approveLeave);
router.patch("/reject/:leaveId", authMiddleware, rectorOnly, rejectLeave);

module.exports = router;

// // backend/routes/rectorRoutes.js
// const express = require("express");
// const router = express.Router();

// const {
//   approveLeave,
//   rejectLeave,
// } = require("../controllers/rectorleaveController");

// const LeaveApplication = require("../models/LeaveApplication");
// const authMiddleware = require("../middleware/authMiddleware");
// const rectorOnly = require("../middleware/rectorOnly");


// // ---------------- GET: All Leaves ----------------
// router.get("/leaves", authMiddleware, rectorOnly, async (req, res) => {
//   try {
//     const leaves = await LeaveApplication.find()
//       .populate("studentId", "name email")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({ leaves });
//   } catch (err) {
//     console.error("Rector get all leaves error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });


// // ---------------- GET: Pending for Rector ----------------
// // Rector sees leaves that need rector approval
// router.get("/leaves/pending", authMiddleware, rectorOnly, async (req, res) => {
//   try {
//     const leaves = await LeaveApplication.find({
//       $and: [
//         { rectorApproved: { $ne: true } },
//         { rectorRejected: { $ne: true } },
//         { status: { $ne: "rejected" } },
//       ],
//     })
//       .populate("studentId", "name email")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({ leaves });
//   } catch (err) {
//     console.error("Rector pending leaves error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });


// // ---------------- Approve / Reject ----------------
// router.patch("/approve/:id", authMiddleware, rectorOnly, approveLeave);
// router.patch("/reject/:id", authMiddleware, rectorOnly, rejectLeave);


// module.exports = router;

