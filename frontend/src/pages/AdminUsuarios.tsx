import {
  useEffect,
  useMemo,
  useState
} from "react";
import toast from "react-hot-toast";
import {
  GoBlocked,
  GoCheckCircle,
  GoClock,
  GoFilter,
  GoPeople,
  GoPerson,
  GoPersonAdd,
  GoSearch,
  GoShieldCheck,
  GoSync,
  GoTrash,
  GoXCircle
} from "react-icons/go";
import { Link } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import api from "../services/api";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: string;
  aprovado: boolean;
  unidade: string;
  cursoFaculdade?: string;
  cargaHorariaSemanal?: number | null;
  fotoBase64?: string | null;
}

const TAMANHO_PAGINA = 25;

export default function AdminUsuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [filtroTipo, setFiltroTipo] = useState("todos");
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return usuarios
      .filter((usuario) =>
        (
          !termo ||
          usuario.nome.toLowerCase().includes(termo) ||
          usuario.email.toLowerCase().includes(termo) ||
          usuario.tipoUsuario.toLowerCase().includes(termo) ||
          (usuario.unidade || "").toLowerCase().includes(termo)
        ) &&
        (
          filtroStatus === "todos" ||
          (filtroStatus === "ativos" && usuario.aprovado) ||
          (filtroStatus === "pendentes" && !usuario.aprovado)
        ) &&
        (
          filtroTipo === "todos" ||
          usuario.tipoUsuario === filtroTipo
        )
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }));
  }, [usuarios, busca, filtroStatus, filtroTipo]);

  const pendentes = usuarios.filter((usuario) => !usuario.aprovado).length;
  const ativos = usuarios.filter((usuario) => usuario.aprovado).length;
  const bolsistas = usuarios.filter((usuario) => usuario.tipoUsuario === "Bolsista").length;
  const supervisores = usuarios.filter((usuario) => usuario.tipoUsuario === "Supervisor").length;

  async function carregarUsuarios(paginaAtual = 1) {
    try {
      const response = await api.get(
        `/supervisor/usuarios?pagina=${paginaAtual}&tamanhoPagina=${TAMANHO_PAGINA}`
      );
      setUsuarios(response.data.items);
      setPagina(response.data.pagina);
      setTotalPaginas(response.data.totalPaginas);
      setTotalItems(response.data.totalItems);
    } catch {
      toast.error("Erro ao carregar usuários");
    }
  }

  async function aprovarUsuario(id: number) {
    try {
      await api.put(`/supervisor/aprovar/${id}`, {});
      toast.success("Usuário Aprovado");
      carregarUsuarios(pagina);
    } catch {
      toast.error("Erro ao aprovar usuário");
    }
  }

  async function desativarUsuario(id: number) {
    try {
      await api.put(`/supervisor/desativar/${id}`, {});
      toast.success("Usuário Desativado");
      carregarUsuarios(pagina);
    } catch {
      toast.error("Erro ao desativar usuário");
    }
  }

  async function excluirUsuario(id: number) {
    try {
      await api.delete(`/supervisor/excluir/${id}`);
      toast.success("Usuário Excluído");
      setModalExcluir(false);
      setUsuarioSelecionado(null);
      carregarUsuarios();
    } catch {
      toast.error("Erro ao excluir usuário");
    }
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  return (
    <div className="app-shell">
      <Sidebar />

      <main className="app-main">
        <div className="page-heading">
          <div>
            <p className="page-kicker">
              Gestão de acesso
            </p>
            <h1 className="page-title">
              Usuários
            </h1>
            <p className="page-subtitle">
              Aprove cadastros, acompanhe perfis e mantenha a base organizada.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/register"
              className="primary-button"
            >
              <GoPersonAdd aria-hidden="true" />
              Novo usuário
            </Link>

            <button
              onClick={() => carregarUsuarios(pagina)}
              className="secondary-button"
            >
              <GoSync aria-hidden="true" />
              Atualizar Lista
            </button>
          </div>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="metric-card admin-metric-card">
            <span className="admin-stat-icon">
              <GoPeople aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Total de Usuários
              </p>
              <strong className="mt-2 block text-4xl text-slate-900">
                {usuarios.length}
              </strong>
            </div>
          </div>

          <div className="metric-card admin-metric-card">
            <span className="admin-stat-icon admin-stat-icon-ok">
              <GoCheckCircle aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Ativos
              </p>
              <strong className="mt-2 block text-4xl text-emerald-700">
                {ativos}
              </strong>
            </div>
          </div>

          <div className="metric-card admin-metric-card">
            <span className="admin-stat-icon admin-stat-icon-warn">
              <GoClock aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Pendentes
              </p>
              <strong className="mt-2 block text-4xl text-amber-700">
                {pendentes}
              </strong>
            </div>
          </div>

          <div className="metric-card admin-metric-card">
            <span className="admin-stat-icon admin-stat-icon-info">
              <GoShieldCheck aria-hidden="true" />
            </span>
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Supervisores
              </p>
              <strong className="mt-2 block text-4xl text-teal-800">
                {supervisores}
              </strong>
              <p className="mt-1 text-sm text-slate-500">
                {bolsistas} bolsista(s)
              </p>
            </div>
          </div>
        </section>

        <section className="panel mb-6">
          <div className="mb-4 flex items-center gap-2">
            <GoFilter
              aria-hidden="true"
              className="text-teal-700"
            />
            <h2 className="text-xl font-bold text-slate-900">
              Filtros Administrativos
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.5fr_0.75fr_0.75fr]">
            <div>
              <label className="field-label">
                Buscar Usuário
              </label>
              <div className="relative">
                <GoSearch
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Nome, email, tipo ou unidade"
                  className="field pl-10"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="field-label">
                Status
              </label>
              <select
                className="field"
                value={filtroStatus}
                onChange={(e) => setFiltroStatus(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="ativos">Ativos</option>
                <option value="pendentes">Pendentes</option>
              </select>
            </div>

            <div>
              <label className="field-label">
                Tipo
              </label>
              <select
                className="field"
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
              >
                <option value="todos">Todos</option>
                <option value="Bolsista">Bolsistas</option>
                <option value="Supervisor">Supervisores</option>
              </select>
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Lista de Usuários
              </h2>
              <p className="text-sm text-slate-500">
                {usuariosFiltrados.length} usuário(s) nesta página · {totalItems} no total
              </p>
            </div>

            <span className="status-pill status-muted">
              <GoPeople aria-hidden="true" />
              página {pagina} de {totalPaginas}
            </span>
          </div>

          <div className="overflow-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Perfil</th>
                  <th>Unidade</th>
                  <th>Dados Acadêmicos</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  usuariosFiltrados.map((usuario) => (
                    <tr key={usuario.id}>
                      <td>
                        <div className="user-cell">
                          <span className="user-avatar">
                            {usuario.fotoBase64 ? (
                              <img
                                src={usuario.fotoBase64}
                                alt={usuario.nome}
                                className="user-avatar-img"
                              />
                            ) : (
                              usuario.nome.charAt(0).toUpperCase()
                            )}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-900">
                              {usuario.nome}
                            </p>
                            <p className="break-all text-sm text-slate-500">
                              {usuario.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="status-pill status-muted">
                          {usuario.tipoUsuario === "Supervisor" ? (
                            <GoShieldCheck aria-hidden="true" />
                          ) : (
                            <GoPerson aria-hidden="true" />
                          )}
                          {usuario.tipoUsuario}
                        </span>
                      </td>
                      <td>{usuario.unidade || "Sem unidade"}</td>
                      <td>
                        {usuario.tipoUsuario === "Bolsista" ? (
                          <div className="text-sm text-slate-600">
                            <p>{usuario.cursoFaculdade || "Curso não informado"}</p>
                            <p className="font-bold text-slate-700">
                              {usuario.cargaHorariaSemanal
                                ? `${usuario.cargaHorariaSemanal}h semanais`
                                : "Carga não informada"}
                            </p>
                          </div>
                        ) : (
                          <span className="text-sm text-slate-500">
                            Acesso Administrativo
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${usuario.aprovado ? "status-ok" : "status-warn"}`}>
                          {usuario.aprovado ? (
                            <GoCheckCircle aria-hidden="true" />
                          ) : (
                            <GoXCircle aria-hidden="true" />
                          )}
                          {usuario.aprovado ? "Ativo" : "Pendente"}
                        </span>
                      </td>
                      <td>
                        <div className="flex flex-wrap gap-2">
                          {!usuario.aprovado && (
                            <button
                              onClick={() => aprovarUsuario(usuario.id)}
                              className="quiet-button min-h-0 px-3 py-2 text-sm"
                            >
                              <GoCheckCircle aria-hidden="true" />
                              Aprovar
                            </button>
                          )}

                          {usuario.aprovado && (
                            <button
                              onClick={() => desativarUsuario(usuario.id)}
                              className="secondary-button min-h-0 px-3 py-2 text-sm"
                            >
                              <GoBlocked aria-hidden="true" />
                              Desativar
                            </button>
                          )}

                          <button
                            onClick={() => {
                              setUsuarioSelecionado(usuario);
                              setModalExcluir(true);
                            }}
                            className="danger-button min-h-0 px-3 py-2 text-sm"
                          >
                            <GoTrash aria-hidden="true" />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {totalPaginas > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                className="secondary-button min-h-0 px-3 py-2 text-sm"
                disabled={pagina <= 1}
                onClick={() => carregarUsuarios(pagina - 1)}
              >
                ← Anterior
              </button>
              <span className="text-sm text-slate-600">
                {pagina} / {totalPaginas}
              </span>
              <button
                className="secondary-button min-h-0 px-3 py-2 text-sm"
                disabled={pagina >= totalPaginas}
                onClick={() => carregarUsuarios(pagina + 1)}
              >
                Próxima →
              </button>
            </div>
          )}
        </section>
      </main>

      {modalExcluir && usuarioSelecionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
          <div className="panel w-full max-w-md">
            <h2 className="text-2xl font-bold text-slate-900">
              Confirmar exclusão
            </h2>

            <p className="mt-3 text-slate-600">
              Deseja excluir permanentemente o usuário {usuarioSelecionado.nome}?
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setModalExcluir(false)}
                className="secondary-button"
              >
                <GoXCircle aria-hidden="true" />
                Cancelar
              </button>

              <button
                onClick={() => excluirUsuario(usuarioSelecionado.id)}
                className="danger-button"
              >
                <GoTrash aria-hidden="true" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
