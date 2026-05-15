import { Toaster } from "react-hot-toast";

import Register from "./pages/Register";

import DashboardBolsista
from "./pages/DashboardBolsista";
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

  <Toaster position="top-right" />

  return (
    <Routes>

<Route
  path="/register"
  element={<Register />}
/>

      <Route
  path="/bolsista"
  element={
    <PrivateRoute>
      <DashboardBolsista />
    </PrivateRoute>
  }
/>

      <Route
  path="/registros"
  element={
    <PrivateRoute>
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
          <PrivateRoute>
            <DashboardSupervisor />
          </PrivateRoute>
        }
      />

      <Route
        path="/relatorios"
        element={
          <PrivateRoute>
            <Relatorios />
          </PrivateRoute>
        }
      />

    </Routes>
  );
}