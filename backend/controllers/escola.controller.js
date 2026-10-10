import { cadastrarEscolaService, loginEscolaService } from "../services/escola.service.js";
import { ehTexto, validarCNPJ, validarEmail, validarSenha, validarTelefone } from "../utils/validacao.js";
import { responderErro } from "../utils/erros.js";
import { assinarToken } from "../utils/seguranca.js";

// CUD para escola

// CREATE escola no database
export const cadastrarEscola = async (req, res) => {

    const { cnpj, razaoSocial, endereco, telefone1, telefone2, email, senha } = req.body ?? {};

    if (!cnpj || !razaoSocial || !endereco || !telefone1 || !email || !senha) {
        return res.status(400).json({ message: "Campos obrigatórios não informados" });
    }

    if (!validarCNPJ(cnpj)) {
        return res.status(400).json({ message: "CNPJ inválido: informe 14 dígitos, somente números" });
    }

    if (!ehTexto(razaoSocial, 200)) {
        return res.status(400).json({ message: "Razão social inválida" });
    }

    if (typeof endereco !== "object" || Array.isArray(endereco)) {
        return res.status(400).json({ message: "Endereço incompleto" });
    }

    const { numero, rua, municipio, estado } = endereco;

    if (!Number.isInteger(numero) || numero <= 0 || !ehTexto(rua, 200) || !ehTexto(municipio, 120) || !ehTexto(estado, 50)) {
        return res.status(400).json({ message: "Endereço incompleto ou inválido" });
    }

    if (!validarTelefone(telefone1) || (telefone2 !== undefined && !validarTelefone(telefone2))) {
        return res.status(400).json({ message: "Telefone inválido" });
    }

    if (!validarEmail(email)) {
        return res.status(400).json({ message: "Email inválido" });
    }

    if (!validarSenha(senha)) {
        return res.status(400).json({ message: "Senha inválida: use no mínimo 8 caracteres" });
    }

    // Monta o objeto só com campos permitidos. "ativo" não é aceito do cliente (começa sempre ativo).
    const escolaObjeto = {
        cnpj,
        razaoSocial,
        endereco: { numero, rua, municipio, estado },
        telefone1,
        telefone2,
        email,
        senha
    };

    try {

        const resposta = await cadastrarEscolaService(escolaObjeto);

        return res.status(201).json({ message: "Escola cadastrada", resposta });

    } catch (erro) {

        return responderErro(res, erro, "Erro ao cadastrar escola");
    }

}

// Login de uma escola (post com dados de login)
export const loginEscola = async (req, res) => {

    const { cnpj, senha } = req.body ?? {};

    if (!cnpj || !senha || !validarCNPJ(cnpj) || typeof senha !== "string") {
        return res.status(400).json({ message: "Campos incompletos ou incorretos" });
    }

    try {

        const escola = await loginEscolaService(cnpj, senha);

        const token = assinarToken("escola", escola._id);

        return res.status(200).json({ message: "Login realizado com sucesso", token });

    } catch (erro) {

        return responderErro(res, erro, "Falha no login");
    }

}
