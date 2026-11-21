// Dados fictícios para testar formulários. Só é carregado com ?dev=1 (ver modoDev em ui.js).
import { aplicarMascara, limparErros } from "./ui.js";

const sorteia = (lista) => lista[Math.floor(Math.random() * lista.length)];
const entre = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const NOMES = ["Ana", "Beatriz", "Carlos", "Daniela", "Eduardo", "Fernanda", "Gabriel", "Helena", "Igor", "Joana", "Lucas", "Marina", "Nicolas", "Olívia", "Pedro", "Rafaela", "Samuel", "Tatiana"];
const SOBRENOMES = ["Almeida", "Barbosa", "Cavalcante", "Dias", "Esteves", "Freitas", "Gomes", "Holanda", "Lima", "Macedo", "Nogueira", "Oliveira", "Pereira", "Queiroz", "Rocha", "Sousa", "Teixeira"];
const CIDADES = ["Quixadá", "Fortaleza", "Sobral", "Juazeiro do Norte", "Crato", "Iguatu", "Canindé", "Russas"];
const RUAS = ["Rua das Flores", "Avenida Brasil", "Rua da Paz", "Rua São José", "Avenida Central", "Rua do Sol", "Rua Santos Dumont"];
const nomeAleatorio = () => `${sorteia(NOMES)} ${sorteia(SOBRENOMES)}`;
const semAcento = (t) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z]/g, "");
const emailAleatorio = (nome) => `${semAcento(nome.split(" ")[0])}.${semAcento(nome.split(" ").pop())}${entre(10, 9999)}@exemplo.test`;
const telefoneAleatorio = () => aplicarMascara("telefone", `88 9${entre(8000, 9999)}${entre(1000, 9999)}`);
const senhaAleatoria = () => `Senha${entre(10000, 99999)}`;

// CNPJ com os dois dígitos verificadores corretos
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

function preencher(form, nome, valor) {
  const el = form.elements[nome];
  if (!el) return;
  el.value = valor;
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

export function cadastroEscola(form) {
  preencher(form, "cnpj", cnpjAleatorio());
  preencher(form, "razaoSocial", `Escola Municipal ${sorteia(NOMES)} ${sorteia(SOBRENOMES)}`);
  preencher(form, "endereco.rua", sorteia(RUAS));
  preencher(form, "endereco.numero", String(entre(1, 999)));
  preencher(form, "endereco.municipio", sorteia(CIDADES));
  preencher(form, "endereco.estado", "Ceará");
  preencher(form, "telefone1", telefoneAleatorio());
  preencher(form, "email", `contato${entre(100, 99999)}@escola-exemplo.test`);
  form.elements.senha.type = "text"; // deixa a senha gerada visível para ser anotada
  preencher(form, "senha", senhaAleatoria());
  limparErros(form);
}

export function cuidador(form) {
  const nome = nomeAleatorio();
  preencher(form, "nome", nome);
  preencher(form, "telefone", telefoneAleatorio());
  preencher(form, "email", emailAleatorio(nome));
  form.elements.senha.type = "text";
  preencher(form, "senha", senhaAleatoria());
  limparErros(form);
}

export function aluno(form) {
  const nome = nomeAleatorio();
  preencher(form, "nome", nome);
  preencher(form, "email", emailAleatorio(nome));
  form.elements.senha.type = "text";
  preencher(form, "senha", senhaAleatoria());
  preencher(form, "dataNascimento", `${entre(2008, 2020)}-${String(entre(1, 12)).padStart(2, "0")}-${String(entre(1, 28)).padStart(2, "0")}`);
  const opcoes = [...form.elements.cuidador.options].filter((o) => o.value);
  if (opcoes.length) form.elements.cuidador.value = sorteia(opcoes).value;
  limparErros(form);
}
