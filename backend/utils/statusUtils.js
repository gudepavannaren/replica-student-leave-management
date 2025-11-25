// backend/utils/statusUtil.js
/**
 * recomputeOverallStatus(leave)
 * Returns:
 * - "pending" when waiting for decisions
 * - "semi-approved" when faculty approved but rector pending (for mode 'faculty+rector')
 * - "approved" when final approval achieved
 * - "rejected" when either stage rejects (business rule: any rejection => rejected)
 */
function recomputeOverallStatus(leave) {
  // leave.mode: "rector" or "faculty+rector"
  // leave.facultyStatus, leave.rectorStatus values: "pending" | "approved" | "rejected"
  const mode = leave.mode || "faculty+rector";

  // If any explicit rejection, immediate 'rejected'
  if (leave.facultyStatus === "rejected" || leave.rectorStatus === "rejected") {
    return "rejected";
  }

  if (mode === "rector") {
    // Only rector decides
    if (leave.rectorStatus === "approved") return "approved";
    return "pending";
  } else {
    // mode: faculty+rector
    if (leave.facultyStatus === "approved" && leave.rectorStatus === "approved") {
      return "approved";
    }
    if (leave.facultyStatus === "approved" && (!leave.rectorStatus || leave.rectorStatus === "pending")) {
      return "semi-approved"; // faculty ok, waiting on rector
    }
    if (!leave.facultyStatus || leave.facultyStatus === "pending") {
      return "pending"; // waiting on faculty
    }
    return "pending";
  }
}

module.exports = { recomputeOverallStatus };

// // utils/statusUtils.js
// function recomputeOverallStatus(leave) {
//   // If either rejected -> rejected
//   if (leave.facultyStatus === 'rejected' || leave.rectorStatus === 'rejected') {
//     return 'rejected';
//   }

//   // Rector-only mode: rector decides
//   if (leave.mode === 'rector') {
//     if (leave.rectorStatus === 'approved') return 'approved';
//     if (leave.rectorStatus === 'rejected') return 'rejected';
//     return 'pending';
//   }

//   // mode: 'faculty+rector'
//   if (leave.facultyStatus === 'approved' && leave.rectorStatus === 'approved') {
//     return 'approved';
//   }

//   if (leave.facultyStatus === 'approved' && (!leave.rectorStatus || leave.rectorStatus === 'pending')) {
//     return 'semi-approved';
//   }

//   if (leave.rectorStatus === 'approved' && (!leave.facultyStatus || leave.facultyStatus === 'pending')) {
//     // rector approved but faculty pending: keep pending (policy choice)
//     return 'pending';
//   }

//   return 'pending';
// }

// module.exports = { recomputeOverallStatus };
