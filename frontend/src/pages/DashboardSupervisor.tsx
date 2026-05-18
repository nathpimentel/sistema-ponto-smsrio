import {
  useEffect,
  useState
} from "react";
import toast from "react-hot-toast";
import {
  GoCheckCircle,
  GoClock,
  GoFile
} from "react-icons/go";
import { Link } from "react-router-dom";

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
            <p className="page-kicker">
              Visao Geral
            </p>
            <h1 className="page-title">
              Bem-vindo(a), {nome}
            </h1>
            <p className="page-subtitle">
              Acompanhe a equipe em expediente e acesse rápidamente as rotinas do ponto.
            </p>
          </div>

          <Link
            to="/relatorios"
            className="primary-button"
          >
            <GoFile aria-hidden="true" />
            Gerar Relatório
          </Link>
        </div>

        <section className="welcome-band mb-6">
          <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Painel de supervisão atualizado automaticamente
              </h2>
              <p className="mt-1 text-slate-600">
                Os indicadores são atualizados a cada poucos segundos para manter a rotina visível.
              </p>
            </div>
            <span className="status-pill status-ok">
              <GoCheckCircle aria-hidden="true" />
              Sistema Online
            </span>
          </div>
        </section>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Bolsistas Cadastrados
            </p>
            <strong className="mt-3 block text-4xl text-slate-900">
              {bolsistas.length}
            </strong>
          </div>

          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Trabalhando Agora
            </p>
            <strong className="mt-3 block text-4xl text-emerald-700">
              {ativos.length}
            </strong>
          </div>

          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Proxima Ação
            </p>
            <strong className="mt-3 block text-xl text-teal-800">
              Revisar Registros
            </strong>
            <Link
              to="/registros"
              className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-teal-700 hover:text-teal-900"
            >
              <GoClock aria-hidden="true" />
              Abrir Histórico
            </Link>
          </div>
        </section>

        <section className="panel">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Equipe em Expediente
              </h2>
              <p className="text-sm text-slate-500">
                Bolsistas com entrada registrada e saída pendente.
              </p>
            </div>
            <span className="status-pill status-muted">
              Atualização Automática
            </span>
          </div>

          {ativos.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-bold text-slate-700">
                Nenhum bolsista em expediente no momento
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Quando alguém registrar entrada, aparecerá aqui.
              </p>
            </div>
          ) : (
            <div className="overflow-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Email</th>
                    <th>Entrada</th>
                    <th>Data</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {ativos.map((ativo, index) => (
                    <tr key={`${ativo.email}-${index}`}>
                      <td className="font-bold">
                        {ativo.nome}
                      </td>
                      <td>{ativo.email}</td>
                      <td>{formatarHorasMinutos(ativo.entrada)}</td>
                      <td>{ativo.data}</td>
                      <td>
                        <span className="status-pill status-ok">
                          Em Expediente
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
