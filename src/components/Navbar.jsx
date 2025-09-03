import { useEffect, useRef, useState } from "react";
import { Menu, UserCircle2, UserPlus, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CreateUserModal from "./CreateUserModal";
import "./navbar.scss";

export default function Navbar({
  collapsed,
  setCollapsed,
  toggled,
  setToggled,
  broken,
}) {
  const { user, logout } = useAuth();
  const [openMenu, setOpenMenu] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const menuRef = useRef(null);

  // const isAdmin = Boolean(user?.is_admin || user?.role === "admin"); // unused

  const handleBurger = () => {
    if (broken) setToggled(!toggled);
    else setCollapsed(!collapsed);
  };

  // click-outside & Esc — dropdown yopish
  useEffect(() => {
    const onDocClick = (e) => {
      if (!openMenu || !menuRef.current) return;
      if (!menuRef.current.contains(e.target)) setOpenMenu(false);
    };
    const onEsc = (e) => e.key === "Escape" && setOpenMenu(false);
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [openMenu]);

  const openCreateUser = () => {
    setOpenMenu(false);
    setShowCreate(true);
  };

  return (
    <>
      <div className="navbar">
        <button
          className="burger"
          onClick={handleBurger}
          aria-label="Yon panel"
          title="Yon panel"
        >
          <Menu size={20} />
        </button>

        <div className="brand">
          <div className="brand-logo" aria-hidden="true">
            UD
          </div>
          <span>Uzbek Doner Admin</span>
        </div>

        <div className="spacer" />

        <div className="actions">
          <div className="profile" ref={menuRef}>
            <button
              className="avatar-btn"
              onClick={() => setOpenMenu((s) => !s)}
              aria-haspopup="menu"
              aria-expanded={openMenu}
              title={user?.username || "Admin"}
            >
              {/* O‘zgarmas ikonka */}
              <UserCircle2 size={22} />
            </button>

            {openMenu && (
              <div className="menu" role="menu">
                <div className="menu-header">
                  <div className="menu-avatar">
                    <UserCircle2 size={28} />
                  </div>
                  <div className="menu-user">
                    <div className="name">
                      {user?.full_name || "Administrator"}
                    </div>
                    <div className="uname">@{user?.username || "admin"}</div>
                  </div>
                </div>

                <button
                  className="menu-item"
                  role="menuitem"
                  onClick={openCreateUser}
                >
                  <UserPlus size={16} />
                  <span>Yangi foydalanuvchi</span>
                </button>

                <button
                  className="menu-item danger"
                  role="menuitem"
                  onClick={logout}
                >
                  <LogOut size={16} />
                  <span>Chiqish</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modalni shu yerning o‘zida boshqaramiz */}
      <CreateUserModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onSuccess={() => setShowCreate(false)}
      />
    </>
  );
}
