// Alunos: lista (escola) ou "meus alunos" (cuidador), ficha do aluno e formulário de cadastro/edição.
// Permissões espelham o back-end: a escola cria, edita e exclui; o cuidador só consulta os alunos vinculados a ele.
import { api } from "./api.js";
import {
  $, $$, avatar, avisar, cabecalho, campo, campoSenha, carregando, confirmar, esc, etiqueta, formatarData, hojeISO, icone,
  idade, ligarForm, modoDev, mostrarFalha, plural, vazio, voltar
} from "./ui.js";

// Filtros que o painel inicial usa para levar a escola direto aos alunos que pedem atenção
export const FILTROS = {
  "sem-nascimento": { rotulo: "Sem data de nascimento", testa: (a) => a.ativo && !a.dataNascimento },
  "sem-acesso": { rotulo: "Sem email de acesso", testa: (a) => a.ativo && !a.email },
  "cuidador-inativo": { rotulo: "Com cuidador inativo", testa: (a, cuidadores) => a.ativo && cuidadores.get(a.cuidador?._id)?.ativo === false }
};

const excluirAluno = (ctx, aluno, depois) => confirmar({
  titulo: "Excluir aluno",
  texto: `Excluir <strong>${esc(aluno.nome)}</strong>? Essa ação não pode ser desfeita.`,
  rotulo: "Excluir aluno",
  aoConfirmar: async () => {
    await api("DELETE", `/alunos/${aluno._id}`);
    avisar("Aluno excluído.");
    depois();
  }
});

/* ---------- Lista ---------- */
export async function verAlunos(ctx) {
  const { raiz } = ctx;
  const ehEscola = ctx.perfil === "escola";
  const novo = ehEscola ? `<a class="btn btn-primario" href="#/alunos/novo">${icone("plus")}Novo aluno</a>` : "";
  raiz.innerHTML = cabecalho({
    titulo: ehEscola ? "Alunos" : `Olá, ${ctx.usuario.nome.split(" ")[0]}`,
    subtitulo: ehEscola ? "Alunos da escola e o cuidador responsável por cada um." : "Estes são os alunos que a escola vinculou a você.",
    acoes: novo
  }) + `<div id="area">${carregando()}</div>`;
  const area = $("#area", raiz);

  let alunos, cuidadores = [];
  try {
    [{ alunos }, cuidadores] = await Promise.all([
      api("GET", "/alunos"),
      ehEscola ? api("GET", "/cuidadores").then((r) => r.cuidadores) : []
    ]);
  } catch (erro) {
    if (ctx.vivo()) mostrarFalha(area, erro, ctx.recarregar);
    return;
  }
  if (!ctx.vivo()) return;

  if (!ehEscola) return desenharCartoes(area, alunos);

  const mapaCuidadores = new Map(cuidadores.map((c) => [c._id, c]));
  const filtroEspecial = FILTROS[ctx.query.get("filtro")] ?? null;
  const estado = { termo: "", situacao: "todos" };

  if (alunos.length === 0) {
    area.innerHTML = `<div class="painel">${vazio({
      icone: "student",
      titulo: "Nenhum aluno por aqui",
      texto: cuidadores.some((c) => c.ativo)
        ? "Cadastre o primeiro aluno e escolha quem é o cuidador responsável."
        : "Cada aluno precisa de um cuidador responsável. Cadastre um cuidador primeiro.",
      acao: cuidadores.some((c) => c.ativo)
        ? '<a class="btn btn-primario" href="#/alunos/novo">Novo aluno</a>'
        : '<a class="btn btn-primario" href="#/cuidadores/novo">Novo cuidador</a>'
    })}</div>`;
    return;
  }

  area.innerHTML = `
    <div class="ferramentas">
      <div class="busca">${icone("magnifying-glass")}<label class="sr" for="busca">Buscar por aluno, email ou cuidador</label><input id="busca" class="input" type="search" placeholder="Buscar por aluno, email ou cuidador" autocomplete="off"></div>
      <div class="chips" role="group" aria-label="Filtrar por situação">
        ${[["todos", "Todos"], ["ativo", "Ativos"], ["inativo", "Inativos"]].map(([v, r]) => `<button type="button" class="chip" data-situacao="${v}" aria-pressed="${v === "todos"}">${r}</button>`).join("")}
      </div>
    </div>
    ${filtroEspecial ? `<p class="filtro-ativo">Mostrando: <strong>${esc(filtroEspecial.rotulo)}</strong> <a class="link" href="#/alunos">Limpar filtro</a></p>` : ""}
    <div id="lista" aria-live="polite"></div>`;

  const lista = $("#lista", area);
  const desenhar = () => {
    const termo = estado.termo.trim().toLowerCase();
    const visiveis = alunos.filter((a) =>
      (estado.situacao === "todos" || a.ativo === (estado.situacao === "ativo")) &&
      (!filtroEspecial || filtroEspecial.testa(a, mapaCuidadores)) &&
      (!termo || `${a.nome} ${a.email ?? ""} ${a.cuidador?.nome ?? ""}`.toLowerCase().includes(termo)));
    if (visiveis.length === 0) {
      lista.innerHTML = `<div class="painel">${vazio({ icone: "magnifying-glass", titulo: "Nada encontrado", texto: "Nenhum aluno corresponde à busca ou ao filtro escolhido." })}</div>`;
      return;
    }
    lista.innerHTML = `
      <p class="contagem">${plural(visiveis.length, "aluno", "alunos")}</p>
      <div class="painel tabela-caixa"><table>
        <thead><tr><th scope="col">Aluno</th><th scope="col">Idade</th><th scope="col">Cuidador</th><th scope="col">Situação</th><th scope="col" class="acoes"><span class="sr">Ações</span></th></tr></thead>
        <tbody>${visiveis.map((a) => `
          <tr>
            <td class="nome" data-rotulo="Aluno"><div class="pessoa">${avatar(a.nome)}<div><a href="#/alunos/${esc(a._id)}">${esc(a.nome)}</a>${a.email ? `<span class="sec">${esc(a.email)}</span>` : ""}</div></div></td>
            <td data-rotulo="Idade">${esc(idade(a.dataNascimento) ?? "Não informada")}</td>
            <td data-rotulo="Cuidador">${esc(a.cuidador?.nome ?? "Sem cuidador")}${a.cuidador?.telefone ? `<span class="sec">${esc(a.cuidador.telefone)}</span>` : ""}</td>
            <td data-rotulo="Situação">${etiqueta(a.ativo)}</td>
            <td class="acoes">
              <a class="btn btn-texto" href="#/alunos/${esc(a._id)}/editar" aria-label="Editar ${esc(a.nome)}">${icone("pencil-simple")}Editar</a>
              <button type="button" class="btn btn-texto perigo" data-excluir="${esc(a._id)}" aria-label="Excluir ${esc(a.nome)}">${icone("trash")}Excluir</button>
            </td>
          </tr>`).join("")}</tbody>
      </table></div>`;
  };
  desenhar();

  $("#busca", area).addEventListener("input", (e) => { estado.termo = e.target.value; desenhar(); });
  area.addEventListener("click", (e) => {
    const chip = e.target.closest("[data-situacao]");
    if (chip) {
      estado.situacao = chip.dataset.situacao;
      $$("[data-situacao]", area).forEach((c) => c.setAttribute("aria-pressed", String(c === chip)));
      desenhar();
      return;
    }
    const excluir = e.target.closest("[data-excluir]");
    if (excluir) excluirAluno(ctx, alunos.find((a) => a._id === excluir.dataset.excluir), ctx.recarregar);
  });
}

function desenharCartoes(area, alunos) {
  if (alunos.length === 0) {
    area.innerHTML = `<div class="painel">${vazio({ icone: "student", titulo: "Nenhum aluno vinculado a você", texto: "Quando a escola vincular alunos a você, eles aparecem aqui." })}</div>`;
    return;
  }
  area.innerHTML = `<ul class="cartoes">${alunos.map((a) => `
    <li class="cartao">
      <div class="cartao-topo">
        ${avatar(a.nome, true)}
        <div class="cartao-info">
          <a class="cartao-nome" href="#/alunos/${esc(a._id)}">${esc(a.nome)}</a>
          <span class="sec">${esc(idade(a.dataNascimento) ?? "Idade não informada")}</span>
          ${a.ativo ? "" : etiqueta(false)}
        </div>
      </div>
      <div class="cartao-acoes">
        <a class="btn btn-primario" href="#/alunos/${esc(a._id)}" aria-label="Ver ficha de ${esc(a.nome)}">Ver ficha</a>
      </div>
    </li>`).join("")}</ul>`;
}

/* ---------- Ficha do aluno ---------- */
export async function verAluno(ctx) {
  const { raiz } = ctx;
  const ehEscola = ctx.perfil === "escola";
  raiz.innerHTML = voltar("#/alunos", ehEscola ? "Alunos" : "Meus alunos") + `<div id="area">${carregando()}</div>`;
  const area = $("#area", raiz);

  let aluno, cuidadorCompleto = null;
  try {
    ({ aluno } = await api("GET", `/alunos/${ctx.params.id}`));
    // Só a escola consulta cuidadores: com isso dá para avisar se o responsável estiver inativo
    if (ehEscola && aluno.cuidador?._id) {
      cuidadorCompleto = await api("GET", `/cuidadores/${aluno.cuidador._id}`).then((r) => r.cuidador).catch(() => null);
    }
  } catch (erro) {
    if (!ctx.vivo()) return;
    if (erro.status === 404) {
      area.innerHTML = `<div class="painel">${vazio({ icone: "student", titulo: "Aluno não encontrado", texto: "Ele pode ter sido excluído ou não estar vinculado a você.", acao: `<a class="btn" href="#/alunos">Voltar para a lista</a>` })}</div>`;
    } else {
      mostrarFalha(area, erro, ctx.recarregar);
    }
    return;
  }
  if (!ctx.vivo()) return;
  document.title = `${aluno.nome} | conecTEA`;

  const c = aluno.cuidador;
  const sinal = idade(aluno.dataNascimento);
  const cuidadorInativo = cuidadorCompleto && !cuidadorCompleto.ativo;
  area.innerHTML = `
    ${cabecalho({
      titulo: aluno.nome,
      avatar: avatar(aluno.nome, true),
      subtitulo: sinal ? `${sinal}` : "Data de nascimento não informada",
      acoes: `
        ${ehEscola ? `<a class="btn" href="#/alunos/${esc(aluno._id)}/editar">${icone("pencil-simple")}Editar</a>
        <button type="button" class="btn btn-perigo-suave" id="excluir">${icone("trash")}Excluir</button>` : ""}`
    })}
    ${cuidadorInativo ? `<div class="alerta" role="note">${icone("warning")}<p><strong>O cuidador responsável está inativo</strong> e não consegue entrar no sistema. Escolha outro cuidador em <a class="link" href="#/alunos/${esc(aluno._id)}/editar">Editar</a>.</p></div>` : ""}
    <p class="nota">${icone("info")}O aluno usa o comunicador entrando com o email e a senha cadastrados pela escola.</p>
    <div class="duas-colunas">
      <section class="painel" aria-labelledby="t-aluno">
        <h2 id="t-aluno">Dados do aluno</h2>
        <dl class="detalhes">
          <div><dt>Nascimento</dt><dd>${esc(formatarData(aluno.dataNascimento))}</dd></div>
          <div><dt>Email de acesso</dt><dd>${aluno.email ? esc(aluno.email) : `Não cadastrado${ehEscola ? ` — <a class="link" href="#/alunos/${esc(aluno._id)}/editar">cadastrar</a>` : ""}`}</dd></div>
          <div><dt>Situação</dt><dd>${etiqueta(aluno.ativo)}</dd></div>
        </dl>
      </section>
      <section class="painel" aria-labelledby="t-cuidador">
        <h2 id="t-cuidador">Cuidador responsável</h2>
        <dl class="detalhes">
          <div><dt>Nome</dt><dd>${ehEscola && c?._id ? `<a class="link" href="#/cuidadores/${esc(c._id)}">${esc(c.nome)}</a>` : esc(c?.nome ?? "Sem cuidador")}</dd></div>
          ${c?.email ? `<div><dt>Email</dt><dd><a class="link" href="mailto:${esc(c.email)}">${esc(c.email)}</a></dd></div>` : ""}
          ${c?.telefone ? `<div><dt>Telefone</dt><dd><a class="link" href="tel:${esc(c.telefone.replace(/[^\d+]/g, ""))}">${esc(c.telefone)}</a></dd></div>` : ""}
        </dl>
      </section>
    </div>`;

  $("#excluir", area)?.addEventListener("click", () => excluirAluno(ctx, aluno, () => ctx.ir("#/alunos")));
}

/* ---------- Formulário (novo e editar) — só a escola ---------- */
export async function verAlunoForm(ctx) {
  const { raiz } = ctx;
  const editando = Boolean(ctx.params.id);
  raiz.innerHTML = voltar(editando ? `#/alunos/${ctx.params.id}` : "#/alunos", editando ? "Ficha do aluno" : "Alunos") +
    cabecalho({ titulo: editando ? "Editar aluno" : "Novo aluno" }) + `<div id="area">${carregando()}</div>`;
  const area = $("#area", raiz);

  let aluno = null, cuidadores;
  try {
    const [resAluno, resCuidadores] = await Promise.all([
      editando ? api("GET", `/alunos/${ctx.params.id}`) : null,
      api("GET", "/cuidadores")
    ]);
    aluno = resAluno?.aluno ?? null;
    cuidadores = resCuidadores.cuidadores;
  } catch (erro) {
    if (ctx.vivo()) mostrarFalha(area, erro, ctx.recarregar);
    return;
  }
  if (!ctx.vivo()) return;

  const ativos = cuidadores.filter((c) => c.ativo);
  if (!editando && ativos.length === 0) {
    area.innerHTML = `<div class="painel">${vazio({ icone: "users-three", titulo: "Cadastre um cuidador primeiro", texto: "Cada aluno precisa de um cuidador responsável ativo.", acao: '<a class="btn btn-primario" href="#/cuidadores/novo">Novo cuidador</a>' })}</div>`;
    return;
  }

  // Na edição, o cuidador atual aparece mesmo se estiver inativo, para o formulário refletir a situação real
  const opcoes = (editando ? cuidadores : ativos)
    .map((c) => `<option value="${esc(c._id)}" ${aluno?.cuidador._id === c._id ? "selected" : ""}>${esc(c.nome)}${c.ativo ? "" : " (inativo)"}</option>`)
    .join("");

  area.innerHTML = `
    <form class="painel formulario" id="form" novalidate>
      ${campo({ nome: "nome", rotulo: "Nome do aluno", valor: aluno?.nome ?? "", obrigatorio: true, extra: 'autocomplete="off"' })}
      ${campo({ nome: "dataNascimento", rotulo: "Data de nascimento", tipo: "date", valor: aluno?.dataNascimento?.slice(0, 10) ?? "", extra: `max="${hojeISO()}"` })}
      <div class="campo">
        <label for="c-cuidador">Cuidador responsável</label>
        <select class="input" id="c-cuidador" name="cuidador" data-rotulo="Cuidador responsável" required>${editando ? "" : '<option value="" disabled selected>Escolha um cuidador</option>'}${opcoes}</select>
      </div>
      <fieldset>
        <legend>Acesso do aluno ao comunicador</legend>
        <div class="grade">
          ${campo({ nome: "email", rotulo: "Email do aluno", tipo: "email", valor: aluno?.email ?? "", obrigatorio: true, extra: 'autocomplete="off"', ajuda: "É o login do aluno." })}
          ${campoSenha({ rotulo: editando ? "Nova senha" : "Senha", obrigatorio: !editando, autocomplete: "new-password", ajuda: `${editando ? "Deixe em branco para manter a senha atual. " : ""}Mínimo de 8 caracteres.` })}
        </div>
      </fieldset>
      ${editando ? `<label class="checa"><input type="checkbox" name="ativo" ${aluno.ativo ? "checked" : ""}>Aluno ativo (aluno inativo não consegue entrar)</label>` : ""}
      <div class="acoes-form">
        <button class="btn btn-primario" type="submit">${editando ? "Salvar alterações" : "Cadastrar aluno"}</button>
        <a class="btn" href="${editando ? `#/alunos/${esc(ctx.params.id)}` : "#/alunos"}">Cancelar</a>
        ${modoDev && !editando ? '<button type="button" class="btn btn-texto" data-exemplo>Preencher com dados de exemplo</button>' : ""}
      </div>
    </form>`;

  const form = $("#form", area);
  $("[data-exemplo]", form)?.addEventListener("click", async () => (await import("./dev-exemplos.js")).aluno(form));

  ligarForm(form, async () => {
    const nome = form.elements.nome.value.trim();
    const data = form.elements.dataNascimento.value;
    const cuidador = form.elements.cuidador.value;
    const email = form.elements.email.value.trim();
    const senha = form.elements.senha.value;
    if (!editando) {
      const corpo = { nome, email, senha, cuidador };
      if (data) corpo.dataNascimento = data;
      const { aluno: criado } = await api("POST", "/alunos", corpo);
      avisar("Aluno cadastrado.");
      ctx.ir(`#/alunos/${criado._id}`);
      return;
    }
    // Só envia o que mudou: o back-end valida cada campo enviado (ex.: o cuidador precisa estar ativo)
    const mudou = {};
    if (nome !== aluno.nome) mudou.nome = nome;
    if (data && data !== aluno.dataNascimento?.slice(0, 10)) mudou.dataNascimento = data;
    if (cuidador !== aluno.cuidador._id) mudou.cuidador = cuidador;
    if (email.toLowerCase() !== (aluno.email ?? "")) mudou.email = email;
    if (senha) mudou.senha = senha;
    if (form.elements.ativo.checked !== aluno.ativo) mudou.ativo = form.elements.ativo.checked;
    if (Object.keys(mudou).length > 0) {
      await api("PATCH", `/alunos/${aluno._id}`, mudou);
      avisar("Aluno atualizado.");
    }
    ctx.ir(`#/alunos/${aluno._id}`);
  });
}
