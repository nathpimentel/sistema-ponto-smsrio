import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  GoPersonAdd,
  GoSignIn
} from "react-icons/go";
import {
  Link,
  useNavigate
} from "react-router-dom";

import logo from "../assets/prefeitura-logo.png";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setCarregando(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        senha
      });

      localStorage.setItem("token", response.data.token);
      localStorage.setItem("tipoUsuario", response.data.tipoUsuario);
      localStorage.setItem("nome", response.data.nome);

      if (response.data.tipoUsuario === "Supervisor") {
        navigate("/dashboard");
      } else {
        navigate("/bolsista");
      }
    } catch (error) {
      const mensagem =
        axios.isAxiosError(error) &&
        typeof error.response?.data === "string"
          ? error.response.data
          : "Erro ao fazer login";

      toast.error(mensagem);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <div className="auth-copy">
          <p className="page-kicker text-white/80">
            Secretaria Municipal de Saúde do Rio de Janeiro
          </p>
          <h1>
            Controle de ponto simples, claro e seguro.
          </h1>
          <p>
            Acompanhe jornadas, relatórios e aprovações em uma experiência
            organizada para supervisores e bolsistas.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <form
          onSubmit={fazerLogin}
          className="auth-card"
        >
          <div className="mb-7">
            <img
              src={logo}
              alt="Prefeitura do Rio Saude"
              className="w-44 mb-7"
            />

            <p className="page-kicker">
              Acesso ao sistema
            </p>
            <h2 className="page-title text-3xl">
              Entrar
            </h2>
          </div>

          <label className="field-label">
            Email
          </label>
          <input
            type="email"
            autoComplete="username"
            placeholder="nome@email.com"
            className="field mb-4"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="field-label">
            Senha
          </label>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="Digite sua senha"
            className="field mb-6"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button
            disabled={carregando}
            className="primary-button w-full"
          >
            <GoSignIn aria-hidden="true" />
            {carregando ? "Entrando..." : "Entrar"}
          </button>

          <div className="mt-6 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <span>Não possui conta?</span>
            <Link
              to="/register"
              className="inline-flex items-center gap-2 font-bold text-teal-700 hover:text-teal-900"
            >
              <GoPersonAdd aria-hidden="true" />
              Criar cadastro
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
