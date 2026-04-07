import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Bell, Search, User } from "lucide-react";

export default function Layout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-area">
        {/* Top Header Bar */}
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
            <button className="topbar-btn">
              <Bell size={18} />
              <span className="notif-badge">3</span>
            </button>
            <div className="topbar-avatar">
              <User size={16} />
              <span>Admin</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
