// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const rectorOnly = require('../middleware/rectorOnly');
const LeaveApplication = require('../models/LeaveApplication');

// POST /api/admin/regenerate-pdf/:leaveId
router.post('/regenerate-pdf/:leaveId', auth, rectorOnly, async (req, res) => {
  try {
    const { leaveId } = req.params;
    if (!leaveId) return res.status(400).json({ message: 'leaveId required' });

    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    // require generator dynamically
    const { generateLeavePDF } = require('../utils/pdfGenerator');

    // attempt to use stored studentSnapshot or fallback to empty object
    const studentSnapshot = leave.studentSnapshot || {};

    const pdf = await generateLeavePDF({ leave, studentSnapshot });

    leave.pdfPath = pdf.filepath;
    await leave.save();

    return res.json({ message: 'PDF regenerated', pdfPath: pdf.filepath, leave });
  } catch (err) {
    console.error('Regenerate PDF error:', err && (err.stack || err.message || err));
    return res.status(500).json({ message: 'Could not regenerate PDF', detail: err.message || String(err) });
  }
});

module.exports = router;
