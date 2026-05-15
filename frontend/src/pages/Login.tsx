import { useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";

export default function Login() {

  const navigate = useNavigate();

  const [email, setEmail] = useState<string>("");

  const [senha, setSenha] = useState<string>("");

  async function fazerLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    try {
      const response = await api.post("/auth/login", {
        email,
        senha: senha
      });

      localStorage.setItem(
        "token",
        response.data.token
      );

      navigate("/dashboard");
    }
    catch {
      alert("Erro ao fazer login");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <form
        onSubmit={fazerLogin}
        className="bg-white p-8 rounded-2xl shadow-md w-full max-w-md"
      >
        <h1 className="text-2xl font-bold mb-6 text-center">
          Login Supervisor
        </h1>

        <input
          type="email"
          placeholder="E-mail"
          className="w-full border p-3 rounded-lg mb-4"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Senha"
          className="w-full border p-3 rounded-lg mb-4"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button
          className="w-full bg-blue-600 text-white p-3 rounded-lg"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}