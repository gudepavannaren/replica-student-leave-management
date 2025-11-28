// backend/routes/rectorRoutes.js
const express = require('express');
const LeaveApplication = require('../models/LeaveApplication');
const auth = require('../middleware/authMiddleware');
const rectorOnly = require('../middleware/rectorOnly');
const { generateLeavePDF } = require('../utils/pdfGenerator');

const router = express.Router();

// Get all leaves that rector should see:
// - mode 'rector' and rectorStatus pending
// - or mode 'faculty+rector' where facultyStatus = approved and rectorStatus = pending
router.get('/leaves/pending', auth, rectorOnly, async (req, res) => {
  try {
    const pending = await LeaveApplication.find({
      $or: [
        { mode: 'rector', rectorStatus: 'pending' },
        { mode: 'faculty+rector', facultyStatus: 'approved', rectorStatus: 'pending' }
      ]
    }).populate('studentId', 'name email rollNumber').sort({ createdAt: -1 }).lean();
    res.json({ pending });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Approve or reject by rector
// body: { action: 'approve'|'reject', reason?: '...' }
router.patch('/approve/:leaveId', auth, rectorOnly, async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { action, reason } = req.body;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: 'action must be approve or reject' });

    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    // If mode faculty+rector, ensure faculty has approved first
    if (leave.mode === 'faculty+rector' && leave.facultyStatus !== 'approved') {
      return res.status(400).json({ message: 'Faculty approval required first' });
    }
    if (leave.rectorStatus !== 'pending') {
      return res.status(400).json({ message: 'Rector already acted' });
    }

    if (action === 'approve') {
      leave.rectorStatus = 'approved';
      leave.rectorId = req.user.id;
      leave.rectorDecisionAt = new Date();
      leave.status = 'approved';

      // generate PDF and attach
      try {
        const snapshot = leave.studentSnapshot || {};
        const pdf = await generateLeavePDF({ leave, studentSnapshot: snapshot });
        leave.pdfPath = pdf.filepath; // e.g. /uploads/leave-<id>.pdf
      } catch (pdfErr) {
        console.error('PDF generation error:', pdfErr);
        // We still save the leave (approved) but inform frontend that pdf generation failed
      }

      await leave.save();
      return res.json({ message: 'Rector approved', leave });
    } else {
      // reject
      leave.rectorStatus = 'rejected';
      leave.rectorId = req.user.id;
      leave.rectorDecisionAt = new Date();
      leave.rectorRejectionReason = reason || '';
      leave.status = 'rejected';
      await leave.save();
      return res.json({ message: 'Rector rejected', leave });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

module.exports = router;

// // backend/routes/rectorRoutes.js
// const express = require("express");
// const router = express.Router();

// const {
//   approveLeave,
//   rejectLeave,
// } = require("../controllers/rectorleaveController");

// const authMiddleware = require("../middleware/authMiddleware");
// const rectorOnly = require("../middleware/rectorOnly");
// const LeaveApplication = require("../models/LeaveApplication");

// router.get("/leaves/pending", authMiddleware, rectorOnly, async (req, res) => {
//   try {
//     const leaves = await LeaveApplication.find({
//       status: "pending",
//     }).populate("studentId", "name email");

//     return res.status(200).json({ leaves });
//   } catch (err) {
//     console.error("Rector pending leaves error:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

// router.patch("/approve/:leaveId", authMiddleware, rectorOnly, approveLeave);
// router.patch("/reject/:leaveId", authMiddleware, rectorOnly, rejectLeave);

// module.exports = router;

// // // backend/routes/rectorRoutes.js
// // const express = require("express");
// // const router = express.Router();

// // const {
// //   approveLeave,
// //   rejectLeave,
// // } = require("../controllers/rectorleaveController");

// // const LeaveApplication = require("../models/LeaveApplication");
// // const authMiddleware = require("../middleware/authMiddleware");
// // const rectorOnly = require("../middleware/rectorOnly");


// // // ---------------- GET: All Leaves ----------------
// // router.get("/leaves", authMiddleware, rectorOnly, async (req, res) => {
// //   try {
// //     const leaves = await LeaveApplication.find()
// //       .populate("studentId", "name email")
// //       .sort({ createdAt: -1 });

// //     return res.status(200).json({ leaves });
// //   } catch (err) {
// //     console.error("Rector get all leaves error:", err);
// //     return res.status(500).json({ message: "Server error" });
// //   }
// // });


// // // ---------------- GET: Pending for Rector ----------------
// // // Rector sees leaves that need rector approval
// // router.get("/leaves/pending", authMiddleware, rectorOnly, async (req, res) => {
// //   try {
// //     const leaves = await LeaveApplication.find({
// //       $and: [
// //         { rectorApproved: { $ne: true } },
// //         { rectorRejected: { $ne: true } },
// //         { status: { $ne: "rejected" } },
// //       ],
// //     })
// //       .populate("studentId", "name email")
// //       .sort({ createdAt: -1 });

// //     return res.status(200).json({ leaves });
// //   } catch (err) {
// //     console.error("Rector pending leaves error:", err);
// //     return res.status(500).json({ message: "Server error" });
// //   }
// // });


// // // ---------------- Approve / Reject ----------------
// // router.patch("/approve/:id", authMiddleware, rectorOnly, approveLeave);
// // router.patch("/reject/:id", authMiddleware, rectorOnly, rejectLeave);


// // module.exports = router;

