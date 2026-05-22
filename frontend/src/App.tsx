import AdminUsuarios
from "./pages/AdminUsuarios";

import AlterarSenha
from "./pages/AlterarSenha";

import { Toaster } from "react-hot-toast";

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
      <Toaster position="top-right" />

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
