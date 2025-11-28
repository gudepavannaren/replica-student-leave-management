// frontend/src/components/sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/Authcontext";

export default function Sidebar() {
  const { user } = useAuth();
  return (
    <aside className="w-56 bg-slate-900 text-slate-200 p-4 min-h-screen">
      <div className="mb-6">
        <div className="font-bold">Menu</div>
      </div>

      <nav className="space-y-2">
        {user?.role === "student" && <Link to="/student/dashboard" className="block">My Leaves</Link>}
        {user?.role === "student" && <Link to="/student/apply" className="block">Apply Leave</Link>}
        {user?.role === "faculty" && <Link to="/faculty/dashboard" className="block">Faculty Dashboard</Link>}
        {user?.role === "rector" && <Link to="/rector/dashboard" className="block">Rector Dashboard</Link>}
      </nav>
    </aside>
  );
}
