// backend/middleware/facultyOnly.js
module.exports = (req, res, next) => {
  if (req.user && req.user.role === 'faculty') return next();
  return res.status(403).json({ message: 'Faculty only' });
};

// / backend/middleware/facultyOnly.js
// module.exports = (req, res, next) => {
//   if (req.user && req.user.role === 'faculty') return next();
//   return res.status(403).json({ message: 'Faculty only' });
// };
// // module.exports = function (req, res, next) {
// //   if (req.user.role !== "faculty") {
// //     return res.status(403).json({ message: "Only faculty can perform this action" });
// //   }
// //   next();
// // };