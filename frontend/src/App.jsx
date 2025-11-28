// frontend/src/app.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import StudentDashboard from "./pages/student/dashboard";
import FacultyDashboard from "./pages/faculty/dashboard";
import RectorDashboard from "./pages/rector/dashboard";
import ApplyLeave from "./pages/student/applyLeave";
import { useAuth } from "./context/Authcontext";

// Simple protected wrapper
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/" replace />;
  }
  return children;
}

// Role based wrapper
function RoleRoute({ role, children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (user.role !== role) return <Navigate to="/unauthorized" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* student */}
      <Route
        path="/student/dashboard"
        element={
          <RoleRoute role="student">
            <StudentDashboard />
          </RoleRoute>
        }
      />
      <Route
        path="/student/apply"
        element={
          <RoleRoute role="student">
            <ApplyLeave />
          </RoleRoute>
        }
      />

      {/* faculty */}
      <Route
        path="/faculty/dashboard"
        element={
          <RoleRoute role="faculty">
            <FacultyDashboard />
          </RoleRoute>
        }
      />

      {/* rector */}
      <Route
        path="/rector/dashboard"
        element={
          <RoleRoute role="rector">
            <RectorDashboard />
          </RoleRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// import { BrowserRouter, Routes, Route } from 'react-router-dom';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import StudentDashboard from './pages/Student/Dashboard';
// import ApplyLeave from './pages/Student/ApplyLeave';
// import FacultyDashboard from './pages/Faculty/Dashboard';
// import RectorDashboard from './pages/Rector/Dashboard';


// function App() {
//   return (
//     <BrowserRouter>
//       <Routes>
//         <Route path="/" element={<Login />} />
//         <Route path="/register" element={<Register />} />
//         <Route path="/student/dashboard" element={<StudentDashboard />} />
//         <Route path="/student/apply" element={<ApplyLeave />} />
//         <Route path="/faculty/dashboard" element={<FacultyDashboard />} />
//         <Route path="/rector/dashboard" element={<RectorDashboard />} />
//       </Routes>
//     </BrowserRouter>
//   );
// }

// export default App;
