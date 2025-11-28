// backend/middleware/studentOnly.js
module.exports = (req, res, next) => {
  if (req.user && req.user.role === 'student') return next();
  return res.status(403).json({ message: 'Students only' });
};

// // backend/middleware/studentOnly.js
// module.exports = (req, res, next) => {
//   if (req.user && req.user.role === 'student') return next();
//   return res.status(403).json({ message: 'Students only' });
// };
// // module.exports = function (req, res, next) {
// //   if (!req.user || req.user.role !== "student") {
// //     return res.status(403).json({ message: "Only students can apply for leave" });
// //   }
// //   next();
// // };