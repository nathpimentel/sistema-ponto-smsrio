import { useEffect, useState } from "react";
import api from "../services/api";

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
  const [bolsistas, setBolsistas] = useState<Bolsista[]>([]);
  const [ativos, setAtivos] = useState<Ativo[]>([]);

  async function carregarBolsistas() {
    try {
      const response = await api.get("/supervisor/bolsistas");

      setBolsistas(response.data);
    } catch {
      alert("Erro ao carregar bolsistas");
    }
  }

  async function carregarAtivos() {
    try {
      const response = await api.get("/supervisor/ativos");

      if (Array.isArray(response.data)) {
        setAtivos(response.data);
      }
    } catch {
      console.log("Nenhum ativo");
    }
  }

  useEffect(() => {
    carregarBolsistas();
    carregarAtivos();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-8">
        Dashboard Supervisor
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Bolsistas Ativos
          </h2>

          {
            ativos.length === 0
              ? <p>Nenhum bolsista trabalhando</p>
              : ativos.map((ativo) => (
                <div
                  key={ativo.email}
                  className="border-b py-2"
                >
                  <p className="font-medium">
                    {ativo.nome}
                  </p>

                  <p className="text-sm text-gray-500">
                    Entrada: {ativo.entrada}
                  </p>
                </div>
              ))
          }
        </div>

        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            Total de Bolsistas
          </h2>

          <p className="text-5xl font-bold text-blue-600">
            {bolsistas.length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-xl font-semibold mb-4">
          Bolsistas
        </h2>

        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">
                Nome
              </th>

              <th className="text-left py-3">
                E-mail
              </th>
            </tr>
          </thead>

          <tbody>
            {bolsistas.map((bolsista) => (
              <tr
                key={bolsista.id}
                className="border-b"
              >
                <td className="py-3">
                  {bolsista.nome}
                </td>

                <td className="py-3">
                  {bolsista.email}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}