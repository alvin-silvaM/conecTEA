import { z } from "zod";
import { Timestamp } from "firebase-admin/firestore";
import { dataSchema, emailSchema, idSchema, senhaSchema, textoSchema } from "../utils/validacao.js";

// Model do Aluno no Firestore (coleção "alunos").
// Dados do aluno são sensíveis (LGPD): guardamos só o necessário para o MVP.
// Campos do documento: nome, email, senha (hash bcrypt), dataNascimento (Timestamp), cuidador (id), escola (id), ativo.
// O aluno tem login próprio (email + senha, cadastrados pela escola) para usar o comunicador.
export const COLECAO_ALUNOS = "alunos";

// Situação de acompanhamento mostrada nas telas do cuidador. Se não for informada,
// vale o "ativo" do aluno (ver situacaoDoAluno).
// FUTURO: a situação "atencao" (aluno que precisa de mais atenção) ainda não foi liberada.
// Para ligar, basta incluir "atencao" na lista abaixo e em SITUACOES do front
// (components/SituacaoBadge.jsx).
export const SITUACOES = ["ativo", "inativo"];
const situacaoSchema = z.enum(SITUACOES, { error: "Situação inválida" });

export const alunoParamsSchema = z.object({ id: idSchema });

// Criação: "escola" vem sempre do token e "ativo" começa true; campos extras são descartados.
export const criarAlunoSchema = z.object({
    nome: textoSchema("Nome inválido", 120),
    email: emailSchema,
    senha: senhaSchema,
    dataNascimento: dataSchema.optional(),
    turma: textoSchema("Turma inválida", 50).optional(),
    situacao: situacaoSchema.optional(),
    cuidador: idSchema
});

// Atualização parcial: só os campos editáveis, ao menos um deles.
export const atualizarAlunoSchema = z
    .object({
        nome: textoSchema("Nome inválido", 120).optional(),
        email: emailSchema.optional(),
        senha: senhaSchema.optional(),
        dataNascimento: dataSchema.optional(),
        turma: textoSchema("Turma inválida", 50).optional(),
        situacao: situacaoSchema.optional(),
        cuidador: idSchema.optional(),
        ativo: z.boolean({ error: "Campo ativo inválido" }).optional()
    })
    .refine((dados) => Object.keys(dados).length > 0, "Nenhum campo para atualizar");

export const loginAlunoSchema = z.object({
    email: emailSchema,
    senha: z.string().min(1)
});

// Converte o que o cliente enviou para o formato gravado no Firestore
export const alunoParaDocumento = (dados) => {
    const doc = { ...dados };
    if (doc.dataNascimento !== undefined) {
        doc.dataNascimento = Timestamp.fromDate(new Date(`${doc.dataNascimento}T00:00:00.000Z`));
    }
    return doc;
};

// Situação exibida: a gravada, ou "ativo"/"inativo" conforme o campo ativo
export const situacaoDoAluno = (dados) => dados.situacao ?? (dados.ativo === false ? "inativo" : "ativo");

// Converte um documento do Firestore para a resposta da API (mantém "_id", data em ISO e o
// cuidador "populado" como antes). "escola" e a senha (hash) não são expostas.
export const alunoParaResposta = (snapshot, cuidador) => {
    const { escola, senha, dataNascimento, cuidador: cuidadorId, ...resto } = snapshot.data();
    return {
        _id: snapshot.id,
        ...resto,
        situacao: situacaoDoAluno(resto),
        ...(dataNascimento ? { dataNascimento: dataNascimento.toDate().toISOString() } : {}),
        cuidador: cuidador ?? { _id: cuidadorId }
    };
};

// Formato enxuto usado nas telas do cuidador (Início e Aluno). Não inclui data de nascimento, e-mail
// nem contato do cuidador: quem não é o responsável só vê o necessário para consulta.
export const alunoParaPainel = (id, dados, cuidadorNome) => ({
    _id: id,
    nome: dados.nome,
    ...(dados.turma ? { turma: dados.turma } : {}),
    situacao: situacaoDoAluno(dados),
    cuidador: { _id: dados.cuidador, nome: cuidadorNome ?? "" }
});
