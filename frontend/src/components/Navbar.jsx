// frontend/src/components/navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/Authcontext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-slate-800 p-3 text-slate-100 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <Link to="/" className="text-lg font-bold">LeaveSys</Link>
        {user && user.role === "student" && <Link to="/student/dashboard" className="ml-2">My Leaves</Link>}
        {user && user.role === "faculty" && <Link to="/faculty/dashboard" className="ml-2">Faculty</Link>}
        {user && user.role === "rector" && <Link to="/rector/dashboard" className="ml-2">Rector</Link>}
      </div>

      <div className="flex items-center space-x-4">
        {user ? (
          <>
            <div className="text-sm mr-2">Hi, {user.name || user.email}</div>
            <button onClick={logout} className="bg-red-600 hover:bg-red-500 px-3 py-1 rounded">Logout</button>
          </>
        ) : (
          <div className="space-x-2">
            <Link to="/" className="underline">Login</Link>
            <Link to="/register" className="underline">Register</Link>
          </div>
        )}
      </div>
    </nav>
  );
}
