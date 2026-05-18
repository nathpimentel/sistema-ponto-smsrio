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

import edificio from "../assets/sms-edificio.jpg";
import logo from "../assets/prefeitura-logo.png";
import api from "../services/api";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function fazerLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setCarregando(true);

    try {
      const response = await api.post("/auth/login", { email, senha });

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
              <input
                type="password"
                autoComplete="current-password"
                placeholder="Digite sua senha"
                className="field mb-7"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
              />

              <button disabled={carregando} className="primary-button w-full">
                <GoSignIn aria-hidden="true" />
                {carregando ? "Entrando..." : "Entrar"}
              </button>

              <div className="mt-6 flex items-center justify-between text-sm text-slate-500">
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

          </div>
        </section>

      </div>
    </div>
  );
}
