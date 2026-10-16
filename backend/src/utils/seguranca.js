import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Hash de uma senha fictícia. Quando o usuário não existe, comparamos contra ele para que a
// resposta demore o mesmo tempo de um login com senha errada (evita descobrir contas pelo tempo).
export const HASH_FICTICIO = bcrypt.hashSync("senha-ficticia-nao-utilizada", 10);

export const assinarToken = (tipo, id) =>
    jwt.sign({ tipo }, process.env.SECRET, {
        subject: String(id),
        expiresIn: "1d",
        algorithm: "HS256"
    });
