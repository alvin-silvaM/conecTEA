import { z } from "zod";

// Blocos de validação (Zod) compartilhados pelos models. Tudo que vem de req.body/params é tratado
// como não confiável: tipos errados (objeto, array, número) são rejeitados antes de chegar ao banco.

export const OBRIGATORIO = "Campos obrigatórios não informados";

// Campo ausente -> mensagem de obrigatório; demais falhas de tipo -> mensagem do campo
const erroDe = (invalida) => (iss) => (iss.input === undefined ? OBRIGATORIO : invalida);

// Id de documento do Firestore (ids automáticos têm 20 caracteres). Restringir o formato evita
// ids com "/" ou ".." que mudariam o caminho do documento.
export const idSchema = z
    .string({ error: erroDe("Identificador inválido") })
    .regex(/^[A-Za-z0-9_-]{1,64}$/, "Identificador inválido");

export const textoSchema = (invalida, max = 200) =>
    z.string({ error: erroDe(invalida) }).trim().min(1, invalida).max(max, invalida);

export const cnpjSchema = z
    .string({ error: erroDe("CNPJ inválido: informe 14 dígitos, somente números") })
    .regex(/^\d{14}$/, "CNPJ inválido: informe 14 dígitos, somente números");

export const emailSchema = z
    .string({ error: erroDe("Email inválido") })
    .trim()
    .toLowerCase()
    .max(254, "Email inválido")
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Email inválido");

// Mínimo de 8 caracteres. O bcrypt ignora o que passa de 72 bytes, então limitamos nesse valor.
export const senhaSchema = z
    .string({ error: erroDe("Senha inválida: use no mínimo 8 caracteres") })
    .min(8, "Senha inválida: use no mínimo 8 caracteres")
    .refine((v) => Buffer.byteLength(v, "utf8") <= 72, "Senha inválida: use no máximo 72 bytes");

export const telefoneSchema = z
    .string({ error: erroDe("Telefone inválido") })
    .regex(/^[\d()+\-\s]{8,20}$/, "Telefone inválido");

// Data AAAA-MM-DD, existente e não futura.
export const dataSchema = z
    .string({ error: "Data de nascimento inválida: use AAAA-MM-DD" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data de nascimento inválida: use AAAA-MM-DD")
    .refine((v) => {
        const d = new Date(`${v}T00:00:00.000Z`);
        return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
    }, "Data de nascimento inválida: use AAAA-MM-DD")
    .refine((v) => new Date(`${v}T00:00:00.000Z`).getTime() <= Date.now(), "Data de nascimento não pode ser futura");
