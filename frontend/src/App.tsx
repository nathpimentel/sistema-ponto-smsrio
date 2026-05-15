import {
  Routes,
  Route
} from "react-router-dom";

import Login from "./pages/Login";
import DashboardSupervisor from "./pages/DashboardSupervisor";

import PrivateRoute from "./routes/PrivateRoute";

export default function App() {
  return (
    <Routes>
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
    </Routes>
  );
}