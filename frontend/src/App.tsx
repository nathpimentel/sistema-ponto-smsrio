import AdminUsuarios
from "./pages/AdminUsuarios";

import AlterarSenha
from "./pages/AlterarSenha";

import {
  Toaster,
  ToastBar,
  toast
} from "react-hot-toast";
import { GoX } from "react-icons/go";

import Register from "./pages/Register";

import DashboardBolsista
from "./pages/DashboardBolsista";
import PerfilBolsista
from "./pages/PerfilBolsista";
import PrimeiroAcesso from "./pages/PrimeiroAcesso";
import Registros from "./pages/Registros";
import {
  Routes,
  Route
} from "react-router-dom";


import Login from "./pages/Login";

import DashboardSupervisor from "./pages/DashboardSupervisor";

import Relatorios from "./pages/Relatorios";

import PrivateRoute from "./routes/PrivateRoute";

export default function App() {
  return (
    <>
      <Toaster
        position="top-right"
        gutter={12}
        containerStyle={{
          top: 20,
          right: 20
        }}
        toastOptions={{
          duration: 4200,
          style: {
            width: "min(420px, calc(100vw - 32px))",
            border: "1px solid rgba(15, 23, 42, 0.08)",
            borderRadius: "14px",
            background: "rgba(255, 255, 255, 0.96)",
            boxShadow: "0 22px 55px rgba(15, 23, 42, 0.18)",
            color: "#0f172a",
            fontSize: "0.92rem",
            fontWeight: 700,
            lineHeight: 1.45,
            padding: "12px 14px"
          },
          success: {
            duration: 3200,
            iconTheme: {
              primary: "#0f766e",
              secondary: "#ecfdf5"
            }
          },
          error: {
            duration: 5200,
            iconTheme: {
              primary: "#dc2626",
              secondary: "#fef2f2"
            }
          },
          loading: {
            iconTheme: {
              primary: "#0e7490",
              secondary: "#ecfeff"
            }
          }
        }}
      >
        {(t) => (
          <ToastBar toast={t}>
            {({ icon, message }) => (
              <div className="flex w-full items-start gap-3">
                <div className="mt-0.5 shrink-0">{icon}</div>
                <div className="min-w-0 flex-1 break-words pr-1">
                  {message}
                </div>
                {t.type !== "loading" && (
                  <button
                    type="button"
                    aria-label="Fechar notificacao"
                    onClick={() => toast.dismiss(t.id)}
                    className="shrink-0 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <GoX aria-hidden="true" />
                  </button>
                )}
              </div>
            )}
          </ToastBar>
        )}
      </Toaster>

      <Routes>

      <Route
  path="/admin-usuarios"
  element={
    <PrivateRoute allowedRoles={["Supervisor"]}>
      <AdminUsuarios />
    </PrivateRoute>
  }
/>

<Route
  path="/register"
  element={
    <PrivateRoute allowedRoles={["Supervisor"]}>
      <Register />
    </PrivateRoute>
  }
/>

<Route
  path="/primeiro-acesso"
  element={<PrimeiroAcesso />}
/>

      <Route
  path="/alterar-senha"
  element={
    <PrivateRoute>
      <AlterarSenha />
    </PrivateRoute>
  }
/>

      <Route
  path="/bolsista"
  element={
    <PrivateRoute allowedRoles={["Bolsista"]}>
      <DashboardBolsista />
    </PrivateRoute>
  }
/>

      <Route
  path="/bolsista/perfil"
  element={
    <PrivateRoute allowedRoles={["Bolsista"]}>
      <PerfilBolsista />
    </PrivateRoute>
  }
/>

      <Route
  path="/perfil"
  element={
    <PrivateRoute allowedRoles={["Supervisor"]}>
      <PerfilBolsista />
    </PrivateRoute>
  }
/>

      <Route
  path="/registros"
  element={
    <PrivateRoute allowedRoles={["Supervisor"]}>
      <Registros />
    </PrivateRoute>
  }
/>

      <Route
        path="/"
        element={<Login />}
      />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute allowedRoles={["Supervisor"]}>
            <DashboardSupervisor />
          </PrivateRoute>
        }
      />

      <Route
        path="/relatorios"
        element={
          <PrivateRoute allowedRoles={["Supervisor"]}>
            <Relatorios />
          </PrivateRoute>
        }
      />

      </Routes>
    </>
  );
}
