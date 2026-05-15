import { useState } from "react";
import toast from "react-hot-toast";
import {
  GoArrowLeft,
  GoEye,
  GoEyeClosed,
  GoPerson,
  GoPersonAdd
} from "react-icons/go";
import {
  Link,
  useNavigate
} from "react-router-dom";

import logo from "../assets/prefeitura-logo.png";
import api from "../services/api";

export default function Register() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("Bolsista");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [unidade, setUnidade] = useState("");
  const [cursoFaculdade, setCursoFaculdade] = useState("");
  const [cargaHorariaSemanal, setCargaHorariaSemanal] = useState("");
  const [salvando, setSalvando] = useState(false);

  const forcaSenha = verificarForcaSenha(senha);

  async function registrar(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (
      !nome ||
      !email ||
      !senha ||
      (
        tipoUsuario === "Bolsista" &&
        (
          !unidade ||
          !cursoFaculdade ||
          !cargaHorariaSemanal
        )
      )
    ) {
      toast.error("Preencha todos os campos obrigatorios");
      return;
    }

    if (!senhaAtendeRequisitos(senha)) {
      toast.error("A senha nao atende os requisitos minimos");
      return;
    }

    setSalvando(true);

    try {
      await api.post("/auth/register", {
        nome,
        email,
        senha,
        tipoUsuario,
        unidade,
        cursoFaculdade,
        cargaHorariaSemanal: cargaHorariaSemanal
          ? Number(cargaHorariaSemanal)
          : null
      });

      toast.success("Cadastro enviado para aprovacao");
      navigate("/");
    } catch {
      toast.error("Erro ao registrar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="auth-page">
      <section className="auth-visual">
        <div className="auth-copy">
          <p className="page-kicker text-white/80">
            Cadastro institucional
          </p>
          <h1>
            Seu acesso com os dados certos desde o inicio.
          </h1>
          <p>
            Curso, carga semanal e unidade informados aqui serao usados nos
            relatorios individuais de ponto.
          </p>
        </div>
      </section>

      <section className="auth-panel">
        <form
          onSubmit={registrar}
          className="auth-card"
        >
          <div className="mb-7">
            <div className="mb-6 grid gap-4 sm:flex sm:items-center sm:justify-between">
              <img
                src={logo}
                alt="Prefeitura do Rio Saude"
                className="w-36"
              />

              <Link
                to="/"
                className="secondary-button min-h-0 whitespace-nowrap px-3 py-2 text-sm"
              >
                <GoArrowLeft aria-hidden="true" />
                Voltar ao login
              </Link>
            </div>

            <p className="page-kicker">
              Novo cadastro
            </p>
            <h2 className="page-title text-3xl">
              Registrar-se
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="field-label">
                Nome completo
              </label>
              <input
                type="text"
                placeholder="Digite seu nome"
                className="field"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">
                Email
              </label>
              <input
                type="email"
                autoComplete="username"
                placeholder="nome@email.com"
                className="field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="field-label">
                Senha
              </label>
              <div className="relative">
                <input
                  type={mostrarSenha ? "text" : "password"}
                  autoComplete="new-password"
                  placeholder="Minimo 8 caracteres"
                  className="field pr-24"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />

                <button
                  type="button"
                  onClick={() => setMostrarSenha(!mostrarSenha)}
                  className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100"
                >
                  {mostrarSenha ? (
                    <GoEyeClosed aria-hidden="true" />
                  ) : (
                    <GoEye aria-hidden="true" />
                  )}
                  {mostrarSenha ? "Ocultar" : "Mostrar"}
                </button>
              </div>

              {senha.length > 0 && (
                <div className="mt-3">
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className={`h-full transition-all duration-500 ${forcaSenha.cor}`}
                      style={{ width: forcaSenha.largura }}
                    />
                  </div>
                  <p className="mt-2 text-sm font-bold text-slate-700">
                    {forcaSenha.texto}
                  </p>
                  <div className="mt-2 grid gap-1 text-xs text-slate-500">
                    <span>{senha.length >= 8 ? "OK" : "--"} Minimo de 8 caracteres</span>
                    <span>{/\d/.test(senha) ? "OK" : "--"} Pelo menos 1 numero</span>
                    <span>
                      {/[!@#$%^&*(),.?":{}|<>]/.test(senha) ? "OK" : "--"} Pelo menos 1 caractere especial
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <span className="field-label">
              Tipo de acesso
            </span>
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
            <section className="mt-6 border-t border-slate-200 pt-6">
              <h3 className="mb-4 text-lg font-bold text-slate-800">
                Dados academicos e unidade
              </h3>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="field-label">
                    Curso
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Enfermagem"
                    className="field"
                    value={cursoFaculdade}
                    onChange={(e) => setCursoFaculdade(e.target.value)}
                  />
                </div>

                <div>
                  <label className="field-label">
                    Carga horaria semanal
                  </label>
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
                  <label className="field-label">
                    Unidade/Orgao
                  </label>
                  <select
                    className="field"
                    value={unidade}
                    onChange={(e) => setUnidade(e.target.value)}
                  >
                    <option value="">
                      Selecione uma unidade
                    </option>
                    <option value="SMS-RIO">
                      SMS-RIO
                    </option>
                    <option value="RH">
                      RH
                    </option>
                    <option value="TI">
                      TI
                    </option>
                    <option value="Administrativo">
                      Administrativo
                    </option>
                  </select>
                </div>
              </div>
            </section>
          )}

          <button
            disabled={salvando}
            className="primary-button mt-7 w-full"
          >
            <GoPersonAdd aria-hidden="true" />
            {salvando ? "Enviando..." : "Enviar cadastro"}
          </button>
        </form>
      </section>
    </div>
  );
}

function senhaAtendeRequisitos(senha: string) {
  return senha.length >= 8 &&
    /\d/.test(senha) &&
    /[!@#$%^&*(),.?":{}|<>]/.test(senha);
}

function verificarForcaSenha(senha: string) {
  let pontos = 0;

  if (senha.length >= 8) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(senha)) pontos++;
  if (senha.length >= 10) pontos++;

  if (pontos <= 1) {
    return {
      texto: "Senha fraca",
      cor: "bg-red-500",
      largura: "25%"
    };
  }

  if (pontos <= 3) {
    return {
      texto: "Senha media",
      cor: "bg-amber-500",
      largura: "65%"
    };
  }

  return {
    texto: "Senha forte",
    cor: "bg-emerald-500",
    largura: "100%"
  };
}
