import axios from "axios";
import {
  useEffect,
  useState
} from "react";
import toast from "react-hot-toast";
import {
  GoCheckCircle,
  GoKey,
  GoPencil,
  GoPerson
} from "react-icons/go";

import Sidebar from "../components/Sidebar";
import SidebarBolsista from "../components/SidebarBolsista";
import api from "../services/api";

interface Perfil {
  nome: string;
  email: string;
  tipoUsuario: string;
  unidade: string;
  cursoFaculdade: string;
  cargaHorariaSemanal: number | null;
}

function mensagemErro(
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

export default function PerfilBolsista() {
  const tipoUsuarioLocal = localStorage.getItem("tipoUsuario");
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacaoSenha, setConfirmacaoSenha] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [salvandoSenha, setSalvandoSenha] = useState(false);

  const tipoUsuario = perfil?.tipoUsuario || tipoUsuarioLocal || "";
  const isBolsista = tipoUsuario === "Bolsista";

  async function carregarPerfil() {
    try {
      const response = await api.get("/auth/perfil");

      setPerfil(response.data);
      setNome(response.data.nome);
      setEmail(response.data.email);
    } catch (error) {
      toast.error(
        mensagemErro(
          error,
          "Erro ao carregar perfil"
        )
      );
    }
  }

  async function salvarPerfil(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setSalvandoPerfil(true);

    try {
      const response = await api.put("/auth/perfil", {
        nome,
        email
      });

      localStorage.setItem("nome", response.data.nome);

      setPerfil((perfilAtual) =>
        perfilAtual
          ? {
              ...perfilAtual,
              nome: response.data.nome,
              email: response.data.email
            }
          : perfilAtual
      );

      toast.success("Perfil atualizado");
    } catch (error) {
      toast.error(
        mensagemErro(
          error,
          "Erro ao atualizar perfil"
        )
      );
    } finally {
      setSalvandoPerfil(false);
    }
  }

  async function alterarSenha(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (novaSenha !== confirmacaoSenha) {
      toast.error("A confirmação não confere com a nova senha");
      return;
    }

    setSalvandoSenha(true);

    try {
      await api.put("/auth/alterar-senha", {
        senhaAtual,
        novaSenha
      });

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacaoSenha("");

      toast.success("Senha alterada com sucesso");
    } catch (error) {
      toast.error(
        mensagemErro(
          error,
          "Erro ao alterar senha"
        )
      );
    } finally {
      setSalvandoSenha(false);
    }
  }

  useEffect(() => {
    carregarPerfil();
  }, []);

  return (
    <div className="app-shell">
      {isBolsista ? <SidebarBolsista /> : <Sidebar />}

      <main className="app-main">
        <div className="page-heading">
          <div>
            <p className="page-kicker">
              Perfil
            </p>
            <h1 className="page-title">
              Dados da Conta
            </h1>
            <p className="page-subtitle">
              Mantenha seus dados de acesso atualizados.
            </p>
          </div>

          <span className="status-pill status-muted">
            <GoPerson aria-hidden="true" />
            {tipoUsuario || "Usuario"}
          </span>
        </div>

        <section className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Nome
            </p>
            <strong className="mt-3 block text-xl text-slate-900">
              {perfil?.nome || "-"}
            </strong>
          </div>

          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Email
            </p>
            <strong className="mt-3 block break-all text-xl text-slate-900">
              {perfil?.email || "-"}
            </strong>
          </div>

          <div className="metric-card">
            <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
              Acesso
            </p>
            <strong className="mt-3 block text-xl text-teal-800">
              {tipoUsuario || "-"}
            </strong>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <section className="panel">
            <h2 className="text-2xl font-bold text-slate-900">
              Informações pessoais
            </h2>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              Estes dados aparecem na identificação do usuario.
            </p>

            <form onSubmit={salvarPerfil}>
              <label className="field-label">
                Nome
              </label>
              <input
                type="text"
                className="field mb-4"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />

              <label className="field-label">
                Email
              </label>
              <input
                type="email"
                autoComplete="username"
                className="field mb-6"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <button
                disabled={salvandoPerfil}
                className="primary-button w-full"
              >
                <GoPencil aria-hidden="true" />
                {salvandoPerfil ? "Salvando..." : "Salvar dados"}
              </button>
            </form>
          </section>

          <section className="panel">
            <h2 className="text-2xl font-bold text-slate-900">
              Segurança
            </h2>
            <p className="mb-6 mt-1 text-sm text-slate-500">
              Atualize sua senha periodicamente.
            </p>

            <form onSubmit={alterarSenha}>
              <label className="field-label">
                Senha Atual
              </label>
              <input
                type="password"
                autoComplete="current-password"
                className="field mb-4"
                value={senhaAtual}
                onChange={(e) => setSenhaAtual(e.target.value)}
              />

              <label className="field-label">
                Nova Senha
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="field mb-4"
                value={novaSenha}
                onChange={(e) => setNovaSenha(e.target.value)}
              />

              <label className="field-label">
                Confirmar nova senha
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="field mb-6"
                value={confirmacaoSenha}
                onChange={(e) => setConfirmacaoSenha(e.target.value)}
              />

              <button
                disabled={salvandoSenha}
                className="secondary-button w-full"
              >
                <GoKey aria-hidden="true" />
                {salvandoSenha ? "Alterando..." : "Alterar senha"}
              </button>
            </form>
          </section>
        </div>

        {isBolsista && (
          <section className="panel mt-6">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Dados Acadêmicos
                </h2>
                <p className="text-sm text-slate-500">
                  Informações usadas nos relatórios individuais de ponto.
                </p>
              </div>

              <span className="status-pill status-muted">
                <GoCheckCircle aria-hidden="true" />
                Definido no Cadastro
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="field-label">
                  Curso
                </label>
                <input
                  disabled
                  className="field"
                  value={perfil?.cursoFaculdade || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="field-label">
                  Unidade/Orgão
                </label>
                <input
                  disabled
                  className="field"
                  value={perfil?.unidade || ""}
                  readOnly
                />
              </div>

              <div>
                <label className="field-label">
                  Carga horária semanal
                </label>
                <input
                  disabled
                  className="field"
                  value={
                    perfil?.cargaHorariaSemanal
                      ? `${perfil.cargaHorariaSemanal}h`
                      : ""
                  }
                  readOnly
                />
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
