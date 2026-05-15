import { Navigate } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function PrivateRoute({
  children,
  allowedRoles
}: Props) {
  const token = localStorage.getItem("token");
  const tipoUsuario = localStorage.getItem("tipoUsuario");

  if (!token) {
    return <Navigate to="/" />;
  }

  if (
    allowedRoles &&
    (!tipoUsuario || !allowedRoles.includes(tipoUsuario))
  ) {
    return (
      <Navigate
        to={tipoUsuario === "Bolsista" ? "/bolsista" : "/dashboard"}
      />
    );
  }

  return children;
}
