import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { LogOut, Search, User } from "lucide-react";

export default function Layout({ currentAdmin, onLogout }) {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search bookings, drivers, cabs..."
              className="search-input"
            />
          </div>
          <div className="topbar-actions">
            <div className="topbar-avatar">
              <User size={16} />
              <span>{currentAdmin?.name ?? "Admin"}</span>
            </div>
            <button className="btn btn--ghost topbar-logout" onClick={onLogout}>
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
