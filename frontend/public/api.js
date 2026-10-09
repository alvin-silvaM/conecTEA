// Chamadas relativas: o server.js encaminha /escolas para o backend.
async function request(path, body) {
  let res;
  try {
    res = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
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

export const cadastrarEscola = (payload) => request('/escolas/cadastro', payload);
export const loginEscola = (payload) => request('/escolas', payload);

export async function verificarBackend() {
  // Não existe rota de health; um POST vazio em /escolas responde 400 se o backend estiver no ar.
  const r = await request('/escolas', {});
  return r.status === 400;
}
