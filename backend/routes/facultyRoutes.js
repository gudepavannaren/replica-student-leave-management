// backend/routes/facultyRoutes.js (snippet for pending leaves)
const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const facultyOnly = require("../middleware/facultyOnly");
const LeaveApplication = require("../models/LeaveApplication");

// GET pending leaves for faculty
router.get("/leaves/pending", authMiddleware, facultyOnly, async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({
      facultyStatus: "pending",
      status: { $ne: "rejected" } // optional filter to avoid already rejected
    })
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ leaves });
  } catch (err) {
    console.error("Faculty pending leaves error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

// const express = require("express");
// const router = express.Router();

// const {
//   rectorApprove,
//   getAllLeavesForRector
// } = require("../controllers/rectorleaveController");

// const authMiddleware = require("../middleware/authMiddleware");
// const rectorOnly = require("../middleware/rectorOnly");

// // 👉 GET all leaves (rector dashboard)
// router.get("/all", authMiddleware, rectorOnly, getAllLeavesForRector);

// // 👉 Approve / Reject leave
// router.patch("/approve/:leaveId", authMiddleware, rectorOnly, rectorApprove);

// module.exports = router;

// backend/routes/facultyRoutes.js



// const express = require("express");
// const router = express.Router();

// const {
//   approveLeave,
//   rejectLeave,
// } = require("../controllers/facultyleaveController");

// const LeaveApplication = require("../models/LeaveApplication");
// const authMiddleware = require("../middleware/authMiddleware");
// const facultyOnly = require("../middleware/facultyOnly");


// // ---------------- GET: All Leaves ----------------
// router.get("/leaves", authMiddleware, facultyOnly, async (req, res) => {
//   try {
//     const leaves = await LeaveApplication.find()
//       .populate("studentId", "name email")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({ leaves });
//   } catch (err) {
//     console.error("Faculty get all leaves error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });


// // ---------------- GET: Pending for Faculty ----------------
// router.get("/leaves/pending", authMiddleware, facultyOnly, async (req, res) => {
//   try {
//     const leaves = await LeaveApplication.find({
//       $and: [
//         { facultyApproved: { $ne: true } },
//         { facultyRejected: { $ne: true } },
//         { status: { $ne: "rejected" } },
//       ],
//     })
//       .populate("studentId", "name email")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({ leaves });
//   } catch (err) {
//     console.error("Faculty pending leaves error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });


// // ---------------- Approve / Reject ----------------
// router.patch("/approve/:id", authMiddleware, facultyOnly, approveLeave);
// router.patch("/reject/:id", authMiddleware, facultyOnly, rejectLeave);


// module.exports = router;
