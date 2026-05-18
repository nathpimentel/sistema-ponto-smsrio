import { NavLink, useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  GoHome,
  GoPerson,
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
  { to: "/bolsista", label: "Meu Painel", icon: GoHome, end: true },
  { to: "/bolsista/perfil", label: "Perfil", icon: GoPerson }
];

export default function SidebarBolsista() {
  const navigate = useNavigate();
  const nome = localStorage.getItem("nome") || "Bolsista";

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
            <GoPerson aria-hidden="true" />
            Bolsista
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
