// backedn/middleware/rectorOnly.js
// Ensures only users with role "rector" may access the route.

module.exports = function (req, res, next) {
  if (!req.user || req.user.role !== "rector") {
    return res.status(403).json({ message: "Only rector can perform this action" });
  }
  next();
};

// module.exports = function (req, res, next) {
//   if (req.user.role !== "rector") {
//     return res.status(403).json({ message: "Only rector can perform this action" });
//   }
//   next();
// };