import toast from "react-hot-toast";

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

  const [mostrarSenha, setMostrarSenha] =
  useState(false);

  const [unidade, setUnidade] =
  useState("");

  

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

  toast.error(
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
    tipoUsuario,
    unidade
  }
);

      toast.success(
  "Cadastro enviado para aprovação"
);

      navigate("/");

    } catch {

      toast.error(
  "Erro ao registrar");
    }

    if (!unidade) {

  toast.error(
    "Selecione uma unidade"
  );

  return;
}
  }

  function verificarForcaSenha(
  senha: string
) {

  let pontos = 0;

  const temNumero =
    /\d/.test(senha);

  const temEspecial =
    /[!@#$%^&*(),.?":{}|<>]/.test(
      senha
    );

  const tamanho =
    senha.length >= 6;

  if (tamanho) pontos++;

  if (temNumero) pontos++;

  if (temEspecial) pontos++;

  if (senha.length >= 10) pontos++;

  if (pontos <= 1) {

    return {
      texto: "Senha fraca",
      cor: "bg-red-500",
      largura: "25%"
    };
  }

  if (pontos <= 3) {

    return {
      texto: "Senha média",
      cor: "bg-yellow-500",
      largura: "65%"
    };
  }

  return {
    texto: "Senha forte",
    cor: "bg-green-500",
    largura: "100%"
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

<div className="relative mb-2">

  <input
    type={
      mostrarSenha
        ? "text"
        : "password"
    }
    placeholder="Digite sua senha"
    className="w-full border p-3 rounded-lg pr-14"
    value={senha}
    onChange={(e) =>
      setSenha(e.target.value)
    }
  />

  <button
    type="button"
    onClick={() =>
      setMostrarSenha(!mostrarSenha)
    }
    className="absolute right-3 top-3 text-gray-500"
  >
    {
      mostrarSenha
        ? "🙈"
        : "👁"
    }
  </button>

</div>

        {
  senha.length > 0 && (

    <div className="mb-6">

      <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">

        <div
          className={`h-3 transition-all duration-500 ${forcaSenha.cor}`}
          style={{
            width: forcaSenha.largura
          }}
        />

      </div>

      <p className="text-sm mt-2 font-semibold text-gray-700">

        {forcaSenha.texto}

      </p>

      <div className="mt-3 space-y-2">

        <p
          className={`text-sm ${
            senha.length >= 6
              ? "text-green-600"
              : "text-gray-500"
          }`}
        >
          ✓ Mínimo de 6 caracteres
        </p>

        <p
          className={`text-sm ${
            /\d/.test(senha)
              ? "text-green-600"
              : "text-gray-500"
          }`}
        >
          ✓ Pelo menos 1 número
        </p>

        <p
          className={`text-sm ${
            /[!@#$%^&*(),.?":{}|<>]/.test(senha)
              ? "text-green-600"
              : "text-gray-500"
          }`}
        >
          ✓ Pelo menos 1 caractere especial
        </p>

      </div>

    </div>
  )
}

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

  <div className="mb-6">

  <p className="text-sm text-gray-600 mb-2">
    Unidade
  </p>

  <select
    className="w-full border p-3 rounded-lg"
    value={unidade}
    onChange={(e) =>
      setUnidade(e.target.value)
    }
  >

    <option value="">
      Selecione uma Unidade/Orgão
    </option>

    <option value="SMS-RIO">
      SMS-RIO
    </option>

    <option value="RH">
      RH
    </option>

    <option value="TI">
      TI
    </option>

    <option value="Administrativo">
      Administrativo
    </option>

  </select>

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