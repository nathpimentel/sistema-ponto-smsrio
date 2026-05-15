import {
  useEffect,
  useState
} from "react";

import SidebarBolsista
from "../components/SidebarBolsista";

import api from "../services/api";

interface Registro {
  data: string;
  entrada: string;
  saida: string;
  horas: string;
}

interface Resumo {
  totalHoras: string;
  totalRegistros: number;
  trabalhandoAgora: boolean;
}

export default function DashboardBolsista() {

  const nome =
    localStorage.getItem("nome");

  const [registros, setRegistros] =
    useState<Registro[]>([]);

  const [resumo, setResumo] =
    useState<Resumo>({
      totalHoras: "00:00",
      totalRegistros: 0,
      trabalhandoAgora: false
    });

  async function baterEntrada() {

    try {

      await api.post(
        "/ponto/entrada",
        {},
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      alert("Entrada registrada");

      carregarHistorico();

      carregarResumo();

    } catch {

      alert("Erro ao registrar entrada");
    }
  }

  async function baterSaida() {

    try {

      await api.post(
        "/ponto/saida",
        {},
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      alert("Saída registrada");

      carregarHistorico();

      carregarResumo();

    } catch {

      alert("Erro ao registrar saída");
    }
  }

  async function carregarHistorico() {

    try {

      const response = await api.get(
        "/ponto/meus-registros",
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setRegistros(response.data);

    } catch {

      alert("Erro ao carregar histórico");
    }
  }

  async function carregarResumo() {

    try {

      const response = await api.get(
        "/ponto/resumo",
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setResumo(response.data);

    } catch {

      alert("Erro ao carregar resumo");
    }
  }

  useEffect(() => {

    carregarHistorico();

    carregarResumo();

  }, []);

  return (
    <div className="flex bg-gray-100 min-h-screen">

      <SidebarBolsista />

      <main className="flex-1 p-8">

        <h1 className="text-3xl font-bold mb-8">
          Bem-vindo, {nome}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">

          <div className="bg-white rounded-2xl shadow p-6">

            <h2 className="text-xl font-bold">
              Total Horas
            </h2>

            <p className="text-4xl mt-4">
              {resumo.totalHoras}
            </p>

          </div>

          <div className="bg-white rounded-2xl shadow p-6">

            <h2 className="text-xl font-bold">
              Registros
            </h2>

            <p className="text-4xl mt-4">
              {resumo.totalRegistros}
            </p>

          </div>

          <div className="bg-white rounded-2xl shadow p-6">

            <h2 className="text-xl font-bold">
              Status
            </h2>

            <p className="text-xl mt-4">

              {
                resumo.trabalhandoAgora
                  ? "Trabalhando"
                  : "Fora do expediente"
              }

            </p>

          </div>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <div className="bg-white rounded-2xl shadow p-6">

            <h2 className="text-2xl font-bold mb-4">
              Entrada
            </h2>

            <button
              onClick={baterEntrada}
              className="bg-green-600 text-white px-6 py-3 rounded-lg"
            >
              Bater Entrada
            </button>

          </div>

          <div className="bg-white rounded-2xl shadow p-6">

            <h2 className="text-2xl font-bold mb-4">
              Saída
            </h2>

            <button
              onClick={baterSaida}
              className="bg-red-600 text-white px-6 py-3 rounded-lg"
            >
              Bater Saída
            </button>

          </div>

        </div>

        <div className="bg-white rounded-2xl shadow p-6 mt-8">

          <h2 className="text-2xl font-bold mb-4">
            Meu Histórico
          </h2>

          <table className="w-full">

            <thead>

              <tr className="border-b">

                <th className="text-left p-3">
                  Data
                </th>

                <th className="text-left p-3">
                  Entrada
                </th>

                <th className="text-left p-3">
                  Saída
                </th>

                <th className="text-left p-3">
                  Horas
                </th>

              </tr>

            </thead>

            <tbody>

              {
                registros.map((registro, index) => (

                  <tr
                    key={index}
                    className="border-b"
                  >

                    <td className="p-3">
                      {registro.data}
                    </td>

                    <td className="p-3">
                      {registro.entrada}
                    </td>

                    <td className="p-3">
                      {registro.saida}
                    </td>

                    <td className="p-3">
                      {registro.horas}
                    </td>

                  </tr>
                ))
              }

            </tbody>

          </table>

        </div>

      </main>

    </div>
  );
}