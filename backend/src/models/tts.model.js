import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import { OBRIGATORIO, idSchema } from "../utils/validacao.js";

// Model dos áudios gerados pelo serviço de TTS (coleção "audios_tts").
// O arquivo WAV fica no Backblaze B2; o Firestore guarda os metadados e o CAMINHO do objeto.
// Campos do documento: texto, voz, aluno (id), caminho, contentType, tamanho (bytes),
// escola (id), criadoPor ({ tipo, id }), criadoEm (Timestamp).
// O id do documento é um hash de escola + aluno + voz + texto: cada aluno tem seus próprios áudios.
export const COLECAO_AUDIOS_TTS = "audios_tts";

// Vozes instaladas no serviço de TTS (nomes curtos aceitos por ele).
export const VOZES = ["cadu", "faber", "jeff", "edresson"];

// Deve acompanhar TTS_MAX_CHARS do serviço (padrão dele: 500)
export const TTS_MAX_CHARS = Number(process.env.TTS_MAX_CHARS) || 500;

const erroDeTexto = (iss) => (iss.input === undefined ? OBRIGATORIO : "Texto inválido");

export const audioParamsSchema = z.object({ id: idSchema });

// Normaliza espaços/quebras de linha (como o serviço faz) para que "Olá  mundo" e "Olá mundo" sejam o mesmo áudio
export const gerarAudioSchema = z.object({
    texto: z
        .string({ error: erroDeTexto })
        .transform((valor) => valor.split(/\s+/).filter(Boolean).join(" "))
        .pipe(
            z.string()
                .min(1, "Texto inválido")
                .max(TTS_MAX_CHARS, `Texto muito longo: use no máximo ${TTS_MAX_CHARS} caracteres`)
        ),
    voz: z.enum(VOZES, {
        error: (iss) => (iss.input === undefined ? OBRIGATORIO : `Voz inválida: use uma destas: ${VOZES.join(", ")}`)
    }),
    // Obrigatório para cuidador; para aluno, o backend usa o ID autenticado.
    alunoId: idSchema.optional()
});

export const dadosParaDocumentoAudio = ({ texto, voz, caminho, tamanho, alunoId, auth }) => ({
    texto,
    voz,
    aluno: String(alunoId),
    caminho,
    contentType: "audio/wav",
    tamanho,
    escola: String(auth.escolaId),
    criadoPor: { tipo: auth.tipo, id: String(auth.id) },
    criadoEm: Timestamp.now()
});

// Resposta da API: mantém "_id" e data em ISO. "escola" não é exposta.
export const audioParaResposta = (snapshot) => {
    const { escola, criadoEm, ...resto } = snapshot.data();
    return {
        _id: snapshot.id,
        ...resto,
        ...(criadoEm ? { criadoEm: criadoEm.toDate().toISOString() } : {})
    };
};
