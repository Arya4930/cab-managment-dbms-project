export default function PortalShell({ title, subtitle, currentUser, onLogout, accentClass = "", children }) {
  return (
    <div className={`portal-shell ${accentClass}`.trim()}>
      <div className="portal-topbar">
        <div>
          <div className="portal-eyebrow">CABEX Portal</div>
          <h1 className="portal-title">{title}</h1>
          <p className="portal-subtitle">{subtitle}</p>
        </div>
        <div className="portal-topbar__actions">
          <div className="portal-usercard">
            <span className="portal-usercard__label">Signed in as</span>
            <strong>{currentUser?.name ?? "Guest"}</strong>
          </div>
          <button className="btn btn--ghost" onClick={onLogout}>Logout</button>
        </div>
      </div>
      <div className="portal-content">{children}</div>
    </div>
  );
}
