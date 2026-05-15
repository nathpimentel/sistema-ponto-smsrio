import { useState } from "react";

import { useNavigate } from "react-router-dom";

import api from "../services/api";

export default function Register() {

  const navigate = useNavigate();

  const [nome, setNome] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [tipoUsuario, setTipoUsuario] =
  useState("Bolsista");

  const forcaSenha =
  verificarForcaSenha(senha);

  

  async function registrar() {

    if (!nome || !email || !senha) {

      alert(
        "Preencha todos os campos"
      );

      return;
    }

    const temNumero =
  /\d/.test(senha);

const temEspecial =
  /[!@#$%^&*(),.?":{}|<>]/.test(
    senha
  );

if (
  senha.length < 6 ||
  !temNumero ||
  !temEspecial
) {

  alert(
    "A senha não atende os requisitos mínimos"
  );

  return;
}

    try {

      await api.post(
  "/auth/register",
  {
    nome,
    email,
    senhaHash: senha,
    tipoUsuario
  }
);

      alert(
        "Cadastro enviado para aprovação"
      );

      navigate("/");

    } catch {

      alert("Erro ao registrar");
    }
  }

  function verificarForcaSenha(
  senha: string
) {

  const temNumero =
    /\d/.test(senha);

  const temEspecial =
    /[!@#$%^&*(),.?":{}|<>]/.test(
      senha
    );

  const tamanho =
    senha.length >= 6;

  if (
    tamanho &&
    temNumero &&
    temEspecial &&
    senha.length >= 10
  ) {
    return {
      texto: "Senha forte",
      cor: "text-green-600"
    };
  }

  if (
    tamanho &&
    (temNumero || temEspecial)
  ) {
    return {
      texto: "Senha média",
      cor: "text-yellow-600"
    };
  }

  return {
    texto: "Senha fraca",
    cor: "text-red-600"
  };
}

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">

      <div className="bg-white p-8 rounded-2xl shadow w-full max-w-md">

        <h1 className="text-3xl font-bold mb-6">
          Cadastro
        </h1>

        <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 p-4 rounded-xl mb-6">

  Após o cadastro, sua conta ficará pendente
  até que um supervisor libere seu acesso
  ao sistema.

</div>
<p className="text-sm text-gray-600 mb-2">
  Nome completo
</p>
        <input
          type="text"
          placeholder="Digite seu nome"
          className="w-full border p-3 rounded-lg mb-4"
          value={nome}
          onChange={(e) =>
            setNome(e.target.value)
          }
        />

        <p className="text-sm text-gray-600 mb-2">
  Email
</p>

        <input
          type="email"
          placeholder="Digite seu email"
          className="w-full border p-3 rounded-lg mb-4"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
        />

        <p className="text-sm text-gray-600 mb-2">
  Senha
</p>

        <input
          type="password"
          placeholder="Digite sua senha"
          className="w-full border p-3 rounded-lg mb-6"
          value={senha}
          onChange={(e) =>
            setSenha(e.target.value)
          }
        />

        <div className="mb-4">

  <p className={`text-sm font-semibold ${forcaSenha.cor}`}>

    {forcaSenha.texto}

  </p>

  <ul className="text-sm text-gray-600 mt-2 list-disc pl-5">

    <li>
      Mínimo de 6 caracteres
    </li>

    <li>
      Pelo menos 1 número
    </li>

    <li>
      Pelo menos 1 caractere especial
    </li>

  </ul>

</div>

<div className="mb-6">

  <p className="text-sm text-gray-600 mb-2">
    Escolha o tipo de acesso
  </p>

  <div className="flex gap-3">

    <button
      type="button"
      onClick={() =>
        setTipoUsuario("Bolsista")
      }
      className={`px-4 py-2 rounded-lg border transition
      ${
        tipoUsuario === "Bolsista"
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-300"
      }`}
    >
      Bolsista
    </button>

    <button
      type="button"
      onClick={() =>
        setTipoUsuario("Supervisor")
      }
      className={`px-4 py-2 rounded-lg border transition
      ${
        tipoUsuario === "Supervisor"
          ? "bg-blue-600 text-white border-blue-600"
          : "bg-white text-gray-700 border-gray-300"
      }`}
    >
      Supervisor
    </button>

  </div>

</div>

        <button
          onClick={registrar}
          className="w-full bg-blue-600 text-white p-3 rounded-lg"
        >
          Criar Conta
        </button>

      </div>

    </div>
  );
}