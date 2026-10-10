import * as api from '/api.js';

const $ = (s) => document.querySelector(s);
const aleatorio = (t) => Array.from({ length: t }, () => Math.floor(Math.random() * 10)).join('');

// Cada entrada ou saída de sessão aumenta este número. Toda requisição guarda o número de quando
// começou; se ao responder o número mudou, a resposta é de uma sessão antiga e é descartada.
// Sem isso, uma resposta lenta da sessão anterior sobrescrevia a tela da sessão atual.
let geracao = 0;

// Só para facilitar o teste: o último cuidador criado pela tela (a senha de teste fica só em memória)
let ultimoCuidadorTeste = null;

// ---------- Utilitários de tela ----------

function mostrar(el, r) {
  el.className = 'resultado ' + (r.ok ? 'ok' : 'erro');
  el.textContent = `HTTP ${r.status || '—'}\n` + JSON.stringify(r.data, null, 2);
}

function mostrarView(nome) {
  for (const v of document.querySelectorAll('.view')) v.hidden = v.dataset.view !== nome;
}

// Apaga TUDO que é dinâmico: listas, respostas, campos e opções. Chamada a cada troca de sessão,
// para nenhum dado da sessão anterior ficar na tela.
function limparTela() {
  for (const el of document.querySelectorAll('.resultado')) { el.textContent = ''; el.className = 'resultado'; }
  for (const ul of document.querySelectorAll('.lista')) ul.replaceChildren();
  for (const f of document.querySelectorAll('form')) f.reset();
  $('#form-aluno').elements['cuidador'].replaceChildren();
  $('#aviso').textContent = '';
}

function atualizarBarra(texto) {
  $('#sessao').hidden = !texto;
  $('#sessao').textContent = texto ? `logado como ${texto}` : '';
  $('#btn-logout').hidden = !texto;
}

function estado(ul, texto, classe = '') {
  const li = document.createElement('li');
  li.className = `estado ${classe}`.trim();
  li.textContent = texto; // textContent: nunca interpreta HTML vindo da API
  ul.replaceChildren(li);
}

function itemLista(texto, aoExcluir) {
  const li = document.createElement('li');
  const span = document.createElement('span');
  span.textContent = texto;
  li.appendChild(span);
  if (aoExcluir) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'excluir';
    b.textContent = 'Excluir';
    b.addEventListener('click', aoExcluir);
    li.appendChild(b);
  }
  return li;
}

function erroDaLista(ul, r) {
  estado(ul, `Não foi possível carregar (HTTP ${r.status || '—'}): ${r.data.message}`, 'erro');
}

// Diz se a resposta ainda vale. Se a sessão mudou, descarta. Se o token expirou, volta ao início.
function vigente(g, r) {
  if (g !== geracao) return false;
  if (r.status === 401) { sair('Sessão expirada ou inválida. Entre novamente.'); return false; }
  return true;
}

async function atualizarStatus() {
  const online = await api.verificarBackend();
  $('#status').textContent = online ? 'backend online' : 'backend offline';
  $('#status').className = 'badge ' + (online ? 'on' : 'off');
}

// ---------- Sessão ----------

function sair(aviso = '') {
  api.clearToken();
  geracao++;
  limparTela();
  mostrarView('visitante');
  atualizarBarra(null);
  $('#aviso').textContent = aviso;
  prepararLogins();
}

// Usada logo após o login e quando a página é recarregada com token guardado
function iniciarSessao() {
  const tipo = api.tipoDoToken();
  if (tipo !== 'escola' && tipo !== 'cuidador') return sair();

  geracao++;
  limparTela();
  mostrarView(tipo);
  atualizarBarra(tipo);
  carregar(tipo, geracao);
}

function carregar(tipo, g) {
  if (tipo === 'escola') return Promise.all([carregarCuidadores(g), carregarAlunos(g, 'escola')]);
  return Promise.all([carregarMeusDados(g), carregarAlunos(g, 'cuidador')]);
}

function prepararLogins() {
  const dica = $('#dica-cuidador');
  if (!ultimoCuidadorTeste) { dica.textContent = ''; return; }
  const login = $('#form-login-cuidador');
  login.elements['email'].value = ultimoCuidadorTeste.email;
  login.elements['senha'].value = ultimoCuidadorTeste.senha;
  dica.textContent = 'Campos preenchidos com o último cuidador criado nesta página.';
}

// ---------- Carregamento das listas ----------

async function carregarCuidadores(g) {
  const ul = $('#lista-cuidadores');
  estado(ul, 'Carregando…');
  const r = await api.listarCuidadores();
  if (!vigente(g, r)) return;
  if (!r.ok) { erroDaLista(ul, r); atualizarSelectCuidadores([]); return; }

  const cuidadores = r.data.cuidadores;
  if (!cuidadores.length) estado(ul, 'Nenhum cuidador cadastrado');
  else ul.replaceChildren(...cuidadores.map((c) => itemLista(`${c.nome} · ${c.email} · ${c.telefone}`, async () => {
    if (!confirm(`Excluir o cuidador ${c.nome}?`)) return;
    const resp = await api.removerCuidador(c._id);
    if (!vigente(g, resp)) return;
    mostrar($('#res-cuidador'), resp);
    carregarCuidadores(g);
  })));
  atualizarSelectCuidadores(cuidadores);
}

// Recria as opções mantendo o cuidador que estava escolhido, e avisa quando não há nenhum
function atualizarSelectCuidadores(cuidadores) {
  const select = $('#form-aluno').elements['cuidador'];
  const anterior = select.value;
  select.replaceChildren(...cuidadores.map((c) => {
    const o = document.createElement('option');
    o.value = c._id;
    o.textContent = c.nome;
    return o;
  }));
  if (cuidadores.some((c) => c._id === anterior)) select.value = anterior;

  const vazio = cuidadores.length === 0;
  select.disabled = vazio;
  $('#form-aluno').querySelector('button[type="submit"]').disabled = vazio;
  $('#aviso-sem-cuidador').hidden = !vazio;
}

async function carregarAlunos(g, tipo) {
  const ul = $(`#lista-alunos-${tipo}`);
  estado(ul, 'Carregando…');
  const r = await api.listarAlunos();
  if (!vigente(g, r)) return;
  if (!r.ok) { erroDaLista(ul, r); return; }

  const alunos = r.data.alunos;
  if (!alunos.length) {
    estado(ul, tipo === 'escola' ? 'Nenhum aluno cadastrado' : 'Nenhum aluno vinculado a você');
    return;
  }
  ul.replaceChildren(...alunos.map((a) => {
    const nasc = a.dataNascimento ? ` · nasc. ${a.dataNascimento.slice(0, 10)}` : '';
    const cuidador = tipo === 'escola' && a.cuidador ? ` · cuidador: ${a.cuidador.nome}` : '';
    const excluir = tipo === 'escola' ? async () => {
      if (!confirm(`Excluir o aluno ${a.nome}?`)) return;
      const resp = await api.removerAluno(a._id);
      if (!vigente(g, resp)) return;
      mostrar($('#res-aluno'), resp);
      carregarAlunos(g, 'escola');
    } : null;
    return itemLista(`${a.nome}${nasc}${cuidador}`, excluir);
  }));
}

async function carregarMeusDados(g) {
  const ul = $('#meus-dados');
  estado(ul, 'Carregando…');
  const r = await api.meusDados();
  if (!vigente(g, r)) return;
  if (!r.ok) { erroDaLista(ul, r); return; }

  const c = r.data.cuidador;
  ul.replaceChildren(
    itemLista(`Nome: ${c.nome}`),
    itemLista(`Email: ${c.email}`),
    itemLista(`Telefone: ${c.telefone}`),
  );
  atualizarBarra(`cuidador · ${c.nome}`);
}

// ---------- Visitante: cadastro e logins ----------

// Preenche o cadastro com dados aleatórios (CNPJ, razão social e email são únicos no backend)
$('#btn-preencher').addEventListener('click', () => {
  const sufixo = aleatorio(4);
  const cnpj = aleatorio(14);
  const senha = 'senha1234';
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
  set('senha', senha);

  // Já deixa o login da escola pronto com os mesmos dados
  const login = $('#form-login');
  login.elements['cnpj'].value = cnpj;
  login.elements['senha'].value = senha;
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
  };
  const tel2 = f.get('telefone2');
  if (tel2) payload.telefone2 = tel2;

  mostrar($('#res-cadastro'), await api.cadastrarEscola(payload));
});

// Login: bloqueia o botão enquanto espera (evita clique duplo, que gastaria o limite de tentativas)
async function fazerLogin(form, chamada, payload, saida) {
  const botao = form.querySelector('button[type="submit"]');
  botao.disabled = true;
  const r = await chamada(payload);
  botao.disabled = false;

  if (r.ok && r.data.token) {
    api.setToken(r.data.token);
    iniciarSessao();
    return;
  }
  mostrar(saida, r);
  atualizarStatus();
}

$('#form-login').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  fazerLogin(e.target, api.loginEscola, { cnpj: f.get('cnpj'), senha: f.get('senha') }, $('#res-login'));
});

$('#form-login-cuidador').addEventListener('submit', (e) => {
  e.preventDefault();
  const f = new FormData(e.target);
  fazerLogin(e.target, api.loginCuidador, { email: f.get('email'), senha: f.get('senha') }, $('#res-login-cuidador'));
});

$('#btn-logout').addEventListener('click', () => sair('Você saiu da sessão.'));

// ---------- Escola: cuidadores ----------

$('#btn-preencher-cuidador').addEventListener('click', () => {
  const sufixo = aleatorio(4);
  const form = $('#form-cuidador');
  form.elements['nome'].value = 'Cuidador Teste ' + sufixo;
  form.elements['telefone'].value = '85988880000';
  form.elements['email'].value = `cuidador${sufixo}@teste.com`;
  form.elements['senha'].value = 'senha1234';
});

$('#form-cuidador').addEventListener('submit', async (e) => {
  e.preventDefault();
  const g = geracao;
  const f = new FormData(e.target);
  const dados = {
    nome: f.get('nome'),
    telefone: f.get('telefone'),
    email: f.get('email'),
    senha: f.get('senha'),
  };
  const r = await api.criarCuidador(dados);
  if (!vigente(g, r)) return;

  mostrar($('#res-cuidador'), r);
  if (r.ok) {
    ultimoCuidadorTeste = { email: dados.email, senha: dados.senha };
    e.target.reset();
    carregarCuidadores(g);
  }
});

// ---------- Escola: alunos ----------

$('#form-aluno').addEventListener('submit', async (e) => {
  e.preventDefault();
  const g = geracao;
  const f = new FormData(e.target);
  const payload = { nome: f.get('nome'), cuidador: f.get('cuidador') };
  const nasc = f.get('dataNascimento');
  if (nasc) payload.dataNascimento = nasc;

  const r = await api.criarAluno(payload);
  if (!vigente(g, r)) return;

  mostrar($('#res-aluno'), r);
  if (r.ok) {
    const escolhido = f.get('cuidador');
    e.target.reset();
    e.target.elements['cuidador'].value = escolhido; // mantém o cuidador para cadastrar vários alunos seguidos
    carregarAlunos(g, 'escola');
  }
});

// ---------- Início ----------

atualizarStatus();
setInterval(atualizarStatus, 15000);
if (api.getToken()) iniciarSessao(); else sair();
