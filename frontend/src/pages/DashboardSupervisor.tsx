import {
  useEffect,
  useState
} from "react";

import toast from "react-hot-toast";

import Sidebar
from "../components/Sidebar";

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

  const [bolsistas, setBolsistas] =
    useState<Bolsista[]>([]);

  const [ativos, setAtivos] =
    useState<Ativo[]>([]);

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

      toast.error(
        "Erro ao carregar bolsistas"
      );
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

      } else {

        setAtivos([]);
      }

    } catch {

      toast.error(
        "Erro ao carregar ativos"
      );
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
    <div className="flex bg-gray-100 min-h-screen">

      <Sidebar />

      <main className="flex-1 p-8">

        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          Dashboard Supervisor
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">

            <h2 className="text-xl font-semibold text-gray-600">
              Bolsistas
            </h2>

            <p className="text-5xl font-bold mt-4 text-blue-600">
              {bolsistas.length}
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">

            <h2 className="text-xl font-semibold text-gray-600">
              Trabalhando Agora
            </h2>

            <p className="text-5xl font-bold mt-4 text-green-600">
              {ativos.length}
            </p>

          </div>

          <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">

            <h2 className="text-xl font-semibold text-gray-600">
              Status Sistema
            </h2>

            <p className="text-2xl font-bold mt-6 text-green-600">
              Online
            </p>

          </div>

        </div>

        <div className="bg-white rounded-3xl shadow-lg border border-gray-100 p-6">

          <div className="flex items-center justify-between mb-6">

            <h2 className="text-2xl font-bold text-gray-800">
              Bolsistas Ativos
            </h2>

            <span className="bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-semibold">
              Atualização automática
            </span>

          </div>

          {
            ativos.length === 0 ? (

              <div className="text-center py-10">

                <p className="text-gray-500 text-lg">
                  Nenhum bolsista em trabalho no momento
                </p>

              </div>

            ) : (

              <div className="overflow-auto">

                <table className="w-full">

                  <thead>

                    <tr className="border-b text-gray-600">

                      <th className="text-left p-4">
                        Nome
                      </th>

                      <th className="text-left p-4">
                        Email
                      </th>

                      <th className="text-left p-4">
                        Entrada
                      </th>

                      <th className="text-left p-4">
                        Data
                      </th>

                      <th className="text-left p-4">
                        Status
                      </th>

                    </tr>

                  </thead>

                  <tbody>

                    {
                      ativos.map((ativo, index) => (

                        <tr
                          key={index}
                          className="border-b hover:bg-gray-50 transition"
                        >

                          <td className="p-4 font-medium">
                            {ativo.nome}
                          </td>

                          <td className="p-4 text-gray-600">
                            {ativo.email}
                          </td>

                          <td className="p-4">
                            {ativo.entrada}
                          </td>

                          <td className="p-4">
                            {ativo.data}
                          </td>

                          <td className="p-4">

                            <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">

                              Ativo

                            </span>

                          </td>

                        </tr>
                      ))
                    }

                  </tbody>

                </table>

              </div>
            )
          }

        </div>

      </main>

    </div>
  );
}