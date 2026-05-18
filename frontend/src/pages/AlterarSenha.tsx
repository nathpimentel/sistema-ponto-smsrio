import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { GoKey } from "react-icons/go";
import { useNavigate } from "react-router-dom";

import Sidebar from "../components/Sidebar";
import SidebarBolsista from "../components/SidebarBolsista";
import api from "../services/api";

export default function AlterarSenha() {
  const navigate = useNavigate();
  const tipoUsuario = localStorage.getItem("tipoUsuario");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function alterarSenha(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (!senhaAtual || !novaSenha || !confirmacao) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (novaSenha !== confirmacao) {
      toast.error("A confirmação nao confere com a nova senha");
      return;
    }

    setSalvando(true);

    try {
      await api.put("/auth/alterar-senha", {
        senhaAtual,
        novaSenha
      });

      setSenhaAtual("");
      setNovaSenha("");
      setConfirmacao("");
      localStorage.clear();

      toast.success("Senha alterada. Entre novamente com a nova senha");
      navigate("/");
    } catch (error) {
      const mensagem =
        axios.isAxiosError(error) &&
        typeof error.response?.data === "string"
          ? error.response.data
          : "Erro ao alterar senha";

      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="app-shell">
      {tipoUsuario === "Bolsista"
        ? <SidebarBolsista />
        : <Sidebar />}

      <main className="app-main">
        <div className="page-heading">
          <div>
            <p className="page-kicker">
              Segurança
            </p>
            <h1 className="page-title">
              Alterar senha
            </h1>
            <p className="page-subtitle">
              Use uma senha nova e exclusiva para este sistema.
            </p>
          </div>
        </div>

        <form
          onSubmit={alterarSenha}
          className="panel w-full max-w-xl"
        >
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
            className="field mb-2"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
          />

          <p className="mb-4 text-sm text-slate-500">
            Mínimo de 8 caracteres, 1 numero e 1 caractere especial.
          </p>

          <label className="field-label">
            Confirmar nova senha
          </label>
          <input
            type="password"
            autoComplete="new-password"
            className="field mb-6"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
          />

          <button
            disabled={salvando}
            className="primary-button w-full"
          >
            <GoKey aria-hidden="true" />
            {salvando ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
      </main>
    </div>
  );
}
