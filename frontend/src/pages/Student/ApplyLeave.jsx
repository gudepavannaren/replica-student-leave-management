import React, { useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/Authcontext";
import Navbar from "../../components/navbar";

export default function ApplyLeave() {
  const { user } = useAuth(); // now used in UI
  const [form, setForm] = useState({
    mode: "faculty+rector",
    reason: "",
    fromDate: "",
    toDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const validate = () => {
    if (!form.reason) return "Reason is required";
    if (!form.fromDate || !form.toDate) return "From and To dates are required";
    const from = new Date(form.fromDate);
    const to = new Date(form.toDate);
    if (from > to) return "From Date cannot be after To Date";
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (to < today) return "To Date must be today or later";
    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setMessage({ type: "error", text: err });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const payload = {
        mode: form.mode,
        reason: form.reason,
        fromDate: form.fromDate,
        toDate: form.toDate,
      };

      const res = await api.post("/api/leaves/apply", payload);
      setMessage({ type: "success", text: res?.data?.message || "Leave applied" });
      setForm({ mode: "faculty+rector", reason: "", fromDate: "", toDate: "" });
    } catch (err) {
      console.error(err);
      setMessage({ type: "error", text: err?.response?.data?.message || "Failed to apply leave" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-semibold mb-2">Apply Leave</h2>
        {/* use the user here to avoid the unused-var lint error */}
        {user && <div className="text-sm mb-4 text-slate-400">Applying as: {user.name || user.email}</div>}

        {message && (
          <div className={`p-3 mb-4 rounded ${message.type === "error" ? "bg-red-600" : "bg-green-600"}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4">
          {/* ... rest of form ... */}
          <div>
            <label className="block mb-1">Mode</label>
            <select name="mode" value={form.mode} onChange={onChange} className="w-full p-2 rounded bg-slate-800">
              <option value="faculty+rector">Faculty + Rector</option>
              <option value="rector">Only Rector</option>
            </select>
          </div>

          <div>
            <label className="block mb-1">Reason</label>
            <textarea name="reason" value={form.reason} onChange={onChange} className="w-full p-2 rounded bg-slate-800"></textarea>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">From</label>
              <input type="date" name="fromDate" value={form.fromDate} onChange={onChange} className="w-full p-2 rounded bg-slate-800" />
            </div>
            <div>
              <label className="block mb-1">To</label>
              <input type="date" name="toDate" value={form.toDate} onChange={onChange} className="w-full p-2 rounded bg-slate-800" />
            </div>
          </div>

          <div>
            <button disabled={loading} className="btn bg-indigo-600 hover:bg-indigo-500">
              {loading ? "Applying..." : "Apply Leave"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


// import { useState } from "react";
// import axios from "axios";

// function ApplyLeave() {
//   const apiurl = import.meta.env.VITE_API_URL;
//   const token = localStorage.getItem("token");
//   const user = JSON.parse(localStorage.getItem("user"));

//   const [formData, setFormData] = useState({
//     mode: "rector",
//     reason: "",
//     fromDate: "",
//     toDate: ""
//   });
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState("");
//   const [isError, setIsError] = useState(false);

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setMessage("");
//     setIsError(false);
//     setLoading(true);

//     try {
//       const payload = {
//         studentId: user.id, // automatically from localStorage
//         mode: formData.mode,
//         reason: formData.reason,
//         fromDate: formData.fromDate,
//         toDate: formData.toDate
//       };

//       await axios.post(`${apiurl}/api/leaves/apply`, payload, {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       });

//       setMessage("Leave application submitted successfully!");
//       setIsError(false);
//       setFormData({
//         mode: "rector",
//         reason: "",
//         fromDate: "",
//         toDate: ""
//       });
//     } catch (error) {
//       console.error("Error applying for leave:", error);
//       const errorMessage = error.response?.data?.message || "Failed to submit leave application.";
//       setMessage(errorMessage);
//       setIsError(true);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-slate-900 to-black p-4">
//       <div className="w-full max-w-lg p-8 border border-slate-700 rounded-xl bg-slate-800 shadow-2xl shadow-slate-950">
//         <h2 className="text-4xl font-extrabold text-center mb-6 text-white tracking-wide">Apply for Leave</h2>

//         {message && (
//           <div className={`text-center mb-4 p-3 rounded-md text-sm font-medium ${
//               isError
//                 ? 'bg-red-900/30 border border-red-700 text-red-400'
//                 : 'bg-green-900/30 border border-green-700 text-green-400'
//             }`}
//           >
//             {message}
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="flex flex-col gap-6">
//           {/* Mode Selection */}
//           <div className="flex flex-col">
//             <label htmlFor="mode" className="mb-2 text-slate-300 font-semibold">Leave Application To</label>
//             <select
//               id="mode"
//               name="mode"
//               value={formData.mode}
//               onChange={handleChange}
//               className="p-4 w-full border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 text-lg appearance-none"
//             >
//               <option value="rector">Rector Only</option>
//               <option value="faculty+rector">Faculty + Rector</option>
//             </select>
//           </div>

//           {/* Reason */}
//           <div className="flex flex-col">
//             <label htmlFor="reason" className="mb-2 text-slate-300 font-semibold">Reason for Leave</label>
//             <textarea
//               id="reason"
//               name="reason"
//               value={formData.reason}
//               onChange={handleChange}
//               placeholder="Please provide a reason for your leave"
//               className="p-4 w-full border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 text-lg min-h-[120px]"
//               required
//             />
//           </div>

//           <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
//             {/* From Date */}
//             <div className="flex flex-col">
//               <label htmlFor="fromDate" className="mb-2 text-slate-300 font-semibold">From Date</label>
//               <input
//                 id="fromDate"
//                 type="date"
//                 name="fromDate"
//                 value={formData.fromDate}
//                 onChange={handleChange}
//                 className="p-4 w-full border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 text-lg"
//                 required
//               />
//             </div>

//             {/* To Date */}
//             <div className="flex flex-col">
//               <label htmlFor="toDate" className="mb-2 text-slate-300 font-semibold">To Date</label>
//               <input
//                 id="toDate"
//                 type="date"
//                 name="toDate"
//                 value={formData.toDate}
//                 onChange={handleChange}
//                 className="p-4 w-full border border-slate-600 rounded-lg bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all duration-200 text-lg"
//                 required
//               />
//             </div>
//           </div>

//           {/* Submit Button */}
//           <button
//             type="submit"
//             disabled={loading}
//             className={`p-4 mt-2 rounded-lg font-bold text-lg w-full transition-all duration-300 ease-in-out transform hover:scale-105 ${
//               loading
//                 ? "bg-slate-700 text-slate-400 cursor-not-allowed"
//                 : "bg-teal-600 text-white hover:bg-teal-700 shadow-lg shadow-teal-900/50"
//             }`}
//           >
//             {loading ? "Submitting..." : "Submit Leave Application"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default ApplyLeave;

// // import { useState } from "react";
// // import axios from "axios";

// // function ApplyLeave() {
// //   const apiurl = import.meta.env.VITE_API_URL;
// //   const token = localStorage.getItem("token");
// //   const user = JSON.parse(localStorage.getItem("user"));

// //   const [formData, setFormData] = useState({
// //     mode: "rector",
// //     reason: "",
// //     fromDate: "",
// //     toDate: ""
// //   });
// //   const [loading, setLoading] = useState(false);
// //   const [message, setMessage] = useState("");

// //   const handleChange = (e) => {
// //     setFormData({ ...formData, [e.target.name]: e.target.value });
// //   };

// //   const handleSubmit = async (e) => {
// //     e.preventDefault();
// //     setMessage("");
// //     setLoading(true);

// //     try {
// //       const payload = {
// //         studentId: user.id, // automatically from localStorage
// //         mode: formData.mode,
// //         reason: formData.reason,
// //         fromDate: formData.fromDate,
// //         toDate: formData.toDate
// //       };

// //       await axios.post(`${apiurl}/api/leaves/apply`, payload, {
// //         headers: {
// //           Authorization: `Bearer ${token}`
// //         }
// //       });

// //       setMessage("Leave application submitted successfully!");
// //       setFormData({
// //         mode: "rector",
// //         reason: "",
// //         fromDate: "",
// //         toDate: ""
// //       });
// //     } catch (error) {
// //       console.error("Error applying for leave:", error);
// //       setMessage(
// //         error.response?.data?.message || "Failed to submit leave application."
// //       );
// //     } finally {
// //       setLoading(false);
// //     }
// //   };

// //   return (
// //     <div className="p-6 max-w-lg mx-auto">
// //       <h2 className="text-2xl font-bold mb-4">Apply for Leave</h2>
// //       {message && <p className="mb-4 text-green-600">{message}</p>}

// //       <form onSubmit={handleSubmit} className="flex flex-col gap-4">
// //         {/* Mode Selection */}
// //         <select
// //           name="mode"
// //           value={formData.mode}
// //           onChange={handleChange}
// //           className="p-2 border rounded"
// //         >
// //           <option value="rector">Rector Only</option>
// //           <option value="faculty+rector">Faculty + Rector</option>

// //         </select>

// //         {/* Reason */}
// //         <textarea
// //           name="reason"
// //           value={formData.reason}
// //           onChange={handleChange}
// //           placeholder="Reason for leave"
// //           className="p-2 border rounded"
// //           required
// //         />

// //         {/* From Date */}
// //         <input
// //           type="date"
// //           name="fromDate"
// //           value={formData.fromDate}
// //           onChange={handleChange}
// //           className="p-2 border rounded"
// //           required
// //         />

// //         {/* To Date */}
// //         <input
// //           type="date"
// //           name="toDate"
// //           value={formData.toDate}
// //           onChange={handleChange}
// //           className="p-2 border rounded"
// //           required
// //         />

// //         {/* Submit Button */}
// //         <button
// //           type="submit"
// //           disabled={loading}
// //           className={`p-3 rounded font-medium ${
// //             loading
// //               ? "bg-gray-400 text-white"
// //               : "bg-blue-500 text-white hover:bg-blue-600"
// //           }`}
// //         >
// //           {loading ? "Submitting..." : "Submit Leave Application"}
// //         </button>
        
// //       </form>
// //     </div>
// //   );
// // }

// // export default ApplyLeave;