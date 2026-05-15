import { NavLink, useNavigate } from "react-router-dom";
import type { IconType } from "react-icons";
import {
  GoChevronRight,
  GoHome,
  GoPerson,
  GoSignOut
} from "react-icons/go";

import logo from "../assets/prefeitura-logo.png";

interface SidebarLink {
  to: string;
  label: string;
  icon: IconType;
}

const links: SidebarLink[] = [
  { to: "/bolsista", label: "Meu painel", icon: GoHome },
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
      <div className="sidebar-logo-card">
        <img
          src={logo}
          alt="Prefeitura do Rio Saude"
          className="w-full"
        />
      </div>

      <div className="mb-8">
        <p className="text-sm text-white/60">
          Area do bolsista
        </p>
        <h1 className="text-xl font-bold leading-tight">
          Controle de Ponto
        </h1>
        <p className="mt-2 text-sm text-white/70">
          {nome}
        </p>
      </div>

      <nav className="sidebar-nav">
        {links.map((link) => {
          const Icon = link.icon;

          return (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) =>
                `nav-link ${isActive ? "bg-white/10 text-white border-white/20" : ""}`
              }
            >
              <span className="nav-link-label">
                <Icon aria-hidden="true" />
                {link.label}
              </span>
              <GoChevronRight
                aria-hidden="true"
                className="text-white/35"
              />
            </NavLink>
          );
        })}

        <button
          onClick={logout}
          className="nav-button"
        >
          <GoSignOut aria-hidden="true" />
          Sair
        </button>
      </nav>
    </aside>
  );
}
