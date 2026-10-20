import { UsuarioModel} from '../models/aluno.model.js'

export const validarVinculos = async (vinculos) => {

    for (const vinculo of vinculos) {

        const usuarioExiste = await UsuarioModel.findById(vinculo.usuario);

        if (!usuarioExiste) {
            const erro = new Error(
                `Usuário ${vinculo.usuario} não encontrado`
            );

            erro.status = 404;
            throw erro;
        }

        if (usuarioExiste.tipo !== vinculo.tipo) {
            const erro = new Error(
                `O usuário ${vinculo.usuario} não pode possuir o tipo de vínculo "${vinculo.tipo}"`
            );

            erro.status = 400;
            throw erro;
        }
    }
};

export const validarCNPJ = (cnpj) => {
    
    const regex = /^\d{14}$/;
    return regex.test(cnpj);
}