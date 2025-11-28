// backend/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'faculty', 'rector'], required: true },

  // student-specific
  rollNumber: { type: String },
  branch: { type: String },
  year: { type: String },
  hostel: { type: String },

  createdAt: { type: Date, default: Date.now }
});

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);

// // backend/models/User.js
// const mongoose = require('mongoose');
// const bcrypt = require('bcryptjs');

// const userSchema = new mongoose.Schema({
//   name: { type: String, required: true },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   role: { type: String, enum: ['student','faculty','rector'], required: true },

//   // student-specific
//   rollNumber: { type: String },
//   branch: { type: String },
//   year: { type: String },
//   hostel: { type: String },

//   createdAt: { type: Date, default: Date.now }
// });

// // hash password before save
// userSchema.pre('save', async function(next){
//   if (!this.isModified('password')) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// userSchema.methods.comparePassword = function(plain){
//   return bcrypt.compare(plain, this.password);
// };

// module.exports = mongoose.model('User', userSchema);

// // const mongoose = require("mongoose");

// // const userSchema = new mongoose.Schema({
// //   name: String,
// //   email: String,
// //   password: String,
// //   role: { type: String, enum: ['student', 'faculty', 'rector'] },
// //   rollNo: String,
// //   hostel: String,
// //   department: String
// // });

// // module.exports = mongoose.model('User', userSchema);  // ✅ CommonJS compatible