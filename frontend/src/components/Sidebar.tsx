import logo from "../assets/prefeitura-logo.png";
import { Link, useNavigate } from "react-router-dom";

export default function Sidebar() {

  const navigate = useNavigate();

  function logout() {

    localStorage.removeItem("token");

    navigate("/");
  }

  return (
    <aside className="w-72 bg-blue-800 text-white min-h-screen p-6">

      <div className="mb-10 flex flex-col items-center">

 <div className="bg-white rounded-2xl p-4 mb-6 shadow">

  <img
    src={logo}
    alt="Prefeitura"
    className="w-44 mx-auto"
  />

</div>

  <h1 className="text-xl font-bold text-center">
    Sistema de Ponto
  </h1>

</div>

      <nav className="flex flex-col gap-4">

        <Link
  to="/dashboard"
  className="hover:bg-blue-600 p-3 rounded-lg"
>
  Página Inicial
</Link>

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

        <Link
  to="/admin-usuarios"
  className="hover:bg-blue-600 p-3 rounded-lg"
>
  Usuários
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