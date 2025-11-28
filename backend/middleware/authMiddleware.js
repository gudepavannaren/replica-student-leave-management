// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;
    // Primary: Bearer token
    if (auth && auth.startsWith('Bearer ')) {
      const token = auth.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
      const user = await User.findById(payload.id).select('-password');
      if (!user) return res.status(401).json({ message: 'User not found' });
      req.user = { id: user._id, role: user.role, name: user.name };
      return next();
    }

    // Dev fallback: query params (very helpful during local testing)
    if (req.query.userId && req.query.role) {
      req.user = { id: req.query.userId, role: req.query.role, name: req.query.name || '' };
      return next();
    }

    return res.status(401).json({ message: 'No token provided' });
  } catch (err) {
    return res.status(401).json({ message: 'Invalid token', detail: err.message });
  }
};

module.exports = authMiddleware;

// // backend/middleware/authMiddleware.js
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// module.exports = async function(req, res, next){
//   try {
//     const auth = req.headers.authorization;
//     if (!auth || !auth.startsWith('Bearer ')) {
//       // dev fallback: allow query params ?userId=...&role=...
//       if (req.query.userId && req.query.role) {
//         req.user = { id: req.query.userId, role: req.query.role };
//         return next();
//       }
//       return res.status(401).json({ message: 'No token' });
//     }
//     const token = auth.split(' ')[1];
//     const payload = jwt.verify(token, process.env.JWT_SECRET || 'devsecret');
//     // optional: fetch user from DB
//     const user = await User.findById(payload.id).select('-password');
//     if (!user) return res.status(401).json({ message: 'User not found' });
//     req.user = { id: user._id, role: user.role, name: user.name };
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: 'Invalid token', detail: err.message });
//   }
// }

// // // backedn/middleware/authMiddleware.js
// // const jwt = require("jsonwebtoken");

// // module.exports = function (req, res, next) {
// //   const authHeader = req.headers["authorization"] || req.headers["Authorization"];
// //   if (!authHeader) {
// //     return res.status(401).json({ message: "Access denied. No token provided." });
// //   }

// //   // Support "Bearer <token>" or raw token
// //   const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
// //   if (!token) return res.status(401).json({ message: "Invalid token format." });

// //   try {
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// //     if (!decoded || (!decoded.id && !decoded._id)) {
// //       return res.status(401).json({ message: "Invalid token payload." });
// //     }
// //     // Normalize id property
// //     req.user = { id: decoded.id || decoded._id, role: decoded.role, email: decoded.email };
// //     next();
// //   } catch (err) {
// //     console.error("Auth token verification failed:", err);
// //     return res.status(401).json({ message: "Invalid or expired token" });
// //   }
// // };

// // // const jwt = require("jsonwebtoken");

// // // module.exports = function (req, res, next) {
// // //   const authHeader = req.headers["authorization"] || req.headers["Authorization"];
// // //   if (!authHeader) {
// // //     return res.status(401).json({ message: "Access denied. No token provided." });
// // //   }

// // //   // Accept "Bearer token" or just "token"
// // //   const token = authHeader.startsWith("Bearer ")
// // //     ? authHeader.split(" ")[1]
// // //     : authHeader;

// // //   if (!token) {
// // //     return res.status(401).json({ message: "Access denied. Invalid token format." });
// // //   }

// // //   try {
// // //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// // //     req.user = decoded; // { id: user._id, role: user.role }
// // //     next();
// // //   } catch (err) {
// // //     return res.status(400).json({ message: "Invalid or expired token" });
// // //   }
// // // };