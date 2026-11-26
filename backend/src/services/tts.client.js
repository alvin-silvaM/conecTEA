import { ErroHttp } from "../utils/erros.js";

// Cliente HTTP do serviço de TTS local (Piper + FastAPI, projeto "services-tts").
// Contrato do serviço: POST {TTS_URL}/synthesize  { text, voice }  ->  audio/wav
// As variáveis são lidas a cada chamada (e não na importação) para facilitar testes e ajustes.

const urlBase = () => (process.env.TTS_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");
const timeoutMs = () => Number(process.env.TTS_TIMEOUT_MS) || 30000;

// Envia o texto e a voz ao serviço e devolve o áudio (Buffer WAV).
// Falhas viram ErroHttp com mensagem segura; o detalhe técnico vai só para o log.
export const sintetizarFala = async (texto, voz) => {
    const headers = { "Content-Type": "application/json" };
    if (process.env.TTS_API_KEY) headers["X-API-Key"] = process.env.TTS_API_KEY;

    let resposta;
    let audio;
    try {
        resposta = await fetch(`${urlBase()}/synthesize`, {
            method: "POST",
            headers,
            body: JSON.stringify({ text: texto, voice: voz }),
            // O timeout também vale para a leitura do corpo (o áudio)
            signal: AbortSignal.timeout(timeoutMs())
        });
        if (resposta.ok) audio = Buffer.from(await resposta.arrayBuffer());
    } catch (erro) {
        const timeout = erro?.name === "TimeoutError";
        console.error(`Serviço de TTS ${timeout ? "não respondeu a tempo" : "inacessível"}:`, erro?.cause?.code ?? erro?.message);
        throw new ErroHttp(timeout ? 504 : 503, "Serviço de voz indisponível");
    }

    if (!resposta.ok) {
        console.error(`Serviço de TTS respondeu ${resposta.status}:`, (await resposta.text().catch(() => "")).slice(0, 500));
        throw new ErroHttp(502, "Falha ao gerar o áudio");
    }

    // Todo WAV começa com "RIFF". Evita gravar no Storage uma resposta que não seja áudio.
    if (!audio || audio.length < 44 || audio.toString("ascii", 0, 4) !== "RIFF") {
        console.error("Serviço de TTS devolveu um conteúdo que não é WAV");
        throw new ErroHttp(502, "Falha ao gerar o áudio");
    }

    return audio;
};
