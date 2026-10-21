import jwt from "jsonwebtoken";
import { firestore } from "../database/firestore.js";
import { COLECAO_ESCOLAS } from "../models/escola.model.js";
import { COLECAO_CUIDADORES } from "../models/cuidador.model.js";
import { idSchema } from "../utils/validacao.js";
import { responderErro } from "../utils/erros.js";

const naoAutorizado = (res) => res.status(401).json({ message: "Token ausente, inválido ou expirado" });

// Lê um documento e só o devolve se existir e estiver ativo
const buscarAtivo = async (colecao, id) => {
    const doc = await firestore().collection(colecao).doc(id).get();
    return doc.exists && doc.data().ativo === true ? doc : null;
};

// Valida o JWT e confere no banco se a conta ainda existe e está ativa. 
// Assim, excluir ou desativar um cuidador/escola corta o acesso na hora, sem esperar o token expirar.
// Preenche req.auth = { tipo, id, escolaId }. O escolaId vem SEMPRE daqui, nunca do body/params.
export const autenticar = async (req, res, next) => {
    
    try {
        const [esquema, token] = (req.headers.authorization || "").split(" ");
        if (esquema !== "Bearer" || !token) return naoAutorizado(res);

        let payload;
        try {
            payload = jwt.verify(token, process.env.SECRET, { algorithms: ["HS256"] });
        } catch {
            return naoAutorizado(res);
        }

        if (!idSchema.safeParse(payload.sub).success || !["escola", "cuidador"].includes(payload.tipo)) {
            return naoAutorizado(res);
        }

        if (payload.tipo === "escola") {
            const escola = await buscarAtivo(COLECAO_ESCOLAS, payload.sub);
            if (!escola) return naoAutorizado(res);
            req.auth = { tipo: "escola", id: escola.id, escolaId: escola.id };
            return next();
        }

        const cuidador = await buscarAtivo(COLECAO_CUIDADORES, payload.sub);
        if (!cuidador) return naoAutorizado(res);

        const escolaAtiva = await buscarAtivo(COLECAO_ESCOLAS, cuidador.data().escola);
        if (!escolaAtiva) return naoAutorizado(res);

        req.auth = { tipo: "cuidador", id: cuidador.id, escolaId: escolaAtiva.id };
        return next();

    } catch (erro) {
        return responderErro(res, erro);
    }
};

// Restringe a rota a certos perfis (ex.: exigirTipo("escola")).
export const exigirTipo = (...tipos) => (req, res, next) => {
    if (!req.auth || !tipos.includes(req.auth.tipo)) {
        return res.status(403).json({ message: "Acesso negado" });
    }
    next();
};
