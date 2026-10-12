import { cadastrarEscolaService, loginEscolaService } from "../services/escola.service.js";
import { responderErro } from "../utils/erros.js";
import { assinarToken } from "../utils/seguranca.js";

// A validação (Zod) acontece antes, no middleware validar() das rotas:
// req.validado.body já contém apenas dados válidos e permitidos.

// CREATE escola no database
export const cadastrarEscola = async (req, res) => {
    try {
        const resposta = await cadastrarEscolaService(req.validado.body);
        return res.status(201).json({ message: "Escola cadastrada", resposta });
    } catch (erro) {
        return responderErro(res, erro, "Erro ao cadastrar escola");
    }
};

// Login de uma escola (post com dados de login)
export const loginEscola = async (req, res) => {
    try {
        const { cnpj, senha } = req.validado.body;
        const escola = await loginEscolaService(cnpj, senha);
        const token = assinarToken("escola", escola._id);
        return res.status(200).json({ message: "Login realizado com sucesso", token });
    } catch (erro) {
        return responderErro(res, erro, "Falha no login");
    }
};
