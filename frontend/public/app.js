// conecTEA — ponto de entrada: sessão, rotas (hash) e estrutura da tela (menu lateral / barra inferior).
// Cada tela vive em js/: alunos, cuidadores, escola, painel, comunicador, auth.
import { api, ApiErro, aoSessaoExpirar, sessao } from "./js/api.js";
import { $, $$, avatar, avisar, esc, falha, icone, marca } from "./js/ui.js";
import { telaEntrada } from "./js/auth.js";
import { verInicio } from "./js/painel.js";
import { verAlunos, verAluno, verAlunoForm } from "./js/alunos.js";
import { verCuidadores, verCuidador, verCuidadorForm } from "./js/cuidadores.js";
import { verEscola, verEscolaEditar, verPerfil } from "./js/escola.js";
import { verComunicador } from "./js/comunicador.js";

const estado = { tipo: null, quem: null, casca: false, navegacao: 0 };

/* ---------- Rotas ---------- */
// Ordem importa: "/alunos/novo" precisa vir antes de "/alunos/:id".
// "perfis" espelha o back-end (quem pode ver o quê); quem não pode volta para a tela inicial do seu perfil.
// O aluno tem login próprio e só enxerga o comunicador.
const rota = (re, perfis, nav, titulo, ver, extra = {}) => ({ re, perfis, nav, titulo, ver, ...extra });
const ROTAS = [
  rota(/^\/inicio$/, ["escola"], "inicio", "Início", verInicio),
  rota(/^\/alunos$/, ["escola", "cuidador"], "alunos", "Alunos", verAlunos),
  rota(/^\/alunos\/novo$/, ["escola"], "alunos", "Novo aluno", verAlunoForm),
  rota(/^\/alunos\/([^/]+)\/editar$/, ["escola"], "alunos", "Editar aluno", verAlunoForm),
  rota(/^\/alunos\/(?!novo$)([^/]+)$/, ["escola", "cuidador"], "alunos", "Aluno", verAluno),
  rota(/^\/cuidadores$/, ["escola"], "cuidadores", "Cuidadores", verCuidadores),
  rota(/^\/cuidadores\/novo$/, ["escola"], "cuidadores", "Novo cuidador", verCuidadorForm),
  rota(/^\/cuidadores\/([^/]+)\/editar$/, ["escola"], "cuidadores", "Editar cuidador", verCuidadorForm),
  rota(/^\/cuidadores\/([^/]+)$/, ["escola"], "cuidadores", "Cuidador", verCuidador),
  rota(/^\/escola$/, ["escola"], "escola", "Minha escola", verEscola),
  rota(/^\/escola\/editar$/, ["escola"], "escola", "Editar escola", verEscolaEditar),
  rota(/^\/perfil$/, ["cuidador"], "perfil", "Meus dados", verPerfil),
  rota(/^\/comunicador$/, ["aluno"], null, "Comunicador", verComunicador, { semCasca: true })
];

const MENU = {
  escola: [
    { id: "inicio", rotulo: "Início", icone: "house", href: "#/inicio" },
    { id: "alunos", rotulo: "Alunos", icone: "student", href: "#/alunos" },
    { id: "cuidadores", rotulo: "Cuidadores", icone: "users-three", href: "#/cuidadores" },
    { id: "escola", rotulo: "Minha escola", icone: "buildings", href: "#/escola" }
  ],
  cuidador: [
    { id: "alunos", rotulo: "Meus alunos", icone: "student", href: "#/alunos" },
    { id: "perfil", rotulo: "Meus dados", icone: "user-circle", href: "#/perfil" }
  ]
};
const INICIO = { escola: "#/inicio", cuidador: "#/alunos", aluno: "#/comunicador" };
const inicioDoPerfil = () => INICIO[estado.tipo];

function lerHash() {
  const [caminho = "", qs = ""] = location.hash.slice(1).split("?");
  return { caminho, query: new URLSearchParams(qs) };
}

function acharRota(caminho) {
  for (const r of ROTAS) {
    const m = caminho.match(r.re);
    if (m && r.perfis.includes(estado.tipo)) return { r, id: m[1] };
  }
  return null;
}

/* ---------- Sessão ---------- */
async function carregarQuem() {
  if (estado.tipo === "escola") {
    const { escola } = await api("GET", "/escolas/eu");
    estado.quem = { nome: escola.razaoSocial, papel: "Escola" };
  } else if (estado.tipo === "aluno") {
    const { aluno } = await api("GET", "/alunos/eu");
    estado.quem = { nome: aluno.nome, papel: "Aluno" };
  } else {
    const { cuidador } = await api("GET", "/cuidadores/eu");
    estado.quem = { nome: cuidador.nome, papel: "Cuidador" };
  }
}

async function entrar(token) {
  sessao.definir(token);
  estado.tipo = sessao.tipo();
  await carregarQuem();
  estado.casca = false;
  rotear(true);
}

function sair(mensagem) {
  sessao.limpar();
  Object.assign(estado, { tipo: null, quem: null, casca: false, navegacao: estado.navegacao + 1 });
  window.speechSynthesis?.cancel();
  if ($("#modal").open) $("#modal").close();
  if (location.hash) history.replaceState(null, "", location.pathname + location.search);
  mostrarEntrada("escola");
  if (mensagem) avisar(mensagem);
}
aoSessaoExpirar(sair);

function mostrarEntrada(modo) {
  telaEntrada($("#app"), modo, { entrar, trocar: mostrarEntrada });
}

/* ---------- Estrutura da tela ---------- */
// Dois layouts: a escola tem menu lateral (muita navegação, tabelas largas); o cuidador tem barra superior
// (poucas telas, foco nos alunos). No celular os dois usam a barra de abas inferior.
function montarCasca() {
  const itens = MENU[estado.tipo];
  const link = (i) => `<a href="${i.href}" data-nav="${i.id}">${icone(i.icone)}<span>${esc(i.rotulo)}</span></a>`;
  const sair = `<button type="button" class="btn" data-sair>${icone("sign-out")}<span>Sair</span></button>`;
  const quem = `<div class="quem">${avatar(estado.quem.nome)}<div><strong>${esc(estado.quem.nome)}</strong><span>${esc(estado.quem.papel)}</span></div></div>`;
  const abas = `<nav class="abas" aria-label="Principal">${itens.map(link).join("")}</nav>`;
  const inicio = inicioDoPerfil();

  $("#app").innerHTML = estado.tipo === "escola" ? `
    <button type="button" class="pular" data-pular>Pular para o conteúdo</button>
    <div class="app app-escola">
      <aside class="lateral">
        <a class="logo" href="${inicio}" aria-label="conecTEA, ir para o início">${marca}</a>
        <nav class="nav" aria-label="Principal">${itens.map(link).join("")}</nav>
        <div class="lateral-fim">${quem}${sair}</div>
      </aside>
      <div class="coluna">
        <div class="topo-movel"><a class="logo" href="${inicio}" aria-label="conecTEA, ir para o início">${marca}</a>${sair}</div>
        <main class="principal" id="conteudo" tabindex="-1"></main>
      </div>
      ${abas}
    </div>` : `
    <button type="button" class="pular" data-pular>Pular para o conteúdo</button>
    <div class="app app-cuidador">
      <header class="barra-topo">
        <div class="barra-in">
          <a class="logo" href="${inicio}" aria-label="conecTEA, ir para o início">${marca}</a>
          <nav class="nav-topo" aria-label="Principal">${itens.map(link).join("")}</nav>
          <div class="quem-topo">${quem}${sair}</div>
        </div>
      </header>
      <main class="principal" id="conteudo" tabindex="-1"></main>
      ${abas}
    </div>`;
  estado.casca = true;
}

document.addEventListener("click", (e) => {
  if (e.target.closest("[data-sair]")) sair();
  if (e.target.closest("[data-pular]")) $("#conteudo")?.focus();
});

/* ---------- Roteador ---------- */
// Cada navegação ganha um elemento novo: respostas atrasadas de uma tela anterior escrevem num elemento
// descartado ("ctx.vivo()" fica falso) e nunca bagunçam a tela atual.
function rotear(forcar = false) {
  if (!sessao.token || !estado.tipo) return;
  const { caminho, query } = lerHash();
  const achada = acharRota(caminho);
  if (!achada) {
    history.replaceState(null, "", inicioDoPerfil());
    return rotear(forcar);
  }
  const { r, id } = achada;

  const minha = ++estado.navegacao;
  const ctx = {
    perfil: estado.tipo,
    usuario: estado.quem,
    params: { id },
    query,
    vivo: () => minha === estado.navegacao,
    ir: (hash) => { if (location.hash === hash) rotear(true); else location.hash = hash; },
    recarregar: () => rotear(true),
    sair,
    atualizarUsuario: async () => { await carregarQuem(); $$(".quem strong").forEach((el) => { el.textContent = estado.quem.nome; }); }
  };

  let raiz;
  if (r.semCasca) {
    estado.casca = false;
    raiz = document.createElement("div");
    $("#app").replaceChildren(raiz);
  } else {
    if (!estado.casca) montarCasca();
    raiz = document.createElement("main");
    raiz.className = "principal";
    raiz.id = "conteudo";
    raiz.tabIndex = -1;
    $("#conteudo").replaceWith(raiz);
    $$("[data-nav]").forEach((a) => (a.dataset.nav === r.nav ? a.setAttribute("aria-current", "page") : a.removeAttribute("aria-current")));
  }
  ctx.raiz = raiz;
  document.title = `${r.titulo} | conecTEA`;
  window.scrollTo(0, 0);

  // Ao terminar de carregar, o foco vai para o título da tela (leitores de tela anunciam a mudança)
  Promise.resolve(r.ver(ctx)).then(() => {
    if (!ctx.vivo() || r.semCasca) return;
    if (document.activeElement === document.body || !raiz.contains(document.activeElement)) $("h1", raiz)?.focus({ preventScroll: true });
  });
}
window.addEventListener("hashchange", () => rotear());

/* ---------- Início ---------- */
(async function iniciar() {
  if (!sessao.token) return mostrarEntrada("escola");
  estado.tipo = sessao.tipo();
  try {
    await carregarQuem();
  } catch (erro) {
    // 401 já foi tratado por aoSessaoExpirar (volta ao login). Se o servidor estiver fora, não derruba a sessão.
    if (erro instanceof ApiErro && erro.status === 0) {
      $("#app").innerHTML = `<main class="entrada-caixa" id="conteudo">${falha(erro)}</main>`;
      $("[data-tentar]").addEventListener("click", iniciar);
    }
    return;
  }
  rotear(true);
})();
