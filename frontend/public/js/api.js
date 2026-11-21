// Camada de API: chamadas relativas (o server.js encaminha /escolas, /cuidadores, /alunos e /health
// ao back-end, então não há URL fixa nem CORS) e controle da sessão.

const CHAVE_TOKEN = "token";

// O token fica em sessionStorage: cada aba tem a própria sessão (dá para testar escola e cuidador
// lado a lado). Se o navegador bloquear o armazenamento, a sessão dura só enquanto a página estiver aberta.
let tokenEmMemoria = null;
const guardar = {
  ler: () => { try { return sessionStorage.getItem(CHAVE_TOKEN) ?? tokenEmMemoria; } catch { return tokenEmMemoria; } },
  gravar: (v) => { tokenEmMemoria = v; try { sessionStorage.setItem(CHAVE_TOKEN, v); } catch { /* ver acima */ } },
  apagar: () => { tokenEmMemoria = null; try { sessionStorage.removeItem(CHAVE_TOKEN); } catch { /* ver acima */ } }
};

export const sessao = {
  get token() { return guardar.ler(); },
  definir: (token) => guardar.gravar(token),
  limpar: () => guardar.apagar(),
  // Só decide qual tela mostrar. Quem autoriza de verdade é o back-end.
  tipo() {
    try {
      return JSON.parse(atob(this.token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).tipo ?? null;
    } catch {
      return null;
    }
  }
};

export class ApiErro extends Error {
  constructor(status, mensagem, erros = []) {
    super(mensagem);
    this.status = status;
    this.erros = erros;
  }
}

let aoExpirar = () => {};
export const aoSessaoExpirar = (fn) => { aoExpirar = fn; };

export async function api(metodo, caminho, corpo) {
  const cabecalhos = {};
  if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
  const token = sessao.token;
  if (token) cabecalhos.Authorization = `Bearer ${token}`;

  let resposta;
  try {
    resposta = await fetch(caminho, { method: metodo, headers: cabecalhos, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
  } catch {
    throw new ApiErro(0, "Não foi possível falar com o servidor. Verifique a conexão e se o back-end está rodando.");
  }

  const texto = await resposta.text();
  let dados = {};
  try { dados = texto ? JSON.parse(texto) : {}; } catch { dados = {}; }

  if (!resposta.ok) {
    if (resposta.status === 401 && token) aoExpirar("Sua sessão expirou. Entre novamente.");
    throw new ApiErro(resposta.status, dados.message || "Algo deu errado. Tente novamente.", dados.erros || []);
  }
  return dados;
}
