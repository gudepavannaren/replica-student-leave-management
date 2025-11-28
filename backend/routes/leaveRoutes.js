// backend/routes/leaveRoutes.js
const express = require('express');
const router = express.Router();

const leaveController = require('../controllers/leaveController');
const authMiddleware = require('../middleware/authMiddleware');
const studentOnly = require('../middleware/studentOnly');

// defensive checks
if (!leaveController || typeof leaveController.applyLeave !== 'function') {
  throw new Error('leaveRoutes: applyLeave not exported from controllers/leaveController');
}
if (typeof authMiddleware !== 'function') {
  throw new Error('leaveRoutes: authMiddleware is not a function');
}
if (typeof studentOnly !== 'function') {
  throw new Error('leaveRoutes: studentOnly is not a function');
}

// Student applies for leave (only students)
router.post('/apply', authMiddleware, studentOnly, leaveController.applyLeave);

// Student fetch their own leaves
router.get('/my-leaves', authMiddleware, studentOnly, leaveController.getLeavesByUser);

// Role-aware status update endpoint (faculty or rector can use this; we still keep authMiddleware)
router.patch('/status/:leaveId', authMiddleware, leaveController.updateLeaveStatus);


module.exports = router;

