import jwt from "jsonwebtoken";
import { EscolaModel } from "../models/escola.model.js";
import { CuidadorModel } from "../models/cuidador.model.js";
import { validarObjectId } from "../utils/validacao.js";
import { responderErro } from "../utils/erros.js";

const naoAutorizado = (res) =>
    res.status(401).json({ message: "Token ausente, inválido ou expirado" });

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

        if (!validarObjectId(payload.sub) || !["escola", "cuidador"].includes(payload.tipo)) {
            return naoAutorizado(res);
        }

        if (payload.tipo === "escola") {
            const escola = await EscolaModel.findOne({ _id: payload.sub, ativo: true }).select("_id");
            if (!escola) return naoAutorizado(res);
            req.auth = { tipo: "escola", id: escola._id, escolaId: escola._id };
            return next();
        }

        const cuidador = await CuidadorModel.findOne({ _id: payload.sub, ativo: true }).select("_id escola");
        if (!cuidador) return naoAutorizado(res);

        const escolaAtiva = await EscolaModel.exists({ _id: cuidador.escola, ativo: true });
        if (!escolaAtiva) return naoAutorizado(res);

        req.auth = { tipo: "cuidador", id: cuidador._id, escolaId: cuidador.escola };
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
