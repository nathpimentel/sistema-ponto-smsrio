import {
  useEffect,
  useMemo,
  useState
} from "react";
import toast from "react-hot-toast";
import {
  GoFileDirectory,
  GoFileDirectoryFill,
  GoSync,
  GoXCircle
} from "react-icons/go";

import Sidebar from "../components/Sidebar";
import api from "../services/api";
import { formatarHorasMinutos } from "../utils/formatarHoras";

interface Registro {
  nome: string;
  email: string;
  data: string;
  entrada: string | null;
  saida: string | null;
  tempoTrabalhado: string | null;
}

interface Bolsista {
  id: number;
  nome: string;
  email: string;
}

interface FiltrosPasta {
  data: string;
  dia: string;
  mes: string;
}

interface PastaBolsista {
  chave: string;
  nome: string;
  email: string;
  registros: Registro[];
  totalHoras: string;
}

const meses = [
  { valor: "", label: "Todos os meses" },
  { valor: "01", label: "Janeiro" },
  { valor: "02", label: "Fevereiro" },
  { valor: "03", label: "Março" },
  { valor: "04", label: "Abril" },
  { valor: "05", label: "Maio" },
  { valor: "06", label: "Junho" },
  { valor: "07", label: "Julho" },
  { valor: "08", label: "Agosto" },
  { valor: "09", label: "Setembro" },
  { valor: "10", label: "Outubro" },
  { valor: "11", label: "Novembro" },
  { valor: "12", label: "Dezembro" }
];

const diasSemana = [
  { valor: "", label: "Todos os dias" },
  { valor: "0", label: "Domingo" },
  { valor: "1", label: "Segunda-feira" },
  { valor: "2", label: "Terça-feira" },
  { valor: "3", label: "Quarta-feira" },
  { valor: "4", label: "Quinta-feira" },
  { valor: "5", label: "Sexta-feira" },
  { valor: "6", label: "Sábado" }
];

function dataBrParaDate(data: string) {
  const [dia, mes, ano] = data
    .split("/")
    .map(Number);

  return new Date(ano, mes - 1, dia);
}

function dataBrParaInput(data: string) {
  const [dia, mes, ano] = data.split("/");

  if (!dia || !mes || !ano) {
    return "";
  }

  return `${ano}-${mes.padStart(2, "0")}-${dia.padStart(2, "0")}`;
}

function somarHoras(registros: Registro[]) {
  const totalMinutos = registros.reduce((total, registro) => {
    if (!registro.tempoTrabalhado) {
      return total;
    }

    const [horas, minutos] = registro.tempoTrabalhado
      .split(":")
      .map(Number);

    return total + (horas || 0) * 60 + (minutos || 0);
  }, 0);

  const horas = Math.floor(totalMinutos / 60);
  const minutos = totalMinutos % 60;

  return `${horas.toString().padStart(2, "0")}:${minutos
    .toString()
    .padStart(2, "0")}`;
}

export default function Registros() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [bolsistas, setBolsistas] = useState<Bolsista[]>([]);
  const [busca, setBusca] = useState("");
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [pastasAbertas, setPastasAbertas] = useState<Record<string, boolean>>({});
  const [filtrosPastas, setFiltrosPastas] = useState<Record<string, FiltrosPasta>>({});

  async function carregarRegistros() {
    try {
      const response = await api.get("/supervisor/registros");
      setRegistros(response.data);
    } catch {
      toast.error("Erro ao carregar registros");
    }
  }

  async function carregarBolsistas() {
    try {
      const response = await api.get("/supervisor/bolsistas");
      setBolsistas(response.data);
    } catch {
      toast.error("Erro ao carregar bolsistas");
    }
  }

  async function atualizarDados() {
    await Promise.all([
      carregarBolsistas(),
      carregarRegistros()
    ]);
  }

  useEffect(() => {
    atualizarDados();
  }, []);

  const registrosFiltrados = useMemo(() => {
    return registros.filter((registro) => {
      const termo = busca.toLowerCase();
      const partesData = registro.data.split("/");

      const matchBusca =
        busca === "" ||
        registro.nome.toLowerCase().includes(termo) ||
        registro.email.toLowerCase().includes(termo);

      const matchMes =
        mes === "" ||
        partesData[1] === mes;

      const matchAno =
        ano === "" ||
        partesData[2] === ano;

      return matchBusca && matchMes && matchAno;
    });
  }, [registros, busca, mes, ano]);

  const pastasBolsistas = useMemo<PastaBolsista[]>(() => {
    const termo = busca.toLowerCase();

    const pastas = bolsistas
      .filter((bolsista) =>
        busca === "" ||
        bolsista.nome.toLowerCase().includes(termo) ||
        bolsista.email.toLowerCase().includes(termo)
      )
      .reduce<Record<string, PastaBolsista>>((acc, bolsista) => {
        acc[bolsista.email] = {
          chave: bolsista.email,
          nome: bolsista.nome,
          email: bolsista.email,
          registros: [],
          totalHoras: "00:00"
        };

        return acc;
      }, {});

    registrosFiltrados.forEach((registro) => {
      const chave = registro.email;

      if (!pastas[chave]) {
        pastas[chave] = {
          chave,
          nome: registro.nome,
          email: registro.email,
          registros: [],
          totalHoras: "00:00"
        };
      }

      pastas[chave].registros.push(registro);
    });

    return Object.values(pastas)
      .map((pasta) => ({
        ...pasta,
        totalHoras: somarHoras(pasta.registros)
      }))
      .sort((a, b) => a.nome.localeCompare(b.nome));
  }, [bolsistas, busca, registrosFiltrados]);

  function alternarPasta(chave: string) {
    setPastasAbertas((estadoAtual) => ({
      ...estadoAtual,
      [chave]: !estadoAtual[chave]
    }));
  }

  function atualizarFiltroPasta(
    chave: string,
    campo: keyof FiltrosPasta,
    valor: string
  ) {
    setFiltrosPastas((estadoAtual) => {
      const filtroAtual = estadoAtual[chave] || {
        data: "",
        dia: "",
        mes: ""
      };

      return {
        ...estadoAtual,
        [chave]: {
          ...filtroAtual,
          [campo]: valor
        }
      };
    });
  }

  function filtrarRegistrosDaPasta(pasta: PastaBolsista) {
    const filtros = filtrosPastas[pasta.chave] || {
      data: "",
      dia: "",
      mes: ""
    };

    return pasta.registros.filter((registro) => {
      const dataRegistro = dataBrParaDate(registro.data);
      const matchData =
        filtros.data === "" ||
        dataBrParaInput(registro.data) === filtros.data;
      const matchDia =
        filtros.dia === "" ||
        dataRegistro.getDay().toString() === filtros.dia;
      const matchMes =
        filtros.mes === "" ||
        registro.data.split("/")[1] === filtros.mes;

      return matchData && matchDia && matchMes;
    });
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <div className="page-heading">
          <div>
            <p className="page-kicker">
              Auditoria
            </p>
            <h1 className="page-title">
              Registros de ponto
            </h1>
            <p className="page-subtitle">
              Consulte entradas, saídas e horas registradas em pastas por bolsista.
            </p>
          </div>
        </div>

        <section className="panel mb-6">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-slate-900">
              Encontrar pasta
            </h2>
            <p className="text-sm text-slate-500">
              Use estes filtros para localizar bolsistas no histórico geral.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <div className="md:col-span-2">
              <label className="field-label">
                Buscar
              </label>
              <input
                type="text"
                placeholder="Nome ou email"
                className="field"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
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
                placeholder="Ex: 2026"
                className="field"
                value={ano}
                onChange={(e) => setAno(e.target.value)}
              />
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Pastas dos bolsistas
              </h2>
              <p className="text-sm text-slate-500">
                {pastasBolsistas.length} pasta(s) com {registrosFiltrados.length} registro(s).
              </p>
            </div>

            <button
              onClick={atualizarDados}
              className="secondary-button"
            >
              <GoSync aria-hidden="true" />
              Atualizar
            </button>
          </div>

          {pastasBolsistas.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
              <p className="font-bold text-slate-700">
                Nenhuma pasta encontrada.
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Ajuste os filtros acima ou atualize os registros.
              </p>
            </div>
          ) : (
            <div className="bolsista-folders">
              {pastasBolsistas.map((pasta) => {
                const aberta = Boolean(pastasAbertas[pasta.chave]);
                const filtros = filtrosPastas[pasta.chave] || {
                  data: "",
                  dia: "",
                  mes: ""
                };
                const registrosDaPasta = filtrarRegistrosDaPasta(pasta);

                return (
                  <article
                    key={pasta.chave}
                    className="folder-card"
                  >
                    <div className="folder-header">
                      <div className="folder-title-row">
                        <div className="folder-icon" aria-hidden="true">
                          {aberta ? <GoFileDirectoryFill /> : <GoFileDirectory />}
                        </div>
                        <div>
                          <h3 className="folder-title">
                            {pasta.nome}
                          </h3>
                          <p className="folder-subtitle">
                            {pasta.email}
                          </p>
                        </div>
                      </div>

                      <div className="folder-actions">
                        <span className="status-pill status-muted">
                          {pasta.registros.length} registro(s)
                        </span>
                        <span className="status-pill status-ok">
                          {formatarHorasMinutos(pasta.totalHoras)}
                        </span>
                        <button
                          type="button"
                          onClick={() => alternarPasta(pasta.chave)}
                          className="secondary-button"
                        >
                          {aberta ? (
                            <GoFileDirectoryFill aria-hidden="true" />
                          ) : (
                            <GoFileDirectory aria-hidden="true" />
                          )}
                          {aberta ? "Fechar" : "Abrir"}
                        </button>
                      </div>
                    </div>

                    {aberta && (
                      <div className="folder-body">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                          <div>
                            <label className="field-label">
                              Filtrar por data
                            </label>
                            <input
                              type="date"
                              className="field"
                              value={filtros.data}
                              onChange={(e) =>
                                atualizarFiltroPasta(
                                  pasta.chave,
                                  "data",
                                  e.target.value
                                )
                              }
                            />
                          </div>

                          <div>
                            <label className="field-label">
                              Filtrar por mês
                            </label>
                            <select
                              className="field"
                              value={filtros.mes}
                              onChange={(e) =>
                                atualizarFiltroPasta(
                                  pasta.chave,
                                  "mes",
                                  e.target.value
                                )
                              }
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
                              Filtrar por dia
                            </label>
                            <select
                              className="field"
                              value={filtros.dia}
                              onChange={(e) =>
                                atualizarFiltroPasta(
                                  pasta.chave,
                                  "dia",
                                  e.target.value
                                )
                              }
                            >
                              {diasSemana.map((dia) => (
                                <option
                                  key={dia.valor}
                                  value={dia.valor}
                                >
                                  {dia.label}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="flex items-end">
                            <button
                              type="button"
                              className="quiet-button w-full"
                              onClick={() =>
                                setFiltrosPastas((estadoAtual) => ({
                                  ...estadoAtual,
                                  [pasta.chave]: {
                                    data: "",
                                    dia: "",
                                    mes: ""
                                  }
                                }))
                              }
                            >
                              <GoXCircle aria-hidden="true" />
                              Limpar filtros
                            </button>
                          </div>
                        </div>

                        <div className="mt-5 overflow-auto">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Data</th>
                                <th>Entrada</th>
                                <th>Saida</th>
                                <th>Horas trabalhadas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {registrosDaPasta.length === 0 ? (
                                <tr>
                                  <td colSpan={4}>
                                    Nenhum registro nesta pasta para os filtros selecionados.
                                  </td>
                                </tr>
                              ) : (
                                registrosDaPasta.map((registro, index) => (
                                  <tr key={`${registro.email}-${registro.data}-${index}`}>
                                    <td className="font-bold">{registro.data}</td>
                                    <td>{registro.entrada ? formatarHorasMinutos(registro.entrada) : "-"}</td>
                                    <td>{registro.saida ? formatarHorasMinutos(registro.saida) : "-"}</td>
                                    <td>{formatarHorasMinutos(registro.tempoTrabalhado)}</td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
