// backend/routes/facultyRoutes.js
const express = require('express');
const LeaveApplication = require('../models/LeaveApplication');
const auth = require('../middleware/authMiddleware');
const facultyOnly = require('../middleware/facultyOnly');

const router = express.Router();

// Get leaves pending faculty approval (only those with mode faculty+rector AND facultyStatus pending)
router.get('/leaves/pending', auth, facultyOnly, async (req, res) => {
  try {
    const pending = await LeaveApplication.find({ mode: 'faculty+rector', facultyStatus: 'pending' })
      .populate('studentId', 'name email rollNumber')
      .sort({ createdAt: -1 })
      .lean();
    res.json({ pending });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Approve or reject by faculty
// body: { action: 'approve'|'reject', reason?: '...' }
router.patch('/approve/:leaveId', auth, facultyOnly, async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { action, reason } = req.body;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'action must be approve or reject' });

    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    if (leave.mode !== 'faculty+rector') {
      return res.status(400).json({ message: 'This leave does not require faculty approval' });
    }
    if (leave.facultyStatus !== 'pending') {
      return res.status(400).json({ message: 'Faculty already acted' });
    }

    if (action === 'approve') {
      leave.facultyStatus = 'approved';
      leave.facultyId = req.user.id;
      leave.facultyDecisionAt = new Date();
      // Rector still pending; overall status remains pending until rector acts
      await leave.save();
      return res.json({ message: 'Faculty approved', leave });
    } else {
      // reject
      leave.facultyStatus = 'rejected';
      leave.facultyId = req.user.id;
      leave.facultyDecisionAt = new Date();
      leave.facultyRejectionReason = reason || '';
      leave.status = 'rejected';
      // rectorStatus can remain pending or set to rejected as well
      leave.rectorStatus = 'rejected';
      await leave.save();
      return res.json({ message: 'Faculty rejected', leave });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

module.exports = router;

// // backend/routes/facultyRoutes.js
// // backend/routes/facultyRoutes.js
// const express = require("express");
// const router = express.Router();

// const {
//   approveLeave,
//   rejectLeave,
// } = require("../controllers/facultyleaveController");

// const authMiddleware = require("../middleware/authMiddleware");
// const facultyOnly = require("../middleware/facultyOnly");
// const LeaveApplication = require("../models/LeaveApplication");

// router.use((req, res, next) => {
//   if (!req.headers.authorization && req.query && req.query.role) {
//     req.user = { id: req.query.userId || "devUser", role: req.query.role };
//   }
//   next();
// });

// // ---------------- GET: Pending Leaves ----------------
// router.get("/leaves/pending", authMiddleware, facultyOnly, async (req, res) => {
//   try {
//     const leaves = await LeaveApplication.find({
//       facultyStatus: "pending",
//       status: { $ne: "rejected" },
//     })
//       .populate("studentId", "name email")
//       .sort({ createdAt: -1 });

//     return res.status(200).json({ leaves });
//   } catch (err) {
//     console.error("Faculty pending leaves error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// // ---------------- Approve Leave ----------------
// router.patch("/approve/:leaveId", authMiddleware, facultyOnly, approveLeave);

// // ---------------- Reject Leave ----------------
// router.patch("/reject/:leaveId", authMiddleware, facultyOnly, rejectLeave);

// module.exports = router;




// // ---------------- Approve / Reject (Faculty) ----------------
// // Use consistent route parameter name 'leaveId' to match controllers/comments.
// // These routes require the user be authenticated and have faculty role.

// // Optional: GET all leaves for faculty (uncomment if you need it)
// // router.get("/leaves", authMiddleware, facultyOnly, async (req, res) => {
// //   try {
// //     const leaves = await LeaveApplication.find()
// //       .populate("studentId", "name email")
// //       .sort({ createdAt: -1 });
// //     return res.status(200).json({ leaves });
// //   } catch (err) {
// //     console.error("Faculty get all leaves error:", err);
// //     return res.status(500).json({ message: "Server error" });
// //   }
// // });




// // const express = require("express");
// // const router = express.Router();

// // const {
// //   rectorApprove,
// //   getAllLeavesForRector
// // } = require("../controllers/rectorleaveController");

// // const authMiddleware = require("../middleware/authMiddleware");
// // const rectorOnly = require("../middleware/rectorOnly");

// // // 👉 GET all leaves (rector dashboard)
// // router.get("/all", authMiddleware, rectorOnly, getAllLeavesForRector);

// // // 👉 Approve / Reject leave
// //router.patch("/approve/:leaveId", authMiddleware, rectorOnly, rectorApprove);

// // module.exports = router;

// // backend/routes/facultyRoutes.js



// // const express = require("express");
// // const router = express.Router();

// // const {
// //   approveLeave,
// //   rejectLeave,
// // } = require("../controllers/facultyleaveController");

// // const LeaveApplication = require("../models/LeaveApplication");
// // const authMiddleware = require("../middleware/authMiddleware");
// // const facultyOnly = require("../middleware/facultyOnly");


// // // ---------------- GET: All Leaves ----------------
// // router.get("/leaves", authMiddleware, facultyOnly, async (req, res) => {
// //   try {
// //     const leaves = await LeaveApplication.find()
// //       .populate("studentId", "name email")
// //       .sort({ createdAt: -1 });

// //     return res.status(200).json({ leaves });
// //   } catch (err) {
// //     console.error("Faculty get all leaves error:", err);
// //     return res.status(500).json({ message: "Server error" });
// //   }
// // });


// // // ---------------- GET: Pending for Faculty ----------------
// // router.get("/leaves/pending", authMiddleware, facultyOnly, async (req, res) => {
// //   try {
// //     const leaves = await LeaveApplication.find({
// //       $and: [
// //         { facultyApproved: { $ne: true } },
// //         { facultyRejected: { $ne: true } },
// //         { status: { $ne: "rejected" } },
// //       ],
// //     })
// //       .populate("studentId", "name email")
// //       .sort({ createdAt: -1 });

// //     return res.status(200).json({ leaves });
// //   } catch (err) {
// //     console.error("Faculty pending leaves error:", err);
// //     return res.status(500).json({ message: "Server error" });
// //   }
// // });


// // // ---------------- Approve / Reject ----------------
// // router.patch("/approve/:id", authMiddleware, facultyOnly, approveLeave);
// // router.patch("/reject/:id", authMiddleware, facultyOnly, rejectLeave);


// // module.exports = router;

