import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  GoArrowLeft,
  GoCopy,
  GoKey,
  GoPersonAdd
} from "react-icons/go";
import { Link } from "react-router-dom";

import edificio from "../assets/sms-edificio.jpg";
import logo from "../assets/prefeitura-logo.png";
import api from "../services/api";

export default function Register() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const tipoUsuario = "Bolsista";
  const [cargaHorariaSemanal, setCargaHorariaSemanal] = useState("20");
  const [salvando, setSalvando] = useState(false);
  const [convite, setConvite] = useState<{
    primeiroAcessoToken: string;
    primeiroAcessoUrl: string;
    expiraEm: string;
  } | null>(null);

  async function copiarTexto(texto: string, mensagem: string) {
    try {
      await navigator.clipboard.writeText(texto);
      toast.success(mensagem);
    } catch {
      toast.error("Não foi possível copiar o link de primeiro acesso.");
    }
  }

  async function registrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const nomeLimpo = nome.trim();
    const emailLimpo = email.trim();

    if (!nomeLimpo) {
      toast.error("Informe o nome completo do acadêmico bolsista.");
      return;
    }

    if (!emailLimpo) {
      toast.error("Informe o e-mail do acadêmico bolsista.");
      return;
    }

    if (!emailLimpo.includes("@")) {
      toast.error("Informe um e-mail válido para enviar o primeiro acesso.");
      return;
    }

    if (!cargaHorariaSemanal) {
      toast.error("Selecione a carga semanal do acadêmico bolsista.");
      return;
    }

    setSalvando(true);

    try {
      const response = await api.post("/auth/register", {
        nome: nomeLimpo,
        email: emailLimpo,
        tipoUsuario,
        cargaHorariaSemanal: cargaHorariaSemanal ? Number(cargaHorariaSemanal) : null
      });

      setConvite(response.data);
      toast.success("Acadêmico bolsista cadastrado. Envie o link de primeiro acesso.");
    } catch (error) {
      const mensagem =
        axios.isAxiosError(error) && typeof error.response?.data === "string"
          ? error.response.data
          : "Não foi possível cadastrar o acadêmico bolsista.";
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card-container">
        <section className="auth-visual" style={{ backgroundImage: `url(${edificio})` }}>
          <div className="auth-visual-badge">
            <img src={logo} alt="Prefeitura do Rio · Saúde" className="h-16" />
          </div>

          <div className="auth-copy">
            <p className="auth-copy-kicker">Cadastro institucional · SMS-Rio</p>
            <h1>
              Cadastre<br />
              acadêmicos<br />
              bolsistas.
            </h1>
            <p>
              Registre o acadêmico bolsista e gere o link de primeiro acesso
              para definição segura da senha.
            </p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-inner">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="auth-panel-eyebrow">
                  <span className="page-kicker" style={{ margin: 0 }}>
                    Novo Cadastro
                  </span>
                </div>
                <h2 className="auth-panel-title">Novo Acadêmico Bolsista</h2>
              </div>
              <Link
                to="/admin-usuarios"
                className="secondary-button min-h-0 shrink-0 px-3 py-2 text-sm"
              >
                <GoArrowLeft aria-hidden="true" />
                Voltar
              </Link>
            </div>

            <form onSubmit={registrar}>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="field-label">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Digite o nome completo"
                    className="field"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">Email</label>
                  <input
                    type="email"
                    autoComplete="username"
                    placeholder="nome.smsrio@gmail.com"
                    className="field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <section className="mt-4">
                <label className="field-label">Carga semanal (h)</label>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                  {["20", "30"].map((carga) => (
                    <button
                      key={carga}
                      type="button"
                      onClick={() => setCargaHorariaSemanal(carga)}
                      className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-bold transition ${
                        cargaHorariaSemanal === carga
                          ? "bg-white text-teal-800 shadow"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {carga}h
                    </button>
                  ))}
                </div>
                <input
                  type="hidden"
                  value={cargaHorariaSemanal}
                />
              </section>

              <button disabled={salvando} className="primary-button mt-5 w-full">
                <GoPersonAdd aria-hidden="true" />
                {salvando ? "Criando..." : "Criar usuário"}
              </button>
            </form>

            {convite && (
              <section className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-3 flex items-center gap-2 font-bold text-emerald-900">
                  <GoKey aria-hidden="true" />
                  Link de primeiro acesso
                </div>
                <button
                  type="button"
                  onClick={() =>
                    copiarTexto(
                      `${window.location.origin}${convite.primeiroAcessoUrl}`,
                      "Link de primeiro acesso copiado."
                    )
                  }
                  className="quiet-button min-h-0 px-3 py-2 text-sm"
                >
                  <GoCopy aria-hidden="true" />
                  Copiar link de primeiro acesso
                </button>
                <p className="mt-3 text-xs leading-relaxed text-emerald-800">
                  O link de primeiro acesso tem validade de 60 minutos.
                </p>
              </section>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
