// Início da escola: panorama feito só com o que o back-end informa (alunos e cuidadores)
// e uma lista do que precisa de atenção no cadastro.
import { api } from "./api.js";
import { $, avatar, cabecalho, carregando, esc, icone, mostrarFalha, plural } from "./ui.js";

export async function verInicio(ctx) {
  const { raiz } = ctx;
  raiz.innerHTML = cabecalho({
    titulo: "Início",
    subtitulo: new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }).replace(/^./, (c) => c.toUpperCase()),
    acoes: `<a class="btn" href="#/cuidadores/novo">${icone("plus")}Novo cuidador</a><a class="btn btn-primario" href="#/alunos/novo">${icone("plus")}Novo aluno</a>`
  }) + `<div id="area">${carregando()}</div>`;
  const area = $("#area", raiz);

  let alunos, cuidadores;
  try {
    [{ alunos }, { cuidadores }] = await Promise.all([api("GET", "/alunos"), api("GET", "/cuidadores")]);
  } catch (erro) {
    if (ctx.vivo()) mostrarFalha(area, erro, ctx.recarregar);
    return;
  }
  if (!ctx.vivo()) return;

  const cuidadorPorId = new Map(cuidadores.map((c) => [c._id, c]));
  const cuidadoresAtivos = cuidadores.filter((c) => c.ativo);
  const alunosAtivos = alunos.filter((a) => a.ativo);
  const cargaPorCuidador = new Map();
  alunos.forEach((a) => cargaPorCuidador.set(a.cuidador?._id, (cargaPorCuidador.get(a.cuidador?._id) ?? 0) + 1));

  // Cada pendência leva direto à tela onde ela se resolve
  const pendencias = [];
  const comCuidadorInativo = alunosAtivos.filter((a) => cuidadorPorId.get(a.cuidador?._id)?.ativo === false).length;
  const semAcesso = alunosAtivos.filter((a) => !a.email).length;
  const semNascimento = alunosAtivos.filter((a) => !a.dataNascimento).length;
  const semAlunos = cuidadoresAtivos.filter((c) => !cargaPorCuidador.get(c._id));

  if (cuidadoresAtivos.length === 0) pendencias.push({ texto: "Não há cuidador ativo. Cada aluno precisa de um cuidador responsável.", href: "#/cuidadores/novo", acao: "Novo cuidador" });
  else if (alunos.length === 0) pendencias.push({ texto: "Nenhum aluno cadastrado ainda.", href: "#/alunos/novo", acao: "Novo aluno" });
  if (comCuidadorInativo) pendencias.push({ texto: `${plural(comCuidadorInativo, "aluno ativo está", "alunos ativos estão")} com cuidador inativo, sem ninguém que consiga acompanhar.`, href: "#/alunos?filtro=cuidador-inativo", acao: "Ver alunos" });
  if (semAlunos.length && alunos.length) pendencias.push({ texto: `${plural(semAlunos.length, "cuidador ativo sem aluno vinculado", "cuidadores ativos sem aluno vinculado")}: ${semAlunos.slice(0, 3).map((c) => c.nome).join(", ")}${semAlunos.length > 3 ? " e outros" : ""}.`, href: "#/cuidadores", acao: "Ver cuidadores" });
  if (semAcesso) pendencias.push({ texto: `${plural(semAcesso, "aluno ativo sem", "alunos ativos sem")} email de acesso: ${semAcesso === 1 ? "ele não consegue" : "eles não conseguem"} entrar no comunicador.`, href: "#/alunos?filtro=sem-acesso", acao: "Ver alunos" });
  if (semNascimento) pendencias.push({ texto: `${plural(semNascimento, "aluno ativo sem", "alunos ativos sem")} data de nascimento.`, href: "#/alunos?filtro=sem-nascimento", acao: "Ver alunos" });

  const carga = [...cuidadoresAtivos].sort((a, b) => (cargaPorCuidador.get(b._id) ?? 0) - (cargaPorCuidador.get(a._id) ?? 0) || a.nome.localeCompare(b.nome, "pt-BR"));

  area.innerHTML = `
    <dl class="faixa" aria-label="Resumo da escola">
      <div><dt>Alunos ativos</dt><dd>${alunosAtivos.length}<small>de ${alunos.length}</small></dd></div>
      <div><dt>Cuidadores ativos</dt><dd>${cuidadoresAtivos.length}<small>de ${cuidadores.length}</small></dd></div>
      <div><dt>Alunos inativos</dt><dd>${alunos.length - alunosAtivos.length}</dd></div>
      <div><dt>Itens de atenção</dt><dd>${pendencias.length}</dd></div>
    </dl>
    <div class="grade-inicio">
      <section class="painel" aria-labelledby="t-atencao">
        <h2 id="t-atencao">Precisa de atenção</h2>
        ${pendencias.length
          ? `<ul class="pendencias">${pendencias.map((p) => `<li>${icone("warning")}<span>${esc(p.texto)}</span><a class="btn btn-texto" href="${p.href}">${esc(p.acao)}${icone("caret-right")}</a></li>`).join("")}</ul>`
          : `<p class="tudo-certo">${icone("check-circle")}Nenhuma pendência de cadastro.</p>`}
      </section>
      <section class="painel" aria-labelledby="t-cuidadores">
        <div class="painel-topo"><h2 id="t-cuidadores">Cuidadores e seus alunos</h2><a class="link" href="#/cuidadores">Ver todos</a></div>
        ${carga.length
          ? `<ul class="lista-simples">${carga.slice(0, 6).map((c) => `<li>${avatar(c.nome)}<a class="link" href="#/cuidadores/${esc(c._id)}">${esc(c.nome)}</a><span class="sec">${plural(cargaPorCuidador.get(c._id) ?? 0, "aluno", "alunos")}</span></li>`).join("")}</ul>${carga.length > 6 ? `<p class="sec">e mais ${carga.length - 6}</p>` : ""}`
          : '<p class="sec">Nenhum cuidador ativo.</p>'}
      </section>
    </div>`;
}
