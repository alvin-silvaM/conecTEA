// Comunicador da criança: tela cheia, sem menus administrativos, botões grandes e pouco texto.
// É a tela do próprio aluno: ele entra com o email e a senha cadastrados pela escola e vem direto para cá.
import { $, $$, avatar, esc, icone } from "./ui.js";

// ATENÇÃO — dados locais. O back-end ainda não tem mensagens, categorias nem pictogramas, então
// este vocabulário é fixo e vem do roteiro do projeto. Nada que a criança escolhe é salvo ou enviado.
// Estudos e Extras aparecem no roteiro, mas ainda sem mensagens definidas, por isso ficam de fora.
// Os ícones são símbolos genéricos (Phosphor, MIT), não pictogramas de CAA: quando houver pictograma
// (campo "pictograma" = URL da imagem), ele substitui o ícone. Com endpoint, troque CATEGORIAS pela resposta da API.
const CATEGORIAS = [
  { id: "alimentacao", nome: "Alimentação", icone: "fork-knife", mensagens: [
    { id: "agua", icone: "drop", texto: "Quero água.", pictograma: null },
    { id: "comer", icone: "fork-knife", texto: "Quero comer.", pictograma: null }
  ] },
  { id: "necessidades", nome: "Necessidades", icone: "hand-heart", mensagens: [
    { id: "banheiro", icone: "toilet", texto: "Quero ir ao banheiro.", pictograma: null },
    { id: "dor", icone: "bandaids", texto: "Estou com dor.", pictograma: null },
    { id: "descansar", icone: "bed", texto: "Quero descansar.", pictograma: null },
    { id: "ajuda", icone: "hand-waving", texto: "Preciso de ajuda.", pictograma: null }
  ] }
];

const CHAVE_SOM = "comunicador-som";
const lerSom = () => { try { return sessionStorage.getItem(CHAVE_SOM) !== "0"; } catch { return true; } };
const gravarSom = (ligado) => { try { sessionStorage.setItem(CHAVE_SOM, ligado ? "1" : "0"); } catch { /* vale só enquanto a página estiver aberta */ } };

// Voz do próprio navegador. Se não houver síntese de voz, a frase continua aparecendo em texto grande.
function falar(texto) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = "pt-BR";
  fala.rate = 0.9;
  const voz = window.speechSynthesis.getVoices().find((v) => v.lang?.toLowerCase().startsWith("pt"));
  if (voz) fala.voice = voz;
  window.speechSynthesis.speak(fala);
}

export function verComunicador(ctx) {
  const { raiz } = ctx;
  document.title = "Comunicador | conecTEA";
  const aluno = { nome: ctx.usuario.nome };

  const estado = { categoria: CATEGORIAS[0].id, som: lerSom() && "speechSynthesis" in window, ativa: null };
  const semVoz = !("speechSynthesis" in window);

  raiz.innerHTML = `
    <main class="comunicador" data-cat="${estado.categoria}" id="conteudo">
      <div class="com-miolo">
        <header class="com-topo">
          <button type="button" class="com-botao" id="sair">${icone("x")}<span>Sair</span></button>
          <p class="com-aluno">${avatar(aluno.nome)}<span>${esc(aluno.nome)}</span></p>
          ${semVoz ? "" : `<button type="button" class="com-botao" id="som" aria-pressed="${estado.som}" aria-label="Som das mensagens"></button>`}
        </header>
        <h1 class="sr" tabindex="-1">Comunicador de ${esc(aluno.nome)}</h1>
        <section aria-label="Mensagem escolhida">
          <div class="balao" id="balao"><span class="balao-icone" id="fala-icone" aria-hidden="true"></span><p id="fala" aria-live="polite" aria-atomic="true"><span class="vazia">Toque em uma mensagem</span></p></div>
        </section>
        <nav class="com-categorias" aria-label="Categorias" id="categorias"></nav>
        <div class="com-mensagens" id="mensagens"></div>
      </div>
    </main>`;

  const comunicador = $(".comunicador", raiz);
  const desenharSom = () => {
    const b = $("#som", raiz);
    if (!b) return;
    b.setAttribute("aria-pressed", String(estado.som));
    b.innerHTML = `${icone(estado.som ? "speaker-high" : "speaker-slash")}<span>${estado.som ? "Som ligado" : "Som desligado"}</span>`;
  };

  const desenharCategorias = () => {
    $("#categorias", raiz).innerHTML = CATEGORIAS.map((c) =>
      `<button type="button" class="com-categoria" data-categoria="${c.id}" data-cat="${c.id}" aria-pressed="${c.id === estado.categoria}">${icone(c.icone)}<span>${esc(c.nome)}</span></button>`).join("");
  };

  const desenharMensagens = () => {
    const cat = CATEGORIAS.find((c) => c.id === estado.categoria);
    comunicador.dataset.cat = cat.id;
    $("#mensagens", raiz).innerHTML = `<ul>${cat.mensagens.map((m) => `
      <li><button type="button" class="com-msg" data-msg="${m.id}" aria-pressed="${m.id === estado.ativa}">
        ${m.pictograma ? `<img src="${esc(m.pictograma)}" alt="">` : icone(m.icone)}<span>${esc(m.texto)}</span></button></li>`).join("")}</ul>`;
  };

  desenharSom();
  desenharCategorias();
  desenharMensagens();

  raiz.addEventListener("click", (e) => {
    const categoria = e.target.closest("[data-categoria]");
    if (categoria) {
      estado.categoria = categoria.dataset.categoria;
      $$("[data-categoria]", raiz).forEach((b) => b.setAttribute("aria-pressed", String(b === categoria)));
      desenharMensagens();
      return;
    }
    const botao = e.target.closest("[data-msg]");
    if (botao) {
      const msg = CATEGORIAS.flatMap((c) => c.mensagens).find((m) => m.id === botao.dataset.msg);
      estado.ativa = msg.id;
      $$("[data-msg]", raiz).forEach((b) => b.setAttribute("aria-pressed", String(b === botao)));
      $("#fala", raiz).textContent = msg.texto;
      $("#fala-icone", raiz).innerHTML = msg.pictograma ? "" : icone(msg.icone);
      $("#balao", raiz).dataset.tem = "";
      if (estado.som) falar(msg.texto);
      return;
    }
    if (e.target.closest("#som")) {
      estado.som = !estado.som;
      gravarSom(estado.som);
      if (!estado.som) window.speechSynthesis.cancel();
      desenharSom();
      return;
    }
    if (e.target.closest("#sair")) confirmarSaida(ctx);
  });
}

// Saída em dois passos: evita que a criança encerre a sessão por um toque sem querer
function confirmarSaida(ctx) {
  const dialogo = $("#modal");
  dialogo.innerHTML = `
    <form class="janela" method="dialog">
      <h2 id="modal-titulo">Sair do comunicador?</h2>
      <p>Para voltar será preciso entrar de novo com o email e a senha.</p>
      <div class="janela-acoes">
        <button type="button" class="btn" data-fechar>Continuar</button>
        <button type="submit" class="btn btn-primario">Sair</button>
      </div>
    </form>`;
  $("[data-fechar]", dialogo).addEventListener("click", () => dialogo.close());
  $("form", dialogo).addEventListener("submit", (e) => { e.preventDefault(); dialogo.close(); ctx.sair(); });
  dialogo.showModal();
  $("[data-fechar]", dialogo).focus();
}
