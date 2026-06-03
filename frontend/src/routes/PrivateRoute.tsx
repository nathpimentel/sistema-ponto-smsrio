import { Navigate } from "react-router-dom";

import { tokenExpirado, useAuth } from "../contexts/AuthContext";

interface Props {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function PrivateRoute({
  children,
  allowedRoles
}: Props) {
  const { token, tipoUsuario, logout } = useAuth();

  // Sem token ou token expirado → limpa e redireciona para o login
  if (!token || tokenExpirado(token)) {
    if (token) logout();
    return <Navigate to="/" replace />;
  }

  // Token válido mas role não autorizada → redireciona para o dashboard correto
  if (
    allowedRoles &&
    (!tipoUsuario || !allowedRoles.includes(tipoUsuario))
  ) {
    return (
      <Navigate
        to={tipoUsuario === "Bolsista" ? "/bolsista" : "/dashboard"}
        replace
      />
    );
  }

  return children;
}
