import axios from "axios";
import {
  useEffect,
  useMemo,
  useState
} from "react";
import toast from "react-hot-toast";
import {
  GoCheckCircle,
  GoDownload
} from "react-icons/go";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

interface Bolsista {
  id: number;
  nome: string;
  email: string;
  curso?: string;
  unidade?: string;
  cargaHorariaSemanal?: number | null;
}

const meses = [
  { valor: "1", label: "Janeiro" },
  { valor: "2", label: "Fevereiro" },
  { valor: "3", label: "Marco" },
  { valor: "4", label: "Abril" },
  { valor: "5", label: "Maio" },
  { valor: "6", label: "Junho" },
  { valor: "7", label: "Julho" },
  { valor: "8", label: "Agosto" },
  { valor: "9", label: "Setembro" },
  { valor: "10", label: "Outubro" },
  { valor: "11", label: "Novembro" },
  { valor: "12", label: "Dezembro" }
];

export default function Relatorios() {
  const hoje = new Date();
  const [busca, setBusca] = useState("");
  const [mes, setMes] = useState(String(hoje.getMonth() + 1));
  const [ano, setAno] = useState(String(hoje.getFullYear()));
  const [bolsistas, setBolsistas] = useState<Bolsista[]>([]);
  const [carregando, setCarregando] = useState(false);

  const bolsistasFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) {
      return bolsistas;
    }

    return bolsistas.filter((bolsista) =>
      bolsista.nome.toLowerCase().includes(termo) ||
      bolsista.email.toLowerCase().includes(termo)
    );
  }, [bolsistas, busca]);

  async function carregarBolsistas(signal?: AbortSignal) {
    try {
      const response = await api.get("/supervisor/bolsistas", { signal });
      setBolsistas(response.data);
    } catch (error) {
      if (axios.isCancel(error)) return;
      toast.error("Erro ao carregar bolsistas");
    }
  }

  async function gerarRelatorio() {
    if (!mes || !ano) {
      toast.error("Informe mês e ano para gerar o relatório");
      return;
    }

    setCarregando(true);

    try {
      const params = new URLSearchParams({
        mes,
        ano
      });

      if (busca.trim()) {
        params.set("busca", busca.trim());
      }

      const response = await api.get(
        `/supervisor/relatorio-pdf?${params.toString()}`,
        { responseType: "blob" }
      );

      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `relatorio-ponto-${mes.padStart(2, "0")}-${ano}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success("Relatório gerado");
    } catch {
      toast.error("Erro ao gerar relatório");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    carregarBolsistas(controller.signal);
    return () => controller.abort();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <div className="page-heading">
          <div>
            <p className="page-kicker">
              Relatórios
            </p>
            <h1 className="page-title">
              Relatório individual de ponto
            </h1>
            <p className="page-subtitle">
              Gere PDFs com os dias em que o bolsista registrou entrada e saída.
            </p>
          </div>
        </div>

        <section className="panel mb-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_0.7fr_0.7fr_auto] lg:items-end">
            <div>
              <label className="field-label">
                Bolsista
              </label>
              <input
                type="text"
                list="bolsistas"
                placeholder="Digite nome ou email"
                className="field"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <datalist id="bolsistas">
                {bolsistas.map((bolsista) => (
                  <option
                    key={bolsista.id}
                    value={bolsista.nome}
                  >
                    {bolsista.email}
                  </option>
                ))}
              </datalist>
            </div>

            <div>
              <label className="field-label">
                Mês
              </label>
              <select
                className="field"
                value={mes}
                onChange={(e) => setMes(e.target.value)}
              >
                {meses.map((item) => (
                  <option
                    key={item.valor}
                    value={item.valor}
                  >
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="field-label">
                Ano
              </label>
              <input
                type="number"
                className="field"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
              />
            </div>

            <button
              onClick={gerarRelatorio}
              disabled={carregando}
              className="primary-button"
            >
              <GoDownload aria-hidden="true" />
              {carregando ? "Gerando..." : "Gerar PDF"}
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Bolsistas cadastrados
              </h2>
              <p className="text-sm text-slate-500">
                Use a lista para conferir o nome correto antes de gerar o PDF.
              </p>
            </div>
            <span className="status-pill status-muted">
              {bolsistasFiltrados.length} encontrados
            </span>
          </div>

          <div className="overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Email</th>
                  <th>Curso</th>
                  <th>Unidade</th>
                  <th>Carga</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {bolsistasFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      Nenhum bolsista encontrado.
                    </td>
                  </tr>
                ) : (
                  bolsistasFiltrados.map((bolsista) => (
                    <tr key={bolsista.id}>
                      <td className="font-bold">
                        {bolsista.nome}
                      </td>
                      <td>{bolsista.email}</td>
                      <td>{bolsista.curso || "-"}</td>
                      <td>{bolsista.unidade || "-"}</td>
                      <td>
                        {bolsista.cargaHorariaSemanal
                          ? `${bolsista.cargaHorariaSemanal}h`
                          : "-"}
                      </td>
                      <td>
                        <button
                          onClick={() => setBusca(bolsista.nome)}
                          className="quiet-button min-h-0 px-3 py-2 text-sm"
                        >
                          <GoCheckCircle aria-hidden="true" />
                          Selecionar
                        </button>
                      </td>
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
