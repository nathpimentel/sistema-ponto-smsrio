import {
  useEffect,
  useState
} from "react";

import toast from "react-hot-toast";

import Sidebar
from "../components/Sidebar";

import api from "../services/api";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: string;
  aprovado: boolean;
  unidade: string;
}

export default function AdminUsuarios() {

  const [usuarios, setUsuarios] =
    useState<Usuario[]>([]);

    const [modalExcluir, setModalExcluir] =
  useState(false);

const [usuarioSelecionado, setUsuarioSelecionado] =
  useState<number | null>(null);

  async function carregarUsuarios() {

    try {

      const response = await api.get(
        "/supervisor/usuarios",
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      setUsuarios(response.data);

    } catch {

      toast.error(
        "Erro ao carregar usuários"
      );
    }
  }

  async function aprovarUsuario(
    id: number
  ) {

    try {

      await api.put(
        `/supervisor/aprovar/${id}`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      toast.success(
        "Usuário aprovado"
      );

      carregarUsuarios();

    } catch (error) {

      console.log(error);

      toast.error(
        "Erro ao aprovar usuário"
      );
    }
  }

  async function desativarUsuario(
    id: number
  ) {

    try {

      await api.put(
        `/supervisor/desativar/${id}`,
        {},
        {
          headers: {
            Authorization:
              `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      toast.success(
        "Usuário desativado"
      );

      carregarUsuarios();

    } catch (error) {

      console.log(error);

      toast.error(
        "Erro ao desativar usuário"
      );
    }
  }

  async function excluirUsuario(
  id: number
) {

  try {

    await api.delete(
      `/supervisor/excluir/${id}`,
      {
        headers: {
          Authorization:
            `Bearer ${localStorage.getItem("token")}`
        }
      }
    );

    toast.success(
      "Usuário excluído"
    );

    carregarUsuarios();

  } catch (error) {

    console.log(error);

    toast.error(
      "Erro ao excluir usuário"
    );
  }
}

  useEffect(() => {

    carregarUsuarios();

  }, []);

  return (
    <div className="flex bg-gray-100 min-h-screen">

      <Sidebar />

      <main className="flex-1 p-8">

        <h1 className="text-3xl font-bold mb-8">
          Administração de Usuários
        </h1>

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
                  Tipo
                </th>

                <th className="text-left p-4">
                  Status
                </th>

                <th className="text-left p-4">
                  Ações
                </th>

              </tr>

            </thead>

            <tbody>

              {
                usuarios.map((usuario) => (

                  <tr
                    key={usuario.id}
                    className="border-b"
                  >

                    <td className="p-4">
                      {usuario.nome}
                    </td>

                    <td className="p-4">
                      {usuario.email}
                    </td>

                    <td className="p-4">
                      {usuario.tipoUsuario}
                    </td>

                    <td className="p-4">

                      {
                        usuario.aprovado ? (

                          <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">

                            Ativo

                          </span>

                        ) : (

                          <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-sm">

                            Pendente

                          </span>
                        )
                      }

                    </td>

                    <td className="p-4 flex gap-2">

                      <button
                        onClick={() =>
                          aprovarUsuario(
                            usuario.id
                          )
                        }
                        className="bg-green-600 text-white px-4 py-2 rounded-lg"
                      >
                        Aprovar
                      </button>

                      <button
                        onClick={() =>
                          desativarUsuario(
                            usuario.id
                          )
                        }
                        className="bg-red-600 text-white px-4 py-2 rounded-lg"
                      >
                        Desativar
                      </button>

                      <button
  onClick={() => {

  setUsuarioSelecionado(
    usuario.id
  );

  setModalExcluir(true);

}}
  className="bg-gray-800 text-white px-4 py-2 rounded-lg"
>
  Excluir
</button>

                    </td>

                  </tr>
                ))
              }

            </tbody>

          </table>

        </div>

      </main>
      {
  modalExcluir && (

    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">

      <div className="bg-white rounded-2xl p-8 w-full max-w-md">

        <h2 className="text-2xl font-bold mb-4">
          Confirmar exclusão
        </h2>

        <p className="text-gray-600 mb-6">

          Tem certeza que deseja excluir
          este usuário permanentemente?

        </p>

        <div className="flex justify-end gap-3">

          <button
            onClick={() =>
              setModalExcluir(false)
            }
            className="px-5 py-2 rounded-lg border"
          >
            Cancelar
          </button>

          <button
            onClick={() => {

              if (
                usuarioSelecionado
              ) {

                excluirUsuario(
                  usuarioSelecionado
                );
              }

            }}
            className="bg-red-600 text-white px-5 py-2 rounded-lg"
          >
            Excluir
          </button>

        </div>

      </div>

    </div>
  )
}

    </div>
  );
}