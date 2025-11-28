// frontend/src/pages/Login.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api"; // path: adjust to ../services/api if your file is there
import { useAuth } from "../context/Authcontext";

export default function Login() {
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function onChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function onSubmit(e) {
    e.preventDefault();           // <<< IMPORTANT: prevents full-page refresh
    setError(null);
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", form);
      const data = res.data;

      // Adapt depending on your backend response shape:
      // Common shapes:
      // 1) { token, user }
      // 2) { success: true, data: { token, user } }
      // 3) { data: { token, user } }
      // The checks below try to handle the common cases.
      const token = data.token || data.data?.token || data.accessToken;
      const user = data.user || data.data?.user || data.data || data;

      if (!token || !user) {
        console.error("Unexpected login response:", data);
        throw new Error(data.message || "Invalid login response");
      }

      // call login from AuthContext
      login({ token, user });
      // login() handles navigation by role (if you implemented it)
    } catch (err) {
      console.error("Login error:", err);
      setError(err?.response?.data?.message || err.message || "Failed to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <form onSubmit={onSubmit} className="w-full max-w-md p-6 bg-slate-800 rounded">
        <h2 className="text-xl mb-4">Login</h2>

        {error && <div className="mb-3 p-2 bg-red-600">{error}</div>}

        <label className="block mb-2">
          Email
          <input
            name="email"
            value={form.email}
            onChange={onChange}
            required
            className="w-full p-2 mt-1 rounded bg-slate-700"
          />
        </label>

        <label className="block mb-4">
          Password
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
            className="w-full p-2 mt-1 rounded bg-slate-700"
          />
        </label>

        <button type="submit" disabled={loading} className="w-full py-2 bg-indigo-600 rounded">
          {loading ? "Signing in..." : "Sign In"}
        </button>

        <div className="mt-4 text-sm">
          <Link to="/register" className="text-indigo-400">Create an account</Link>
        </div>
      </form>
    </div>
  );
}

// import { useState } from "react";
// import { NavLink, useNavigate } from "react-router-dom";
// import axios from "axios";

// function Login() {
//   const apiurl = import.meta.env.VITE_API_URL; // Example: http://localhost:5000
//   const navigate = useNavigate();

//   const [loginData, setLoginData] = useState({ email: "", password: "" });
//   const [loading, setLoading] = useState(false);
//   const [errorMsg, setErrorMsg] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setErrorMsg("");
//     setLoading(true);

//     try {
//       const res = await axios.post(`${apiurl}/api/auth/login`, loginData);

//       // Save token & user details in localStorage
//       localStorage.setItem("token", res.data.token);
//       localStorage.setItem("user", JSON.stringify(res.data.user));

//       // Redirect based on role
//       if (res.data.user.role === "rector") {
//         navigate("/rector/dashboard");
//       } else if (res.data.user.role === "student") {
//         navigate("/student/dashboard");
//       } 
//       else if (res.data.user.role === "faculty") {
//         navigate("/faculty/dashboard");
//       } 
//       else {
//         navigate("/");
//       }

//       // Reset form
//       setLoginData({ email: "", password: "" });
//     } catch (error) {
//       if (error.response?.data?.message) {
//         setErrorMsg(error.response.data.message);
//       } else {
//         setErrorMsg("An unexpected error occurred. Please try again.");
//       }
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex items-center justify-center h-screen bg-gray-100">
//       <div className="w-full max-w-md p-6 border border-gray-300 rounded-lg bg-white shadow-md">
//         <h2 className="text-3xl font-semibold text-center mb-4">Login</h2>
//         <p className="text-center mb-4">
//           Don't have an account?{" "}
//           <NavLink
//             to="/register"
//             className="text-blue-500 hover:underline"
//           >
//             Signup
//           </NavLink>
//         </p>

//         {errorMsg && (
//           <div className="text-red-500 text-sm font-medium mb-4 text-center">
//             {errorMsg}
//           </div>
//         )}

//         <form
//           className="flex flex-col gap-4"
//           onSubmit={handleSubmit}
//         >
//           <input
//             type="email"
//             placeholder="Enter your Email"
//             className="p-3 w-full border border-gray-400 rounded-lg"
//             onChange={(e) =>
//               setLoginData({ ...loginData, email: e.target.value })
//             }
//             value={loginData.email}
//             required
//           />
//           <input
//             type="password"
//             placeholder="Enter your Password"
//             className="p-3 w-full border border-gray-400 rounded-lg"
//             onChange={(e) =>
//               setLoginData({ ...loginData, password: e.target.value })
//             }
//             value={loginData.password}
//             required
//           />
//           <button
//             type="submit"
//             disabled={loading}
//             className={`p-3 rounded-lg font-medium transition-all ${
//               loading
//                 ? "bg-gray-400 text-white"
//                 : "bg-blue-500 text-white hover:bg-blue-600"
//             }`}
//           >
//             {loading ? "Logging in..." : "Submit"}
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// }

// export default Login;/