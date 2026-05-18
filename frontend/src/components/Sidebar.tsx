import { NavLink, useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  GoClock,
  GoFile,
  GoHome,
  GoPeople,
  GoPerson,
  GoShieldCheck,
  GoSignOut
} from "react-icons/go";

import logo from "../assets/prefeitura-logo.png";

interface SidebarLink {
  to: string;
  label: string;
  icon: IconType;
  end?: boolean;
}

const links: SidebarLink[] = [
  { to: "/dashboard", label: "Visão Geral", icon: GoHome, end: true },
  { to: "/registros", label: "Registros", icon: GoClock },
  { to: "/relatorios", label: "Relatórios", icon: GoFile },
  { to: "/admin-usuarios", label: "Usuários", icon: GoPeople },
  { to: "/perfil", label: "Perfil", icon: GoPerson }
];

export default function Sidebar() {
  const navigate = useNavigate();
  const nome = localStorage.getItem("nome") || "Supervisor";

  function logout() {
    localStorage.clear();
    navigate("/");
  }

  return (
    <aside className="sidebar-shell">
      <div className="sidebar-logo-section">
        <div className="sidebar-logo-card">
          <img src={logo} alt="Prefeitura do Rio · Saúde" className="w-full" />
        </div>
      </div>

      <div className="sidebar-user-section">
        <div className="sidebar-avatar">
          {nome.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <p className="sidebar-username">{nome}</p>
          <p className="sidebar-role">
            <GoShieldCheck aria-hidden="true" />
            Supervisor
          </p>
        </div>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `nav-link${isActive ? " nav-link-active" : ""}`
              }
            >
              <span className="nav-link-label">
                <Icon aria-hidden="true" />
                {link.label}
              </span>
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar-logout">
        <button onClick={logout} className="nav-button">
          <GoSignOut aria-hidden="true" />
          Sair do sistema
        </button>
      </div>
    </aside>
  );
}
