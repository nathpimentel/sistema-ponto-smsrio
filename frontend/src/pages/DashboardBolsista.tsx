import axios from "axios";
import {
  useEffect,
  useState
} from "react";
import toast from "react-hot-toast";
import {
  GoClock,
  GoPerson,
  GoSignIn,
  GoSignOut
} from "react-icons/go";
import { Link } from "react-router-dom";

import SidebarBolsista from "../components/SidebarBolsista";
import api from "../services/api";
import { formatarDuracao, formatarHorario } from "../utils/formatarHoras";

interface Registro {
  data: string;
  entrada: string;
  saida: string;
  horas: string;
}

interface Resumo {
  totalHoras: string;
  totalRegistros: number;
  trabalhandoAgora: boolean;
  inicioExpediente?: string | null;
}

function mensagemErroPadrao(error: unknown, fallback: string) {
  if (axios.isAxiosError(error) && typeof error.response?.data === "string") {
    return error.response.data;
  }
  return fallback;
}

export default function DashboardBolsista() {
  const nome = localStorage.getItem("nome") || "Bolsista";
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [resumo, setResumo] = useState<Resumo>({
    totalHoras: "00:00",
    totalRegistros: 0,
    trabalhandoAgora: false,
    inicioExpediente: null
  });
  const [agora, setAgora] = useState(() => new Date());

  async function baterEntrada() {
    try {
      await api.post("/ponto/entrada", {});
      toast.success("Entrada registrada");
      carregarHistorico();
      carregarResumo();
    } catch (error) {
      toast.error(mensagemErroPadrao(error, "Erro ao registrar entrada"));
    }
  }

  async function baterSaida() {
    try {
      await api.post("/ponto/saida", {});
      toast.success("Saída registrada");
      carregarHistorico();
      carregarResumo();
    } catch (error) {
      toast.error(mensagemErroPadrao(error, "Erro ao registrar saída"));
    }
  }

  async function carregarHistorico() {
    try {
      const response = await api.get("/ponto/meus-registros");
      setRegistros(response.data);
    } catch {
      toast.error("Erro ao carregar histórico");
    }
  }

  async function carregarResumo() {
    try {
      const response = await api.get("/ponto/resumo");
      setResumo(response.data);
    } catch {
      toast.error("Erro ao carregar resumo");
    }
  }

  useEffect(() => {
    carregarHistorico();
    carregarResumo();

    // Cronometro ja calcula localmente a partir de inicioExpediente;
    // nao precisa de polling curto. Recarrega o resumo a cada 60s
    // apenas para detectar mudancas externas (ex: bolsista desaprovado).
    const interval = setInterval(carregarResumo, 60_000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => setAgora(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  function formatarCronometro() {
    if (!resumo.trabalhandoAgora || !resumo.inicioExpediente) return "00:00:00";

    const inicio = new Date(resumo.inicioExpediente);
    const diff = Math.max(0, Math.floor((agora.getTime() - inicio.getTime()) / 1000));
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    const s = diff % 60;

    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function horarioInicioExpediente() {
    if (!resumo.inicioExpediente) return "--:--";
    return new Date(resumo.inicioExpediente).toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return (
    <div className="app-shell">
      <SidebarBolsista />

      <main className="app-main">
        <div className="page-heading">
          <div>
            <p className="page-kicker">Meu painel</p>
            <h1 className="page-title">Olá, {nome}</h1>
            <p className="page-subtitle">
              Registre sua jornada e acompanhe seu histórico mensal.
            </p>
          </div>

          <Link to="/bolsista/perfil" className="secondary-button">
            <GoPerson aria-hidden="true" />
            Meu perfil
          </Link>
        </div>

        {/* Punch section */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="panel" style={{ borderRadius: 12, display: "flex", flexDirection: "column" }}>
            <div className={`punch-icon ${resumo.trabalhandoAgora ? "punch-icon-muted" : "punch-icon-entrada"}`}>
              <GoSignIn aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Registrar entrada</h2>
            <p className="mt-1 text-sm text-slate-500" style={{ flex: 1 }}>
              {resumo.trabalhandoAgora
                ? "Você já está em expediente desde as " + horarioInicioExpediente() + "."
                : "Use quando iniciar sua jornada do dia."}
            </p>
            <button
              onClick={baterEntrada}
              disabled={resumo.trabalhandoAgora}
              className={`mt-5 w-full ${resumo.trabalhandoAgora ? "quiet-button" : "primary-button"}`}
            >
              <GoSignIn aria-hidden="true" />
              {resumo.trabalhandoAgora ? "Entrada já registrada" : "Bater entrada"}
            </button>
          </div>

          <div className="panel" style={{ borderRadius: 12, display: "flex", flexDirection: "column" }}>
            <div className={`punch-icon ${resumo.trabalhandoAgora ? "punch-icon-saida" : "punch-icon-muted"}`}>
              <GoSignOut aria-hidden="true" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Registrar saída</h2>
            <p className="mt-1 text-sm text-slate-500" style={{ flex: 1 }}>
              {resumo.trabalhandoAgora
                ? "Encerre seu expediente ao finalizar o turno."
                : "Nenhum expediente ativo no momento."}
            </p>
            <button
              onClick={baterSaida}
              disabled={!resumo.trabalhandoAgora}
              className={`mt-5 w-full ${resumo.trabalhandoAgora ? "danger-button" : "quiet-button"}`}
            >
              <GoSignOut aria-hidden="true" />
              {resumo.trabalhandoAgora ? "Bater saída" : "Sem entrada pendente"}
            </button>
          </div>
        </section>

        {/* Metrics */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Horas no mês
            </p>
            <strong className="mt-3 block text-2xl text-slate-900">
              {formatarDuracao(resumo.totalHoras)}
            </strong>
          </div>

          <div className="metric-card live-clock-card" style={{ gridColumn: "span 2" }}>
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Expediente atual
            </p>
            <strong className="mt-3 block font-mono text-4xl text-emerald-700">
              {formatarCronometro()}
            </strong>
            <p className="mt-2 text-sm text-slate-500">
              {resumo.trabalhandoAgora
                ? `Entrada às ${horarioInicioExpediente()}`
                : "Cronômetro inicia na entrada"}
            </p>
          </div>

          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Dias registrados
            </p>
            <strong className="mt-3 block text-4xl text-teal-800">
              {resumo.totalRegistros}
            </strong>
          </div>
        </section>

        {/* Status orb card */}
        <section className="mb-6">
          <div
            className={`status-card ${
              resumo.trabalhandoAgora ? "status-card-active" : "status-card-resting"
            }`}
          >
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Status atual
            </p>

            <div className="status-visual">
              <div className="status-orb">
                <span className="status-ring status-ring-one" />
                <span className="status-ring status-ring-two" />
                <span className="status-core" />
              </div>

              <div className="status-bars">
                <span />
                <span />
                <span />
                <span />
              </div>
            </div>

            <p className="mt-3 text-xl font-bold text-slate-900">
              {resumo.trabalhandoAgora ? "Em expediente" : "Sem expediente ativo"}
            </p>
          </div>
        </section>

        {/* History */}
        <section className="panel">
          <div className="mb-5 flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg text-teal-700"
              style={{ background: "#e8f2f5", fontSize: "1.1rem" }}
            >
              <GoClock aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Histórico de ponto</h2>
              <p className="text-sm text-slate-500">
                Últimos registros de entrada, saída e horas trabalhadas.
              </p>
            </div>
          </div>

          <div className="overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Entrada</th>
                  <th>Saída</th>
                  <th>Horas</th>
                </tr>
              </thead>
              <tbody>
                {registros.length === 0 ? (
                  <tr>
                    <td colSpan={4}>Nenhum registro encontrado.</td>
                  </tr>
                ) : (
                  registros.map((registro, index) => (
                    <tr key={`${registro.data}-${index}`}>
                      <td className="font-bold">{registro.data}</td>
                      <td>{registro.entrada ? formatarHorario(registro.entrada) : "-"}</td>
                      <td>{registro.saida ? formatarHorario(registro.saida) : "-"}</td>
                      <td>{formatarDuracao(registro.horas)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
