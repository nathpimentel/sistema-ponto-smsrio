import axios from "axios";
import {
  useEffect,
  useState
} from "react";
import toast from "react-hot-toast";
import {
  GoArrowLeft,
  GoCheckCircle,
  GoEye,
  GoEyeClosed,
  GoKey,
  GoXCircle
} from "react-icons/go";
import {
  Link,
  useNavigate,
  useSearchParams
} from "react-router-dom";

import edificio from "../assets/sms-edificio.jpg";
import logo from "../assets/prefeitura-logo.png";
import api from "../services/api";

export default function PrimeiroAcesso() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenRecebido = searchParams.get("token") ?? "";

  const [token, setToken] = useState(tokenRecebido);
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [validandoToken, setValidandoToken] = useState(false);
  const [tokenValidado, setTokenValidado] = useState(false);
  const [erroToken, setErroToken] = useState("");

  const forcaSenha = verificarForcaSenha(novaSenha);
  const requisitosSenha = obterRequisitosSenha(novaSenha);
  const senhaCumpreRequisitos = requisitosSenha.every((requisito) => requisito.ok);
  const tokenVeioDoLink = Boolean(tokenRecebido);
  const senhaBloqueada = !tokenValidado;
  const senhasNaoCoincidem =
    confirmarSenha.length > 0 && novaSenha !== confirmarSenha;

  useEffect(() => {
    if (!tokenRecebido) return;
    const controller = new AbortController();
    validarToken(tokenRecebido, false);
    return () => controller.abort();
  }, [tokenRecebido]);

  async function definirSenha(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!token.trim()) {
      toast.error("Informe o token de primeiro acesso");
      return;
    }

    if (!senhaAtendeRequisitos(novaSenha)) {
      toast.error("A senha não atende os requisitos mínimos");
      return;
    }

    if (novaSenha !== confirmarSenha) {
      toast.error("As senhas não conferem");
      return;
    }

    setSalvando(true);

    try {
      await api.post("/auth/primeiro-acesso/definir-senha", {
        token: token.trim(),
        novaSenha
      });

      toast.success("Senha definida com sucesso");
      navigate("/");
    } catch (error) {
      if (axios.isAxiosError(error) && error.request && !error.response) {
        toast.error("Nao foi possivel conectar ao servidor. Verifique se o backend esta rodando.");
        return;
      }

      const mensagem =
        axios.isAxiosError(error) && typeof error.response?.data === "string"
          ? error.response.data
          : "Não foi possível definir a senha";
      toast.error(mensagem);
    } finally {
      setSalvando(false);
    }
  }

  function atualizarToken(valor: string) {
    setToken(valor);
    setTokenValidado(false);
    setErroToken("");
    setNovaSenha("");
    setConfirmarSenha("");
  }

  async function validarToken(valor = token, mostrarSucesso = true) {
    const tokenLimpo = valor.trim();

    setTokenValidado(false);
    setErroToken("");
    setNovaSenha("");
    setConfirmarSenha("");

    if (!tokenLimpo) {
      setErroToken("Informe o token de primeiro acesso");
      return;
    }

    if (!/^[a-f0-9]{64}$/i.test(tokenLimpo)) {
      setErroToken("Token incompleto ou em formato inválido");
      return;
    }

    setValidandoToken(true);

    try {
      await api.get("/auth/primeiro-acesso/validar-token", {
        params: { token: tokenLimpo }
      });

      setToken(tokenLimpo);
      setTokenValidado(true);

      if (mostrarSucesso) {
        toast.success("Convite validado");
      }
    } catch (error) {
      const mensagem =
        axios.isAxiosError(error) && typeof error.response?.data === "string"
          ? error.response.data
          : "Não foi possível validar o convite";

      setErroToken(mensagem);
      toast.error(mensagem);
    } finally {
      setValidandoToken(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card-container">

        <section className="auth-visual" style={{ backgroundImage: `url(${edificio})` }}>
          <div className="auth-visual-badge">
            <img src={logo} alt="Prefeitura do Rio · Saúde" className="h-16" />
          </div>

          <div className="auth-copy">
            <p className="auth-copy-kicker">Primeiro acesso · SMS-Rio</p>
            <h1>
              Acesso<br />
              criado com<br />
              segurança.
            </h1>
            <p>
              Defina sua senha pessoal a partir do convite enviado
              pelo administrador do sistema.
            </p>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-panel-inner">

            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <div className="auth-panel-eyebrow">
                  <span className="page-kicker" style={{ margin: 0 }}>
                    Primeiro Acesso
                  </span>
                </div>
                <h2 className="auth-panel-title">Defina sua senha</h2>
              </div>
              <Link
                to="/"
                className="secondary-button min-h-0 shrink-0 px-3 py-2 text-sm"
              >
                <GoArrowLeft aria-hidden="true" />
                Voltar
              </Link>
            </div>

            <p className="auth-panel-subtitle">
              Crie sua senha definitiva para acessar o sistema.
            </p>

            <form onSubmit={definirSenha}>
              <div className="grid grid-cols-1 gap-4">
                {tokenVeioDoLink ? (
                  <div
                    className={`rounded-lg border p-3 text-sm font-bold ${
                      tokenValidado
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                        : erroToken
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-slate-200 bg-slate-50 text-slate-600"
                    }`}
                  >
                    {validandoToken && "Validando convite..."}
                    {!validandoToken && tokenValidado && "Convite validado pelo link de primeiro acesso."}
                    {!validandoToken && erroToken && erroToken}
                  </div>
                ) : (
                  <div>
                    <label className="field-label">Token de acesso</label>
                    <div className="flex gap-2">
                      <input
                        type="password"
                        autoComplete="one-time-code"
                        placeholder="Cole o token recebido"
                        className="field"
                        value={token}
                        onChange={(e) => atualizarToken(e.target.value)}
                      />
                      <button
                        type="button"
                        disabled={validandoToken || !token.trim()}
                        onClick={() => validarToken()}
                        className="secondary-button min-h-0 shrink-0 px-3 py-2 text-sm"
                      >
                        {validandoToken ? "Validando..." : "Validar"}
                      </button>
                    </div>
                    {tokenValidado && (
                      <p className="mt-2 flex items-center gap-2 text-xs font-bold text-emerald-700">
                        <GoCheckCircle aria-hidden="true" />
                        Convite validado. Crie sua senha.
                      </p>
                    )}
                    {erroToken && (
                      <p className="mt-2 flex items-center gap-2 text-xs font-bold text-red-600">
                        <GoXCircle aria-hidden="true" />
                        {erroToken}
                      </p>
                    )}
                  </div>
                )}

                <div>
                  <label className="field-label">Nova senha</label>
                  <div className="relative">
                    <input
                      type={mostrarSenha ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Mínimo 8 caracteres"
                      className="field pr-24"
                      disabled={senhaBloqueada}
                      value={novaSenha}
                      onChange={(e) => setNovaSenha(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={senhaBloqueada}
                      onClick={() => setMostrarSenha(!mostrarSenha)}
                      className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-sm font-bold text-slate-600 hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent"
                    >
                      {mostrarSenha ? <GoEyeClosed aria-hidden="true" /> : <GoEye aria-hidden="true" />}
                      {mostrarSenha ? "Ocultar" : "Mostrar"}
                    </button>
                  </div>

                  {senhaBloqueada && !tokenVeioDoLink && (
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Informe o token de acesso para liberar a criação da senha.
                    </p>
                  )}

                  {novaSenha.length > 0 && (
                    <div className="mt-2 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                        <div
                          className={`h-full transition-all duration-500 ${senhaCumpreRequisitos ? forcaSenha.cor : "bg-red-500"}`}
                          style={{ width: forcaSenha.largura }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                        {senhaCumpreRequisitos ? forcaSenha.texto : "Requisitos pendentes"}
                      </span>
                    </div>
                  )}

                  {novaSenha.length > 0 && (
                    <ul className="mt-3 grid grid-cols-1 gap-1.5 rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs font-semibold">
                      {requisitosSenha.map((requisito) => (
                        <li
                          key={requisito.texto}
                          className={`flex items-center gap-2 transition-colors ${
                            requisito.ok ? "text-emerald-700" : "text-red-600"
                          }`}
                        >
                          {requisito.ok ? (
                            <GoCheckCircle
                              aria-hidden="true"
                              className="shrink-0 text-emerald-600"
                            />
                          ) : (
                            <GoXCircle
                              aria-hidden="true"
                              className="shrink-0 text-red-600"
                            />
                          )}
                          {requisito.texto}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <label className="field-label">Confirmar senha</label>
                  <input
                    type={mostrarSenha ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repita a nova senha"
                    className={`field ${senhasNaoCoincidem ? "border-red-400 focus:border-red-500 focus:ring-red-200" : ""}`}
                    disabled={senhaBloqueada}
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                  />
                  {senhasNaoCoincidem && (
                    <p className="mt-2 flex items-center gap-2 text-xs font-bold text-red-600">
                      <GoXCircle aria-hidden="true" />
                      As senhas não coincidem
                    </p>
                  )}
                </div>
              </div>

              <button
                disabled={salvando || senhaBloqueada || senhasNaoCoincidem}
                className="primary-button mt-6 w-full"
              >
                <GoKey aria-hidden="true" />
                {salvando ? "Salvando..." : "Salvar senha"}
              </button>
            </form>

          </div>
        </section>

      </div>
    </div>
  );
}

function senhaAtendeRequisitos(senha: string) {
  return obterRequisitosSenha(senha).every((requisito) => requisito.ok);
}

function obterRequisitosSenha(senha: string) {
  return [
    { texto: "Mínimo 8 caracteres", ok: senha.length >= 8 },
    { texto: "Uma letra minúscula", ok: /[a-z]/.test(senha) },
    { texto: "Uma letra maiúscula", ok: /[A-Z]/.test(senha) },
    { texto: "Um número", ok: /\d/.test(senha) },
    { texto: "Um caractere especial", ok: /[!@#$%^&*(),.?":{}|<>]/.test(senha) }
  ];
}

function verificarForcaSenha(senha: string) {
  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (/[a-z]/.test(senha)) pontos++;
  if (/[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(senha)) pontos++;
  if (senha.length >= 12) pontos++;

  if (pontos <= 2) return { texto: "Senha fraca", cor: "bg-red-500", largura: "30%" };
  if (pontos <= 4) return { texto: "Senha média", cor: "bg-amber-500", largura: "65%" };
  return { texto: "Senha forte", cor: "bg-emerald-500", largura: "100%" };
}
