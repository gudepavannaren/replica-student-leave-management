// backend/routes/facultyRoutes.js
// backend/routes/facultyRoutes.js
const express = require("express");
const router = express.Router();

const {
  approveLeave,
  rejectLeave,
} = require("../controllers/facultyleaveController");

const authMiddleware = require("../middleware/authMiddleware");
const facultyOnly = require("../middleware/facultyOnly");
const LeaveApplication = require("../models/LeaveApplication");

router.use((req, res, next) => {
  if (!req.headers.authorization && req.query && req.query.role) {
    req.user = { id: req.query.userId || "devUser", role: req.query.role };
  }
  next();
});

// ---------------- GET: Pending Leaves ----------------
router.get("/leaves/pending", authMiddleware, facultyOnly, async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({
      facultyStatus: "pending",
      status: { $ne: "rejected" },
    })
      .populate("studentId", "name email")
      .sort({ createdAt: -1 });

    return res.status(200).json({ leaves });
  } catch (err) {
    console.error("Faculty pending leaves error:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

// ---------------- Approve Leave ----------------
router.patch("/approve/:leaveId", authMiddleware, facultyOnly, approveLeave);

// ---------------- Reject Leave ----------------
router.patch("/reject/:leaveId", authMiddleware, facultyOnly, rejectLeave);

module.exports = router;




// ---------------- Approve / Reject (Faculty) ----------------
// Use consistent route parameter name 'leaveId' to match controllers/comments.
// These routes require the user be authenticated and have faculty role.

// Optional: GET all leaves for faculty (uncomment if you need it)
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
//router.patch("/approve/:leaveId", authMiddleware, rectorOnly, rectorApprove);

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

