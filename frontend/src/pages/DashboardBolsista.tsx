import axios from "axios";
import {
  useEffect,
  useState
} from "react";
import toast from "react-hot-toast";
import {
  GoPerson,
  GoSignIn,
  GoSignOut
} from "react-icons/go";
import { Link } from "react-router-dom";

import SidebarBolsista from "../components/SidebarBolsista";
import api from "../services/api";
import { formatarHorasMinutos } from "../utils/formatarHoras";

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

function mensagemErroPadrao(
  error: unknown,
  fallback: string
) {
  if (
    axios.isAxiosError(error) &&
    typeof error.response?.data === "string"
  ) {
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
      toast.error(
        mensagemErroPadrao(
          error,
          "Erro ao registrar entrada"
        )
      );
    }
  }

  async function baterSaida() {
    try {
      await api.post("/ponto/saida", {});
      toast.success("Saída registrada");
      carregarHistorico();
      carregarResumo();
    } catch (error) {
      toast.error(
        mensagemErroPadrao(
          error,
          "Erro ao registrar saída"
        )
      );
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

    const interval = setInterval(() => {
      carregarHistorico();
      carregarResumo();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setAgora(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  function formatarCronometro() {
    if (!resumo.trabalhandoAgora || !resumo.inicioExpediente) {
      return "00:00:00";
    }

    const inicio = new Date(resumo.inicioExpediente);
    const diferencaSegundos = Math.max(
      0,
      Math.floor((agora.getTime() - inicio.getTime()) / 1000)
    );
    const horas = Math.floor(diferencaSegundos / 3600);
    const minutos = Math.floor((diferencaSegundos % 3600) / 60);
    const segundos = diferencaSegundos % 60;

    return `${horas.toString().padStart(2, "0")}:${minutos
      .toString()
      .padStart(2, "0")}:${segundos.toString().padStart(2, "0")}`;
  }

  function horarioInicioExpediente() {
    if (!resumo.inicioExpediente) {
      return "--:--";
    }

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
            <p className="page-kicker">
              Meu painel
            </p>
            <h1 className="page-title">
              Bem-vindo(a), {nome}
            </h1>
            <p className="page-subtitle">
              Registre sua jornada e acompanhe seu histórico mensal.
            </p>
          </div>

          <Link
            to="/bolsista/perfil"
            className="secondary-button"
          >
            <GoPerson aria-hidden="true" />
            Abrir perfil
          </Link>
        </div>

        <section className="welcome-band mb-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {resumo.trabalhandoAgora
                  ? "Seu expediente esta em andamento"
                  : "Pronto para registrar sua jornada"}
              </h2>
              <p className="mt-1 text-slate-600">
                Use os botões de ponto conforme entrada e saída do dia.
              </p>
            </div>
            <span className={`status-pill ${resumo.trabalhandoAgora ? "status-ok" : "status-muted"}`}>
              {resumo.trabalhandoAgora ? "Trabalhando" : "Fora do expediente"}
            </span>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Horas no mês
            </p>
            <strong className="mt-3 block text-2xl text-slate-900">
              {formatarHorasMinutos(resumo.totalHoras)}
            </strong>
          </div>

          <div className="metric-card live-clock-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Expediente atual
            </p>
            <strong className="mt-3 block font-mono text-4xl text-emerald-700">
              {formatarCronometro()}
            </strong>
            <p className="mt-2 text-sm text-slate-500">
              {resumo.trabalhandoAgora
                ? `Entrada as ${horarioInicioExpediente()}`
                : "Cronometro inicia na entrada"}
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

          <div
            className={`status-card ${
              resumo.trabalhandoAgora
                ? "status-card-active"
                : "status-card-resting"
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
              {resumo.trabalhandoAgora
                ? "Em expediente"
                : "Sem expediente ativo"}
            </p>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="panel">
            <h2 className="text-xl font-bold text-slate-900">
              Registrar entrada
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Use quando iniciar sua jornada do dia.
            </p>
            <button
              onClick={baterEntrada}
              disabled={resumo.trabalhandoAgora}
              className={`mt-5 w-full ${
                resumo.trabalhandoAgora
                  ? "quiet-button"
                  : "primary-button"
              }`}
            >
              <GoSignIn aria-hidden="true" />
              {resumo.trabalhandoAgora ? "Entrada ja registrada" : "Bater entrada"}
            </button>
          </div>

          <div className="panel">
            <h2 className="text-xl font-bold text-slate-900">
              Registrar saída
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Use ao encerrar sua jornada.
            </p>
            <button
              onClick={baterSaida}
              disabled={!resumo.trabalhandoAgora}
              className={`mt-5 w-full ${
                resumo.trabalhandoAgora
                  ? "danger-button"
                  : "quiet-button"
              }`}
            >
              <GoSignOut aria-hidden="true" />
              {resumo.trabalhandoAgora ? "Bater saida" : "Sem entrada pendente"}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-slate-900">
              Histórico de ponto
            </h2>
            <p className="text-sm text-slate-500">
              Ultimos registros de entrada, saída e horas trabalhadas.
            </p>
          </div>

          <div className="overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Entrada</th>
                  <th>Saida</th>
                  <th>Horas</th>
                </tr>
              </thead>
              <tbody>
                {registros.length === 0 ? (
                  <tr>
                    <td colSpan={4}>
                      Nenhum registro encontrado.
                    </td>
                  </tr>
                ) : (
                  registros.map((registro, index) => (
                    <tr key={`${registro.data}-${index}`}>
                      <td className="font-bold">{registro.data}</td>
                      <td>{registro.entrada ? formatarHorasMinutos(registro.entrada) : "-"}</td>
                      <td>{registro.saida ? formatarHorasMinutos(registro.saida) : "-"}</td>
                      <td>{formatarHorasMinutos(registro.horas)}</td>
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
