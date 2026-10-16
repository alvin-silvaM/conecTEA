// conecTEA: front-end em JavaScript puro. Fala com a API pelas mesmas rotas do back-end
// (o server.js encaminha /escolas, /cuidadores e /alunos), então não há URL fixa aqui.

/* ---------- Utilidades ---------- */
const $ = (seletor, raiz = document) => raiz.querySelector(seletor);
const esc = (valor) =>
  String(valor ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const icone = (nome) => `<svg class="icone" aria-hidden="true"><use href="icons.svg#i-${nome}"/></svg>`;
const soDigitos = (v) => String(v ?? "").replace(/\D/g, "");
const formatarCnpj = (v) => String(v ?? "").replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
const formatarData = (iso) =>
  iso ? new Date(iso).toLocaleDateString("pt-BR", { timeZone: "UTC" }) : "Não informada";
const hojeISO = () => new Date().toISOString().slice(0, 10);

const guardar = {
  ler: (chave) => { try { return sessionStorage.getItem(chave); } catch { return null; } },
  gravar: (chave, valor) => { try { sessionStorage.setItem(chave, valor); } catch { /* sem armazenamento: a sessão dura só esta aba */ } },
  apagar: (chave) => { try { sessionStorage.removeItem(chave); } catch { /* idem */ } }
};

/* ---------- Máscaras, limites e dados de exemplo ---------- */
// Só números, com limite de tamanho. O valor mostrado já vem formatado.
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
const MASCARA_DO_CAMPO = { cnpj: "cnpj", telefone: "telefone", telefone1: "telefone", telefone2: "telefone", "endereco.numero": "numero" };
// Mesmos limites de tamanho que o back-end valida
const LIMITE_DO_CAMPO = { nome: 120, razaoSocial: 200, "endereco.rua": 200, "endereco.municipio": 120, "endereco.estado": 50, email: 254, senha: 72 };
const DIGITOS = {
  cnpj: { min: 14, max: 14, msg: "O CNPJ deve ter 14 números." },
  telefone: { min: 10, max: 11, msg: "Informe o telefone com DDD (10 ou 11 números)." }
};

// Aplica a máscara enquanto a pessoa digita ou cola, e limpa o erro do campo que ela está corrigindo
document.addEventListener("input", (e) => {
  const input = e.target;
  if (!(input instanceof HTMLInputElement)) return;
  const mascara = MASCARAS[input.dataset.mascara];
  if (mascara) input.value = mascara(input.value);
  if (input.getAttribute("aria-invalid")) {
    input.removeAttribute("aria-invalid");
    input.closest(".campo")?.querySelector(".erro")?.remove();
  }
});

const sorteia = (lista) => lista[Math.floor(Math.random() * lista.length)];
const entre = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const NOMES = ["Ana", "Beatriz", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gabriel", "Helena", "Igor", "Joana", "Lucas", "Marina", "Nicolas", "Olívia", "Pedro", "Rafaela", "Samuel", "Tatiana"];
const SOBRENOMES = ["Almeida", "Barbosa", "Cavalcante", "Dias", "Esteves", "Freitas", "Gomes", "Holanda", "Lima", "Macedo", "Nogueira", "Oliveira", "Pereira", "Queiroz", "Rocha", "Sousa", "Teixeira"];
const CIDADES = ["Quixadá", "Fortaleza", "Sobral", "Juazeiro do Norte", "Crato", "Iguatu", "Canindé", "Russas"];
const RUAS = ["Rua das Flores", "Avenida Brasil", "Rua da Paz", "Rua São José", "Avenida Central", "Rua do Sol", "Rua Santos Dumont"];
const nomeAleatorio = () => `${sorteia(NOMES)} ${sorteia(SOBRENOMES)}`;
const semAcento = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const emailAleatorio = (nome) => `${semAcento(nome.split(" ")[0])}.${semAcento(nome.split(" ").pop())}${entre(10, 9999)}@exemplo.test`;
const telefoneAleatorio = () => MASCARAS.telefone(`88 9${entre(8000, 9999)}${entre(1000, 9999)}`);
const senhaAleatoria = () => `Senha${entre(10000, 99999)}`;
// CNPJ com os dois dígitos verificadores corretos (dados fictícios, só para testar)
const cnpjAleatorio = () => {
  const base = Array.from({ length: 8 }, () => entre(0, 9)).concat([0, 0, 0, 1]);
  const digito = (nums) => {
    const pesos = nums.length === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const resto = nums.reduce((t, n, i) => t + n * pesos[i], 0) % 11;
    return resto < 2 ? 0 : 11 - resto;
  };
  const d1 = digito(base);
  return base.concat(d1, digito(base.concat(d1))).join("");
};

// Preenche um campo como se a pessoa tivesse digitado (aplica a máscara)
function preencher(form, nome, valor) {
  const campoEl = form.elements[nome];
  if (!campoEl) return;
  campoEl.value = valor;
  campoEl.dispatchEvent(new Event("input", { bubbles: true }));
}

// Mostra a senha gerada para a pessoa poder anotá-la antes de salvar
function preencherSenha(form) {
  const senha = form.elements.senha;
  senha.type = "text";
  preencher(form, "senha", senhaAleatoria());
}

const botaoExemplo = '<button type="button" class="btn btn-texto" data-exemplo>Dados de exemplo</button>';

// Conferências simples antes de enviar: obrigatório e quantidade de números (CNPJ e telefone)
function conferirCampos(form) {
  let primeiro = null;
  const marcar = (input, mensagem) => {
    input.setAttribute("aria-invalid", "true");
    const msg = document.createElement("span");
    msg.className = "erro";
    msg.textContent = mensagem;
    input.closest(".campo")?.append(msg);
    primeiro ??= input;
  };
  for (const input of form.querySelectorAll("input[required]:not([type=checkbox]), select[required]")) {
    if (!input.value.trim()) marcar(input, "Preencha este campo.");
  }
  for (const input of form.querySelectorAll("[data-digitos]")) {
    if (input.getAttribute("aria-invalid") || !input.value.trim()) continue;
    const regra = DIGITOS[input.dataset.digitos];
    const n = soDigitos(input.value).length;
    if (n < regra.min || n > regra.max) marcar(input, regra.msg);
  }
  primeiro?.focus();
  return !primeiro;
}

/* ---------- Estado e API ---------- */
const estado = { token: guardar.ler("token"), tipo: null, quem: null, rotaAtual: null };

const tipoDoToken = (token) => {
  try {
    return JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).tipo ?? null;
  } catch {
    return null;
  }
};

class ApiErro extends Error {
  constructor(status, mensagem, erros = []) {
    super(mensagem);
    this.status = status;
    this.erros = erros;
  }
}

async function api(metodo, caminho, corpo) {
  const cabecalhos = {};
  if (corpo !== undefined) cabecalhos["Content-Type"] = "application/json";
  if (estado.token) cabecalhos.Authorization = `Bearer ${estado.token}`;

  let resposta;
  try {
    resposta = await fetch(caminho, { method: metodo, headers: cabecalhos, body: corpo === undefined ? undefined : JSON.stringify(corpo) });
  } catch {
    throw new ApiErro(0, "Não foi possível falar com o servidor. Verifique se o back-end está rodando.");
  }
  const dados = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    if (resposta.status === 401 && estado.token) {
      sair("Sua sessão expirou. Entre novamente.");
    }
    throw new ApiErro(resposta.status, dados.message || "Algo deu errado. Tente novamente.", dados.erros || []);
  }
  return dados;
}

function sair(mensagem) {
  estado.token = null;
  estado.tipo = null;
  estado.quem = null;
  estado.rotaAtual = null;
  guardar.apagar("token");
  if ($("#modal").open) $("#modal").close();
  location.hash = "";
  mostrarEntrada("login-escola");
  if (mensagem) avisar(mensagem);
}

/* ---------- Avisos ---------- */
function avisar(texto, tipo = "ok") {
  const el = document.createElement("div");
  el.className = `aviso ${tipo === "erro" ? "erro" : ""}`;
  el.innerHTML = `${icone(tipo === "erro" ? "warning-circle" : "check-circle")}<span>${esc(texto)}</span>`;
  const caixa = $("#avisos");
  caixa.append(el);
  while (caixa.children.length > 3) caixa.firstElementChild.remove();
  setTimeout(() => el.remove(), 5000);
}

/* ---------- Formulários ---------- */
function campo({ nome, rotulo, tipo = "text", valor = "", ajuda = "", obrigatorio = false, extra = "", classe = "" }) {
  const id = `c-${nome.replace(/\./g, "-")}`;
  const mascara = MASCARA_DO_CAMPO[nome];
  const limite = LIMITE_DO_CAMPO[nome];
  const atributos = [
    mascara ? `data-mascara="${mascara}"` : "",
    DIGITOS[mascara] ? `data-digitos="${mascara}"` : "", // o limite de números vem da máscara (aceita colar texto com pontos e traços)
    limite ? `maxlength="${limite}"` : "",
    mascara ? 'inputmode="numeric"' : ""
  ].join(" ");
  return `
    <div class="campo ${classe}">
      <label for="${id}">${esc(rotulo)}${obrigatorio ? "" : ' <span class="ajuda">(opcional)</span>'}</label>
      <input class="input" id="${id}" name="${nome}" type="${mascara === "numero" ? "text" : tipo}" value="${esc(valor)}" ${obrigatorio ? "required" : ""} ${atributos} ${extra}>
      ${ajuda ? `<span class="ajuda" id="${id}-ajuda">${esc(ajuda)}</span>` : ""}
    </div>`;
}

function limparErros(form) {
  form.querySelectorAll(".erro").forEach((e) => e.remove());
  form.querySelectorAll("[aria-invalid]").forEach((e) => e.removeAttribute("aria-invalid"));
  const aviso = $(".aviso-form", form);
  if (aviso) aviso.textContent = "";
}

// Mostra os erros da API junto de cada campo; o que não tiver campo vai para o aviso do formulário.
// "simples": só a mensagem geral (usado nos logins, que de propósito não detalham o formato).
function mostrarErros(form, erro, simples = false) {
  limparErros(form);
  const aviso = $(".aviso-form", form);
  const sobras = [];
  if (!simples) {
    for (const { campo: nome, mensagem } of erro.erros) {
      const input = form.elements[nome];
      if (!input || !input.closest) { sobras.push(mensagem); continue; }
      input.setAttribute("aria-invalid", "true");
      const msg = document.createElement("span");
      msg.className = "erro";
      msg.textContent = mensagem;
      input.closest(".campo").append(msg);
    }
  }
  if (simples || erro.erros.length === 0) aviso.textContent = erro.message;
  else if (sobras.length) aviso.textContent = sobras.join(" ");
  else if (erro.erros.length > 1) aviso.textContent = "Corrija os campos destacados.";
  form.querySelector("[aria-invalid]")?.focus();
}

// Executa a ação do formulário com o botão travado enquanto espera a resposta
async function enviar(form, botao, acao, simples = false) {
  limparErros(form);
  if (!conferirCampos(form)) return undefined;
  const rotulo = botao.textContent;
  botao.disabled = true;
  botao.textContent = "Aguarde...";
  try {
    return await acao();
  } catch (erro) {
    if (erro instanceof ApiErro) mostrarErros(form, erro, simples);
    else throw erro;
    return undefined;
  } finally {
    botao.disabled = false;
    botao.textContent = rotulo;
  }
}

/* ---------- Janela (modal) ---------- */
function abrirJanela({ titulo, corpo, salvar = "Salvar", perigo = false, aoEnviar, exemplo = null }) {
  const dialogo = $("#modal");
  dialogo.innerHTML = `
    <form class="janela" novalidate>
      <div class="janela-topo">
        <h2 id="modal-titulo">${esc(titulo)}</h2>
        <button type="button" class="btn btn-texto fechar" data-fechar aria-label="Fechar">${icone("x")}</button>
      </div>
      <div class="janela-corpo">${corpo}<div class="aviso-form" role="alert"></div></div>
      <div class="janela-pe">
        ${exemplo ? botaoExemplo : ""}
        <div class="janela-pe-acoes">
          <button type="button" class="btn" data-fechar>Cancelar</button>
          <button type="submit" class="btn ${perigo ? "btn-perigo" : "btn-primario"}">${esc(salvar)}</button>
        </div>
      </div>
    </form>`;
  const form = $("form", dialogo);
  const fechar = () => dialogo.close();
  dialogo.querySelectorAll("[data-fechar]").forEach((b) => b.addEventListener("click", fechar));
  dialogo.onclick = (e) => { if (e.target === dialogo) fechar(); };
  if (exemplo) $("[data-exemplo]", dialogo).addEventListener("click", () => exemplo(form));
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const botao = $('button[type="submit"]', form);
    const ok = await enviar(form, botao, () => aoEnviar(form));
    if (ok !== undefined && ok !== false) fechar();
  });
  if (!dialogo.open) dialogo.showModal();
  (form.querySelector(".input") ?? $('button[type="submit"]', form)).focus();
}

const confirmar = ({ titulo, texto, rotulo, aoConfirmar }) =>
  abrirJanela({
    titulo,
    corpo: `<p>${texto}</p>`,
    salvar: rotulo,
    perigo: true,
    aoEnviar: async () => { await aoConfirmar(); return true; }
  });

/* ---------- Entrada: login e cadastro ---------- */
const painelMarca = `
  <aside class="entrada-marca">
    <div class="logo">conec<b>TEA</b></div>
    <div>
      <h1>Escola e família no mesmo ritmo.</h1>
      <p>Cadastre cuidadores e alunos e acompanhe tudo em um só lugar, de um jeito simples e tranquilo.</p>
    </div>
  </aside>`;

function mostrarEntrada(modo, mensagem = "") {
  const app = $("#app");
  if (modo === "cadastro") {
    app.innerHTML = `<div class="entrada">${painelMarca}<main class="entrada-form"><div class="entrada-caixa larga">${formCadastro()}</div></main></div>`;
    ligarCadastro();
  } else {
    app.innerHTML = `<div class="entrada">${painelMarca}<main class="entrada-form"><div class="entrada-caixa">${formLogin(modo)}</div></main></div>`;
    ligarLogin(modo);
  }
  if (mensagem) $(".aviso-form")?.append(mensagem);
  document.title = "conecTEA";
}

function formLogin(modo) {
  const escola = modo === "login-escola";
  return `
    <div>
      <h2>Entrar</h2>
    </div>
    <div class="troca" role="group" aria-label="Tipo de acesso">
      <button type="button" data-modo="login-escola" aria-pressed="${escola}">Escola</button>
      <button type="button" data-modo="login-cuidador" aria-pressed="${!escola}">Cuidador</button>
    </div>
    <form id="form-login" novalidate>
      ${escola
        ? campo({ nome: "cnpj", rotulo: "CNPJ", valor: "", obrigatorio: true, extra: 'autocomplete="username" placeholder="00.000.000/0000-00"' })
        : campo({ nome: "email", rotulo: "Email", tipo: "email", obrigatorio: true, extra: 'autocomplete="username" placeholder="nome@exemplo.com"' })}
      ${campo({ nome: "senha", rotulo: "Senha", tipo: "password", obrigatorio: true, extra: 'autocomplete="current-password"' })}
      <div class="aviso-form" role="alert"></div>
      <button class="btn btn-primario" type="submit">Entrar</button>
    </form>
    ${escola ? '<p class="rodape-form">Sua escola ainda não tem cadastro? <button type="button" class="link" data-cadastro>Cadastrar escola</button></p>'
             : '<p class="rodape-form">O acesso do cuidador é criado pela escola.</p>'}`;
}

function ligarLogin(modo) {
  const raiz = $("#app");
  raiz.querySelectorAll("[data-modo]").forEach((b) => b.addEventListener("click", () => mostrarEntrada(b.dataset.modo)));
  $("[data-cadastro]", raiz)?.addEventListener("click", () => mostrarEntrada("cadastro"));
  const form = $("#form-login");
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const dados = Object.fromEntries(new FormData(form));
    const escola = modo === "login-escola";
    const botao = $('button[type="submit"]', form);
    await enviar(form, botao, async () => {
      const { token } = escola
        ? await api("POST", "/escolas", { cnpj: soDigitos(dados.cnpj), senha: dados.senha })
        : await api("POST", "/cuidadores/login", { email: dados.email.trim(), senha: dados.senha });
      await iniciarSessao(token);
    }, true);
  });
  $(".input", form).focus();
}

function formCadastro() {
  return `
    <div>
      <h2>Cadastrar escola</h2>
      <p class="rodape-form">Depois do cadastro você entra direto e já pode cadastrar cuidadores e alunos.</p>
    </div>
    <form id="form-cadastro" novalidate>
      <fieldset>
        <legend>Dados da escola</legend>
        <div class="grade">
          ${campo({ nome: "cnpj", rotulo: "CNPJ", obrigatorio: true, ajuda: "14 números", extra: 'placeholder="00.000.000/0000-00"' })}
          ${campo({ nome: "razaoSocial", rotulo: "Razão social", obrigatorio: true })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Endereço</legend>
        <div class="grade">
          ${campo({ nome: "endereco.rua", rotulo: "Rua", obrigatorio: true, classe: "largo" })}
          ${campo({ nome: "endereco.numero", rotulo: "Número", obrigatorio: true })}
          ${campo({ nome: "endereco.municipio", rotulo: "Município", obrigatorio: true })}
          ${campo({ nome: "endereco.estado", rotulo: "Estado", obrigatorio: true })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Contato e acesso</legend>
        <div class="grade">
          ${campo({ nome: "telefone1", rotulo: "Telefone", tipo: "tel", obrigatorio: true, extra: 'placeholder="(88) 99999-0000"' })}
          ${campo({ nome: "telefone2", rotulo: "Segundo telefone", tipo: "tel" })}
          ${campo({ nome: "email", rotulo: "Email", tipo: "email", obrigatorio: true })}
          ${campo({ nome: "senha", rotulo: "Senha", tipo: "password", obrigatorio: true, ajuda: "Mínimo de 8 caracteres", extra: 'autocomplete="new-password"' })}
        </div>
      </fieldset>
      <div class="aviso-form" role="alert"></div>
      <div class="acoes-form">
        <button class="btn btn-primario" type="submit">Cadastrar escola</button>
        ${botaoExemplo}
      </div>
    </form>
    <p class="rodape-form">Já tem cadastro? <button type="button" class="link" data-entrar>Entrar</button></p>`;
}

const corpoEscola = (f) => {
  const v = (n) => f.elements[n].value.trim();
  const corpo = {
    razaoSocial: v("razaoSocial"),
    endereco: {
      numero: v("endereco.numero") === "" ? undefined : Number(v("endereco.numero")),
      rua: v("endereco.rua"),
      municipio: v("endereco.municipio"),
      estado: v("endereco.estado")
    },
    telefone1: v("telefone1"),
    email: v("email")
  };
  return { corpo, telefone2: v("telefone2") };
};

function ligarCadastro() {
  $("[data-entrar]").addEventListener("click", () => mostrarEntrada("login-escola"));
  const form = $("#form-cadastro");
  $("[data-exemplo]", form).addEventListener("click", () => {
    preencher(form, "cnpj", cnpjAleatorio());
    preencher(form, "razaoSocial", `Escola Municipal ${sorteia(NOMES)} ${sorteia(SOBRENOMES)}`);
    preencher(form, "endereco.rua", sorteia(RUAS));
    preencher(form, "endereco.numero", String(entre(1, 999)));
    preencher(form, "endereco.municipio", sorteia(CIDADES));
    preencher(form, "endereco.estado", "Ceará");
    preencher(form, "telefone1", telefoneAleatorio());
    preencher(form, "telefone2", "");
    preencher(form, "email", `contato${entre(100, 99999)}@escola-exemplo.test`);
    preencherSenha(form);
    limparErros(form);
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const botao = $('button[type="submit"]', form);
    await enviar(form, botao, async () => {
      const { corpo, telefone2 } = corpoEscola(form);
      const cnpj = soDigitos(form.elements.cnpj.value);
      const senha = form.elements.senha.value;
      await api("POST", "/escolas/cadastro", { cnpj, ...corpo, ...(telefone2 ? { telefone2 } : {}), senha });
      const { token } = await api("POST", "/escolas", { cnpj, senha });
      await iniciarSessao(token);
      avisar("Escola cadastrada. Bem-vinda ao conecTEA!");
    });
  });
  $(".input", form).focus();
}

/* ---------- Sessão e estrutura do app ---------- */
async function iniciarSessao(token) {
  estado.token = token;
  estado.tipo = tipoDoToken(token);
  guardar.gravar("token", token);
  await carregarQuem();
  if (!location.hash.startsWith("#/")) location.hash = "#/alunos";
  mostrarApp();
}

async function carregarQuem() {
  if (estado.tipo === "escola") {
    const { escola } = await api("GET", "/escolas/eu");
    estado.quem = { nome: escola.razaoSocial, papel: "Escola" };
  } else {
    const { cuidador } = await api("GET", "/cuidadores/eu");
    estado.quem = { nome: cuidador.nome, papel: "Cuidador" };
  }
}

const rotas = {
  escola: [
    { id: "alunos", rotulo: "Alunos", icone: "student", ver: verAlunos },
    { id: "cuidadores", rotulo: "Cuidadores", icone: "users-three", ver: verCuidadores },
    { id: "escola", rotulo: "Minha escola", icone: "buildings", ver: verEscola }
  ],
  cuidador: [
    { id: "alunos", rotulo: "Alunos", icone: "student", ver: verAlunos },
    { id: "perfil", rotulo: "Meus dados", icone: "user-circle", ver: verPerfil }
  ]
};

function mostrarApp() {
  const itens = rotas[estado.tipo];
  $("#app").innerHTML = `
    <div class="app">
      <aside class="lateral">
        <div class="logo">conec<b>TEA</b></div>
        <nav class="nav" aria-label="Principal">
          ${itens.map((r) => `<a href="#/${r.id}" data-rota="${r.id}">${icone(r.icone)}<span>${r.rotulo}</span></a>`).join("")}
        </nav>
        <div class="lateral-fim">
          <div class="quem"><strong>${esc(estado.quem.nome)}</strong><span>${esc(estado.quem.papel)}</span></div>
          <button type="button" class="btn" id="sair">${icone("sign-out")}Sair</button>
        </div>
      </aside>
      <main class="principal" id="conteudo"></main>
    </div>`;
  $("#sair").addEventListener("click", () => sair());
  rotear(true);
}

// Cada troca de tela usa um <main> novo: respostas atrasadas de uma tela anterior escrevem num
// elemento descartado e nunca duplicam a tela atual.
function rotear(forcar = false) {
  if (!estado.token) return;
  const itens = rotas[estado.tipo];
  const id = location.hash.replace("#/", "");
  const rota = itens.find((r) => r.id === id) ?? itens[0];
  if (!forcar && estado.rotaAtual === rota.id) return;
  estado.rotaAtual = rota.id;
  const antigo = $("#conteudo");
  const novo = document.createElement("main");
  novo.className = "principal";
  novo.id = "conteudo";
  antigo.replaceWith(novo);
  document.querySelectorAll("[data-rota]").forEach((a) => {
    if (a.dataset.rota === rota.id) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });
  document.title = `${rota.rotulo} | conecTEA`;
  rota.ver(novo);
}

/* ---------- Componentes das telas ---------- */
const cabecalho = ({ titulo, subtitulo = "", acao = "" }) => `
  <div class="cabeca">
    <div><h1 tabindex="-1">${esc(titulo)}</h1>${subtitulo ? `<p>${esc(subtitulo)}</p>` : ""}</div>
    ${acao}
  </div>`;

const carregando = () => `<div class="painel tabela-caixa carregando" aria-hidden="true"><div class="esqueleto"></div><div class="esqueleto"></div><div class="esqueleto"></div></div>`;

const falha = (erro) => `
  <div class="falha" role="alert"><span>${esc(erro.message)}</span><button class="btn" type="button" data-tentar>Tentar de novo</button></div>`;

const vazio = ({ icone: nome, titulo, texto, acao = "" }) => `
  <div class="vazio">${icone(nome)}<h2>${esc(titulo)}</h2><p>${esc(texto)}</p>${acao}</div>`;

const etiqueta = (ativo) => `<span class="etiqueta ${ativo ? "" : "off"}">${ativo ? "Ativo" : "Inativo"}</span>`;

// Lista com busca. "colunas": [{ titulo, classe, celula(item) }]; "acoes(item)" devolve o html dos botões
function listaComBusca(raiz, { itens, colunas, acoes, textoBusca, vazioHtml, rotuloBusca }) {
  const area = $("#area-lista", raiz);
  const desenhar = (filtro = "") => {
    const termo = filtro.trim().toLowerCase();
    const visiveis = termo ? itens.filter((i) => textoBusca(i).toLowerCase().includes(termo)) : itens;
    if (itens.length === 0) { area.innerHTML = `<div class="painel">${vazioHtml}</div>`; return; }
    if (visiveis.length === 0) {
      area.innerHTML = `<div class="painel">${vazio({ icone: "magnifying-glass", titulo: "Nada encontrado", texto: `Nenhum resultado para "${filtro.trim()}". Tente outro termo.` })}</div>`;
      return;
    }
    area.innerHTML = `
      <div class="painel tabela-caixa"><table>
        <thead><tr>${colunas.map((c) => `<th scope="col" class="${c.classe ?? ""}">${esc(c.titulo)}</th>`).join("")}${acoes ? '<th scope="col" class="acoes"><span class="sr">Ações</span></th>' : ""}</tr></thead>
        <tbody>${visiveis.map((i) => `<tr data-id="${esc(i._id)}">
          ${colunas.map((c) => `<td class="${c.classe ?? ""}" data-rotulo="${esc(c.titulo)}">${c.celula(i)}</td>`).join("")}
          ${acoes ? `<td class="acoes">${acoes(i)}</td>` : ""}
        </tr>`).join("")}</tbody>
      </table></div>`;
  };
  desenhar();
  const busca = $("#busca", raiz);
  if (busca) {
    busca.setAttribute("aria-label", rotuloBusca);
    busca.addEventListener("input", () => desenhar(busca.value));
  }
}

const botoesLinha = (i, nome) => `
  <button type="button" class="btn btn-texto" data-editar="${esc(i._id)}" aria-label="Editar ${esc(nome)}">${icone("pencil-simple")}Editar</button>
  <button type="button" class="btn btn-texto perigo" data-excluir="${esc(i._id)}" aria-label="Excluir ${esc(nome)}">${icone("trash")}Excluir</button>`;

const barraBusca = (rotulo) => `
  <div class="ferramentas"><div class="busca">${icone("magnifying-glass")}<input id="busca" class="input" type="search" placeholder="${esc(rotulo)}" autocomplete="off"></div></div>`;

/* ---------- Tela: alunos ---------- */
async function verAlunos(raiz) {
  const ehEscola = estado.tipo === "escola";
  const botaoNovo = ehEscola ? `<button type="button" class="btn btn-primario" id="novo">${icone("plus")}Novo aluno</button>` : "";
  raiz.innerHTML = cabecalho({
    titulo: "Alunos",
    subtitulo: ehEscola ? "Alunos da escola e o cuidador responsável por cada um." : "Alunos sob os seus cuidados.",
    acao: botaoNovo
  }) + `<div id="area-lista">${carregando()}</div>`;
  $("h1", raiz).focus();

  let alunos, cuidadores = [];
  try {
    [{ alunos }, cuidadores] = await Promise.all([
      api("GET", "/alunos"),
      ehEscola ? api("GET", "/cuidadores").then((r) => r.cuidadores) : []
    ]);
  } catch (erro) {
    $("#area-lista", raiz).innerHTML = falha(erro);
    $("[data-tentar]", raiz)?.addEventListener("click", () => verAlunos(raiz));
    return;
  }

  const recarregar = () => verAlunos(raiz);
  const ativos = cuidadores.filter((c) => c.ativo);

  const formAluno = (aluno) => {
    const opcoes = (aluno ? cuidadores : ativos)
      .map((c) => `<option value="${esc(c._id)}" ${aluno?.cuidador._id === c._id ? "selected" : ""}>${esc(c.nome)}${c.ativo ? "" : " (inativo)"}</option>`)
      .join("");
    return `
      ${campo({ nome: "nome", rotulo: "Nome", valor: aluno?.nome ?? "", obrigatorio: true })}
      ${campo({ nome: "dataNascimento", rotulo: "Data de nascimento", tipo: "date", valor: aluno?.dataNascimento?.slice(0, 10) ?? "", extra: `max="${hojeISO()}"` })}
      <div class="campo">
        <label for="c-cuidador">Cuidador responsável</label>
        <select class="input" id="c-cuidador" name="cuidador" required>${aluno ? "" : '<option value="" disabled selected>Escolha um cuidador</option>'}${opcoes}</select>
      </div>
      ${aluno ? `<label class="checa"><input type="checkbox" name="ativo" ${aluno.ativo ? "checked" : ""}>Aluno ativo</label>` : ""}`;
  };

  const novo = () => {
    if (ativos.length === 0) {
      avisar("Cadastre ao menos um cuidador ativo antes de criar um aluno.", "erro");
      location.hash = "#/cuidadores";
      return;
    }
    abrirJanela({
      titulo: "Novo aluno",
      corpo: formAluno(null),
      exemplo: (f) => {
        preencher(f, "nome", nomeAleatorio());
        preencher(f, "dataNascimento", `${entre(2008, 2020)}-${String(entre(1, 12)).padStart(2, "0")}-${String(entre(1, 28)).padStart(2, "0")}`);
        const opcoes = [...f.elements.cuidador.options].filter((o) => o.value);
        f.elements.cuidador.value = sorteia(opcoes).value;
        limparErros(f);
      },
      aoEnviar: async (f) => {
        const corpo = { nome: f.elements.nome.value.trim(), cuidador: f.elements.cuidador.value || undefined };
        if (f.elements.dataNascimento.value) corpo.dataNascimento = f.elements.dataNascimento.value;
        await api("POST", "/alunos", corpo);
        avisar("Aluno cadastrado.");
        recarregar();
        return true;
      }
    });
  };

  const editar = (aluno) => abrirJanela({
    titulo: "Editar aluno",
    corpo: formAluno(aluno),
    aoEnviar: async (f) => {
      // Só envia o que mudou: o back-end valida cada campo enviado (ex.: cuidador precisa estar ativo)
      const mudou = {};
      const nome = f.elements.nome.value.trim();
      if (nome !== aluno.nome) mudou.nome = nome;
      const data = f.elements.dataNascimento.value;
      if (data && data !== aluno.dataNascimento?.slice(0, 10)) mudou.dataNascimento = data;
      if (f.elements.cuidador.value !== aluno.cuidador._id) mudou.cuidador = f.elements.cuidador.value;
      if (f.elements.ativo.checked !== aluno.ativo) mudou.ativo = f.elements.ativo.checked;
      if (Object.keys(mudou).length === 0) return true;
      await api("PATCH", `/alunos/${aluno._id}`, mudou);
      avisar("Aluno atualizado.");
      recarregar();
      return true;
    }
  });

  const excluir = (aluno) => confirmar({
    titulo: "Excluir aluno",
    texto: `Excluir <strong>${esc(aluno.nome)}</strong>? Essa ação não pode ser desfeita.`,
    rotulo: "Excluir aluno",
    aoConfirmar: async () => { await api("DELETE", `/alunos/${aluno._id}`); avisar("Aluno excluído."); recarregar(); }
  });

  if (alunos.length > 0) $(".cabeca", raiz).insertAdjacentHTML("afterend", barraBusca("Buscar por aluno ou cuidador"));
  if (ehEscola) $("#novo", raiz).addEventListener("click", novo);

  listaComBusca(raiz, {
    itens: alunos,
    rotuloBusca: "Buscar por aluno ou cuidador",
    textoBusca: (a) => `${a.nome} ${a.cuidador?.nome ?? ""}`,
    colunas: [
      { titulo: "Aluno", classe: "nome", celula: (a) => esc(a.nome) },
      { titulo: "Nascimento", classe: "data", celula: (a) => formatarData(a.dataNascimento) },
      { titulo: "Cuidador", celula: (a) => `${esc(a.cuidador?.nome ?? "Sem cuidador")}${a.cuidador?.telefone ? `<span class="sec">${esc(a.cuidador.telefone)}</span>` : ""}` },
      { titulo: "Situação", celula: (a) => etiqueta(a.ativo) }
    ],
    acoes: ehEscola ? (a) => botoesLinha(a, a.nome) : null,
    vazioHtml: vazio({
      icone: "student",
      titulo: "Nenhum aluno por aqui",
      texto: ehEscola ? "Cadastre o primeiro aluno e escolha quem é o cuidador responsável." : "Quando a escola vincular alunos a você, eles aparecem nesta lista.",
      acao: ehEscola ? '<button type="button" class="btn btn-primario" data-novo-vazio>Novo aluno</button>' : ""
    })
  });

  raiz.onclick = (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.hasAttribute("data-novo-vazio")) novo();
    const achar = (id) => alunos.find((a) => a._id === id);
    if (btn.dataset.editar) editar(achar(btn.dataset.editar));
    if (btn.dataset.excluir) excluir(achar(btn.dataset.excluir));
  };
}

/* ---------- Tela: cuidadores ---------- */
async function verCuidadores(raiz) {
  raiz.innerHTML = cabecalho({
    titulo: "Cuidadores",
    subtitulo: "Pessoas que acompanham os alunos. Elas entram no sistema com o email e a senha cadastrados aqui.",
    acao: `<button type="button" class="btn btn-primario" id="novo">${icone("plus")}Novo cuidador</button>`
  }) + `<div id="area-lista">${carregando()}</div>`;
  $("h1", raiz).focus();

  let cuidadores;
  try {
    ({ cuidadores } = await api("GET", "/cuidadores"));
  } catch (erro) {
    $("#area-lista", raiz).innerHTML = falha(erro);
    $("[data-tentar]", raiz)?.addEventListener("click", () => verCuidadores(raiz));
    return;
  }
  const recarregar = () => verCuidadores(raiz);

  const formCuidador = (c) => `
    ${campo({ nome: "nome", rotulo: "Nome", valor: c?.nome ?? "", obrigatorio: true })}
    <div class="grade">
      ${campo({ nome: "telefone", rotulo: "Telefone", tipo: "tel", valor: c?.telefone ?? "", obrigatorio: true })}
      ${campo({ nome: "email", rotulo: "Email", tipo: "email", valor: c?.email ?? "", obrigatorio: true })}
    </div>
    <div class="campo">
      <label for="c-senha">${c ? "Nova senha" : "Senha"}${c ? ' <span class="ajuda">(opcional)</span>' : ""}</label>
      <input class="input" id="c-senha" name="senha" type="password" maxlength="72" autocomplete="new-password" ${c ? "" : "required"} aria-describedby="c-senha-ajuda">
      <span class="ajuda" id="c-senha-ajuda">${c ? "Deixe em branco para manter a senha atual. " : ""}Mínimo de 8 caracteres.</span>
    </div>
    ${c ? `<label class="checa"><input type="checkbox" name="ativo" ${c.ativo ? "checked" : ""}>Cuidador ativo</label>` : ""}`;

  const novo = () => abrirJanela({
    titulo: "Novo cuidador",
    corpo: formCuidador(null),
    exemplo: (f) => {
      const nome = nomeAleatorio();
      preencher(f, "nome", nome);
      preencher(f, "telefone", telefoneAleatorio());
      preencher(f, "email", emailAleatorio(nome));
      preencherSenha(f);
      limparErros(f);
    },
    aoEnviar: async (f) => {
      await api("POST", "/cuidadores", {
        nome: f.elements.nome.value.trim(),
        telefone: f.elements.telefone.value.trim(),
        email: f.elements.email.value.trim(),
        senha: f.elements.senha.value
      });
      avisar("Cuidador cadastrado.");
      recarregar();
      return true;
    }
  });

  const editar = (c) => abrirJanela({
    titulo: "Editar cuidador",
    corpo: formCuidador(c),
    aoEnviar: async (f) => {
      const mudou = {};
      const valores = { nome: f.elements.nome.value.trim(), telefone: f.elements.telefone.value.trim(), email: f.elements.email.value.trim().toLowerCase() };
      for (const [k, v] of Object.entries(valores)) if (v !== c[k]) mudou[k] = v;
      if (f.elements.senha.value) mudou.senha = f.elements.senha.value;
      if (f.elements.ativo.checked !== c.ativo) mudou.ativo = f.elements.ativo.checked;
      if (Object.keys(mudou).length === 0) return true;
      await api("PATCH", `/cuidadores/${c._id}`, mudou);
      avisar("Cuidador atualizado.");
      recarregar();
      return true;
    }
  });

  const excluir = (c) => confirmar({
    titulo: "Excluir cuidador",
    texto: `Excluir <strong>${esc(c.nome)}</strong>? Se houver alunos vinculados, passe-os para outro cuidador antes.`,
    rotulo: "Excluir cuidador",
    aoConfirmar: async () => { await api("DELETE", `/cuidadores/${c._id}`); avisar("Cuidador excluído."); recarregar(); }
  });

  if (cuidadores.length > 0) $(".cabeca", raiz).insertAdjacentHTML("afterend", barraBusca("Buscar por nome ou email"));
  $("#novo", raiz).addEventListener("click", novo);

  listaComBusca(raiz, {
    itens: cuidadores,
    rotuloBusca: "Buscar por nome ou email",
    textoBusca: (c) => `${c.nome} ${c.email}`,
    colunas: [
      { titulo: "Cuidador", classe: "nome", celula: (c) => esc(c.nome) },
      { titulo: "Contato", celula: (c) => `${esc(c.email)}<span class="sec">${esc(c.telefone)}</span>` },
      { titulo: "Situação", celula: (c) => etiqueta(c.ativo) }
    ],
    acoes: (c) => botoesLinha(c, c.nome),
    vazioHtml: vazio({
      icone: "users-three",
      titulo: "Nenhum cuidador cadastrado",
      texto: "Cadastre os cuidadores primeiro: cada aluno precisa de um cuidador responsável.",
      acao: '<button type="button" class="btn btn-primario" data-novo-vazio>Novo cuidador</button>'
    })
  });

  raiz.onclick = (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;
    if (btn.hasAttribute("data-novo-vazio")) novo();
    const achar = (id) => cuidadores.find((c) => c._id === id);
    if (btn.dataset.editar) editar(achar(btn.dataset.editar));
    if (btn.dataset.excluir) excluir(achar(btn.dataset.excluir));
  };
}

/* ---------- Tela: minha escola ---------- */
async function verEscola(raiz) {
  raiz.innerHTML = cabecalho({ titulo: "Minha escola", subtitulo: "Dados cadastrais e de acesso." }) + `<div id="area-lista">${carregando()}</div>`;
  $("h1", raiz).focus();
  raiz.onclick = null;

  let escola;
  try {
    ({ escola } = await api("GET", "/escolas/eu"));
  } catch (erro) {
    $("#area-lista", raiz).innerHTML = falha(erro);
    $("[data-tentar]", raiz)?.addEventListener("click", () => verEscola(raiz));
    return;
  }

  const e = escola.endereco;
  $("#area-lista", raiz).innerHTML = `
    <section class="painel detalhes" aria-label="Dados da escola">
      <dl>
        <div><dt>Razão social</dt><dd>${esc(escola.razaoSocial)}</dd></div>
        <div><dt>CNPJ</dt><dd>${esc(formatarCnpj(escola.cnpj))}</dd></div>
        <div><dt>Endereço</dt><dd>${esc(`${e.rua}, ${e.numero}`)}<br>${esc(`${e.municipio}, ${e.estado}`)}</dd></div>
        <div><dt>Email</dt><dd>${esc(escola.email)}</dd></div>
        <div><dt>Telefone</dt><dd>${esc(escola.telefone1)}</dd></div>
        ${escola.telefone2 ? `<div><dt>Segundo telefone</dt><dd>${esc(escola.telefone2)}</dd></div>` : ""}
      </dl>
      <div><button type="button" class="btn btn-primario" id="editar">${icone("pencil-simple")}Editar dados</button></div>
    </section>
    <section class="painel perigo-zona" aria-label="Excluir escola">
      <p><strong>Excluir escola</strong>Só é possível quando não houver cuidadores nem alunos cadastrados. O CNPJ e o email ficam livres para um novo cadastro.</p>
      <button type="button" class="btn btn-perigo" id="excluir">${icone("trash")}Excluir escola</button>
    </section>`;

  $("#editar", raiz).addEventListener("click", () => abrirJanela({
    titulo: "Editar escola",
    corpo: `
      ${campo({ nome: "razaoSocial", rotulo: "Razão social", valor: escola.razaoSocial, obrigatorio: true })}
      <div class="grade">
        ${campo({ nome: "endereco.rua", rotulo: "Rua", valor: e.rua, obrigatorio: true, classe: "largo" })}
        ${campo({ nome: "endereco.numero", rotulo: "Número", valor: e.numero, obrigatorio: true })}
        ${campo({ nome: "endereco.municipio", rotulo: "Município", valor: e.municipio, obrigatorio: true })}
        ${campo({ nome: "endereco.estado", rotulo: "Estado", valor: e.estado, obrigatorio: true })}
        ${campo({ nome: "telefone1", rotulo: "Telefone", tipo: "tel", valor: escola.telefone1, obrigatorio: true })}
        ${campo({ nome: "telefone2", rotulo: "Segundo telefone", tipo: "tel", valor: escola.telefone2 ?? "" })}
        ${campo({ nome: "email", rotulo: "Email", tipo: "email", valor: escola.email, obrigatorio: true, classe: "largo" })}
        <div class="campo largo">
          <label for="c-senha">Nova senha <span class="ajuda">(opcional)</span></label>
          <input class="input" id="c-senha" name="senha" type="password" maxlength="72" autocomplete="new-password">
          <span class="ajuda">Deixe em branco para manter a senha atual. Mínimo de 8 caracteres.</span>
        </div>
      </div>`,
    aoEnviar: async (f) => {
      const { corpo, telefone2 } = corpoEscola(f);
      const mudou = {};
      if (corpo.razaoSocial !== escola.razaoSocial) mudou.razaoSocial = corpo.razaoSocial;
      if (JSON.stringify(corpo.endereco) !== JSON.stringify({ numero: e.numero, rua: e.rua, municipio: e.municipio, estado: e.estado })) mudou.endereco = corpo.endereco;
      if (corpo.telefone1 !== escola.telefone1) mudou.telefone1 = corpo.telefone1;
      if (corpo.email.toLowerCase() !== escola.email) mudou.email = corpo.email;
      if (telefone2 !== (escola.telefone2 ?? "")) mudou.telefone2 = telefone2 === "" ? null : telefone2;
      if (f.elements.senha.value) mudou.senha = f.elements.senha.value;
      if (Object.keys(mudou).length === 0) return true;
      await api("PATCH", "/escolas/eu", mudou);
      avisar("Dados da escola atualizados.");
      await carregarQuem();
      mostrarApp();
      return true;
    }
  }));

  $("#excluir", raiz).addEventListener("click", () => confirmar({
    titulo: "Excluir escola",
    texto: `Excluir <strong>${esc(escola.razaoSocial)}</strong>? Essa ação não pode ser desfeita.`,
    rotulo: "Excluir escola",
    aoConfirmar: async () => { await api("DELETE", "/escolas/eu"); sair("Escola excluída."); }
  }));
}

/* ---------- Tela: dados do cuidador ---------- */
async function verPerfil(raiz) {
  raiz.innerHTML = cabecalho({ titulo: "Meus dados", subtitulo: "Para alterar qualquer informação, fale com a escola." }) + `<div id="area-lista">${carregando()}</div>`;
  $("h1", raiz).focus();
  raiz.onclick = null;
  try {
    const { cuidador } = await api("GET", "/cuidadores/eu");
    $("#area-lista", raiz).innerHTML = `
      <section class="painel detalhes" aria-label="Seus dados"><dl>
        <div><dt>Nome</dt><dd>${esc(cuidador.nome)}</dd></div>
        <div><dt>Email</dt><dd>${esc(cuidador.email)}</dd></div>
        <div><dt>Telefone</dt><dd>${esc(cuidador.telefone)}</dd></div>
        <div><dt>Situação</dt><dd>${etiqueta(cuidador.ativo)}</dd></div>
      </dl></section>`;
  } catch (erro) {
    $("#area-lista", raiz).innerHTML = falha(erro);
    $("[data-tentar]", raiz)?.addEventListener("click", () => verPerfil(raiz));
  }
}

/* ---------- Início ---------- */
window.addEventListener("hashchange", () => rotear());

(async function iniciar() {
  if (estado.token) {
    estado.tipo = tipoDoToken(estado.token);
    try {
      await carregarQuem();
      if (!location.hash.startsWith("#/")) location.hash = "#/alunos";
      mostrarApp();
      return;
    } catch {
      sair();
      return;
    }
  }
  mostrarEntrada("login-escola");
})();
