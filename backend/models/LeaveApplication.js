// backend/models/LeaveApplication.js
const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentSnapshot: {
    name: String,
    rollNumber: String,
    branch: String,
    year: String,
    hostel: String
  },

  mode: { type: String, enum: ['rector', 'faculty+rector'], required: true },
  reason: { type: String, required: true },
  fromDate: { type: Date, required: true },
  toDate: { type: Date, required: true },
  remarks: { type: String },

  // Faculty decision
  facultyStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  facultyDecisionAt: Date,
  facultyRejectionReason: String,

  // Rector decision
  rectorStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  rectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rectorDecisionAt: Date,
  rectorRejectionReason: String,

  // overall status
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

  // PDF path (relative path served by express static)
  pdfPath: { type: String },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

leaveSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('LeaveApplication', leaveSchema);

// // backend/models/LeaveApplication.js
// const mongoose = require('mongoose');

// const leaveSchema = new mongoose.Schema({
//   studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   studentSnapshot: {
//     name: String,
//     rollNumber: String,
//     branch: String,
//     year: String,
//     hostel: String
//   },

//   mode: { type: String, enum: ['rector','faculty+rector'], required: true },
//   reason: { type: String, required: true },
//   fromDate: { type: Date, required: true },
//   toDate: { type: Date, required: true },
//   remarks: { type: String },

//   // Faculty decision
//   facultyStatus: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
//   facultyId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   facultyDecisionAt: Date,
//   facultyRejectionReason: String,

//   // Rector decision
//   rectorStatus: { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
//   rectorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   rectorDecisionAt: Date,
//   rectorRejectionReason: String,

//   // overall: pending / semi-approved / approved / rejected
//   status: { type: String, default: 'pending' },

//   // PDF path (relative to /uploads)
//   pdfPath: { type: String },

//   createdAt: { type: Date, default: Date.now },
//   updatedAt: { type: Date, default: Date.now }
// });

// leaveSchema.pre('save', function(next){
//   this.updatedAt = new Date();
//   next();
// });

// module.exports = mongoose.model('LeaveApplication', leaveSchema);

// // models/LeaveApplication.js
// const mongoose = require('mongoose');
// const { Schema, model } = mongoose;

// const leaveSchema = new Schema(
//   {
//     studentId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

//     // Leave mode: either rector alone, or faculty + rector approval required
//     mode: { type: String, enum: ['rector', 'faculty+rector'], required: true },

//     reason: { type: String, trim: true },
//     fromDate: { type: Date, required: true },
//     toDate: { type: Date, required: true },

//     // Overall status for UI convenience:
//     // 'pending' (nobody approved yet), 'semi-approved' (faculty approved, rector pending),
//     // 'approved' (both approved / rector approved in rector-mode), 'rejected'
//     status: {
//       type: String,
//       enum: ['pending', 'semi-approved', 'approved', 'rejected'],
//       default: 'pending'
//     },

//     // Faculty approvals
//     facultyStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
//     facultyId: { type: Schema.Types.ObjectId, ref: 'User' },
//     facultyDecisionAt: { type: Date },

//     // Rector approvals
//     rectorStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
//     rectorId: { type: Schema.Types.ObjectId, ref: 'User' },
//     rectorDecisionAt: { type: Date },

//     // Optional: generated pdf / pass path
//     pdfPath: { type: String },

//     // Optional: other metadata
//     remarks: { type: String }
//   },
//   { timestamps: true }
// );

// module.exports = model('LeaveApplication', leaveSchema);
