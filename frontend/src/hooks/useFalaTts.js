import { useCallback, useEffect, useRef, useState } from 'react';
import { baixarAudio, gerarAudio, listarVozes } from '../services/api.js';
import { guardarIdDeAudio, lerIdsDeAudio } from '../utils/cartoes.js';

// Reprodução de voz pelo serviço de TTS do backend.
//   frase -> POST /tts/audios (gera ou reaproveita) -> GET /tts/audios/:id/arquivo (WAV) -> <audio>
// Os áudios baixados ficam em memória (URL de blob), então o segundo toque no mesmo cartão é instantâneo.
// Chame `preparar()` nos cartões visíveis: quando o aluno toca, o som já está pronto.

// WAV mudo mínimo: "destrava" o <audio> dentro do toque (iOS/Safari só tocam se o play() nasce de um gesto).
const SILENCIO =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';

const normalizar = (t) => t.split(/\s+/).filter(Boolean).join(' ');

// Cache do módulo: vale entre telas durante a sessão. Chave: aluno|voz|frase -> Promise<URL do blob>
const cacheDeUrls = new Map();
let vozPadrao = null;

async function obterVoz() {
  if (!vozPadrao) {
    vozPadrao = listarVozes()
      .then((vozes) => vozes[0])
      .catch((erro) => {
        vozPadrao = null; // tenta de novo na próxima vez
        throw erro;
      });
  }
  return vozPadrao;
}

// Garante o áudio da frase e devolve o id dele no servidor (usado também ao salvar um cartão novo).
export async function garantirAudio(alunoId, frase) {
  const texto = normalizar(frase);
  const voz = await obterVoz();
  const audio = await gerarAudio({ texto, voz });
  guardarIdDeAudio(alunoId, voz, texto, audio._id);
  return { audioId: audio._id, voz, texto };
}

// Devolve (e guarda em cache) a URL tocável do áudio da frase.
export function urlDoAudio(alunoId, frase) {
  const texto = normalizar(frase);
  const promessa = (async () => {
    const voz = await obterVoz();
    const chave = `${alunoId}|${voz}|${texto}`;
    if (cacheDeUrls.has(chave)) return cacheDeUrls.get(chave);

    const trabalho = (async () => {
      let id = lerIdsDeAudio(alunoId)[`${voz}|${texto}`];
      if (id) {
        try {
          return URL.createObjectURL(await baixarAudio(id));
        } catch {
          // áudio sumiu do servidor: gera de novo abaixo
        }
      }
      const gerado = await garantirAudio(alunoId, texto);
      return URL.createObjectURL(await baixarAudio(gerado.audioId));
    })();
    cacheDeUrls.set(chave, trabalho);
    trabalho.catch(() => cacheDeUrls.delete(chave)); // não guarda falha
    return trabalho;
  })();
  return promessa;
}

export default function useFalaTts(alunoId) {
  const audioRef = useRef(null);
  const [carregando, setCarregando] = useState(null); // frase que está sendo preparada
  const [tocando, setTocando] = useState(null); // frase em reprodução
  const [erro, setErro] = useState('');
  const pedidoAtual = useRef(0);

  if (!audioRef.current && typeof Audio !== 'undefined') audioRef.current = new Audio();

  useEffect(() => {
    const el = audioRef.current;
    const fim = () => setTocando(null);
    el.addEventListener('ended', fim);
    el.addEventListener('pause', fim);
    return () => {
      el.removeEventListener('ended', fim);
      el.removeEventListener('pause', fim);
      el.pause();
    };
  }, []);

  // Baixa o áudio antes do toque (em segundo plano, um de cada vez, ignorando falhas)
  const preparar = useCallback(
    async (frases) => {
      for (const f of frases) {
        try {
          await urlDoAudio(alunoId, f);
        } catch {
          /* o erro aparece só se a pessoa tocar */
        }
      }
    },
    [alunoId],
  );

  const falar = useCallback(
    async (frase) => {
      const el = audioRef.current;
      const pedido = ++pedidoAtual.current;
      setErro('');

      // Dentro do toque: interrompe o que estiver tocando e destrava o player
      el.pause();
      el.src = SILENCIO;
      el.play().catch(() => {});

      setCarregando(frase);
      try {
        const url = await urlDoAudio(alunoId, frase);
        if (pedido !== pedidoAtual.current) return; // outro toque veio depois
        el.src = url;
        setTocando(frase);
        await el.play();
      } catch (e) {
        if (pedido !== pedidoAtual.current) return;
        setTocando(null);
        setErro(
          e?.name === 'NotAllowedError'
            ? 'Toque de novo para ouvir.'
            : e?.message || 'Não foi possível reproduzir a voz agora.',
        );
      } finally {
        if (pedido === pedidoAtual.current) setCarregando(null);
      }
    },
    [alunoId],
  );

  return { falar, preparar, carregando, tocando, erro, limparErro: () => setErro('') };
}
