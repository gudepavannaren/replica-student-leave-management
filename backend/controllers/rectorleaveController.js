// backedn/controllers/rectorleaveController.js
const LeaveApplication = require("../models/LeaveApplication");
const { recomputeOverallStatus } = require("../utils/statusUtil");

/**
 * Rector approves a leave.
 */
exports.approveLeave = async (req, res) => {
  try {
    const leaveId = req.params.id || req.params.leaveId;
    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.rectorStatus = "approved";
    leave.rectorId = req.user.id || req.user._id;
    leave.rectorDecisionAt = new Date();

    leave.status = recomputeOverallStatus(leave);

    await leave.save();
    return res.status(200).json({ message: "Leave approved by rector", leave });
  } catch (err) {
    console.error("Rector approve error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Rector rejects a leave.
 */
exports.rejectLeave = async (req, res) => {
  try {
    const leaveId = req.params.id || req.params.leaveId;
    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.rectorStatus = "rejected";
    leave.rectorId = req.user.id || req.user._id;
    leave.rectorDecisionAt = new Date();

    leave.status = recomputeOverallStatus(leave);

    await leave.save();
    return res.status(200).json({ message: "Leave rejected by rector", leave });
  } catch (err) {
    console.error("Rector reject error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// // controllers/rectorleaveController.js
// const LeaveApplication = require('../models/LeaveApplication');

// // helper to compute combined status
// function recomputeOverallStatus(leave) {
//   if (!leave) return 'pending';
//   if (leave.facultyStatus === 'rejected' || leave.rectorStatus === 'rejected') return 'rejected';

//   if (leave.mode === 'rector') {
//     if (leave.rectorStatus === 'approved') return 'approved';
//     return 'pending';
//   }

//   // mode faculty+rector
//   if (leave.facultyStatus === 'approved' && leave.rectorStatus === 'approved') return 'approved';
//   if (leave.facultyStatus === 'approved' && (!leave.rectorStatus || leave.rectorStatus === 'pending')) return 'semi-approved';
//   if (leave.rectorStatus === 'approved' && (!leave.facultyStatus || leave.facultyStatus === 'pending')) return 'pending';
//   return 'pending';
// }

// exports.getAllLeavesForRector = async (req, res) => {
//   try {
//     // Rector sees both modes; optionally you can filter by college etc.
//     const leaves = await LeaveApplication.find({}).sort({ createdAt: -1 }).lean();
//     return res.json({ leaves });
//   } catch (err) {
//     console.error('getAllLeavesForRector', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.getPendingLeavesForRector = async (req, res) => {
//   try {
//     // Pending: either rectorStatus pending for mode rector OR for faculty+rector where faculty approved etc.
//     const leaves = await LeaveApplication.find({
//       $or: [
//         { mode: 'rector', rectorStatus: 'pending' },
//         { mode: 'faculty+rector', rectorStatus: 'pending' }
//       ]
//     }).sort({ createdAt: -1 }).lean();

//     return res.json({ leaves });
//   } catch (err) {
//     console.error('getPendingLeavesForRector', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// exports.updateLeaveStatusByRector = async (req, res) => {
//   try {
//     const { leaveId } = req.params;
//     const { status } = req.body; // expects "approved" or "rejected"
//     if (!['approved', 'rejected'].includes(status)) {
//       return res.status(400).json({ message: "Invalid status. Use 'approved' or 'rejected'." });
//     }

//     const leave = await LeaveApplication.findById(leaveId);
//     if (!leave) return res.status(404).json({ message: 'Leave not found' });

//     leave.rectorStatus = status;
//     leave.rectorId = req.user && (req.user.id || req.user._id);
//     leave.rectorDecisionAt = new Date();

//     leave.status = recomputeOverallStatus(leave);
//     await leave.save();

//     return res.json({ message: 'Rector decision recorded', leave });
//   } catch (err) {
//     console.error('updateLeaveStatusByRector', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };
