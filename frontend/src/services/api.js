import axios from 'axios';

// Camada de acesso à API. Nenhum componente chama o Axios diretamente: tudo passa por aqui.
// As rotas usam o prefixo /api: o Vite (dev) e o Nginx (produção) removem esse prefixo
// antes de encaminhar ao backend. O prefixo evita conflito com as rotas do React
// (/alunos e /cuidadores existem nos dois lados).
const BASE = import.meta.env.VITE_API_BASE ?? '/api';

// O token fica em sessionStorage: cada aba tem a própria sessão.
const TOKEN_KEY = 'conectea_token';
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

// Erro padrão da API: { message, erros?: [{ campo, mensagem }] }
// Os componentes só conhecem esta classe, nunca o erro do Axios.
export class ApiError extends Error {
  constructor(status, message, erros = []) {
    super(message);
    this.status = status;
    this.erros = erros;
  }
}

// Instância configurada: baseURL e timeout valem para todas as requisições.
// O Axios converte o corpo para JSON, define o Content-Type e converte a resposta de JSON sozinho.
const http = axios.create({
  baseURL: BASE,
  timeout: 15000,
});

// Interceptor de requisição: anexa o token antes de cada envio.
// Rotas públicas (login e cadastro) passam `skipAuth: true` para não enviar o token.
http.interceptors.request.use((config) => {
  const token = getToken();
  if (token && !config.skipAuth) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta: o Axios rejeita qualquer status fora de 2xx.
// Aqui convertemos o erro do Axios no ApiError, mantendo o formato que as telas já usam.
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

// Mesma assinatura da versão com fetch, então as funções exportadas abaixo não mudam.
async function request(method, url, { body, auth = true } = {}) {
  const resposta = await http.request({ method, url, data: body, skipAuth: !auth });
  return resposta.data ?? {};
}

// Escola
export const cadastrarEscola = (dados) => request('POST', '/escolas/cadastro', { body: dados, auth: false });
export const loginEscola = (dados) => request('POST', '/escolas', { body: dados, auth: false });
export const buscarMinhaEscola = () => request('GET', '/escolas/eu').then((d) => d.escola);
export const atualizarMinhaEscola = (dados) => request('PATCH', '/escolas/eu', { body: dados }).then((d) => d.escola);

// Cuidadores
export const listarCuidadores = () => request('GET', '/cuidadores').then((d) => d.cuidadores);
export const buscarCuidador = (id) => request('GET', `/cuidadores/${id}`).then((d) => d.cuidador);
export const criarCuidador = (dados) => request('POST', '/cuidadores', { body: dados }).then((d) => d.cuidador);
export const atualizarCuidador = (id, dados) => request('PATCH', `/cuidadores/${id}`, { body: dados }).then((d) => d.cuidador);
export const excluirCuidador = (id) => request('DELETE', `/cuidadores/${id}`);

// Alunos
export const listarAlunos = () => request('GET', '/alunos').then((d) => d.alunos);
export const buscarAluno = (id) => request('GET', `/alunos/${id}`).then((d) => d.aluno);
export const criarAluno = (dados) => request('POST', '/alunos', { body: dados }).then((d) => d.aluno);
export const atualizarAluno = (id, dados) => request('PATCH', `/alunos/${id}`, { body: dados }).then((d) => d.aluno);
export const excluirAluno = (id) => request('DELETE', `/alunos/${id}`);

// Cuidador (perfil logado)
export const loginCuidador = (dados) => request('POST', '/cuidadores/login', { body: dados, auth: false });
export const buscarMeuCuidador = () => request('GET', '/cuidadores/eu').then((d) => d.cuidador);
export const atualizarMeusDados = (dados) => request('PATCH', '/cuidadores/eu', { body: dados }).then((d) => d.cuidador);
export const buscarInicioCuidador = () => request('GET', '/cuidadores/eu/inicio'); // { indicadores, alunosFixados }
export const buscarPainelAlunos = () => request('GET', '/alunos/painel'); // { vinculados, demais }
export const fixarAluno = (id) => request('PUT', `/alunos/${id}/fixar`);
export const desafixarAluno = (id) => request('DELETE', `/alunos/${id}/fixar`);

// Aluno (perfil logado)
export const loginAluno = (dados) => request('POST', '/alunos/login', { body: dados, auth: false });
export const buscarMeuAluno = () => request('GET', '/alunos/eu').then((d) => d.aluno);

// Voz (TTS). O backend gera o WAV, guarda no Storage e reaproveita quando frase + voz se repetem.
export const listarVozes = () => request('GET', '/tts/vozes').then((d) => d.vozes);
export const gerarAudio = (dados) => request('POST', '/tts/audios', { body: dados }).then((d) => d.audio); // { _id, texto, voz, ... }
// Baixa o arquivo WAV (rota autenticada, por isso não dá para usar o id direto em <audio src>).
export const baixarAudio = (id) =>
  http.get(`/tts/audios/${id}/arquivo`, { responseType: 'blob', timeout: 30000 }).then((r) => r.data);
