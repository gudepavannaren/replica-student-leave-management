// controllers/leaveController.js
const LeaveApplication = require('../models/LeaveApplication');
const { recomputeOverallStatus } = require("../utils/statusUtils");


// Student applies for leave
const applyLeave = async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { mode, reason, fromDate, toDate, remarks } = req.body;
    if (!mode || !['rector', 'faculty+rector'].includes(mode)) {
      return res.status(400).json({ message: "Provide 'mode' as 'rector' or 'faculty+rector'." });
    }
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Provide fromDate and toDate.' });
    }

    const leave = new LeaveApplication({
      studentId: userId,
      mode,
      reason,
      fromDate,
      toDate,
      remarks,
      facultyStatus: 'pending',
      rectorStatus: 'pending',
      status: 'pending'
    });

    await leave.save();
    return res.status(201).json({ message: 'Leave applied successfully', leave });
  } catch (err) {
    console.error('applyLeave error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get leaves for the user (student's own leaves)
const getLeavesByUser = async (req, res) => {
  try {
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const leaves = await LeaveApplication.find({ studentId: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ leaves });
  } catch (err) {
    console.error('getLeavesByUser error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Role-aware status update (faculty or rector)
const updateLeaveStatus = async (req, res) => {
  try {
    const { leaveId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });
    }

    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    const role = req.user && req.user.role;
    const userId = req.user && (req.user.id || req.user._id);
    if (!role || !userId) return res.status(401).json({ message: 'Unauthorized' });

    if (role === 'faculty') {
      leave.facultyStatus = action === 'approve' ? 'approved' : 'rejected';
      leave.facultyId = userId;
      leave.facultyDecisionAt = new Date();
    } else if (role === 'rector') {
      leave.rectorStatus = action === 'approve' ? 'approved' : 'rejected';
      leave.rectorId = userId;
      leave.rectorDecisionAt = new Date();
    } else {
      return res.status(403).json({ message: 'Only faculty or rector can change approval status.' });
    }

    // Recompute overall status and save
    leave.status = recomputeOverallStatus(leave);
    await leave.save();

    return res.status(200).json({ message: 'Decision recorded', leave });
  } catch (err) {
    console.error('updateLeaveStatus error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  applyLeave,
  getLeavesByUser,
  updateLeaveStatus
};
