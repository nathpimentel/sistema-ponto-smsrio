import { useState } from "react";

import Sidebar from "../components/Sidebar";

import api from "../services/api";

export default function Relatorios() {

  const [busca, setBusca] = useState("");

  const [mes, setMes] = useState("");

  const [ano, setAno] = useState("");

  async function gerarRelatorio() {

    try {

      const response = await api.get(
        `/supervisor/relatorio-pdf?busca=${busca}&mes=${mes}&ano=${ano}`,
        {
          responseType: "blob",

          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      const url = window.URL.createObjectURL(
        new Blob([response.data])
      );

      const link = document.createElement("a");

      link.href = url;

      link.setAttribute(
        "download",
        "relatorio.pdf"
      );

      document.body.appendChild(link);

      link.click();

    } catch {

      alert("Erro ao gerar relatório");
    }
  }

  return (
    <div className="flex bg-gray-100 min-h-screen">

      <Sidebar />

      <main className="flex-1 p-8">

        <h1 className="text-3xl font-bold mb-8">
          Relatórios
        </h1>

        <div className="bg-white p-6 rounded-2xl shadow max-w-xl">

          <input
            type="text"
            placeholder="Nome ou email"
            className="w-full border p-3 rounded-lg mb-4"
            value={busca}
            onChange={(e) =>
              setBusca(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Mês"
            className="w-full border p-3 rounded-lg mb-4"
            value={mes}
            onChange={(e) =>
              setMes(e.target.value)
            }
          />

          <input
            type="number"
            placeholder="Ano"
            className="w-full border p-3 rounded-lg mb-6"
            value={ano}
            onChange={(e) =>
              setAno(e.target.value)
            }
          />

          <button
            onClick={gerarRelatorio}
            className="w-full bg-blue-600 text-white p-3 rounded-lg"
          >
            Gerar PDF
          </button>

        </div>

      </main>

    </div>
  );
}