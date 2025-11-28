// frontend/src/pages/faculty/dashboard.jsx
import React, { useEffect, useState } from "react";
import api from "../../services/api";
import Navbar from "../../components/navbar";
import { useAuth } from "../../context/Authcontext";

export default function FacultyDashboard() {
  const { user } = useAuth(); // optional, used only to re-fetch if user changes
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [globalError, setGlobalError] = useState(null);
  const [processingId, setProcessingId] = useState(null); // id currently being processed

  const PENDING_ENDPOINT = "/api/faculty/leaves/pending";
  const APPROVE_ENDPOINT = (id) => `/api/faculty/approve/${id}`;

  useEffect(() => {
    let mounted = true;
    const fetchPending = async () => {
      setLoading(true);
      setGlobalError(null);
      try {
        console.log("[FacultyDashboard] GET", PENDING_ENDPOINT);
        const res = await api.get(PENDING_ENDPOINT);
        // backend returns { leaves: [...] }
        const fetched = Array.isArray(res?.data?.leaves) ? res.data.leaves : (Array.isArray(res?.data) ? res.data : []);
        if (mounted) setLeaves(fetched);
      } catch (err) {
        console.error("[FacultyDashboard] fetch failed:", err?.response?.status, err?.response?.data || err?.message);
        // map common errors to friendly message
        const status = err?.response?.status;
        if (status === 401) setGlobalError("Unauthorized. Please login again.");
        else if (status === 403) setGlobalError("Forbidden. Your account lacks the faculty role.");
        else setGlobalError("Failed to load pending leaves. Check backend routes or console for details.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPending();
    return () => { mounted = false; };
  }, [user]);

  // Generic change-status (approve/reject)
  const changeLeaveStatus = async (leaveId, action) => {
    if (!leaveId) return;
    setProcessingId(leaveId);
    setGlobalError(null);

    try {
      console.log("[FacultyDashboard] calling PATCH", APPROVE_ENDPOINT(leaveId), { action });
      // backend expects body { action: 'approve' | 'reject' }
      const res = await api.patch(APPROVE_ENDPOINT(leaveId), { action });
      console.log("[FacultyDashboard] change status response:", res?.data);
      // remove the row from UI (or call fetch again if you prefer)
      setLeaves(prev => prev.filter(l => (l._id || l.id) !== leaveId));
    } catch (err) {
      console.error("Approve/Reject error:", err);
      const status = err?.response?.status;
      if (status === 401) {
        alert("Action failed: Unauthorized. Please login.");
      } else if (status === 403) {
        alert("Action failed: Only faculty can perform this action.");
      } else if (status === 404) {
        alert("Action failed: Leave not found.");
      } else {
        // fallback
        alert("Approve failed: " + (err?.response?.data?.message || err?.message || "Server error"));
      }
    } finally {
      setProcessingId(null);
    }
  };

  const approve = (id) => changeLeaveStatus(id, "approve");
  const reject = (id) => {
    // optional: you can prompt for a reason
    if (!window.confirm("Are you sure you want to reject this leave?")) return;
    changeLeaveStatus(id, "reject");
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <div className="p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Faculty Dashboard</h1>

        {loading && <div className="text-slate-400 mb-4">Loading pending leaves...</div>}

        {globalError && (
          <div className="mb-4 p-3 bg-red-600 text-white rounded">{globalError}</div>
        )}

        {!loading && leaves.length === 0 && !globalError && (
          <div className="p-4 bg-slate-800 rounded">No pending leaves found.</div>
        )}

        {!loading && leaves.length > 0 && (
          <div className="overflow-auto bg-slate-800 rounded p-4">
            <table className="min-w-full table-auto">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left">Student</th>
                  <th className="px-4 py-2 text-left">Email</th>
                  <th className="px-4 py-2 text-left">From</th>
                  <th className="px-4 py-2 text-left">To</th>
                  <th className="px-4 py-2 text-left">Reason</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map((l) => {
                  const id = l._id || l.id;
                  const isProcessing = processingId === id;
                  const studentName = l.student?.name || l.studentName || (l.studentId && l.studentId.name) || "—";
                  const studentEmail = l.student?.email || (l.studentId && l.studentId.email) || "—";
                  const from = l.fromDate ? new Date(l.fromDate).toLocaleDateString() : (l.from || "—");
                  const to = l.toDate ? new Date(l.toDate).toLocaleDateString() : (l.to || "—");
                  const statusText = l.facultyStatus || l.status || "pending";

                  return (
                    <tr key={id} className="border-t border-slate-700">
                      <td className="px-4 py-3">{studentName}</td>
                      <td className="px-4 py-3">{studentEmail}</td>
                      <td className="px-4 py-3">{from}</td>
                      <td className="px-4 py-3">{to}</td>
                      <td className="px-4 py-3 max-w-md">{l.reason || "—"}</td>
                      <td className="px-4 py-3">{statusText}</td>
                      <td className="px-4 py-3">
                        <div className="space-x-2">
                          <button
                            disabled={isProcessing}
                            onClick={() => approve(id)}
                            className={`px-3 py-1 rounded ${isProcessing ? "bg-green-500/60 cursor-wait" : "bg-green-600"}`}
                          >
                            {isProcessing ? "Processing..." : "Approve"}
                          </button>
                          <button
                            disabled={isProcessing}
                            onClick={() => reject(id)}
                            className={`px-3 py-1 rounded ${isProcessing ? "bg-red-500/60 cursor-wait" : "bg-red-600"}`}
                          >
                            {isProcessing ? "Processing..." : "Reject"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}



// import React, { useEffect, useState } from "react";
// import axios from "axios";

// // This component is for the Faculty Dashboard, so we'll rename it for clarity.
// const FacultyDashboard = () => {
//   const [leaves, setLeaves] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const token = localStorage.getItem("token");
//   // Best practice: Use environment variables for API URLs
//   const apiurl = import.meta.env.VITE_API_URL || "http://localhost:5000";

//   useEffect(() => {
//     fetchLeaves();
//   }, []);

//   const fetchLeaves = async () => {
//     try {
//       const res = await axios.get(`${apiurl}/api/faculty/all`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setLeaves(res.data);
//     } catch (err) {
//       console.error("Failed to fetch leave applications:", err);
//       // It's good practice to handle errors, e.g., show a message to the user.
//     } finally {
//       setLoading(false);
//     }
//   };

//   const updateLeaveStatus = async (leaveId, status) => {
//     try {
//       await axios.put(
//         `${apiurl}/api/faculty/status/${leaveId}`,
//         { status },
//         {
//           headers: { Authorization: `Bearer ${token}` },
//         }
//       );
//       setLeaves((prev) =>
//         prev.map((l) => (l._id === leaveId ? { ...l, status } : l))
//       );
//     } catch (err) {
//       console.error("Failed to update leave status:", err);
//       // Optionally show an error message to the user.
//     }
//   };

//   // Helper function to get status-specific styling
//   const getStatusBadge = (status) => {
//     switch (status.toLowerCase()) {
//       case "approved":
//         return "bg-green-500/20 text-green-400";
//       case "rejected":
//         return "bg-red-500/20 text-red-400";
//       case "pending":
//       default:
//         return "bg-amber-500/20 text-amber-400";
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white p-6 sm:p-8">
//       <div className="max-w-7xl mx-auto">
//         <h2 className="text-3xl sm:text-4xl font-extrabold tracking-wide text-white mb-10">
//           Faculty - Leave Applications
//         </h2>

//         <div className="overflow-x-auto bg-slate-800 border border-slate-700 rounded-xl shadow-2xl shadow-slate-950">
//           {loading ? (
//             <p className="text-center text-slate-400 text-lg py-16">
//               Loading applications...
//             </p>
//           ) : (
//             <table className="w-full text-left border-collapse">
//               <thead className="bg-slate-900/50">
//                 <tr>
//                   <th className="px-6 py-4 text-sm font-bold text-slate-300 uppercase tracking-wider">Student Name</th>
//                   <th className="px-6 py-4 text-sm font-bold text-slate-300 uppercase tracking-wider">Email</th>
//                   <th className="px-6 py-4 text-sm font-bold text-slate-300 uppercase tracking-wider">From</th>
//                   <th className="px-6 py-4 text-sm font-bold text-slate-300 uppercase tracking-wider">To</th>
//                   <th className="px-6 py-4 text-sm font-bold text-slate-300 uppercase tracking-wider">Reason</th>
//                   <th className="px-6 py-4 text-sm font-bold text-slate-300 uppercase tracking-wider">Status</th>
//                   <th className="px-6 py-4 text-sm font-bold text-slate-300 uppercase tracking-wider text-center">Actions</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {leaves.length > 0 ? (
//                   leaves.map((leave) => (
//                     <tr
//                       key={leave._id}
//                       className="border-b border-slate-700 last:border-b-0 hover:bg-slate-700/50 transition-colors duration-200"
//                     >
//                       <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-200">{leave.studentId?.name || "N/A"}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-slate-300">{leave.studentId?.email || "N/A"}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-slate-300">{new Date(leave.fromDate).toLocaleDateString()}</td>
//                       <td className="px-6 py-4 whitespace-nowrap text-slate-300">{new Date(leave.toDate).toLocaleDateString()}</td>
//                       <td className="px-6 py-4 max-w-xs truncate text-slate-300" title={leave.reason}>{leave.reason}</td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         <span className={`px-3 py-1 text-xs font-bold rounded-full ${getStatusBadge(leave.status)}`}>
//                           {leave.status}
//                         </span>
//                       </td>
//                       <td className="px-6 py-4 whitespace-nowrap">
//                         {leave.status === "pending" && (
//                           <div className="flex items-center justify-center gap-3">
//                             <button
//                               className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition-transform transform hover:scale-105"
//                               onClick={() => updateLeaveStatus(leave._id, "approved")}
//                             >
//                               Approve
//                             </button>
//                             <button
//                               className="bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition-transform transform hover:scale-105"
//                               onClick={() => updateLeaveStatus(leave._id, "rejected")}
//                             >
//                               Reject
//                             </button>
//                           </div>
//                         )}
//                       </td>
//                     </tr>
//                   ))
//                 ) : (
//                   <tr>
//                     <td colSpan="7" className="text-center py-16 text-slate-400">
//                       No leave applications found.
//                     </td>
//                   </tr>
//                 )}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// // Renaming the export to match the component name
// export default FacultyDashboard;


// // import React, { useEffect, useState } from "react";
// // import axios from "axios";

// // const RectorDashboard = () => {
// //   const [leaves, setLeaves] = useState([]);
// //   const [loading, setLoading] = useState(true);
// //   const token = localStorage.getItem("token");
// //   const apiurl = "http://localhost:5000"; // change to your backend URL

// //   useEffect(() => {
// //     fetchLeaves();
// //   }, []);

// //   const fetchLeaves = async () => {
// //     try {
// //       const res = await axios.get(`${apiurl}/api/faculty/all`, {
// //         headers: { Authorization: `Bearer ${token}` },
// //       });
// //       setLeaves(res.data);
// //       setLoading(false);
// //     } catch (err) {
// //       console.error(err);
// //       setLoading(false);
// //     }
// //   };

// //   const updateLeaveStatus = async (leaveId, status) => {
// //     try {
// //       await axios.put(
// //         `${apiurl}/api/faculty/status/${leaveId}`,
// //         { status },
// //         {
// //           headers: { Authorization: `Bearer ${token}` },
// //         }
// //       );
// //       setLeaves((prev) =>
// //         prev.map((l) => (l._id === leaveId ? { ...l, status } : l))
// //       );
// //     } catch (err) {
// //       console.error(err);
// //     }
// //   };

// //   if (loading) return <p>Loading...</p>;

// //   return (
// //     <div className="p-4">
// //       <h2 className="text-2xl font-bold mb-4">Faculty - Leave Applications</h2>
// //       <table className="min-w-full bg-white border border-gray-200 shadow">
// //         <thead>
// //           <tr className="bg-gray-100">
// //             <th className="p-2 border">Student Name</th>
// //             <th className="p-2 border">Email</th>
// //             <th className="p-2 border">From</th>
// //             <th className="p-2 border">To</th>
// //             <th className="p-2 border">Reason</th>
// //             <th className="p-2 border">Status</th>
// //             <th className="p-2 border">Actions</th>
// //           </tr>
// //         </thead>
// //         <tbody>
// //           {leaves.map((leave) => (
// //             <tr key={leave._id}>
// //               <td className="p-2 border">{leave.studentId?.name}</td>
// //               <td className="p-2 border">{leave.studentId?.email}</td>
// //               <td className="p-2 border">
// //                 {new Date(leave.fromDate).toLocaleDateString()}
// //               </td>
// //               <td className="p-2 border">
// //                 {new Date(leave.toDate).toLocaleDateString()}
// //               </td>
// //               <td className="p-2 border">{leave.reason}</td>
// //               <td className="p-2 border">{leave.status}</td>
// //               <td className="p-2 border">
// //                 {leave.status === "pending" && (
// //                   <>
// //                     <button
// //                       className="bg-green-500 text-white px-2 py-1 rounded mr-2"
// //                       onClick={() => updateLeaveStatus(leave._id, "approved")}
// //                     >
// //                       Approve
// //                     </button>
// //                     <button
// //                       className="bg-red-500 text-white px-2 py-1 rounded"
// //                       onClick={() => updateLeaveStatus(leave._id, "rejected")}
// //                     >
// //                       Reject
// //                     </button>
// //                   </>
// //                 )}
// //               </td>
// //             </tr>
// //           ))}
// //         </tbody>
// //       </table>
// //     </div>
// //   );
// // };

// // export default RectorDashboard;
