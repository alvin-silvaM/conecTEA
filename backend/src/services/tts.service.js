import { createHash } from "node:crypto";
import { firestore } from "../database/firestore.js";
import { arquivoExiste, lerArquivo, salvarArquivo } from "../database/storage.js";
import { COLECAO_AUDIOS_TTS, audioParaResposta, dadosParaDocumentoAudio } from "../models/tts.model.js";
import { COLECAO_ALUNOS } from "../models/aluno.model.js";
import { ErroHttp } from "../utils/erros.js";
import { sintetizarFala } from "./tts.client.js";

const audios = () => firestore().collection(COLECAO_AUDIOS_TTS);
const alunos = () => firestore().collection(COLECAO_ALUNOS);

// Resolve o aluno-alvo a partir da identidade autenticada.
// Aluno só pode gerar para si; cuidador só pode gerar para aluno sob sua responsabilidade.
const resolverAluno = async (auth, alunoIdInformado) => {
    const alunoId = auth.tipo === "aluno" ? String(auth.id) : String(alunoIdInformado || "");
    if (!alunoId || (auth.tipo === "aluno" && alunoIdInformado && String(alunoIdInformado) !== alunoId)) {
        throw new ErroHttp(404, "Aluno não encontrado");
    }

    const snapshot = await alunos().doc(alunoId).get();
    if (!snapshot.exists) throw new ErroHttp(404, "Aluno não encontrado");

    const dados = snapshot.data();
    const permitido = dados.ativo === true &&
        dados.escola === String(auth.escolaId) &&
        (auth.tipo === "aluno" ? snapshot.id === String(auth.id) : dados.cuidador === String(auth.id));

    if (!permitido) throw new ErroHttp(404, "Aluno não encontrado");
    return snapshot.id;
};

// Gera o áudio e o associa explicitamente ao aluno.
// A chave inclui escola + aluno + voz + texto: alunos diferentes não compartilham o mesmo registro.
export const gerarAudioService = async (auth, { texto, voz, alunoId: alunoIdInformado }) => {
    if (auth.tipo !== "aluno" && auth.tipo !== "cuidador") {
        throw new ErroHttp(403, "Acesso negado");
    }
    const alunoId = await resolverAluno(auth, alunoIdInformado);
    const id = createHash("sha256").update(`${auth.escolaId}\n${alunoId}\n${voz}\n${texto}`).digest("hex");
    const ref = audios().doc(id);

    const existente = await ref.get();
    if (existente.exists && (await arquivoExiste(existente.data().caminho))) {
        return { audio: audioParaResposta(existente), criado: false };
    }

    const wav = await sintetizarFala(texto, voz);
    const caminho = `tts/${auth.escolaId}/${alunoId}/${voz}/${id}.wav`;

    await salvarArquivo(caminho, wav, "audio/wav");
    await ref.set(dadosParaDocumentoAudio({ texto, voz, caminho, tamanho: wav.length, alunoId, auth }));

    return { audio: audioParaResposta(await ref.get()), criado: true };
};

// 404 tanto para "não existe" quanto para áudio de outro aluno/escola/cuidador.
const buscarDocumento = async (auth, id) => {
    const snapshot = await audios().doc(id).get();
    if (!snapshot.exists) throw new ErroHttp(404, "Áudio não encontrado");

    const dados = snapshot.data();
    if (dados.escola !== String(auth.escolaId) || !dados.aluno) {
        throw new ErroHttp(404, "Áudio não encontrado");
    }

    const aluno = await alunos().doc(String(dados.aluno)).get();
    if (!aluno.exists) throw new ErroHttp(404, "Áudio não encontrado");

    const dadosAluno = aluno.data();
    const permitido = dadosAluno.ativo === true &&
        dadosAluno.escola === String(auth.escolaId) &&
        (auth.tipo === "aluno"
            ? String(dados.aluno) === String(auth.id)
            : auth.tipo === "cuidador" && dadosAluno.cuidador === String(auth.id));

    if (!permitido) throw new ErroHttp(404, "Áudio não encontrado");
    return snapshot;
};

export const buscarAudioService = async (auth, id) => audioParaResposta(await buscarDocumento(auth, id));

// O backend transmite o arquivo ao usuário somente depois de verificar sua autorização.
export const baixarAudioService = async (auth, id) => {
    const snapshot = await buscarDocumento(auth, id);
    const { caminho, contentType } = snapshot.data();
    const conteudo = await lerArquivo(caminho);
    if (!conteudo) throw new ErroHttp(404, "Arquivo de áudio não encontrado");
    return { conteudo, contentType };
};
