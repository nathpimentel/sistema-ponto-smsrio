import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";

import api from "../services/api";

interface Registro {
  nome: string;
  email: string;
  data: string;
  entrada: string;
  saida: string;
  tempoTrabalhado: string;
}

export default function Registros() {

  const [registros, setRegistros] =
    useState<Registro[]>([]);

  const [busca, setBusca] =
    useState("");

  const [mes, setMes] =
    useState("");

  const [ano, setAno] =
    useState("");

  async function carregarRegistros() {

    try {

      const response = await api.get(
        "/supervisor/registros",
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setRegistros(response.data);

    } catch (error) {

      console.log(error);

      alert("Erro ao carregar registros");
    }
  }

  useEffect(() => {

    carregarRegistros();

  }, []);

  const registrosFiltrados =
    registros.filter((registro) => {

      const matchBusca =
        busca === "" ||

        registro.nome
          .toLowerCase()
          .includes(
            busca.toLowerCase()
          ) ||

        registro.email
          .toLowerCase()
          .includes(
            busca.toLowerCase()
          );

      const matchMes =
        mes === "" ||

        registro.data
          .split("/")[1] === mes;

      const matchAno =
        ano === "" ||

        registro.data
          .split("/")[2] === ano;

      return (
        matchBusca &&
        matchMes &&
        matchAno
      );
    });

  return (
    <div className="flex bg-gray-100 min-h-screen">

      <Sidebar />

      <main className="flex-1 p-8">

        <h1 className="text-3xl font-bold mb-8">
          Registros
        </h1>

        <div className="bg-white p-6 rounded-2xl shadow mb-6">

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <input
              type="text"
              placeholder="Nome ou email"
              className="border p-3 rounded-lg"
              value={busca}
              onChange={(e) =>
                setBusca(e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Mês"
              className="border p-3 rounded-lg"
              value={mes}
              onChange={(e) =>
                setMes(e.target.value)
              }
            />

            <input
              type="number"
              placeholder="Ano"
              className="border p-3 rounded-lg"
              value={ano}
              onChange={(e) =>
                setAno(e.target.value)
              }
            />

          </div>

        </div>

        <div className="bg-white rounded-2xl shadow overflow-auto">

          <table className="w-full">

            <thead className="bg-gray-200">

              <tr>

                <th className="text-left p-4">
                  Nome
                </th>

                <th className="text-left p-4">
                  Email
                </th>

                <th className="text-left p-4">
                  Data
                </th>

                <th className="text-left p-4">
                  Entrada
                </th>

                <th className="text-left p-4">
                  Saída
                </th>

                <th className="text-left p-4">
                  Horas
                </th>

              </tr>

            </thead>

            <tbody>

              {
                registrosFiltrados.map(
                  (registro, index) => (

                    <tr
                      key={index}
                      className="border-b hover:bg-gray-50"
                    >

                      <td className="p-4">
                        {registro.nome}
                      </td>

                      <td className="p-4">
                        {registro.email}
                      </td>

                      <td className="p-4">
                        {registro.data}
                      </td>

                      <td className="p-4">
                        {registro.entrada}
                      </td>

                      <td className="p-4">
                        {registro.saida}
                      </td>

                      <td className="p-4">
                        {registro.tempoTrabalhado}
                      </td>

                    </tr>
                  )
                )
              }

            </tbody>

          </table>

        </div>

      </main>

    </div>
  );
}