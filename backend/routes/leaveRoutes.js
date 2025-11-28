// backend/routes/leaveRoutes.js
const express = require('express');
const LeaveApplication = require('../models/LeaveApplication');
const User = require('../models/User');
const auth = require('../middleware/authMiddleware');
const studentOnly = require('../middleware/studentOnly');

const router = express.Router();

// Student apply leave
router.post('/apply', auth, studentOnly, async (req, res) => {
  try {
    const { mode, reason, fromDate, toDate, remarks } = req.body;
    if (!mode || !reason || !fromDate || !toDate) {
      return res.status(400).json({ message: 'mode, reason, fromDate, toDate required' });
    }
    // fetch student snapshot
    const student = await User.findById(req.user.id).lean();
    if (!student) return res.status(404).json({ message: 'Student not found' });

    const leave = new LeaveApplication({
      studentId: student._id,
      studentSnapshot: {
        name: student.name,
        rollNumber: student.rollNumber,
        branch: student.branch,
        year: student.year,
        hostel: student.hostel
      },
      mode,
      reason,
      fromDate,
      toDate,
      remarks
    });

    // If mode is 'rector' then facultyStatus irrelevant; keep default pending.
    // final status stays pending until approvals.
    await leave.save();
    res.status(201).json({ message: 'Leave applied', leave });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

// Student get all own leaves
router.get('/my-leaves', auth, studentOnly, async (req, res) => {
  try {
    const leaves = await LeaveApplication.find({ studentId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.json({ leaves });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error', detail: err.message });
  }
});

module.exports = router;

// // backend/routes/leaveRoutes.js
// const express = require('express');
// const router = express.Router();

// const leaveController = require('../controllers/leaveController');
// const authMiddleware = require('../middleware/authMiddleware');
// const studentOnly = require('../middleware/studentOnly');

// // defensive checks
// if (!leaveController || typeof leaveController.applyLeave !== 'function') {
//   throw new Error('leaveRoutes: applyLeave not exported from controllers/leaveController');
// }
// if (typeof authMiddleware !== 'function') {
//   throw new Error('leaveRoutes: authMiddleware is not a function');
// }
// if (typeof studentOnly !== 'function') {
//   throw new Error('leaveRoutes: studentOnly is not a function');
// }

// // Student applies for leave (only students)
// router.post('/apply', authMiddleware, studentOnly, leaveController.applyLeave);

// // Student fetch their own leaves
// router.get('/my-leaves', authMiddleware, studentOnly, leaveController.getLeavesByUser);

// // Role-aware status update endpoint (faculty or rector can use this; we still keep authMiddleware)
// router.patch('/status/:leaveId', authMiddleware, leaveController.updateLeaveStatus);


// module.exports = router;

