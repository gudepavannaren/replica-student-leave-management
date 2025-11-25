// backedn/middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  if (!authHeader) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  // Support "Bearer <token>" or raw token
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
  if (!token) return res.status(401).json({ message: "Invalid token format." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || (!decoded.id && !decoded._id)) {
      return res.status(401).json({ message: "Invalid token payload." });
    }
    // Normalize id property
    req.user = { id: decoded.id || decoded._id, role: decoded.role, email: decoded.email };
    next();
  } catch (err) {
    console.error("Auth token verification failed:", err);
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};

// const jwt = require("jsonwebtoken");

// module.exports = function (req, res, next) {
//   const authHeader = req.headers["authorization"] || req.headers["Authorization"];
//   if (!authHeader) {
//     return res.status(401).json({ message: "Access denied. No token provided." });
//   }

//   // Accept "Bearer token" or just "token"
//   const token = authHeader.startsWith("Bearer ")
//     ? authHeader.split(" ")[1]
//     : authHeader;

//   if (!token) {
//     return res.status(401).json({ message: "Access denied. Invalid token format." });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // { id: user._id, role: user.role }
//     next();
//   } catch (err) {
//     return res.status(400).json({ message: "Invalid or expired token" });
//   }
// };