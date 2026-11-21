// Dados da escola (perfil escola) e dados do cuidador logado (perfil cuidador).
import { api } from "./api.js";
import { $, avisar, cabecalho, campo, campoSenha, carregando, confirmar, esc, formatarCnpj, etiqueta, icone, ligarForm, mostrarFalha, reaplicarMascaras, voltar } from "./ui.js";

// Lê o formulário de escola no formato da API (telefone2 vai separado: vazio significa "sem segundo telefone")
export const corpoEscola = (f) => {
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

/* ---------- Minha escola ---------- */
export async function verEscola(ctx) {
  const { raiz } = ctx;
  raiz.innerHTML = cabecalho({ titulo: "Minha escola", subtitulo: "Dados cadastrais e de acesso." }) + `<div id="area">${carregando()}</div>`;
  const area = $("#area", raiz);
  let escola;
  try {
    ({ escola } = await api("GET", "/escolas/eu"));
  } catch (erro) {
    if (ctx.vivo()) mostrarFalha(area, erro, ctx.recarregar);
    return;
  }
  if (!ctx.vivo()) return;

  const e = escola.endereco;
  area.innerHTML = `
    <section class="painel" aria-labelledby="t-dados">
      <div class="painel-topo"><h2 id="t-dados">Dados da escola</h2><a class="btn" href="#/escola/editar">${icone("pencil-simple")}Editar dados</a></div>
      <dl class="detalhes">
        <div><dt>Razão social</dt><dd>${esc(escola.razaoSocial)}</dd></div>
        <div><dt>CNPJ</dt><dd>${esc(formatarCnpj(escola.cnpj))}</dd></div>
        <div><dt>Endereço</dt><dd>${esc(`${e.rua}, ${e.numero}`)}<br>${esc(`${e.municipio}, ${e.estado}`)}</dd></div>
        <div><dt>Email</dt><dd>${esc(escola.email)}</dd></div>
        <div><dt>Telefone</dt><dd>${esc(escola.telefone1)}</dd></div>
        ${escola.telefone2 ? `<div><dt>Segundo telefone</dt><dd>${esc(escola.telefone2)}</dd></div>` : ""}
      </dl>
    </section>
    <section class="painel zona-perigo" aria-labelledby="t-excluir">
      <div>
        <h2 id="t-excluir">Excluir escola</h2>
        <p>Só é possível quando não houver cuidadores nem alunos cadastrados. O CNPJ e o email ficam livres para um novo cadastro.</p>
      </div>
      <button type="button" class="btn btn-perigo" id="excluir">${icone("trash")}Excluir escola</button>
    </section>`;

  $("#excluir", raiz).addEventListener("click", () => confirmar({
    titulo: "Excluir escola",
    texto: `Excluir <strong>${esc(escola.razaoSocial)}</strong>? Essa ação não pode ser desfeita.`,
    rotulo: "Excluir escola",
    aoConfirmar: async () => { await api("DELETE", "/escolas/eu"); ctx.sair("Escola excluída."); }
  }));
}

/* ---------- Editar escola ---------- */
export async function verEscolaEditar(ctx) {
  const { raiz } = ctx;
  raiz.innerHTML = voltar("#/escola", "Minha escola") + cabecalho({ titulo: "Editar escola" }) + `<div id="area">${carregando()}</div>`;
  const area = $("#area", raiz);
  let escola;
  try {
    ({ escola } = await api("GET", "/escolas/eu"));
  } catch (erro) {
    if (ctx.vivo()) mostrarFalha(area, erro, ctx.recarregar);
    return;
  }
  if (!ctx.vivo()) return;

  const e = escola.endereco;
  area.innerHTML = `
    <form class="painel formulario" id="form" novalidate>
      <div class="grade">
        ${campo({ nome: "razaoSocial", rotulo: "Razão social", valor: escola.razaoSocial, obrigatorio: true, classe: "largo" })}
        ${campo({ nome: "endereco.rua", rotulo: "Rua", valor: e.rua, obrigatorio: true, classe: "largo" })}
        ${campo({ nome: "endereco.numero", rotulo: "Número", valor: e.numero, obrigatorio: true })}
        ${campo({ nome: "endereco.municipio", rotulo: "Município", valor: e.municipio, obrigatorio: true })}
        ${campo({ nome: "endereco.estado", rotulo: "Estado", valor: e.estado, obrigatorio: true })}
        ${campo({ nome: "telefone1", rotulo: "Telefone", tipo: "tel", valor: escola.telefone1, obrigatorio: true })}
        ${campo({ nome: "telefone2", rotulo: "Segundo telefone", tipo: "tel", valor: escola.telefone2 ?? "" })}
        ${campo({ nome: "email", rotulo: "Email", tipo: "email", valor: escola.email, obrigatorio: true, classe: "largo" })}
        ${campoSenha({ rotulo: "Nova senha", obrigatorio: false, autocomplete: "new-password", ajuda: "Deixe em branco para manter a senha atual. Mínimo de 8 caracteres.", classe: "largo" })}
      </div>
      <div class="acoes-form">
        <button class="btn btn-primario" type="submit">Salvar alterações</button>
        <a class="btn" href="#/escola">Cancelar</a>
      </div>
    </form>`;
  reaplicarMascaras(area);

  const form = $("#form", raiz);
  ligarForm(form, async () => {
    const { corpo, telefone2 } = corpoEscola(form);
    const mudou = {};
    if (corpo.razaoSocial !== escola.razaoSocial) mudou.razaoSocial = corpo.razaoSocial;
    if (JSON.stringify(corpo.endereco) !== JSON.stringify({ numero: e.numero, rua: e.rua, municipio: e.municipio, estado: e.estado })) mudou.endereco = corpo.endereco;
    if (corpo.telefone1 !== escola.telefone1) mudou.telefone1 = corpo.telefone1;
    if (corpo.email.toLowerCase() !== escola.email) mudou.email = corpo.email;
    if (telefone2 !== (escola.telefone2 ?? "")) mudou.telefone2 = telefone2 === "" ? null : telefone2;
    if (form.elements.senha.value) mudou.senha = form.elements.senha.value;
    if (Object.keys(mudou).length > 0) {
      await api("PATCH", "/escolas/eu", mudou);
      avisar("Dados da escola atualizados.");
      await ctx.atualizarUsuario();
    }
    ctx.ir("#/escola");
  });
}


/* ---------- Meus dados (cuidador) ---------- */
export async function verPerfil(ctx) {
  const { raiz } = ctx;
  raiz.innerHTML = cabecalho({ titulo: "Meus dados", subtitulo: "Para alterar qualquer informação, fale com a escola." }) + `<div id="area">${carregando()}</div>`;
  const area = $("#area", raiz);
  try {
    const { cuidador } = await api("GET", "/cuidadores/eu");
    if (!ctx.vivo()) return;
    area.innerHTML = `
      <section class="painel" aria-label="Seus dados"><dl class="detalhes">
        <div><dt>Nome</dt><dd>${esc(cuidador.nome)}</dd></div>
        <div><dt>Email</dt><dd>${esc(cuidador.email)}</dd></div>
        <div><dt>Telefone</dt><dd>${esc(cuidador.telefone)}</dd></div>
        <div><dt>Situação</dt><dd>${etiqueta(cuidador.ativo)}</dd></div>
      </dl></section>`;
  } catch (erro) {
    if (ctx.vivo()) mostrarFalha(area, erro, ctx.recarregar);
  }
}
