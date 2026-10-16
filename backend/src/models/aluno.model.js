import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import { dataSchema, idSchema, textoSchema } from "../utils/validacao.js";

// Model do Aluno no Firestore (coleção "alunos").
// Dados do aluno são sensíveis (LGPD): guardamos só o necessário para o MVP.
// Campos do documento: nome, dataNascimento (Timestamp), cuidador (id), escola (id), ativo.
export const COLECAO_ALUNOS = "alunos";

export const alunoParamsSchema = z.object({ id: idSchema });

// Criação: "escola" vem sempre do token e "ativo" começa true; campos extras são descartados.
export const criarAlunoSchema = z.object({
    nome: textoSchema("Nome inválido", 120),
    dataNascimento: dataSchema.optional(),
    cuidador: idSchema
});

// Atualização parcial: só os campos editáveis, ao menos um deles.
export const atualizarAlunoSchema = z
    .object({
        nome: textoSchema("Nome inválido", 120).optional(),
        dataNascimento: dataSchema.optional(),
        cuidador: idSchema.optional(),
        ativo: z.boolean({ error: "Campo ativo inválido" }).optional()
    })
    .refine((dados) => Object.keys(dados).length > 0, "Nenhum campo para atualizar");

// Converte o que o cliente enviou para o formato gravado no Firestore
export const alunoParaDocumento = (dados) => {
    const doc = { ...dados };
    if (doc.dataNascimento !== undefined) {
        doc.dataNascimento = Timestamp.fromDate(new Date(`${doc.dataNascimento}T00:00:00.000Z`));
    }
    return doc;
};

// Converte um documento do Firestore para a resposta da API (mantém "_id", data em ISO e o
// cuidador "populado" como antes). "escola" não é exposta.
export const alunoParaResposta = (snapshot, cuidador) => {
    const { escola, dataNascimento, cuidador: cuidadorId, ...resto } = snapshot.data();
    return {
        _id: snapshot.id,
        ...resto,
        ...(dataNascimento ? { dataNascimento: dataNascimento.toDate().toISOString() } : {}),
        cuidador: cuidador ?? { _id: cuidadorId }
    };
};
