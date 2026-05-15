import Sidebar from "../components/Sidebar";

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

      const response = await api.get(
        "/supervisor/bolsistas",
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setBolsistas(response.data);

    } catch {

      alert("Erro ao carregar bolsistas");
    }
  }

  async function carregarAtivos() {

    try {

      const response = await api.get(
        "/supervisor/ativos",
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (Array.isArray(response.data)) {

        setAtivos(response.data);
      }

    } catch {

      alert("Erro ao carregar ativos");
    }
  }

  useEffect(() => {

    carregarBolsistas();

    carregarAtivos();

  }, []);

  return (
    <div className="flex bg-gray-100 min-h-screen">

      <Sidebar />

      <main className="flex-1 p-8">

        <h1 className="text-3xl font-bold mb-8">
          Dashboard Supervisor
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">

          <div className="bg-white p-6 rounded-2xl shadow">

            <h2 className="text-xl font-semibold">
              Total de Bolsistas
            </h2>

            <p className="text-4xl mt-4 font-bold">
              {bolsistas.length}
            </p>

          </div>

          <div className="bg-white p-6 rounded-2xl shadow">

            <h2 className="text-xl font-semibold">
              Bolsistas Ativos
            </h2>

            <p className="text-4xl mt-4 font-bold">
              {ativos.length}
            </p>

          </div>

        </div>

        <div className="bg-white p-6 rounded-2xl shadow">

          <h2 className="text-2xl font-bold mb-4">
            Trabalhando Agora
          </h2>

          {
            ativos.length === 0 ? (

              <p>
                Nenhum bolsista em trabalho no momento
              </p>

            ) : (

              <table className="w-full">

                <thead>

                  <tr className="border-b">

                    <th className="text-left p-2">
                      Nome
                    </th>

                    <th className="text-left p-2">
                      Entrada
                    </th>

                    <th className="text-left p-2">
                      Data
                    </th>

                  </tr>

                </thead>

                <tbody>

                  {
                    ativos.map((ativo, index) => (

                      <tr
                        key={index}
                        className="border-b"
                      >

                        <td className="p-2">
                          {ativo.nome}
                        </td>

                        <td className="p-2">
                          {ativo.entrada}
                        </td>

                        <td className="p-2">
                          {ativo.data}
                        </td>

                      </tr>
                    ))
                  }

                </tbody>

              </table>
            )
          }

        </div>

      </main>

    </div>
  );
}