import {
  useEffect,
  useState
} from "react";
import toast from "react-hot-toast";
import {
  GoCheckCircle,
  GoClock,
  GoFile,
  GoPeople,
  GoPerson,
  GoSync
} from "react-icons/go";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { formatarHorarioLocal } from "../utils/formatarHoras";

interface Bolsista {
  id: number;
  nome: string;
  email: string;
}

interface Ativo {
  nome: string;
  email: string;
  entrada: string;
  data: string;
}

export default function DashboardSupervisor() {
  const nome = localStorage.getItem("nome") || "Supervisor";
  const [bolsistas, setBolsistas] = useState<Bolsista[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);

  async function carregarBolsistas() {
    try {
      const response = await api.get("/supervisor/bolsistas");
      setBolsistas(response.data);
    } catch {
      toast.error("Erro ao carregar bolsistas");
    }
  }

  async function carregarAtivos() {
    try {
      const response = await api.get("/supervisor/ativos");
      setAtivos(Array.isArray(response.data) ? response.data : []);
    } catch {
      toast.error("Erro ao carregar bolsistas em expediente");
    }
  }

  useEffect(() => {
    carregarBolsistas();
    carregarAtivos();

    const interval = setInterval(() => {
      carregarBolsistas();
      carregarAtivos();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <div className="page-heading">
          <div>
            <p className="page-kicker">Visão Geral</p>
            <h1 className="page-title">Olá, {nome}</h1>
            <p className="page-subtitle">
              Acompanhe a equipe em expediente e acesse rapidamente as rotinas do ponto.
            </p>
          </div>

          <Link to="/relatorios" className="primary-button">
            <GoFile aria-hidden="true" />
            Gerar Relatório
          </Link>
        </div>

        {/* KPI cards */}
        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="metric-card admin-metric-card">
            <span className="admin-stat-icon">
              <GoPeople aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Bolsistas Cadastrados
              </p>
              <strong className="mt-2 block text-4xl text-slate-900">
                {bolsistas.length}
              </strong>
            </div>
          </div>

          <div className="metric-card admin-metric-card">
            <span className="admin-stat-icon admin-stat-icon-ok">
              <GoCheckCircle aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Trabalhando Agora
              </p>
              <strong className="mt-2 block text-4xl text-emerald-700">
                {ativos.length}
              </strong>
              <p className="mt-1 text-sm text-slate-500">em expediente</p>
            </div>
          </div>

          <div className="metric-card admin-metric-card">
            <span className="admin-stat-icon admin-stat-icon-info">
              <GoClock aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Próxima Ação
              </p>
              <strong className="mt-2 block text-xl text-teal-800">
                Revisar Registros
              </strong>
              <Link
                to="/registros"
                className="mt-2 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-900"
              >
                <GoClock aria-hidden="true" />
                Abrir Histórico
              </Link>
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
                  Bolsistas com entrada registrada e saída pendente.
                </p>
              </div>
            </div>

            <span className="status-pill status-ok">
              <GoSync aria-hidden="true" />
              Atualização automática
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
                Nenhum bolsista em expediente no momento
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Quando alguém registrar entrada, aparecerá aqui.
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
                    <span className="mt-1 status-pill status-ok" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                      <GoCheckCircle aria-hidden="true" />
                      Entrada {formatarHorarioLocal(ativo.entrada)}
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
