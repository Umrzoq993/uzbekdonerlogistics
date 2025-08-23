import React from "react";
import { Sidebar, Menu, MenuItem, SubMenu } from "react-pro-sidebar";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  Map,
  List,
  PlusSquare,
  Archive,
  MapPinned,
  Users,
} from "lucide-react";
import "./sidebar.scss";

export default function SidebarMenu({
  collapsed,
  toggled,
  onBackdropClick,
  onBreakPoint,
}) {
  const { pathname } = useLocation();

  const isActive = (path, { prefix = false } = {}) =>
    prefix ? pathname.startsWith(path) : pathname === path;

  const iconWithState = (icon, active) =>
    React.cloneElement(icon, {
      className: `menu-icon${active ? " active" : ""}`,
      size: 20,
    });

  return (
    <Sidebar
      className="sidebar-root"
      width="260px"
      collapsedWidth="80px"
      collapsed={collapsed}
      toggled={toggled}
      onBackdropClick={onBackdropClick}
      breakPoint="md"
      onBreakPoint={onBreakPoint}
      backgroundColor="#fff"
    >
      <div className="sidebar-header">
        <div className="logo">🍔</div>
        <div className="title">Admin Panel</div>
      </div>

      <Menu menuItemStyles={{ button: { padding: "12px 16px" } }}>
        <MenuItem
          active={isActive("/")}
          icon={iconWithState(<LayoutDashboard />, isActive("/"))}
          title={collapsed ? "Dashboard" : undefined}
          component={
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "link-active" : undefined
              }
            />
          }
        >
          <span className="menu-label">Dashboard</span>
        </MenuItem>

        <SubMenu
          defaultOpen={isActive("/orders", { prefix: true })}
          icon={iconWithState(
            <Package />,
            isActive("/orders", { prefix: true })
          )}
          label={
            <span
              className="menu-label"
              title={collapsed ? "Buyurtmalar" : undefined}
            >
              Buyurtmalar
            </span>
          }
        >
          <MenuItem
            active={isActive("/orders")}
            icon={iconWithState(<List />, isActive("/orders"))}
            title={collapsed ? "Ro‘yxat" : undefined}
            component={
              <NavLink
                to="/orders"
                className={({ isActive }) =>
                  isActive ? "link-active" : undefined
                }
              />
            }
          >
            <span className="menu-label">Ro‘yxat</span>
          </MenuItem>

          <MenuItem
            active={isActive("/orders/new")}
            icon={iconWithState(<PlusSquare />, isActive("/orders/new"))}
            title={collapsed ? "Yangi buyurtma" : undefined}
            component={
              <NavLink
                to="/orders/new"
                className={({ isActive }) =>
                  isActive ? "link-active" : undefined
                }
              />
            }
          >
            <span className="menu-label">Yangi buyurtma</span>
          </MenuItem>

          <MenuItem
            active={isActive("/orders/archived", { prefix: true })}
            icon={iconWithState(
              <Archive />,
              isActive("/orders/archived", { prefix: true })
            )}
            title={collapsed ? "Arxiv" : undefined}
            component={
              <NavLink
                to="/orders/archived"
                className={({ isActive }) =>
                  isActive ? "link-active" : undefined
                }
              />
            }
          >
            <span className="menu-label">Arxiv</span>
          </MenuItem>
        </SubMenu>

        <SubMenu
          defaultOpen={isActive("/branches", { prefix: true })}
          icon={iconWithState(<Map />, isActive("/branches", { prefix: true }))}
          label={
            <span
              className="menu-label"
              title={collapsed ? "Filiallar" : undefined}
            >
              Filiallar
            </span>
          }
        >
          <MenuItem
            active={isActive("/branches")}
            icon={iconWithState(<List />, isActive("/branches"))}
            title={collapsed ? "Ro‘yxat" : undefined}
            component={
              <NavLink
                to="/branches"
                className={({ isActive }) =>
                  isActive ? "link-active" : undefined
                }
              />
            }
          >
            <span className="menu-label">Ro‘yxat</span>
          </MenuItem>

          <MenuItem
            active={isActive("/branches/polygons")}
            icon={iconWithState(<MapPinned />, isActive("/branches/polygons"))}
            title={collapsed ? "Poligonlar" : undefined}
            component={
              <NavLink
                to="/branches/polygons"
                className={({ isActive }) =>
                  isActive ? "link-active" : undefined
                }
              />
            }
          >
            <span className="menu-label">Poligonlar</span>
          </MenuItem>

          <MenuItem
            active={isActive("/branches/new")}
            icon={iconWithState(<PlusSquare />, isActive("/branches/new"))}
            title={collapsed ? "Yangi filial" : undefined}
            component={
              <NavLink
                to="/branches/new"
                className={({ isActive }) =>
                  isActive ? "link-active" : undefined
                }
              />
            }
          >
            <span className="menu-label">Yangi filial</span>
          </MenuItem>
        </SubMenu>

        {/* YANGI: Kategoriyalar */}
        <MenuItem
          active={isActive("/categories", { prefix: true })}
          icon={iconWithState(
            <List />,
            isActive("/categories", { prefix: true })
          )}
          title={collapsed ? "Kategoriyalar" : undefined}
          component={
            <NavLink
              to="/categories"
              className={({ isActive }) =>
                isActive ? "link-active" : undefined
              }
            />
          }
        >
          <span className="menu-label">Kategoriyalar</span>
        </MenuItem>
        {/*Foydalanuvchilar */}
        <MenuItem
          active={isActive("/users", { prefix: true })}
          icon={iconWithState(<Users />, isActive("/users", { prefix: true }))}
          title={collapsed ? "Foydalanuvchilar" : undefined}
          component={
            <NavLink
              to="/users"
              className={({ isActive }) =>
                isActive ? "link-active" : undefined
              }
            />
          }
        >
          <span className="menu-label">Foydalanuvchilar</span>
        </MenuItem>
      </Menu>
    </Sidebar>
  );
}
