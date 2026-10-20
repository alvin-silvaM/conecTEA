// Chamadas relativas: o server.js encaminha /escolas, /cuidadores, /alunos e /health para o backend.

// O token fica em sessionStorage: cada aba tem a sua própria sessão. Assim dá para testar
// "escola" numa aba e "cuidador" noutra sem que uma derrube a outra (com localStorage as abas dividem o token).
const TOKEN_KEY = 'conectea_token';
export const getToken = () => sessionStorage.getItem(TOKEN_KEY);
export const setToken = (token) => sessionStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => sessionStorage.removeItem(TOKEN_KEY);

// Só para decidir qual tela mostrar. Quem decide o acesso de verdade é o backend.
export function tipoDoToken() {
  try {
    const token = getToken();
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload.tipo || null;
  } catch {
    return null;
  }
}

async function request(method, path, body, autenticado = false) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (autenticado) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, data: { message: 'Não foi possível conectar ao backend. Verifique se ele está rodando.' } };
  }

  const text = await res.text();
  let data;
  try { data = text ? JSON.parse(text) : {}; } catch { data = { message: text }; }

  // O server.js devolve 502 sem corpo JSON quando o backend está fora do ar.
  if (res.status >= 500 && !data.message) {
    data = { message: 'Backend indisponível ou retornou erro interno.' };
  }
  return { ok: res.ok, status: res.status, data };
}

// Escola
export const cadastrarEscola = (payload) => request('POST', '/escolas/cadastro', payload);
export const loginEscola = (payload) => request('POST', '/escolas', payload);

// Cuidador
export const loginCuidador = (payload) => request('POST', '/cuidadores/login', payload);
export const meusDados = () => request('GET', '/cuidadores/eu', undefined, true);
export const listarCuidadores = () => request('GET', '/cuidadores', undefined, true);
export const criarCuidador = (payload) => request('POST', '/cuidadores', payload, true);
export const removerCuidador = (id) => request('DELETE', `/cuidadores/${id}`, undefined, true);

// Aluno
export const listarAlunos = () => request('GET', '/alunos', undefined, true);
export const criarAluno = (payload) => request('POST', '/alunos', payload, true);
export const removerAluno = (id) => request('DELETE', `/alunos/${id}`, undefined, true);

export async function verificarBackend() {
  const r = await request('GET', '/health');
  return r.ok;
}
