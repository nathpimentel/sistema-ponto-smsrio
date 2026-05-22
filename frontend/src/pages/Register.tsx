import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import {
  GoArrowLeft,
  GoKey,
  GoPerson,
  GoPersonAdd
} from "react-icons/go";
import { Link } from "react-router-dom";

import edificio from "../assets/sms-edificio.jpg";
import logo from "../assets/prefeitura-logo.png";
import api from "../services/api";

export default function Register() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("Bolsista");
  const [unidade, setUnidade] = useState("");
  const [cursoFaculdade, setCursoFaculdade] = useState("");
  const [cargaHorariaSemanal, setCargaHorariaSemanal] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [convite, setConvite] = useState<{
    primeiroAcessoToken: string;
    primeiroAcessoUrl: string;
    expiraEm: string;
  } | null>(null);

  async function registrar(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (
      !nome ||
      !email ||
      (tipoUsuario === "Bolsista" && (!unidade || !cursoFaculdade || !cargaHorariaSemanal))
    ) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setSalvando(true);

    try {
      const response = await api.post("/auth/register", {
        nome,
        email,
        tipoUsuario,
        unidade,
        cursoFaculdade,
        cargaHorariaSemanal: cargaHorariaSemanal ? Number(cargaHorariaSemanal) : null
      });

      setConvite(response.data);
      toast.success("Usuario criado. Envie o link de primeiro acesso");
    } catch (error) {
      const mensagem =
        axios.isAxiosError(error) && typeof error.response?.data === "string"
          ? error.response.data
          : "Erro ao registrar";
      toast.error(mensagem);
    } finally {
      setSalvando(false);
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
            <p className="auth-copy-kicker">Cadastro institucional · SMS-Rio</p>
            <h1>
              Faça parte<br />
              da nossa<br />
              equipe.
            </h1>
            <p>
              Preencha seus dados para solicitar acesso ao sistema
              de controle de ponto da Secretaria de Saúde.
            </p>
          </div>
        </section>

        {/* Painel do formulário direito */}
        <section className="auth-panel">
          <div className="auth-panel-inner">

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="auth-panel-eyebrow">
                  <span className="page-kicker" style={{ margin: 0 }}>
                    Novo Cadastro
                  </span>
                </div>
                <h2 className="auth-panel-title">Novo usuario</h2>
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
                    placeholder="Digite seu nome"
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
                    placeholder="nome@email.com"
                    className="field"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

              </div>

              <div className="mt-4">
                <span className="field-label">Tipo de acesso</span>
                <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
                  {["Bolsista", "Supervisor"].map((tipo) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setTipoUsuario(tipo)}
                      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition ${
                        tipoUsuario === tipo
                          ? "bg-white text-teal-800 shadow"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      <GoPerson aria-hidden="true" />
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>

              {tipoUsuario === "Bolsista" && (
                <section className="mt-4 border-t border-slate-200 pt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="field-label">Curso</label>
                      <input
                        type="text"
                        placeholder="Ex: Enfermagem"
                        className="field"
                        value={cursoFaculdade}
                        onChange={(e) => setCursoFaculdade(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="field-label">Carga semanal (h)</label>
                      <input
                        type="number"
                        min="1"
                        placeholder="Ex: 30"
                        className="field"
                        value={cargaHorariaSemanal}
                        onChange={(e) => setCargaHorariaSemanal(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="field-label">Unidade/Órgão</label>
                      <select
                        className="field"
                        value={unidade}
                        onChange={(e) => setUnidade(e.target.value)}
                      >
                        <option value="">Selecione</option>
                        <option value="SMS-RIO">SMS-RIO</option>
                        <option value="RH">RH</option>
                        <option value="TI">TI</option>
                        <option value="Administrativo">Administrativo</option>
                      </select>
                    </div>
                  </div>
                </section>
              )}

              <button disabled={salvando} className="primary-button mt-5 w-full">
                <GoPersonAdd aria-hidden="true" />
                {salvando ? "Criando..." : "Criar usuario"}
              </button>
            </form>

            {convite && (
              <section className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="mb-3 flex items-center gap-2 font-bold text-emerald-900">
                  <GoKey aria-hidden="true" />
                  Link de primeiro acesso
                </div>
                <p className="break-all text-sm text-emerald-950">
                  {`${window.location.origin}${convite.primeiroAcessoUrl}`}
                </p>
                <p className="mt-3 break-all text-xs text-emerald-800">
                  Token: {convite.primeiroAcessoToken}
                </p>
              </section>
            )}

          </div>
        </section>

      </div>
    </div>
  );
}
