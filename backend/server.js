// server.js (updated)
// Replace your existing server.js with this file.

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Serve uploads (PDFs, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ---------- config ----------
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGO || 'mongodb://127.0.0.1:27017/leave_management';

// ---------- try to require models & middleware ----------
let LeaveApplication = null;
let User = null;
let authMiddleware = null;
let studentOnly = null;
let facultyOnly = null;
let rectorOnly = null;

try {
  LeaveApplication = require('./models/LeaveApplication');
  console.log('Loaded models/LeaveApplication.js');
} catch (err) {
  console.warn('Warning: ./models/LeaveApplication.js not found or errored when requiring.');
  console.warn(err && err.message);
}

try {
  User = require('./models/User');
  console.log('Loaded models/User.js');
} catch (err) {
  // optional
}

// auth middleware (preferred)
try {
  authMiddleware = require('./middleware/authMiddleware');
  console.log('Loaded middleware/authMiddleware.js');
} catch (err) {
  console.warn('Warning: ./middleware/authMiddleware.js not found or errored when requiring. Using dev fallback auth middleware.');
  // VERY simple fallback for dev testing only — remove in production
  authMiddleware = (req, res, next) => {
    // allow ?userId=...&role=student|faculty|rector for quick local tests
    const { userId, role } = req.query;
    if (userId && role) {
      req.user = { id: userId, role };
      return next();
    }
    return res.status(401).json({ message: 'Missing auth middleware and no test query params provided.' });
  };
}

// role middlewares
try {
  studentOnly = require('./middleware/studentOnly');
  console.log('Loaded middleware/studentOnly.js');
} catch (err) {
  console.warn('Warning: ./middleware/studentOnly.js not found — using fallback.');
  studentOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'student' || req.user.role === 'Student')) return next();
    return res.status(403).json({ message: 'Forbidden: students only' });
  };
}

try {
  facultyOnly = require('./middleware/facultyOnly');
  console.log('Loaded middleware/facultyOnly.js');
} catch (err) {
  console.warn('Warning: ./middleware/facultyOnly.js not found — using fallback.');
  facultyOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'faculty' || req.user.role === 'Faculty')) return next();
    return res.status(403).json({ message: 'Forbidden: faculty only' });
  };
}

try {
  rectorOnly = require('./middleware/rectorOnly');
  console.log('Loaded middleware/rectorOnly.js');
} catch (err) {
  console.warn('Warning: ./middleware/rectorOnly.js not found — using fallback.');
  rectorOnly = (req, res, next) => {
    if (req.user && (req.user.role === 'rector' || req.user.role === 'Rector')) return next();
    return res.status(403).json({ message: 'Forbidden: rector only' });
  };
}

// ---------- helper util (business logic) ----------
function recomputeOverallStatus(leave) {
  if (!leave) return 'pending';
  if (leave.facultyStatus === 'rejected' || leave.rectorStatus === 'rejected') return 'rejected';

  if (leave.mode === 'rector') {
    if (leave.rectorStatus === 'approved') return 'approved';
    if (leave.rectorStatus === 'rejected') return 'rejected';
    return 'pending';
  }

  // mode: faculty+rector
  if (leave.facultyStatus === 'approved' && leave.rectorStatus === 'approved') return 'approved';
  if (leave.facultyStatus === 'approved' && (!leave.rectorStatus || leave.rectorStatus === 'pending')) return 'semi-approved';
  if (leave.rectorStatus === 'approved' && (!leave.facultyStatus || leave.facultyStatus === 'pending')) return 'pending'; // waiting for faculty
  return 'pending';
}

// ----------------- Attempt to mount external route files -----------------
let mountedAtLeastOneRoute = false;

try {
  const authRoutes = require('./routes/authRoutes');
  app.use('/api/auth', authRoutes);
  console.log('Mounted /api/auth (routes/authRoutes.js)');
  mountedAtLeastOneRoute = true;
} catch (err) {
  console.warn('routes/authRoutes.js not found; login/register routes will use fallback if available.');
}

try {
  const facultyRoutes = require('./routes/facultyRoutes');
  app.use('/api/faculty', facultyRoutes);
  console.log('Mounted /api/faculty (routes/facultyRoutes.js)');
  mountedAtLeastOneRoute = true;
} catch (err) {
  console.warn('routes/facultyRoutes.js not found; faculty routes will use fallback if available.');
}

try {
  const rectorRoutes = require('./routes/rectorRoutes');
  app.use('/api/rector', rectorRoutes);
  console.log('Mounted /api/rector (routes/rectorRoutes.js)');
  mountedAtLeastOneRoute = true;
} catch (err) {
  console.warn('routes/rectorRoutes.js not found; rector routes will use fallback if available.');
}

try {
  const leaveRoutes = require('./routes/leaveRoutes');
  app.use('/api/leaves', leaveRoutes);
  console.log('Mounted /api/leave (routes/leaveRoutes.js)');
  mountedAtLeastOneRoute = true;
} catch (err) {
  console.warn('routes/leaveRoutes.js not found; leave routes will use fallback if available.');
}

// ----------------- FALLBACK ROUTER (only used if route files missing) -----------------
const fallbackRouter = express.Router();

// Student applies for leave (fallback)
fallbackRouter.post('/leaves/apply', authMiddleware, studentOnly, async (req, res) => {
  try {
    if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { mode, reason, fromDate, toDate, remarks } = req.body;
    if (!mode || !['rector', 'faculty+rector'].includes(mode)) {
      return res.status(400).json({ message: "Provide 'mode' as 'rector' or 'faculty+rector'." });
    }
    if (!fromDate || !toDate) {
      return res.status(400).json({ message: 'Provide fromDate and toDate.' });
    }

    // optional: validate date ordering
    if (new Date(fromDate) > new Date(toDate)) {
      return res.status(400).json({ message: 'fromDate cannot be after toDate.' });
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
    console.error('apply error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Student fetch own leaves (fallback)
fallbackRouter.get('/leaves/my-leaves', authMiddleware, studentOnly, async (req, res) => {
  try {
    if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });
    const userId = req.user && (req.user.id || req.user._id);
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const leaves = await LeaveApplication.find({ studentId: userId }).sort({ createdAt: -1 });
    return res.status(200).json({ leaves });
  } catch (err) {
    console.error('get my-leaves error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Faculty: get pending leaves (uses facultyStatus)
fallbackRouter.get('/faculty/leaves/pending', authMiddleware, facultyOnly, async (req, res) => {
  try {
    if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

    const leaves = await LeaveApplication.find({
      facultyStatus: { $in: ['pending', null] },
      status: { $ne: 'rejected' }
    }).sort({ createdAt: -1 });

    return res.status(200).json({ leaves });
  } catch (err) {
    console.error('faculty pending leaves error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Faculty approve/reject (role-aware)
fallbackRouter.patch('/faculty/approve/:leaveId', authMiddleware, facultyOnly, async (req, res) => {
  try {
    if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

    const { leaveId } = req.params;
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });

    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.facultyStatus = action === 'approve' ? 'approved' : 'rejected';
    leave.facultyId = req.user.id || req.user._id;
    leave.facultyDecisionAt = new Date();

    leave.status = recomputeOverallStatus(leave);
    await leave.save();

    return res.status(200).json({ message: 'Faculty decision recorded', leave });
  } catch (err) {
    console.error('faculty approve error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Rector: get pending leaves
fallbackRouter.get('/rector/leaves/pending', authMiddleware, rectorOnly, async (req, res) => {
  try {
    if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

    const leaves = await LeaveApplication.find({ status: 'pending' }).sort({ createdAt: -1 });
    return res.status(200).json({ leaves });
  } catch (err) {
    console.error('rector get pending leaves error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Rector approve/reject
fallbackRouter.patch('/rector/approve/:leaveId', authMiddleware, rectorOnly, async (req, res) => {
  try {
    if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

    const { leaveId } = req.params;
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });

    const leave = await LeaveApplication.findById(leaveId);
    if (!leave) return res.status(404).json({ message: 'Leave not found' });

    leave.rectorStatus = action === 'approve' ? 'approved' : 'rejected';
    leave.rectorId = req.user.id || req.user._id;
    leave.rectorDecisionAt = new Date();

    leave.status = recomputeOverallStatus(leave);
    await leave.save();

    return res.status(200).json({ message: 'Rector decision recorded', leave });
  } catch (err) {
    console.error('rector approve error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Generic role-aware status endpoint (works for faculty/rector)
fallbackRouter.patch('/leaves/status/:leaveId', authMiddleware, async (req, res) => {
  try {
    if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

    const { leaveId } = req.params;
    const { action } = req.body;
    if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });

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

    leave.status = recomputeOverallStatus(leave);
    await leave.save();

    return res.status(200).json({ message: 'Decision recorded', leave });
  } catch (err) {
    console.error('update status error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Mount fallback router at root of API only if needed
if (!mountedAtLeastOneRoute) {
  app.use('/api', fallbackRouter);
  console.log('No external route files mounted — using fallback inline handlers at /api/*');
} else {
  // If some route files are mounted but you still want the fallback to cover missing endpoints,
  // you can mount fallbackRouter at /api/fallback or merge selectively.
  // For safety, we won't auto-mount the fallback if real route files exist.
  console.log('At least one route file mounted externally; fallback inline handlers are NOT mounted to avoid conflicts.');
}

// Root health
app.get('/', (req, res) => res.json({ message: 'Leave management backend is running' }));

// Helper: print mounted routes (for debugging)
function printRoutes() {
  console.log('\n--- Registered routes ---');
  if (!app._router) {
    console.log('No routes registered.');
    return;
  }
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // routes registered directly on the app
      const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
      console.log(methods, middleware.route.path);
    } else if (middleware.name === 'router') {
      // router middleware
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
          console.log(methods, handler.route.path);
        }
      });
    }
  });
  console.log('--- end routes ---\n');
}

// ---------- connect to DB and start server ----------
async function start() {
  try {
    await mongoose.connect(MONGO_URI, {
      // Mongoose 8 no longer needs these, but safe to include
    });
    console.log('✅ Connected to MongoDB');

    app.listen(PORT, () => {
      console.log(`✅ Server running on http://localhost:${PORT}`);
      printRoutes();
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB or start server:', err);
    process.exit(1);
  }
}

start();

// // server.js
// const express = require('express');
// const mongoose = require('mongoose');
// const cors = require('cors');
// const path = require('path');

// require('dotenv').config();

// const app = express();
// app.use(express.json());
// app.use(cors());

// // ---------------- ROUTES IMPORT ----------------
// // const authRoutes = require("./routes/authRoutes");
// // const facultyRoutes = require("./routes/facultyRoutes");
// // const rectorRoutes = require("./routes/rectorRoutes");
// // const leaveRoutes = require("./routes/leaveRoutes");

// // // ---------------- ROUTES MOUNT ----------------
// // app.use("/api/auth", authRoutes);
// // app.use("/api/faculty", facultyRoutes);
// // app.use("/api/rector", rectorRoutes);
// // app.use("/api/leave", leaveRoutes);
// // ---------- config ----------

// const PORT = process.env.PORT || 5000;
// const MONGO_URI = process.env.MONGO_URI || process.env.MONGO || 'mongodb://127.0.0.1:27017/leave_management';

// // ---------- try to load existing models and middleware ----------
// let LeaveApplication;
// let User;
// let authMiddleware;
// let studentOnly;
// let facultyOnly;
// let rectorOnly;

// try {
//   LeaveApplication = require('./models/LeaveApplication');
//   console.log('Loaded models/LeaveApplication.js');
// } catch (err) {
//   console.warn('Warning: ./models/LeaveApplication.js not found or errored when requiring. Ensure file exists and exports a Mongoose model.');
//   console.warn(err && err.message);
// }

// try {
//   User = require('./models/User');
//   console.log('Loaded models/User.js');
// } catch (err) {
//   // optional; only used if we need to fetch role from DB
// }

// try {
//   authMiddleware = require('./middleware/authMiddleware');
//   console.log('Loaded middleware/authMiddleware.js');
// } catch (err) {
//   console.warn('Warning: ./middleware/authMiddleware.js not found or errored when requiring. You need an auth middleware that attaches req.user { id, role }');
//   console.warn(err && err.message);

//   // fallback simple auth middleware for local testing (DO NOT use in production)
//   authMiddleware = (req, res, next) => {
//     // For local testing: allow passing ?userId=...&role=student|faculty|rector
//     const { userId, role } = req.query;
//     if (userId && role) {
//       req.user = { id: userId, role };
//       return next();
//     }
//     return res.status(401).json({ message: 'Missing auth middleware and no test query params provided. Provide Authorization header or add middleware.' });
//   };
// }

// try {
//   studentOnly = require('./middleware/studentOnly');
//   console.log('Loaded middleware/studentOnly.js');
// } catch (err) {
//   console.warn('Warning: ./middleware/studentOnly.js not found or errored when requiring. Using inline fallback.');
//   studentOnly = (req, res, next) => {
//     if (req.user && (req.user.role === 'student' || req.user.role === 'Student')) return next();
//     return res.status(403).json({ message: 'Forbidden: students only' });
//   };
// }

// try {
//   facultyOnly = require('./middleware/facultyOnly');
//   console.log('Loaded middleware/facultyOnly.js');
// } catch (err) {
//   console.warn('Warning: ./middleware/facultyOnly.js not found or errored when requiring. Using inline fallback.');
//   facultyOnly = (req, res, next) => {
//     if (req.user && (req.user.role === 'faculty' || req.user.role === 'Faculty')) return next();
//     return res.status(403).json({ message: 'Forbidden: faculty only' });
//   };
// }

// try {
//   rectorOnly = require('./middleware/rectorOnly');
//   console.log('Loaded middleware/rectorOnly.js');
// } catch (err) {
//   console.warn('Warning: ./middleware/rectorOnly.js not found or errored when requiring. Using inline fallback.');
//   rectorOnly = (req, res, next) => {
//     if (req.user && (req.user.role === 'rector' || req.user.role === 'Rector')) return next();
//     return res.status(403).json({ message: 'Forbidden: rector only' });
//   };
// }

// // ---------- helper util (business logic) ----------
// function recomputeOverallStatus(leave) {
//   // leave.facultyStatus and leave.rectorStatus expected to be 'pending' | 'approved' | 'rejected'
//   if (!leave) return 'pending';
//   if (leave.facultyStatus === 'rejected' || leave.rectorStatus === 'rejected') return 'rejected';

//   if (leave.mode === 'rector') {
//     if (leave.rectorStatus === 'approved') return 'approved';
//     if (leave.rectorStatus === 'rejected') return 'rejected';
//     return 'pending';
//   }

//   // mode: faculty+rector
//   if (leave.facultyStatus === 'approved' && leave.rectorStatus === 'approved') return 'approved';
//   if (leave.facultyStatus === 'approved' && (!leave.rectorStatus || leave.rectorStatus === 'pending')) return 'semi-approved';
//   if (leave.rectorStatus === 'approved' && (!leave.facultyStatus || leave.facultyStatus === 'pending')) return 'pending'; // keep pending until faculty approves
//   return 'pending';
// }

// // ---------- route handlers (inline) ----------

// // Student applies for leave
// app.post('/api/leaves/apply', authMiddleware, studentOnly, async (req, res) => {
//   try {
//     if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

//     const userId = req.user && (req.user.id || req.user._id);
//     if (!userId) return res.status(401).json({ message: 'Unauthorized' });

//     const { mode, reason, fromDate, toDate, remarks } = req.body;
//     if (!mode || !['rector', 'faculty+rector'].includes(mode)) {
//       return res.status(400).json({ message: "Provide 'mode' as 'rector' or 'faculty+rector'." });
//     }
//     if (!fromDate || !toDate) {
//       return res.status(400).json({ message: 'Provide fromDate and toDate.' });
//     }

//     const leave = new LeaveApplication({
//       studentId: userId,
//       mode,
//       reason,
//       fromDate,
//       toDate,
//       remarks,
//       facultyStatus: 'pending',
//       rectorStatus: 'pending',
//       status: 'pending'
//     });

//     await leave.save();
//     return res.status(201).json({ message: 'Leave applied successfully', leave });
//   } catch (err) {
//     console.error('apply error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // Student fetch own leaves
// app.get('/api/leaves/my-leaves', authMiddleware, studentOnly, async (req, res) => {
//   try {
//     if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });
//     const userId = req.user && (req.user.id || req.user._id);
//     if (!userId) return res.status(401).json({ message: 'Unauthorized' });

//     const leaves = await LeaveApplication.find({ studentId: userId }).sort({ createdAt: -1 });
//     return res.status(200).json({ leaves });
//   } catch (err) {
//     console.error('get my-leaves error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // --- Rector: view and approve/reject leaves ---
// // make sure these are required at top of file if not already:
// // const LeaveApplication = require('./models/LeaveApplication');
// // const authMiddleware = require('./middleware/authMiddleware');
// // const rectorOnly = require('./middleware/rectorOnly');


// // Get ALL leaves (for rector view)
// app.get('/api/rector/leaves', authMiddleware, rectorOnly, async (req, res) => {
//   try {
//     if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

//     // Optionally you can filter by hostel/class depending on req.user
//     const leaves = await LeaveApplication.find().sort({ createdAt: -1 });
//     return res.status(200).json({ leaves }); // same shape as your student route
//   } catch (err) {
//     console.error('rector get all leaves error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // Get only PENDING leaves for rector
// app.get('/api/rector/leaves/pending', authMiddleware, rectorOnly, async (req, res) => {
//   try {
//     if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

//     // Adjust the status string to match your app's convention (e.g., "pending", "pendingRector")
//     const leaves = await LeaveApplication.find({ status: 'pending' }).sort({ createdAt: -1 });
//     return res.status(200).json({ leaves });
//   } catch (err) {
//     console.error('rector get pending leaves error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // Approve a leave (rector)
// app.patch('/api/rector/approve/:id', authMiddleware, rectorOnly, async (req, res) => {
//   try {
//     if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });
//     const { id } = req.params;

//     const leave = await LeaveApplication.findById(id);
//     if (!leave) return res.status(404).json({ message: 'Leave not found' });

//     // Prevent re-approving
//     if (leave.status === 'approved' || leave.status === 'approvedByFaculty' || leave.status === 'approvedByRector') {
//       return res.status(400).json({ message: 'Leave already approved' });
//     }

//     // Update status and metadata
//     leave.status = 'approved'; // choose status string used by your app
//     leave.rectorApprovedBy = req.user._id || req.user.id;
//     leave.rectorApprovedAt = new Date();
//     await leave.save();

//     console.log(`Rector ${req.user._id || req.user.id} approved leave ${id}`);
//     return res.status(200).json({ message: 'Leave approved by rector', leave });
//   } catch (err) {
//     console.error('rector approve leave error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // Reject a leave (rector)
// app.patch('/api/rector/reject/:id', authMiddleware, rectorOnly, async (req, res) => {
//   try {
//     if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });
//     const { id } = req.params;
//     const { reason } = req.body; // optional reject reason

//     const leave = await LeaveApplication.findById(id);
//     if (!leave) return res.status(404).json({ message: 'Leave not found' });

//     // Prevent re-rejecting if already rejected
//     if (leave.status && leave.status.toLowerCase().includes('rejected')) {
//       return res.status(400).json({ message: 'Leave already rejected' });
//     }

//     leave.status = 'rejected';
//     leave.rectorRejectedBy = req.user._id || req.user.id;
//     leave.rectorRejectedAt = new Date();
//     if (reason) leave.rectorRejectionReason = reason;

//     await leave.save();

//     console.log(`Rector ${req.user._id || req.user.id} rejected leave ${id} reason: ${reason || 'none'}`);
//     return res.status(200).json({ message: 'Leave rejected by rector', leave });
//   } catch (err) {
//     console.error('rector reject leave error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // --- Faculty: view and approve/reject leaves ---
// // make sure these are required at top of file:
// // const LeaveApplication = require('./models/LeaveApplication');
// // const authMiddleware = require('./middleware/authMiddleware');
// // const facultyOnly = require('./middleware/facultyOnly');

// // ---------------- GET ALL LEAVES ----------------
// app.get('/api/faculty/leaves', authMiddleware, facultyOnly, async (req, res) => {
//   try {
//     if (!LeaveApplication)
//       return res.status(500).json({ message: 'LeaveApplication model missing.' });

//     const leaves = await LeaveApplication.find().sort({ createdAt: -1 });
//     return res.status(200).json({ leaves });
//   } catch (err) {
//     console.error('faculty get all leaves error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // ---------------- GET PENDING LEAVES FOR FACULTY ----------------
// app.get('/api/faculty/leaves/pending', authMiddleware, facultyOnly, async (req, res) => {
//   try {
//     const leaves = await LeaveApplication.find({
//       $and: [
//         { facultyApproved: { $ne: true } },   // faculty has not approved
//         { facultyRejected: { $ne: true } },   // faculty has not rejected
//         { status: { $ne: 'rejected' } },       // overall not rejected
//       ],
//     }).sort({ createdAt: -1 });

//     return res.status(200).json({ leaves });
//   } catch (err) {
//     console.error('faculty pending leaves error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // ---------------- APPROVE LEAVE (Faculty) ----------------
// app.patch('/api/faculty/approve/:id', authMiddleware, facultyOnly, async (req, res) => {
//   try {
//     const { id } = req.params;

//     const leave = await LeaveApplication.findById(id);
//     if (!leave) return res.status(404).json({ message: 'Leave not found' });

//     if (leave.status === 'rejected') {
//       return res.status(400).json({ message: 'Already rejected. Cannot approve.' });
//     }

//     // Mark faculty approval
//     leave.facultyApproved = true;
//     leave.facultyApprovedBy = req.user._id;
//     leave.facultyApprovedAt = new Date();

//     // STATUS LOGIC
//     if (leave.rectorApproved) {
//       leave.status = 'approved';         // both approved
//     } else {
//       leave.status = 'approvedByFaculty'; // waiting for rector
//     }

//     await leave.save();

//     console.log(`Faculty ${req.user._id} approved leave ${id}`);
//     return res.status(200).json({ message: 'Leave approved by faculty', leave });
//   } catch (err) {
//     console.error('faculty approve error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // ---------------- REJECT LEAVE (Faculty) ----------------
// app.patch('/api/faculty/reject/:id', authMiddleware, facultyOnly, async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { reason } = req.body;

//     const leave = await LeaveApplication.findById(id);
//     if (!leave) return res.status(404).json({ message: 'Leave not found' });

//     leave.facultyRejected = true;
//     leave.facultyRejectedBy = req.user._id;
//     leave.facultyRejectedAt = new Date();
//     leave.facultyRejectionReason = reason || 'Rejected by faculty';

//     leave.status = 'rejected'; // immediate rejection

//     await leave.save();

//     console.log(`Faculty ${req.user._id} rejected leave ${id}`);
//     return res.status(200).json({ message: 'Leave rejected by faculty', leave });
//   } catch (err) {
//     console.error('faculty reject error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });


// // Role-aware status update (faculty or rector can hit this)
// app.patch('/api/leaves/status/:leaveId', authMiddleware, async (req, res) => {
//   try {
//     if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

//     const { leaveId } = req.params;
//     const { action } = req.body; // 'approve' or 'reject'
//     if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });

//     const leave = await LeaveApplication.findById(leaveId);
//     if (!leave) return res.status(404).json({ message: 'Leave not found' });

//     const role = req.user && req.user.role;
//     const userId = req.user && (req.user.id || req.user._id);
//     if (!role || !userId) return res.status(401).json({ message: 'Unauthorized' });

//     if (role === 'faculty') {
//       leave.facultyStatus = action === 'approve' ? 'approved' : 'rejected';
//       leave.facultyId = userId;
//       leave.facultyDecisionAt = new Date();
//     } else if (role === 'rector') {
//       leave.rectorStatus = action === 'approve' ? 'approved' : 'rejected';
//       leave.rectorId = userId;
//       leave.rectorDecisionAt = new Date();
//     } else {
//       return res.status(403).json({ message: 'Only faculty or rector can change approval status.' });
//     }

//     leave.status = recomputeOverallStatus(leave);
//     await leave.save();

//     return res.status(200).json({ message: 'Decision recorded', leave });
//   } catch (err) {
//     console.error('update status error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // Dedicated faculty endpoint (optional)
// app.patch('/api/faculty/approve/:leaveId', authMiddleware, facultyOnly, async (req, res) => {
//   try {
//     if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

//     const { leaveId } = req.params;
//     const { action } = req.body;
//     if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });

//     const leave = await LeaveApplication.findById(leaveId);
//     if (!leave) return res.status(404).json({ message: 'Leave not found' });

//     const userId = req.user && (req.user.id || req.user._id);
//     leave.facultyStatus = action === 'approve' ? 'approved' : 'rejected';
//     leave.facultyId = userId;
//     leave.facultyDecisionAt = new Date();

//     leave.status = recomputeOverallStatus(leave);
//     await leave.save();

//     return res.status(200).json({ message: 'Faculty decision recorded', leave });
//   } catch (err) {
//     console.error('faculty approve error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // Dedicated rector endpoint (optional)
// app.patch('/api/rector/approve/:leaveId', authMiddleware, rectorOnly, async (req, res) => {
//   try {
//     if (!LeaveApplication) return res.status(500).json({ message: 'Server not configured: LeaveApplication model missing.' });

//     const { leaveId } = req.params;
//     const { action } = req.body;
//     if (!['approve', 'reject'].includes(action)) return res.status(400).json({ message: "Invalid action. Use 'approve' or 'reject'." });

//     const leave = await LeaveApplication.findById(leaveId);
//     if (!leave) return res.status(404).json({ message: 'Leave not found' });

//     const userId = req.user && (req.user.id || req.user._id);
//     leave.rectorStatus = action === 'approve' ? 'approved' : 'rejected';
//     leave.rectorId = userId;
//     leave.rectorDecisionAt = new Date();

//     leave.status = recomputeOverallStatus(leave);
//     await leave.save();

//     return res.status(200).json({ message: 'Rector decision recorded', leave });
//   } catch (err) {
//     console.error('rector approve error:', err);
//     return res.status(500).json({ message: 'Server error' });
//   }
// });

// // Root health
// app.get('/', (req, res) => res.json({ message: 'Leave management backend is running' }));

// // ---------- connect to DB and start server ----------
// async function start() {
//   try {
//     await mongoose.connect(MONGO_URI, {
//       useNewUrlParser: true,
//       useUnifiedTopology: true
//     });
//     console.log('✅ Connected to MongoDB');
//     app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
//   } catch (err) {
//     console.error('Failed to connect to MongoDB or start server:', err);
//     process.exit(1);
//   }
// }

// start();
