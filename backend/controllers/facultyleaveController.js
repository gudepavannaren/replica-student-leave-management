// backedn/controllers/FacultyleaveController.js
const LeaveApplication = require("../models/LeaveApplication");
const { recomputeOverallStatus } = require("../utils/statusUtil");

/**
 * Faculty approves a leave.
 * Sets facultyStatus, facultyId, facultyDecisionAt, recomputes overall status.
 */
exports.approveLeave = async (req, res) => {
  try {
    const leaveId = req.params.id || req.params.leaveId;
    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    // Update canonical fields
    leave.facultyStatus = "approved";
    leave.facultyId = req.user.id || req.user._id;
    leave.facultyDecisionAt = new Date();

    // Recompute combined status
    leave.status = recomputeOverallStatus(leave);

    await leave.save();
    return res.status(200).json({ message: "Leave approved by faculty", leave });
  } catch (err) {
    console.error("Faculty approve error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

/**
 * Faculty rejects a leave.
 */
exports.rejectLeave = async (req, res) => {
  try {
    const leaveId = req.params.id || req.params.leaveId;
    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) return res.status(404).json({ message: "Leave not found" });

    leave.facultyStatus = "rejected";
    leave.facultyId = req.user.id || req.user._id;
    leave.facultyDecisionAt = new Date();

    leave.status = recomputeOverallStatus(leave);

    await leave.save();
    return res.status(200).json({ message: "Leave rejected by faculty", leave });
  } catch (err) {
    console.error("Faculty reject error:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

// // facultyleaveController.js
// const LeaveApplication = require('./LeaveApplication'); // model path

// // GET /api/faculty/all
// exports.getAllLeavesForFaculty = async (req, res) => {
//   try {
//     // Filter depending on faculty responsibilities, or return all
//     const leaves = await LeaveApplication.find().sort({ createdAt: -1 }).lean();
//     return res.status(200).json(leaves);
//   } catch (error) {
//     console.error('Error in getAllLeavesForFaculty:', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// // GET /api/faculty/pending
// exports.getPendingLeavesForFaculty = async (req, res) => {
//   try {
//     const leaves = await LeaveApplication.find({ status: 'pendingFaculty' }).sort({ createdAt: -1 }).lean();
//     return res.status(200).json(leaves);
//   } catch (error) {
//     console.error('Error in getPendingLeavesForFaculty:', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// // PATCH /api/faculty/approve/:leaveId
// exports.approveLeave = async (req, res) => {
//   try {
//     const { leaveId } = req.params;
//     const leave = await LeaveApplication.findById(leaveId);
//     if (!leave) return res.status(404).json({ message: 'Leave not found' });

//     // Example: set a faculty-approval flag
//     leave.status = 'approvedByFaculty';
//     leave.facultyApprovedBy = req.user._id;
//     await leave.save();

//     return res.status(200).json({ message: 'Leave approved by faculty', leave });
//   } catch (error) {
//     console.error('Error in approveLeave (faculty):', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };

// // PATCH /api/faculty/reject/:leaveId
// exports.rejectLeave = async (req, res) => {
//   try {
//     const { leaveId } = req.params;
//     const leave = await LeaveApplication.findById(leaveId);
//     if (!leave) return res.status(404).json({ message: 'Leave not found' });

//     leave.status = 'rejectedByFaculty';
//     leave.facultyRejectedBy = req.user._id;
//     await leave.save();

//     return res.status(200).json({ message: 'Leave rejected by faculty', leave });
//   } catch (error) {
//     console.error('Error in rejectLeave (faculty):', error);
//     return res.status(500).json({ message: 'Server error' });
//   }
// };
