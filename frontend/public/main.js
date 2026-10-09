import { cadastrarEscola, loginEscola, verificarBackend } from '/api.js';

const $ = (s) => document.querySelector(s);

function mostrar(el, r) {
  el.className = 'resultado ' + (r.ok ? 'ok' : 'erro');
  el.textContent = `HTTP ${r.status || '—'}\n` + JSON.stringify(r.data, null, 2);
}

async function atualizarStatus() {
  const badge = $('#status');
  const online = await verificarBackend();
  badge.textContent = online ? 'backend online' : 'backend offline';
  badge.className = 'badge ' + (online ? 'on' : 'off');
}

function atualizarToken() {
  $('#token-box').hidden = !localStorage.getItem('conectea_token');
}

// Preenche o cadastro com dados aleatórios (CNPJ, razão social e email são únicos no backend)
$('#btn-preencher').addEventListener('click', () => {
  const n = (t) => Array.from({ length: t }, () => Math.floor(Math.random() * 10)).join('');
  const sufixo = n(4);
  const cnpj = n(14);
  const form = $('#form-cadastro');
  const set = (nome, valor) => { form.elements[nome].value = valor; };

  set('cnpj', cnpj);
  set('razaoSocial', 'Escola Teste ' + sufixo);
  set('rua', 'Rua das Flores');
  set('numero', 100);
  set('municipio', 'Fortaleza');
  set('estado', 'CE');
  set('telefone1', '85999990000');
  set('telefone2', '8533330000');
  set('email', `escola${sufixo}@teste.com`);
  set('senha', '123456');
  form.elements['ativo'].checked = true;

  // Já deixa o login pronto com os mesmos dados
  const login = $('#form-login');
  login.elements['cnpj'].value = cnpj;
  login.elements['senha'].value = '123456';
});

$('#form-cadastro').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const payload = {
    cnpj: f.get('cnpj'),
    razaoSocial: f.get('razaoSocial'),
    endereco: {
      numero: Number(f.get('numero')),
      rua: f.get('rua'),
      municipio: f.get('municipio'),
      estado: f.get('estado'),
    },
    telefone1: f.get('telefone1'),
    email: f.get('email'),
    senha: f.get('senha'),
    ativo: f.get('ativo') === 'on',
  };
  const tel2 = f.get('telefone2');
  if (tel2) payload.telefone2 = tel2;

  const r = await cadastrarEscola(payload);
  mostrar($('#res-cadastro'), r);
  atualizarStatus();
});

$('#form-login').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  const r = await loginEscola({ cnpj: f.get('cnpj'), senha: f.get('senha') });
  if (r.ok && r.data.token) localStorage.setItem('conectea_token', r.data.token);
  mostrar($('#res-login'), r);
  atualizarToken();
  atualizarStatus();
});

$('#btn-logout').addEventListener('click', () => {
  localStorage.removeItem('conectea_token');
  atualizarToken();
});

atualizarStatus();
atualizarToken();