import {
  useEffect,
  useState
} from "react";
import toast from "react-hot-toast";
import {
  GoAlert,
  GoCalendar,
  GoCheckCircle,
  GoPeople,
  GoPerson,
  GoSync
} from "react-icons/go";

import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { formatarHorasMinutos } from "../utils/formatarHoras";

interface Bolsista {
  id: number;
  nome: string;
  email: string;
}

interface Ativo {
  nome: string;
  email: string;
  entrada: string;
  tempoEmExpediente: string;
  minutosEmExpediente: number;
  status: string;
}

interface ResumoDia {
  data: string;
  atualizadoEm: string;
  bolsistasAtivos: number;
  presentesHoje: number;
  trabalhandoAgora: number;
  pendenciasSaida: number;
  semPontoHoje: number;
  equipeEmExpediente: Ativo[];
}

export default function DashboardSupervisor() {
  const nome = localStorage.getItem("nome") || "Supervisor";
  const [bolsistas, setBolsistas] = useState<Bolsista[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);
  const [resumoDia, setResumoDia] = useState<ResumoDia | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarBolsistas(signal?: AbortSignal) {
    try {
      const response = await api.get("/supervisor/bolsistas", { signal });
      setBolsistas(response.data);
    } catch (error) {
      if (axios.isCancel(error)) return;
      toast.error("Erro ao carregar bolsistas");
    }
  }

  async function carregarAtivos(signal?: AbortSignal) {
    try {
      const response = await api.get("/supervisor/resumo-dia", { signal });
      setResumoDia(response.data);
      setAtivos(Array.isArray(response.data.equipeEmExpediente)
        ? response.data.equipeEmExpediente
        : []);
    } catch (error) {
      if (axios.isCancel(error)) return;
      toast.error("Erro ao carregar resumo do dia");
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      carregarBolsistas(controller.signal),
      carregarAtivos(controller.signal)
    ]).finally(() => setCarregando(false));

    const interval = setInterval(() => {
      carregarBolsistas(controller.signal);
      carregarAtivos(controller.signal);
    }, 60_000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, []);

  if (carregando) {
    return (
      <div className="app-shell">
        <Sidebar />
        <main className="app-main">
          <div className="animate-pulse space-y-4 pt-6">
            <div className="h-8 w-48 rounded-lg bg-slate-200" />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="h-28 rounded-xl bg-slate-200" />
              <div className="h-28 rounded-xl bg-slate-200" />
              <div className="h-28 rounded-xl bg-slate-200" />
              <div className="h-28 rounded-xl bg-slate-200" />
            </div>
            <div className="h-72 rounded-xl bg-slate-200" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <div className="page-heading">
          <div>
            <p className="page-kicker">Visão Geral</p>
            <h1 className="page-title">Olá, {nome}</h1>
            <p className="page-subtitle">
              Acompanhe a equipe em expediente e monitore os registros do ponto.
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-500">
              Hoje, {resumoDia?.data ?? "--/--/----"} · Atualizado às {resumoDia?.atualizadoEm ?? "--:--"}
            </p>
          </div>
        </div>

        {/* KPI cards */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="metric-card admin-metric-card">
            <span className="admin-stat-icon">
              <GoPeople aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Acadêmicos Ativos
              </p>
              <strong className="mt-2 block text-4xl text-slate-900">
                {resumoDia?.bolsistasAtivos ?? bolsistas.length}
              </strong>
            </div>
          </div>

          <div className="metric-card admin-metric-card">
            <span className="admin-stat-icon admin-stat-icon-ok">
              <GoCheckCircle aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Presentes Hoje
              </p>
              <strong className="mt-2 block text-4xl text-emerald-700">
                {resumoDia?.presentesHoje ?? 0}
              </strong>
              <p className="mt-1 text-sm text-slate-500">
                {resumoDia?.trabalhandoAgora ?? ativos.length} em expediente
              </p>
            </div>
          </div>

          <div className="metric-card admin-metric-card">
            <span className="admin-stat-icon admin-stat-icon-warn">
              <GoAlert aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Pendências
              </p>
              <strong className="mt-2 block text-4xl text-amber-700">
                {resumoDia?.pendenciasSaida ?? 0}
              </strong>
              <p className="mt-1 text-sm text-slate-500">saídas em aberto</p>
            </div>
          </div>

          <div className="metric-card admin-metric-card">
            <span className="admin-stat-icon">
              <GoCalendar aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Sem Ponto Hoje
              </p>
              <strong className="mt-2 block text-4xl text-slate-900">
                {resumoDia?.semPontoHoje ?? 0}
              </strong>
              <p className="mt-1 text-sm text-slate-500">sem entrada registrada</p>
            </div>
          </div>

        </section>

        {/* Active bolsistas */}
        <section className="panel">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-lg text-emerald-700"
                style={{ background: "#dcfce7", fontSize: "1.15rem" }}
              >
                <GoPerson aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Equipe em Expediente</h2>
                <p className="text-sm text-slate-500">
                  Entradas abertas hoje, com tempo em expediente.
                </p>
              </div>
            </div>

            <span className="status-pill status-ok">
              <GoSync aria-hidden="true" />
              Atualizado às {resumoDia?.atualizadoEm ?? "--:--"}
            </span>
          </div>

          {ativos.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-8 py-10 text-center">
              <div
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "#e2e8f0", color: "#64748b", fontSize: "1.6rem" }}
              >
                <GoPeople aria-hidden="true" />
              </div>
              <p className="font-bold text-slate-700">
                Nenhuma entrada aberta no momento
              </p>
              <p className="mt-1 text-sm text-slate-500">
                A equipe com ponto aberto aparecerá aqui em tempo real.
              </p>
            </div>
          ) : (
            <div className="active-bolsistas-grid">
              {ativos.map((ativo, index) => (
                <div key={`${ativo.email}-${index}`} className="active-bolsista-card">
                  <div className="active-bolsista-avatar">
                    {ativo.nome.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p className="font-bold text-slate-900 truncate">{ativo.nome}</p>
                    <p className="text-xs text-slate-500 truncate">{ativo.email}</p>
                    <span
                      className={`mt-1 status-pill ${ativo.status === "Atenção" ? "status-warn" : "status-ok"}`}
                      style={{ fontSize: "0.7rem", padding: "2px 8px" }}
                    >
                      {ativo.status === "Atenção" ? <GoAlert aria-hidden="true" /> : <GoCheckCircle aria-hidden="true" />}
                      Entrada {ativo.entrada} · {formatarHorasMinutos(ativo.tempoEmExpediente)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
