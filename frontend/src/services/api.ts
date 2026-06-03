import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5021",
  withCredentials: true // envia o cookie refresh_token automaticamente
});

// Injeta o access token em toda requisição
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Controle de renovação concorrente:
// Se múltiplas requisições falham com 401 ao mesmo tempo,
// apenas uma chama /auth/refresh — as demais aguardam na fila.
let renovando = false;
let filaDePendentes: Array<{
  resolver: (token: string) => void;
  rejeitar: (erro: unknown) => void;
}> = [];

function processarFila(erro: unknown, novoToken: string | null) {
  filaDePendentes.forEach(({ resolver, rejeitar }) => {
    if (erro) {
      rejeitar(erro);
    } else {
      resolver(novoToken!);
    }
  });
  filaDePendentes = [];
}

function limparSessao() {
  localStorage.removeItem("token");
  localStorage.removeItem("tipoUsuario");
  localStorage.removeItem("nome");
  window.location.href = "/";
}

// Interceptor de resposta: 401 → tenta renovar via refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const requisicaoOriginal = error.config;

    // Não tenta renovar se:
    // - não é 401
    // - já é uma tentativa de retry
    // - é o proprio endpoint de refresh (evita loop)
    if (
      !axios.isAxiosError(error) ||
      error.response?.status !== 401 ||
      requisicaoOriginal._retry ||
      requisicaoOriginal.url?.includes("/auth/refresh") ||
      requisicaoOriginal.url?.includes("/auth/login")
    ) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        limparSessao();
      }
      return Promise.reject(error);
    }

    // Já existe uma renovação em curso: enfileira e aguarda
    if (renovando) {
      return new Promise((resolver, rejeitar) => {
        filaDePendentes.push({ resolver, rejeitar });
      }).then((novoToken) => {
        requisicaoOriginal.headers.Authorization = `Bearer ${novoToken}`;
        return api(requisicaoOriginal);
      });
    }

    requisicaoOriginal._retry = true;
    renovando = true;

    try {
      const { data } = await api.post("/auth/refresh");

      const novoToken = data.token;
      localStorage.setItem("token", novoToken);
      localStorage.setItem("tipoUsuario", data.tipoUsuario);
      localStorage.setItem("nome", data.nome);

      api.defaults.headers.common["Authorization"] = `Bearer ${novoToken}`;
      processarFila(null, novoToken);

      requisicaoOriginal.headers.Authorization = `Bearer ${novoToken}`;
      return api(requisicaoOriginal);
    } catch (erroRenovacao) {
      processarFila(erroRenovacao, null);
      limparSessao();
      return Promise.reject(erroRenovacao);
    } finally {
      renovando = false;
    }
  }
);

export default api;
