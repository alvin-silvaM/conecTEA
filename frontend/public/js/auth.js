// Entrada no sistema: login (escola por CNPJ, cuidador por email) e cadastro de escola.
// O aluno entra com o email e a senha cadastrados pela escola e cai direto no comunicador.
import { api } from "./api.js";
import { $, $$, avisar, campo, campoSenha, ligarForm, marca, modoDev, soDigitos } from "./ui.js";
import { corpoEscola } from "./escola.js";

// Trama decorativa do painel de marca (fios cruzados, bem sutis)
const trama = `<svg class="trama" aria-hidden="true" focusable="false"><defs><pattern id="trama" width="48" height="48" patternUnits="userSpaceOnUse"><path d="M0 12h20M28 12h20M12 0v20M12 28v20M24 36h20M36 24v20" stroke="currentColor" stroke-width="3" stroke-linecap="round" fill="none"/></pattern></defs><rect width="100%" height="100%" fill="url(#trama)"/></svg>`;

const painelMarca = `
  <aside class="entrada-marca">
    ${trama}
    <span class="logo">${marca}</span>
    <div>
      <h1>Cada criança tem o direito de se comunicar</h1>
      <span class="fio" aria-hidden="true"></span>
      <p>Comunicação aumentativa e alternativa para a rotina escolar, acompanhada pela escola e pelos cuidadores.</p>
    </div>
    <p class="entrada-selo">Projeto universitário de pesquisa em CAA</p>
  </aside>`;

// "modo": "escola" | "cuidador" | "aluno" | "cadastro". ctx.entrar(token) inicia a sessão.
export function telaEntrada(raiz, modo, ctx) {
  const ehCadastro = modo === "cadastro";
  raiz.innerHTML = `
    <div class="entrada">
      ${painelMarca}
      <main class="entrada-form" id="conteudo">
        <div class="entrada-caixa ${ehCadastro ? "larga" : ""}">${ehCadastro ? formCadastro() : formLogin(modo)}</div>
      </main>
    </div>`;
  document.title = ehCadastro ? "Cadastrar escola | conecTEA" : "Entrar | conecTEA";
  $$("[data-modo]", raiz).forEach((b) => b.addEventListener("click", () => ctx.trocar(b.dataset.modo)));
  if (ehCadastro) ligarCadastro(raiz, ctx);
  else ligarLogin(raiz, modo, ctx);
  $(".input", raiz)?.focus();
}

const ACESSOS = [["escola", "Escola"], ["cuidador", "Cuidador"], ["aluno", "Aluno"]];

function formLogin(modo) {
  const escola = modo === "escola";
  return `
    <h2>Entrar no conecTEA</h2>
    <div class="troca" role="group" aria-label="Tipo de acesso">
      ${ACESSOS.map(([id, rotulo]) => `<button type="button" data-modo="${id}" aria-pressed="${id === modo}">${rotulo}</button>`).join("")}
    </div>
    <form id="form-login" novalidate>
      ${escola
        ? campo({ nome: "cnpj", rotulo: "CNPJ da escola", obrigatorio: true, extra: 'autocomplete="username" placeholder="00.000.000/0000-00"' })
        : campo({ nome: "email", rotulo: modo === "aluno" ? "Email do aluno" : "Email", tipo: "email", obrigatorio: true, extra: 'autocomplete="username" placeholder="nome@exemplo.com"' })}
      ${campoSenha({ autocomplete: "current-password" })}
      <button class="btn btn-primario btn-largo" type="submit">Entrar</button>
    </form>
    ${escola
      ? '<p class="rodape-form">Sua escola ainda não tem conta? <button type="button" class="link" data-modo="cadastro">Cadastrar escola</button></p>'
      : `<p class="rodape-form">O acesso ${modo === "aluno" ? "do aluno" : "do cuidador"} é criado pela escola. Se ainda não recebeu o seu, fale com a coordenação.</p>`}`;
}

function ligarLogin(raiz, modo, ctx) {
  const form = $("#form-login", raiz);
  ligarForm(form, async () => {
    const dados = Object.fromEntries(new FormData(form));
    const { token } = modo === "escola"
      ? await api("POST", "/escolas", { cnpj: soDigitos(dados.cnpj), senha: dados.senha })
      : await api("POST", modo === "aluno" ? "/alunos/login" : "/cuidadores/login", { email: dados.email.trim(), senha: dados.senha });
    await ctx.entrar(token);
  }, { simples: true });
}

function formCadastro() {
  return `
    <h2>Cadastrar escola</h2>
    <p class="rodape-form">Depois do cadastro você entra direto e já pode cadastrar cuidadores e alunos.</p>
    <form id="form-cadastro" novalidate>
      <fieldset>
        <legend>Dados da escola</legend>
        <div class="grade">
          ${campo({ nome: "cnpj", rotulo: "CNPJ", obrigatorio: true, ajuda: "14 números", extra: 'placeholder="00.000.000/0000-00" autocomplete="off"' })}
          ${campo({ nome: "razaoSocial", rotulo: "Razão social", obrigatorio: true, extra: 'autocomplete="organization"' })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Endereço</legend>
        <div class="grade">
          ${campo({ nome: "endereco.rua", rotulo: "Rua", obrigatorio: true, classe: "largo", extra: 'autocomplete="address-line1"' })}
          ${campo({ nome: "endereco.numero", rotulo: "Número", obrigatorio: true })}
          ${campo({ nome: "endereco.municipio", rotulo: "Município", obrigatorio: true, extra: 'autocomplete="address-level2"' })}
          ${campo({ nome: "endereco.estado", rotulo: "Estado", obrigatorio: true, extra: 'autocomplete="address-level1"' })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Contato e acesso</legend>
        <div class="grade">
          ${campo({ nome: "telefone1", rotulo: "Telefone", tipo: "tel", obrigatorio: true, extra: 'placeholder="(88) 99999-0000" autocomplete="tel"' })}
          ${campo({ nome: "telefone2", rotulo: "Segundo telefone", tipo: "tel" })}
          ${campo({ nome: "email", rotulo: "Email", tipo: "email", obrigatorio: true, extra: 'autocomplete="email"' })}
          ${campoSenha({ rotulo: "Senha", ajuda: "Mínimo de 8 caracteres", autocomplete: "new-password" })}
        </div>
      </fieldset>
      <div class="acoes-form">
        <button class="btn btn-primario" type="submit">Cadastrar escola</button>
        ${modoDev ? '<button type="button" class="btn btn-texto" data-exemplo>Preencher com dados de exemplo</button>' : ""}
      </div>
    </form>
    <p class="rodape-form">Já tem conta? <button type="button" class="link" data-modo="escola">Entrar</button></p>`;
}

function ligarCadastro(raiz, ctx) {
  const form = $("#form-cadastro", raiz);
  $("[data-exemplo]", form)?.addEventListener("click", async () => (await import("./dev-exemplos.js")).cadastroEscola(form));
  ligarForm(form, async () => {
    const { corpo, telefone2 } = corpoEscola(form);
    const cnpj = soDigitos(form.elements.cnpj.value);
    const senha = form.elements.senha.value;
    await api("POST", "/escolas/cadastro", { cnpj, ...corpo, ...(telefone2 ? { telefone2 } : {}), senha });
    const { token } = await api("POST", "/escolas", { cnpj, senha });
    await ctx.entrar(token);
    avisar("Escola cadastrada. Bem-vinda ao conecTEA!");
  });
}
