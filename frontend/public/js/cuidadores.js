// Cuidadores (só a escola gerencia): lista, ficha com os alunos vinculados e formulário de cadastro/edição.
import { api } from "./api.js";
import {
  $, avatar, avisar, cabecalho, campo, campoSenha, carregando, confirmar, esc, etiqueta, icone, idade, ligarForm,
  modoDev, mostrarFalha, plural, reaplicarMascaras, vazio, voltar
} from "./ui.js";

const excluirCuidador = (c, qtdAlunos, depois) => confirmar({
  titulo: "Excluir cuidador",
  texto: qtdAlunos > 0
    ? `<strong>${esc(c.nome)}</strong> tem ${plural(qtdAlunos, "aluno vinculado", "alunos vinculados")}. Passe-${qtdAlunos === 1 ? "o" : "os"} para outro cuidador antes de excluir.`
    : `Excluir <strong>${esc(c.nome)}</strong>? Essa ação não pode ser desfeita.`,
  rotulo: "Excluir cuidador",
  aoConfirmar: async () => {
    await api("DELETE", `/cuidadores/${c._id}`);
    avisar("Cuidador excluído.");
    depois();
  }
});

/* ---------- Lista ---------- */
export async function verCuidadores(ctx) {
  const { raiz } = ctx;
  raiz.innerHTML = cabecalho({
    titulo: "Cuidadores",
    subtitulo: "Quem acompanha os alunos. Cada cuidador entra com o email e a senha cadastrados aqui.",
    acoes: `<a class="btn btn-primario" href="#/cuidadores/novo">${icone("plus")}Novo cuidador</a>`
  }) + `<div id="area">${carregando()}</div>`;
  const area = $("#area", raiz);

  let cuidadores, alunos;
  try {
    [{ cuidadores }, { alunos }] = await Promise.all([api("GET", "/cuidadores"), api("GET", "/alunos")]);
  } catch (erro) {
    if (ctx.vivo()) mostrarFalha(area, erro, ctx.recarregar);
    return;
  }
  if (!ctx.vivo()) return;

  if (cuidadores.length === 0) {
    area.innerHTML = `<div class="painel">${vazio({
      icone: "users-three", titulo: "Nenhum cuidador cadastrado",
      texto: "Cadastre os cuidadores primeiro: cada aluno precisa de um cuidador responsável.",
      acao: '<a class="btn btn-primario" href="#/cuidadores/novo">Novo cuidador</a>'
    })}</div>`;
    return;
  }

  const total = new Map();
  alunos.forEach((a) => total.set(a.cuidador?._id, (total.get(a.cuidador?._id) ?? 0) + 1));

  area.innerHTML = `
    <div class="ferramentas">
      <div class="busca">${icone("magnifying-glass")}<label class="sr" for="busca">Buscar por nome ou email</label><input id="busca" class="input" type="search" placeholder="Buscar por nome ou email" autocomplete="off"></div>
    </div>
    <div id="lista" aria-live="polite"></div>`;
  const lista = $("#lista", area);

  const desenhar = (filtro = "") => {
    const termo = filtro.trim().toLowerCase();
    const visiveis = termo ? cuidadores.filter((c) => `${c.nome} ${c.email}`.toLowerCase().includes(termo)) : cuidadores;
    if (visiveis.length === 0) {
      lista.innerHTML = `<div class="painel">${vazio({ icone: "magnifying-glass", titulo: "Nada encontrado", texto: "Nenhum cuidador corresponde à busca." })}</div>`;
      return;
    }
    lista.innerHTML = `
      <p class="contagem">${plural(visiveis.length, "cuidador", "cuidadores")}</p>
      <div class="painel tabela-caixa"><table>
        <thead><tr><th scope="col">Cuidador</th><th scope="col">Contato</th><th scope="col">Alunos</th><th scope="col">Situação</th><th scope="col" class="acoes"><span class="sr">Ações</span></th></tr></thead>
        <tbody>${visiveis.map((c) => `
          <tr>
            <td class="nome" data-rotulo="Cuidador"><div class="pessoa">${avatar(c.nome)}<a href="#/cuidadores/${esc(c._id)}">${esc(c.nome)}</a></div></td>
            <td data-rotulo="Contato">${esc(c.email)}<span class="sec">${esc(c.telefone)}</span></td>
            <td data-rotulo="Alunos">${total.get(c._id) ?? 0}</td>
            <td data-rotulo="Situação">${etiqueta(c.ativo)}</td>
            <td class="acoes">
              <a class="btn btn-texto" href="#/cuidadores/${esc(c._id)}/editar" aria-label="Editar ${esc(c.nome)}">${icone("pencil-simple")}Editar</a>
              <button type="button" class="btn btn-texto perigo" data-excluir="${esc(c._id)}" aria-label="Excluir ${esc(c.nome)}">${icone("trash")}Excluir</button>
            </td>
          </tr>`).join("")}</tbody>
      </table></div>`;
  };
  desenhar();
  $("#busca", area).addEventListener("input", (e) => desenhar(e.target.value));
  area.addEventListener("click", (e) => {
    const botao = e.target.closest("[data-excluir]");
    if (!botao) return;
    const c = cuidadores.find((x) => x._id === botao.dataset.excluir);
    excluirCuidador(c, total.get(c._id) ?? 0, ctx.recarregar);
  });
}

/* ---------- Ficha ---------- */
export async function verCuidador(ctx) {
  const { raiz } = ctx;
  raiz.innerHTML = voltar("#/cuidadores", "Cuidadores") + `<div id="area">${carregando()}</div>`;
  const area = $("#area", raiz);

  let cuidador, vinculados;
  try {
    const [r, { alunos }] = await Promise.all([api("GET", `/cuidadores/${ctx.params.id}`), api("GET", "/alunos")]);
    cuidador = r.cuidador;
    vinculados = alunos.filter((a) => a.cuidador?._id === cuidador._id);
  } catch (erro) {
    if (!ctx.vivo()) return;
    if (erro.status === 404) {
      area.innerHTML = `<div class="painel">${vazio({ icone: "users-three", titulo: "Cuidador não encontrado", texto: "Ele pode ter sido excluído.", acao: '<a class="btn" href="#/cuidadores">Voltar para a lista</a>' })}</div>`;
    } else {
      mostrarFalha(area, erro, ctx.recarregar);
    }
    return;
  }
  if (!ctx.vivo()) return;
  document.title = `${cuidador.nome} | conecTEA`;

  area.innerHTML = `
    ${cabecalho({
      titulo: cuidador.nome,
      avatar: avatar(cuidador.nome, true),
      subtitulo: plural(vinculados.length, "aluno vinculado", "alunos vinculados"),
      acoes: `<a class="btn" href="#/cuidadores/${esc(cuidador._id)}/editar">${icone("pencil-simple")}Editar</a>
              <button type="button" class="btn btn-perigo-suave" id="excluir">${icone("trash")}Excluir</button>`
    })}
    ${cuidador.ativo ? "" : `<div class="alerta" role="note">${icone("warning")}<p><strong>Cuidador inativo.</strong> Ele não consegue entrar no sistema.${vinculados.length ? " Os alunos abaixo ficam sem acompanhamento até serem passados para outro cuidador." : ""}</p></div>`}
    <div class="duas-colunas">
      <section class="painel" aria-labelledby="t-contato">
        <h2 id="t-contato">Contato e acesso</h2>
        <dl class="detalhes">
          <div><dt>Email</dt><dd><a class="link" href="mailto:${esc(cuidador.email)}">${esc(cuidador.email)}</a></dd></div>
          <div><dt>Telefone</dt><dd><a class="link" href="tel:${esc(cuidador.telefone.replace(/[^\d+]/g, ""))}">${esc(cuidador.telefone)}</a></dd></div>
          <div><dt>Situação</dt><dd>${etiqueta(cuidador.ativo)}</dd></div>
        </dl>
      </section>
      <section class="painel" aria-labelledby="t-alunos">
        <h2 id="t-alunos">Alunos vinculados</h2>
        ${vinculados.length
          ? `<ul class="lista-simples">${vinculados.map((a) => `<li>${avatar(a.nome)}<a class="link" href="#/alunos/${esc(a._id)}">${esc(a.nome)}</a><span class="sec">${esc(idade(a.dataNascimento) ?? "Idade não informada")}${a.ativo ? "" : " · inativo"}</span></li>`).join("")}</ul>`
          : '<p class="sec">Nenhum aluno vinculado a este cuidador.</p>'}
      </section>
    </div>`;

  $("#excluir", area).addEventListener("click", () => excluirCuidador(cuidador, vinculados.length, () => ctx.ir("#/cuidadores")));
}

/* ---------- Formulário (novo e editar) ---------- */
export async function verCuidadorForm(ctx) {
  const { raiz } = ctx;
  const editando = Boolean(ctx.params.id);
  raiz.innerHTML = voltar(editando ? `#/cuidadores/${ctx.params.id}` : "#/cuidadores", editando ? "Ficha do cuidador" : "Cuidadores") +
    cabecalho({ titulo: editando ? "Editar cuidador" : "Novo cuidador" }) + `<div id="area">${editando ? carregando() : ""}</div>`;
  const area = $("#area", raiz);

  let c = null;
  if (editando) {
    try {
      ({ cuidador: c } = await api("GET", `/cuidadores/${ctx.params.id}`));
    } catch (erro) {
      if (ctx.vivo()) mostrarFalha(area, erro, ctx.recarregar);
      return;
    }
    if (!ctx.vivo()) return;
  }

  area.innerHTML = `
    <form class="painel formulario" id="form" novalidate>
      ${campo({ nome: "nome", rotulo: "Nome", valor: c?.nome ?? "", obrigatorio: true, extra: 'autocomplete="off"' })}
      <div class="grade">
        ${campo({ nome: "telefone", rotulo: "Telefone", tipo: "tel", valor: c?.telefone ?? "", obrigatorio: true, extra: 'autocomplete="off" placeholder="(88) 99999-0000"' })}
        ${campo({ nome: "email", rotulo: "Email", tipo: "email", valor: c?.email ?? "", obrigatorio: true, extra: 'autocomplete="off"', ajuda: "É o login do cuidador." })}
      </div>
      ${campoSenha({
        rotulo: editando ? "Nova senha" : "Senha", obrigatorio: !editando, autocomplete: "new-password",
        ajuda: `${editando ? "Deixe em branco para manter a senha atual. " : ""}Mínimo de 8 caracteres.`
      })}
      ${editando ? `<label class="checa"><input type="checkbox" name="ativo" ${c.ativo ? "checked" : ""}>Cuidador ativo</label>` : ""}
      <div class="acoes-form">
        <button class="btn btn-primario" type="submit">${editando ? "Salvar alterações" : "Cadastrar cuidador"}</button>
        <a class="btn" href="${editando ? `#/cuidadores/${esc(ctx.params.id)}` : "#/cuidadores"}">Cancelar</a>
        ${modoDev && !editando ? '<button type="button" class="btn btn-texto" data-exemplo>Preencher com dados de exemplo</button>' : ""}
      </div>
    </form>`;
  reaplicarMascaras(area);

  const form = $("#form", area);
  $("[data-exemplo]", form)?.addEventListener("click", async () => (await import("./dev-exemplos.js")).cuidador(form));

  ligarForm(form, async () => {
    const valores = {
      nome: form.elements.nome.value.trim(),
      telefone: form.elements.telefone.value.trim(),
      email: form.elements.email.value.trim()
    };
    if (!editando) {
      const { cuidador } = await api("POST", "/cuidadores", { ...valores, senha: form.elements.senha.value });
      avisar("Cuidador cadastrado.");
      ctx.ir(`#/cuidadores/${cuidador._id}`);
      return;
    }
    const mudou = {};
    for (const [k, v] of Object.entries(valores)) {
      if ((k === "email" ? v.toLowerCase() : v) !== c[k]) mudou[k] = v;
    }
    if (form.elements.senha.value) mudou.senha = form.elements.senha.value;
    if (form.elements.ativo.checked !== c.ativo) mudou.ativo = form.elements.ativo.checked;
    if (Object.keys(mudou).length > 0) {
      await api("PATCH", `/cuidadores/${c._id}`, mudou);
      avisar("Cuidador atualizado.");
    }
    ctx.ir(`#/cuidadores/${c._id}`);
  });
}
