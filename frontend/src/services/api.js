import axios from 'axios';

// Camada de acesso à API. Nenhum componente chama o Axios diretamente, tudo passa por aqui.
const BASE = import.meta.env.VITE_API_BASE ?? '/api';

// O token fica em sessionStorage pra cada aba ter a própria sessão.
const TOKEN_KEY = 'conectea_token';
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  constructor(status, message, erros = []) {
    super(message);
    this.status = status;
    this.erros = erros;
  }
}

const http = axios.create({
  baseURL: BASE,
  timeout: 15000,
});

http.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

http.interceptors.response.use(
  (resposta) => resposta,
  (erro) => {
    if (erro.response) {
      const { status, data } = erro.response;
      const message =
        data?.message || (status >= 500 ? 'Servidor indisponível. Tente novamente.' : 'Erro inesperado.');
      throw new ApiError(status, message, data?.erros || []);
    }
    if (erro.code === 'ECONNABORTED') {
      throw new ApiError(0, 'O servidor demorou para responder. Tente novamente.');
    }
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.');
  },
);

async function request(method, url, { body, auth = true } = {}) {
  const resposta = await http.request({ method, url, data: body, skipAuth: !auth });
  return resposta.data ?? {};
}

// Funções da escola
export const cadastrarEscola = (dados) => request('POST', '/escolas/cadastro', { body: dados, auth: false });
export const loginEscola = (dados) => request('POST', '/escolas', { body: dados, auth: false });
export const buscarMinhaEscola = () => request('GET', '/escolas/eu').then((d) => d.escola);
export const atualizarMinhaEscola = (dados) => request('PATCH', '/escolas/eu', { body: dados }).then((d) => d.escola);

// Funções dos cuidadores
export const listarCuidadores = () => request('GET', '/cuidadores').then((d) => d.cuidadores);
export const criarCuidador = (dados) => request('POST', '/cuidadores', { body: dados }).then((d) => d.cuidador);

// Funções dos alunos
export const listarAlunos = () => request('GET', '/alunos').then((d) => d.alunos);
export const criarAluno = (dados) => request('POST', '/alunos', { body: dados }).then((d) => d.aluno);
export const atualizarAluno = (id, dados) => request('PATCH', `/alunos/${id}`, { body: dados }).then((d) => d.aluno);