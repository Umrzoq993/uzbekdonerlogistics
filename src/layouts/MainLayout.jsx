// src/layouts/MainLayout.jsx
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar.jsx";
import SidebarMenu from "../components/SidebarMenu.jsx";

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false); // desktop collapse
  const [toggled, setToggled] = useState(false); // mobile drawer
  const [broken, setBroken] = useState(false); // < md ?

  const handleBreakpoint = (isBroken) => setBroken(isBroken);
  const handleBackdrop = () => setToggled(false);

  return (
    <div className="app-shell">
      <aside className="app-sidebar">
        <SidebarMenu
          collapsed={collapsed}
          toggled={toggled}
          onBackdropClick={handleBackdrop}
          onBreakPoint={handleBreakpoint}
        />
      </aside>

      <header className="app-navbar">
        <Navbar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          toggled={toggled}
          setToggled={setToggled}
          broken={broken}
        />
      </header>

      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}
