// Peças de interface compartilhadas: formatação, máscaras, formulários com validação, avisos e diálogo.
import { ApiErro } from "./api.js";

/* ---------- Utilidades ---------- */
export const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
export const $$ = (seletor, raiz = document) => [...raiz.querySelectorAll(seletor)];
export const esc = (valor) =>
  String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
export const icone = (nome) => `<svg class="icone" aria-hidden="true"><use href="icons.svg#i-${nome}"/></svg>`;
export const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");
export const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
export const hojeISO = () => new Date().toISOString().slice(0, 10);

export const formatarCnpj = (v) =>
  String(v ?? "").replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
export const formatarData = (iso) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Não informada";

// "9 anos", "1 ano e 4 meses"; null quando não há data
export function idade(iso) {
  if (!iso) return null;
  const nasc = new Date(iso);
  const hoje = new Date();
  let meses = (hoje.getUTCFullYear() - nasc.getUTCFullYear()) * 12 + (hoje.getUTCMonth() - nasc.getUTCMonth());
  if (hoje.getUTCDate() < nasc.getUTCDate()) meses--;
  if (meses < 0) return null;
  const anos = Math.floor(meses / 12);
  if (anos >= 2) return `${anos} anos`;
  if (anos === 1) return meses % 12 ? `1 ano e ${plural(meses % 12, "mês", "meses")}` : "1 ano";
  return plural(meses, "mês", "meses");
}

/* ---------- Máscaras e limites (mesmos tamanhos que o back-end valida) ---------- */
const MASCARAS = {
  cnpj: (v) => {
    const d = soDigitos(v).slice(0, 14);
    return d.replace(/^(\d{2})(\d{0,3})(\d{0,3})(\d{0,4})(\d{0,2}).*/, (_, a, b, c, e, f) =>
      a + (b ? `.${b}` : "") + (c ? `.${c}` : "") + (e ? `/${e}` : "") + (f ? `-${f}` : ""));
  },
  telefone: (v) => {
    const d = soDigitos(v).slice(0, 11);
    if (d.length === 0) return "";
    if (d.length <= 2) return `(${d}`;
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  },
  numero: (v) => soDigitos(v).slice(0, 6)
};
export const aplicarMascara = (tipo, valor) => MASCARAS[tipo](valor);
const MASCARA_DO_CAMPO = { cnpj: "cnpj", telefone: "telefone", telefone1: "telefone", telefone2: "telefone", "endereco.numero": "numero" };
const LIMITE_DO_CAMPO = { nome: 120, razaoSocial: 200, "endereco.rua": 200, "endereco.municipio": 120, "endereco.estado": 50, email: 254, senha: 72 };
const DIGITOS = {
  cnpj: { min: 14, max: 14, msg: "O CNPJ deve ter 14 números." },
  telefone: { min: 10, max: 11, msg: "Informe o telefone com DDD (10 ou 11 números)." }
};

// Aplica a máscara enquanto a pessoa digita ou cola e limpa o erro do campo que ela está corrigindo
document.addEventListener("input", (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement)) return;
  const mascara = MASCARAS[input.dataset.mascara];
  if (mascara) input.value = mascara(input.value);
  if (input.getAttribute("aria-invalid")) limparErroDoCampo(input);
});

// Reaplica as máscaras a campos que já vieram preenchidos (telefone sem formato, por exemplo)
export const reaplicarMascaras = (raiz) =>
  $$("[data-mascara]", raiz).forEach((i) => { i.value = MASCARAS[i.dataset.mascara](i.value); });

// Atalhos de clique: "Mostrar/ocultar senha" e links do resumo de erros que levam ao campo
document.addEventListener("click", (e) => {
  const olho = e.target.closest("[data-olho]");
  if (olho) {
    const input = document.getElementById(olho.dataset.olho);
    const mostrar = input.type === "password";
    input.type = mostrar ? "text" : "password";
    olho.setAttribute("aria-pressed", String(mostrar));
    olho.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
    olho.innerHTML = icone(mostrar ? "eye-slash" : "eye");
    return;
  }
  const foco = e.target.closest("[data-foco]");
  if (foco) document.getElementById(foco.dataset.foco)?.focus();
});

/* ---------- Avisos (toasts) ---------- */
export function avisar(texto, tipo = "ok") {
  const erro = tipo === "erro";
  const el = document.createElement("div");
  el.className = `aviso ${erro ? "erro" : ""}`;
  el.setAttribute("role", erro ? "alert" : "status");
  el.innerHTML = `${icone(erro ? "warning-circle" : "check-circle")}<span>${esc(texto)}</span>`;
  const caixa = $("#avisos");
  caixa.append(el);
  while (caixa.children.length > 3) caixa.firstElementChild.remove();
  setTimeout(() => el.remove(), erro ? 8000 : 5000);
}

/* ---------- Campos de formulário ---------- */
export function campo({ nome, rotulo, tipo = "text", valor = "", ajuda = "", obrigatorio = false, extra = "", classe = "" }) {
  const id = `c-${nome.replace(/\./g, "-")}`;
  const mascara = MASCARA_DO_CAMPO[nome];
  const limite = LIMITE_DO_CAMPO[nome];
  const atributos = [
    mascara ? `data-mascara="${mascara}"` : "",
    DIGITOS[mascara] ? `data-digitos="${mascara}"` : "",
    limite ? `maxlength="${limite}"` : "",
    mascara ? 'inputmode="numeric"' : "",
    ajuda ? `aria-describedby="${id}-ajuda"` : ""
  ].join(" ");
  return `
    <div class="campo ${classe}">
      <label for="${id}">${esc(rotulo)}${obrigatorio ? "" : ' <span class="ajuda">(opcional)</span>'}</label>
      <input class="input" id="${id}" name="${nome}" data-rotulo="${esc(rotulo)}" type="${mascara === "numero" ? "text" : tipo}" value="${esc(valor)}" ${obrigatorio ? "required" : ""} ${atributos} ${extra}>
      ${ajuda ? `<span class="ajuda" id="${id}-ajuda">${esc(ajuda)}</span>` : ""}
    </div>`;
}

export function campoSenha({ rotulo = "Senha", ajuda = "", obrigatorio = true, autocomplete = "current-password", classe = "" }) {
  const id = "c-senha";
  return `
    <div class="campo ${classe}">
      <label for="${id}">${esc(rotulo)}${obrigatorio ? "" : ' <span class="ajuda">(opcional)</span>'}</label>
      <div class="campo-senha">
        <input class="input" id="${id}" name="senha" data-rotulo="${esc(rotulo)}" type="password" maxlength="72" autocomplete="${autocomplete}" ${obrigatorio ? "required" : ""} ${ajuda ? `aria-describedby="${id}-ajuda"` : ""}>
        <button type="button" class="btn btn-texto" data-olho="${id}" aria-pressed="false" aria-label="Mostrar senha">${icone("eye")}</button>
      </div>
      ${ajuda ? `<span class="ajuda" id="${id}-ajuda">${esc(ajuda)}</span>` : ""}
    </div>`;
}

/* ---------- Validação e erros ---------- */
function marcarCampo(input, mensagem) {
  input.setAttribute("aria-invalid", "true");
  const cx = input.closest(".campo");
  const msg = document.createElement("span");
  msg.className = "erro";
  msg.id = `${input.id}-erro`;
  msg.textContent = mensagem;
  cx?.append(msg);
  const ids = (input.getAttribute("aria-describedby") ?? "").split(" ").filter(Boolean);
  if (!ids.includes(msg.id)) input.setAttribute("aria-describedby", [...ids, msg.id].join(" "));
}

function limparErroDoCampo(input) {
  input.removeAttribute("aria-invalid");
  document.getElementById(`${input.id}-erro`)?.remove();
  const ids = (input.getAttribute("aria-describedby") ?? "").split(" ").filter((i) => i && i !== `${input.id}-erro`);
  if (ids.length) input.setAttribute("aria-describedby", ids.join(" "));
  else input.removeAttribute("aria-describedby");
}

export function limparErros(form) {
  form.querySelector(".resumo-erros")?.remove();
  $$("[aria-invalid]", form).forEach(limparErroDoCampo);
}

// Resumo no topo do formulário: recebe o foco e cada item leva ao campo com problema
function mostrarResumo(form, titulo, itens) {
  form.querySelector(".resumo-erros")?.remove();
  const el = document.createElement("div");
  el.className = "resumo-erros";
  el.setAttribute("role", "alert");
  el.tabIndex = -1;
  el.innerHTML = `<p class="resumo-titulo">${icone("warning-circle")}<span>${esc(titulo)}</span></p>${
    itens.length
      ? `<ul>${itens.map((i) => `<li>${i.id ? `<button type="button" class="link" data-foco="${esc(i.id)}">${esc(i.texto)}</button>` : esc(i.texto)}</li>`).join("")}</ul>`
      : ""}`;
  form.prepend(el);
  el.focus();
}

// Conferências antes de enviar: obrigatório e quantidade de números (CNPJ e telefone)
function conferirCampos(form) {
  const erros = [];
  for (const input of $$("input[required]:not([type=checkbox]), select[required]", form)) {
    if (!input.value.trim()) erros.push({ input, mensagem: "Preencha este campo." });
  }
  for (const input of $$("[data-digitos]", form)) {
    if (!input.value.trim() || erros.some((e) => e.input === input)) continue;
    const regra = DIGITOS[input.dataset.digitos];
    const n = soDigitos(input.value).length;
    if (n < regra.min || n > regra.max) erros.push({ input, mensagem: regra.msg });
  }
  return erros;
}

const rotuloDe = (input) => input.dataset.rotulo || input.name;

// Liga o envio do formulário: valida, trava o botão enquanto espera e mostra os erros da API.
// "simples": só a mensagem geral (os logins de propósito não detalham o formato do que foi errado).
export function ligarForm(form, acao, { simples = false } = {}) {
  form.noValidate = true;
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    limparErros(form);
    const erros = conferirCampos(form);
    if (erros.length) {
      erros.forEach(({ input, mensagem }) => marcarCampo(input, mensagem));
      mostrarResumo(form, erros.length === 1 ? "Há 1 campo para corrigir" : `Há ${erros.length} campos para corrigir`,
        erros.map(({ input, mensagem }) => ({ id: input.id, texto: `${rotuloDe(input)}: ${mensagem}` })));
      return;
    }
    const botao = $('button[type="submit"]', form);
    const rotulo = botao.innerHTML;
    botao.disabled = true;
    botao.setAttribute("aria-busy", "true");
    botao.textContent = "Aguarde…";
    try {
      await acao();
    } catch (erro) {
      if (!(erro instanceof ApiErro)) throw erro;
      mostrarErrosApi(form, erro, simples);
    } finally {
      botao.disabled = false;
      botao.removeAttribute("aria-busy");
      botao.innerHTML = rotulo;
    }
  });
}

function mostrarErrosApi(form, erro, simples) {
  limparErros(form);
  if (simples || erro.erros.length === 0) return mostrarResumo(form, erro.message, []);
  const itens = erro.erros.map(({ campo: nome, mensagem }) => {
    const input = form.elements[nome];
    if (!input?.closest) return { texto: mensagem };
    marcarCampo(input, mensagem);
    return { id: input.id, texto: `${rotuloDe(input)}: ${mensagem}` };
  });
  mostrarResumo(form, itens.length === 1 ? "Há 1 campo para corrigir" : "Corrija os campos abaixo", itens);
}

/* ---------- Confirmação (único uso de janela modal: ações irreversíveis) ---------- */
export function confirmar({ titulo, texto, rotulo, aoConfirmar }) {
  const dialogo = $("#modal");
  dialogo.innerHTML = `
    <form class="janela" method="dialog" novalidate>
      <h2 id="modal-titulo">${esc(titulo)}</h2>
      <p>${texto}</p>
      <div class="aviso-form" role="alert"></div>
      <div class="janela-acoes">
        <button type="button" class="btn" data-fechar>Cancelar</button>
        <button type="submit" class="btn btn-perigo">${esc(rotulo)}</button>
      </div>
    </form>`;
  const form = $("form", dialogo);
  const fechar = () => dialogo.close();
  $("[data-fechar]", dialogo).addEventListener("click", fechar);
  dialogo.onclick = (e) => { if (e.target === dialogo) fechar(); };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const botao = $('button[type="submit"]', form);
    botao.disabled = true;
    botao.textContent = "Aguarde…";
    try {
      await aoConfirmar();
      fechar();
    } catch (erro) {
      if (!(erro instanceof ApiErro)) throw erro;
      $(".aviso-form", form).textContent = erro.message;
      botao.disabled = false;
      botao.textContent = rotulo;
    }
  });
  if (!dialogo.open) dialogo.showModal();
  $("[data-fechar]", dialogo).focus(); // foco no lado seguro: cancelar
}

/* ---------- Marca e avatar ---------- */
export const marca = `<svg class="icone logo-marca" aria-hidden="true"><use href="icons.svg#i-logo"/></svg><span>conec<b>TEA</b></span>`;

// Inicial do nome num círculo; a cor (um dos quatro "fios") vem do nome, então é sempre a mesma para a mesma pessoa
export function avatar(nome, grande = false) {
  const texto = String(nome ?? "?").trim() || "?";
  let h = 0;
  for (const c of texto) h = (h * 31 + c.codePointAt(0)) >>> 0;
  return `<span class="avatar ${grande ? "avatar-lg" : ""}" data-fio="${h % 4}" aria-hidden="true">${esc([...texto][0].toUpperCase())}</span>`;
}

/* ---------- Blocos de tela ---------- */
export const cabecalho = ({ titulo, subtitulo = "", acoes = "", avatar: ava = "" }) => `
  <header class="cabeca">
    <div class="${ava ? "cabeca-identidade" : ""}">
      ${ava}
      <div><h1 tabindex="-1">${esc(titulo)}</h1><span class="fio" aria-hidden="true"></span>${subtitulo ? `<p>${esc(subtitulo)}</p>` : ""}</div>
    </div>
    ${acoes ? `<div class="cabeca-acoes">${acoes}</div>` : ""}
  </header>`;

export const voltar = (href, rotulo) => `<a class="voltar" href="${href}">${icone("arrow-left")}${esc(rotulo)}</a>`;

export const carregando = () => `
  <div class="painel carregando" role="status"><span class="sr">Carregando…</span>
    <div class="esqueleto"></div><div class="esqueleto"></div><div class="esqueleto"></div>
  </div>`;

export const falha = (erro) => `
  <div class="falha" role="alert"><span>${icone("warning-circle")}${esc(erro.message)}</span><button class="btn" type="button" data-tentar>Tentar de novo</button></div>`;

export const vazio = ({ icone: nome, titulo, texto, acao = "" }) => `
  <div class="vazio">${icone(nome)}<h2>${esc(titulo)}</h2><p>${esc(texto)}</p>${acao}</div>`;

export const etiqueta = (ativo) =>
  `<span class="etiqueta ${ativo ? "" : "off"}">${icone(ativo ? "check" : "x")}${ativo ? "Ativo" : "Inativo"}</span>`;

// Mostra a falha de carregamento dentro de "area" e liga o botão "Tentar de novo"
export function mostrarFalha(area, erro, tentarDeNovo) {
  area.innerHTML = falha(erro);
  $("[data-tentar]", area)?.addEventListener("click", tentarDeNovo);
}

/* ---------- Modo de desenvolvimento ---------- */
// Abra o sistema com ?dev=1 para exibir o botão "Preencher com dados de exemplo" nos formulários.
// Fica desligado para quem usa o sistema de verdade.
export const modoDev = (() => {
  try {
    if (new URLSearchParams(location.search).get("dev") === "1") sessionStorage.setItem("dev", "1");
    return sessionStorage.getItem("dev") === "1";
  } catch {
    return false;
  }
})();
