import { Link, useNavigate } from "react-router-dom";

export default function Sidebar() {

  const navigate = useNavigate();

  function logout() {

    localStorage.removeItem("token");

    navigate("/");
  }

  return (
    <aside className="w-64 bg-blue-700 text-white min-h-screen p-6">

      <h1 className="text-2xl font-bold mb-10">
        Sistema Ponto
      </h1>

      <nav className="flex flex-col gap-4">

<Link
  to="/registros"
  className="hover:bg-blue-600 p-3 rounded-lg"
>
  Registros
</Link>

        <Link
          to="/relatorios"
          className="hover:bg-blue-600 p-3 rounded-lg"
        >
          Relatórios
        </Link>

        <button
          onClick={logout}
          className="bg-white text-blue-700 p-3 rounded-lg mt-8"
        >
          Sair
        </button>

      </nav>

    </aside>
  );
}