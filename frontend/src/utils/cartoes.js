// Pictogramas, cartões padrão e armazenamento dos cartões do aluno.
//
// O backend ainda não tem rotas de cartões: guarda só o ÁUDIO (rotas /tts). Por isso a lista de cartões
// criados pelo aluno fica no navegador (localStorage), separada por aluno. O áudio de cada frase fica no
// servidor e é reaproveitado (mesma frase + voz = mesmo áudio).

import abracar from '../assets/pictogramas/abracar.webp';
import beberAgua from '../assets/pictogramas/beber-agua.webp';
import brincar from '../assets/pictogramas/brincar.webp';
import comer from '../assets/pictogramas/comer.webp';
import descansar from '../assets/pictogramas/descansar.webp';
import dormir from '../assets/pictogramas/dormir.webp';
import escovar from '../assets/pictogramas/escovar-os-dentes.webp';
import estudar from '../assets/pictogramas/estudar.webp';
import banheiro from '../assets/pictogramas/ir-ao-banheiro.webp';
import irEmbora from '../assets/pictogramas/ir-embora.webp';
import musica from '../assets/pictogramas/ouvir-musica.webp';
import pedirAjuda from '../assets/pictogramas/pedir-ajuda.webp';
import sentirDor from '../assets/pictogramas/sentir-dor.webp';
import banho from '../assets/pictogramas/tomar-banho.webp';

// Na ordem da biblioteca do Figma ("Escolha um pictograma")
export const PICTOGRAMAS = [
  { id: 'comer', nome: 'Comer', src: comer },
  { id: 'beber-agua', nome: 'Beber água', src: beberAgua },
  { id: 'ir-ao-banheiro', nome: 'Ir ao banheiro', src: banheiro },
  { id: 'dormir', nome: 'Dormir', src: dormir },
  { id: 'sentir-dor', nome: 'Sentir dor', src: sentirDor },
  { id: 'brincar', nome: 'Brincar', src: brincar },
  { id: 'estudar', nome: 'Estudar', src: estudar },
  { id: 'pedir-ajuda', nome: 'Pedir ajuda', src: pedirAjuda },
  { id: 'descansar', nome: 'Descansar', src: descansar },
  { id: 'tomar-banho', nome: 'Tomar banho', src: banho },
  { id: 'escovar-os-dentes', nome: 'Escovar os dentes', src: escovar },
  { id: 'ir-embora', nome: 'Ir embora', src: irEmbora },
  { id: 'abracar', nome: 'Abraçar', src: abracar },
  { id: 'ouvir-musica', nome: 'Ouvir música', src: musica },
];

export const pictogramaPorId = (id) => PICTOGRAMAS.find((p) => p.id === id);

// Cores de fundo dos cartões (amarelo, rosa, azul, lilás, verde), como no Figma
export const CORES = ['amarelo', 'rosa', 'azul', 'lilas', 'verde'];

// "rotulo" é o que aparece no cartão; "fala" é o que a voz diz (quando diferente).
export const CARTOES_PADRAO = [
  { id: 'padrao-comer', rotulo: 'Quero comer', fala: 'Quero comer', pictograma: 'comer', cor: 'amarelo' },
  { id: 'padrao-dor', rotulo: 'Não me sinto bem', fala: 'Não me sinto bem', pictograma: 'sentir-dor', cor: 'rosa' },
  { id: 'padrao-banheiro', rotulo: 'Ir ao banheiro', fala: 'Preciso ir ao banheiro', pictograma: 'ir-ao-banheiro', cor: 'azul' },
  { id: 'padrao-cansado', rotulo: 'Estou cansado', fala: 'Estou cansado', pictograma: 'dormir', cor: 'lilas' },
];

export const EMOCOES = [
  { id: 'feliz', rotulo: 'Feliz', fala: 'Estou feliz' },
  { id: 'triste', rotulo: 'Triste', fala: 'Estou triste' },
  { id: 'raiva', rotulo: 'Com raiva', fala: 'Estou com raiva' },
  { id: 'medo', rotulo: 'Com medo', fala: 'Estou com medo' },
  { id: 'cansado', rotulo: 'Cansado', fala: 'Estou cansado' },
  { id: 'tranquilo', rotulo: 'Tranquilo', fala: 'Estou tranquilo' },
];

export const MAX_FRASE = 100;

// ---------- armazenamento local (por aluno) ----------
const chave = (alunoId, nome) => `conectea:aluno:${alunoId}:${nome}`;

function ler(chaveCompleta, padrao) {
  try {
    const bruto = localStorage.getItem(chaveCompleta);
    return bruto ? JSON.parse(bruto) : padrao;
  } catch {
    return padrao;
  }
}

function gravar(chaveCompleta, valor) {
  try {
    localStorage.setItem(chaveCompleta, JSON.stringify(valor));
    return true;
  } catch {
    return false; // armazenamento cheio ou bloqueado (aba anônima)
  }
}

export const lerCartoesCriados = (alunoId) => ler(chave(alunoId, 'cartoes'), []);

// Salva um cartão novo e devolve a lista atualizada
export function salvarCartao(alunoId, { texto, pictograma, audioId }) {
  const atuais = lerCartoesCriados(alunoId);
  const cartao = {
    id: `c-${Date.now().toString(36)}`,
    rotulo: texto,
    fala: texto,
    pictograma,
    cor: CORES[atuais.length % CORES.length],
    audioId,
  };
  const lista = [...atuais, cartao];
  if (!gravar(chave(alunoId, 'cartoes'), lista)) throw new Error('Não foi possível guardar o cartão neste aparelho.');
  return cartao;
}

// Mapa "voz|frase" -> id do áudio no servidor. Evita pedir de novo (e gastar o limite do TTS) toda vez.
export const lerIdsDeAudio = (alunoId) => ler(chave(alunoId, 'audios'), {});
export function guardarIdDeAudio(alunoId, voz, frase, audioId) {
  const mapa = lerIdsDeAudio(alunoId);
  mapa[`${voz}|${frase}`] = audioId;
  gravar(chave(alunoId, 'audios'), mapa);
}
