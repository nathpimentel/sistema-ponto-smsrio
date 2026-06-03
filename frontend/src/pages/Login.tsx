import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  GoEye,
  GoEyeClosed,
  GoKey,
  GoSignIn
} from "react-icons/go";
import {
  Link,
  useNavigate
} from "react-router-dom";

import edificio from "../assets/sms-edificio.jpg";
import logo from "../assets/prefeitura-logo.png";
import api from "../services/api";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);

    try {
      const response = await api.post("/auth/login", { email, senha });

      login(response.data.token, response.data.tipoUsuario, response.data.nome);

      if (response.data.tipoUsuario === "Supervisor") {
        navigate("/dashboard");
      } else {
        navigate("/bolsista");
      }
    } catch (error) {
      const mensagem =
        axios.isAxiosError(error) && typeof error.response?.data === "string"
          ? error.response.data
          : "Erro ao fazer login";
      toast.error(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card-container">

        {/* Painel visual esquerdo */}
        <section className="auth-visual" style={{ backgroundImage: `url(${edificio})` }}>
          <div className="auth-visual-badge">
            <img src={logo} alt="Prefeitura do Rio · Saúde" className="h-16" />
          </div>

          <div className="auth-copy">
            <p className="auth-copy-kicker">Secretaria Municipal de Saúde · RJ</p>
            <h1>
              Cuidando<br />
              de quem<br />
              cuida.
            </h1>
            <p>
              Gerencie presenças, acompanhe jornadas e mantenha
              a equipe alinhada — tudo em um só lugar.
            </p>
          </div>
        </section>

        {/* Painel do formulário direito */}
        <section className="auth-panel">
          <div className="auth-panel-inner">

            <div className="auth-panel-eyebrow">
              <span className="page-kicker" style={{ margin: 0 }}>
                Acesso ao sistema
              </span>
            </div>

            <h2 className="auth-panel-title">
              Bem-vindo<br />de volta!
            </h2>
            <p className="auth-panel-subtitle">
              Insira suas credenciais institucionais para continuar.
            </p>

            <form onSubmit={fazerLogin}>
              <label className="field-label">Email</label>
              <input
                type="email"
                autoComplete="username"
                placeholder="nome@email.com"
                className="field mb-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label className="field-label">Senha</label>
              <div className="relative mb-7">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  className="field pr-24"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-2 top-2 inline-flex h-9 w-9 items-center justify-center rounded-md text-slate-600 hover:bg-slate-100"
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarSenha ? <GoEyeClosed aria-hidden="true" /> : <GoEye aria-hidden="true" />}
                </button>
              </div>

              <button disabled={carregando} className="primary-button w-full">
                <GoSignIn aria-hidden="true" />
                {carregando ? "Entrando..." : "Entrar"}
              </button>

              <div className="mt-6 flex items-center justify-center text-sm">
                <Link
                  to="/primeiro-acesso"
                  className="inline-flex items-center gap-2 font-bold text-teal-700 hover:text-teal-900"
                >
                  <GoKey aria-hidden="true" />
                  Primeiro acesso?
                </Link>
              </div>
            </form>

          </div>
        </section>

      </div>
    </div>
  );
}
