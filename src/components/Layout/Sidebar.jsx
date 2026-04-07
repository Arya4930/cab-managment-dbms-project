import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarCheck,
  Truck,
  Users,
  Wrench,
  CreditCard,
  TrendingUp,
  MapPin,
  ChevronRight,
  Zap,
} from "lucide-react";

const NAV_ITEMS = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard", desc: "Overview & KPIs" },
  { to: "/bookings", icon: CalendarCheck, label: "Bookings", desc: "Rides & Scheduling" },
  { to: "/fleet", icon: Truck, label: "Fleet", desc: "Cabs & Vehicles" },
  { to: "/drivers", icon: Users, label: "Drivers", desc: "Driver Profiles" },
  { to: "/maintenance", icon: Wrench, label: "Maintenance", desc: "Service Logs" },
  { to: "/payments", icon: CreditCard, label: "Payments", desc: "Transactions" },
  { to: "/earnings", icon: TrendingUp, label: "Earnings", desc: "Revenue & Reports" },
  { to: "/tracking", icon: MapPin, label: "Tracking", desc: "Live Ride Tracking" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">
          <Zap size={20} />
        </div>
        <div className="brand-text">
          <span className="brand-name">CABEX</span>
          <span className="brand-sub">Fleet Management</span>
        </div>
      </div>

      {/* Nav section label */}
      <div className="nav-label">NAVIGATION</div>

      {/* Nav items */}
      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, icon: Icon, label, desc }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `nav-item ${isActive ? "nav-item--active" : ""}`
            }
          >
            <div className="nav-item-icon">
              <Icon size={18} />
            </div>
            <div className="nav-item-text">
              <span className="nav-item-label">{label}</span>
              <span className="nav-item-desc">{desc}</span>
            </div>
            <ChevronRight size={14} className="nav-item-arrow" />
          </NavLink>
        ))}
      </nav>

      {/* Footer status */}
      <div className="sidebar-footer">
        <div className="system-status">
          <div className="status-dot status-dot--online" />
          <span>All systems operational</span>
        </div>
        <div className="sidebar-version">v2.4.1 · Oracle DB</div>
      </div>
    </aside>
  );
}
