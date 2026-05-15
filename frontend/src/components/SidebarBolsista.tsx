import { useNavigate } from "react-router-dom";

export default function SidebarBolsista() {

  const navigate = useNavigate();

  function logout() {

    localStorage.clear();

    navigate("/");
  }

  return (
    <aside className="w-64 bg-green-700 text-white min-h-screen p-6">

      <h1 className="text-2xl font-bold mb-10">
        Área Bolsista
      </h1>

      <nav className="flex flex-col gap-4">

        <button
          className="text-left hover:bg-green-600 p-3 rounded-lg"
        >
          Meu Painel
        </button>

        <button
          onClick={logout}
          className="bg-white text-green-700 p-3 rounded-lg mt-8"
        >
          Sair
        </button>

      </nav>

    </aside>
  );
}