import mongoose from "mongoose";

// Validações de tipo e formato. Tudo que vem de req.body é tratado como não confiável:
// qualquer valor que não seja string (objeto, array, número) é rejeitado antes de chegar ao banco.

export const ehTexto = (valor, max = 200) =>
    typeof valor === "string" && valor.trim().length > 0 && valor.length <= max;

export const validarCNPJ = (valor) => typeof valor === "string" && /^\d{14}$/.test(valor);

export const validarEmail = (valor) =>
    typeof valor === "string" && valor.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);

// Mínimo de 8 caracteres. O bcrypt ignora o que passa de 72 bytes, então limitamos nesse valor.
export const validarSenha = (valor) =>
    typeof valor === "string" && valor.length >= 8 && Buffer.byteLength(valor, "utf8") <= 72;

export const validarTelefone = (valor) =>
    typeof valor === "string" && /^[\d()+\-\s]{8,20}$/.test(valor);

export const validarObjectId = (valor) =>
    typeof valor === "string" && /^[a-f\d]{24}$/i.test(valor) && mongoose.isValidObjectId(valor);

// Data no formato AAAA-MM-DD, existente e não futura.
export const validarData = (valor) => {
    if (typeof valor !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(valor)) return false;
    const data = new Date(`${valor}T00:00:00.000Z`);
    if (Number.isNaN(data.getTime()) || data.toISOString().slice(0, 10) !== valor) return false;
    return data.getTime() <= Date.now();
};
