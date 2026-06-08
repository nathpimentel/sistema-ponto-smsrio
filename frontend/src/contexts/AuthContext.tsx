import {
  createContext,
  useContext,
  useState,
  type ReactNode
} from "react";

// Chaves usadas no localStorage — centralizadas para evitar typos
const AUTH_KEYS = {
  token: "token",
  tipoUsuario: "tipoUsuario",
  nome: "nome"
} as const;

// Decodifica o payload do JWT sem biblioteca externa
function decodificarPayload(token: string): Record<string, unknown> | null {
  try {
    const payload = token.split(".")[1];
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

// Retorna true se o token estiver expirado ou inválido
export function tokenExpirado(token: string): boolean {
  const payload = decodificarPayload(token);
  if (!payload || typeof payload.exp !== "number") return true;
  return Date.now() / 1000 > payload.exp;
}

interface AuthState {
  token: string | null;
  tipoUsuario: string | null;
  nome: string | null;
}

interface AuthContextValue extends AuthState {
  isAuthenticated: boolean;
  login: (token: string, tipoUsuario: string, nome: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Lê o estado inicial do localStorage validando a expiração
function lerEstadoInicial(): AuthState {
  const token = localStorage.getItem(AUTH_KEYS.token);

  if (!token || tokenExpirado(token)) {
    Object.values(AUTH_KEYS).forEach((k) => localStorage.removeItem(k));
    return { token: null, tipoUsuario: null, nome: null };
  }

  return {
    token,
    tipoUsuario: localStorage.getItem(AUTH_KEYS.tipoUsuario),
    nome: localStorage.getItem(AUTH_KEYS.nome)
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(lerEstadoInicial);

  function login(token: string, tipoUsuario: string, nome: string) {
    localStorage.setItem(AUTH_KEYS.token, token);
    localStorage.setItem(AUTH_KEYS.tipoUsuario, tipoUsuario);
    localStorage.setItem(AUTH_KEYS.nome, nome);
    setState({ token, tipoUsuario, nome });
  }

  // Remove apenas as chaves do app — não limpa todo o localStorage
  function logout() {
    Object.values(AUTH_KEYS).forEach((k) => localStorage.removeItem(k));
    setState({ token: null, tipoUsuario: null, nome: null });
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        isAuthenticated: !!state.token,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de AuthProvider");
  }

  return ctx;
}
