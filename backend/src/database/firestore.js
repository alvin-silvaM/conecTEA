import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";

// Firestore via Firebase Admin SDK (backend confiável).
// Credenciais, em ordem de prioridade:
//   1. FIRESTORE_EMULATOR_HOST  -> emulador local, não precisa de credencial.
//   2. GOOGLE_APPLICATION_CREDENTIALS -> caminho do JSON da conta de serviço (fora do repositório).
//   3. Application Default Credentials (gcloud auth application-default login, Cloud Run, etc.).
// Nunca use a API key do firebaseConfig aqui: ela não é credencial administrativa.

let db;

// Valida a configuração sem imprimir nenhum valor sensível.
export const validarConfigFirebase = () => {
    const erros = [];

    if (!process.env.FIREBASE_PROJECT_ID) {
        erros.push("defina FIREBASE_PROJECT_ID no .env");
    }

    const caminho = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (caminho && !process.env.FIRESTORE_EMULATOR_HOST && !existsSync(caminho)) {
        erros.push("GOOGLE_APPLICATION_CREDENTIALS aponta para um arquivo que não existe");
    }

    return erros;
};

export const iniciarFirestore = async () => {
    const erros = validarConfigFirebase();
    if (erros.length > 0) {
        throw new Error(`Configuração do Firebase inválida: ${erros.join("; ")}`);
    }

    const credencial = process.env.FIRESTORE_EMULATOR_HOST ? undefined : applicationDefault();

    // Confere a credencial antes de qualquer chamada: sem isso o erro nasce dentro do cliente gRPC
    // e derruba o processo com um stack trace em vez de uma mensagem clara.
    if (credencial) {
        try {
            await credencial.getAccessToken();
        } catch {
            throw new Error(
                "Credenciais do Firebase não encontradas ou inválidas. Defina GOOGLE_APPLICATION_CREDENTIALS " +
                "com o caminho do JSON da conta de serviço, ou rode: gcloud auth application-default login"
            );
        }
    }

    if (getApps().length === 0) {
        initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID, credential: credencial });
    }

    db = getFirestore();
    // Documentos com campos undefined são ignorados em vez de gerar erro
    db.settings({ ignoreUndefinedProperties: true });

    // Falha rápido, com mensagem clara, se as credenciais ou o projeto estiverem errados
    try {
        await db.collection("_healthcheck").doc("ping").get();
    } catch (erro) {
        throw new Error(
            "Não foi possível acessar o Firestore. Confira FIREBASE_PROJECT_ID, as credenciais " +
            `(GOOGLE_APPLICATION_CREDENTIALS ou ADC) e se o Firestore foi criado no projeto. (${erro.code ?? "erro"})`
        );
    }

    console.log("Conectado ao Firestore");
};

export const firestore = () => {
    if (!db) throw new Error("Firestore não inicializado");
    return db;
};

// Unicidade (o Firestore não tem índice unique): cada valor único (email, CNPJ...) tem um documento
// "trava" em "_unicos", com id derivado do hash do valor. Ele é criado na MESMA transação do
// documento principal, então dois cadastros simultâneos com o mesmo valor não passam juntos.
export const refUnico = (tipo, valor) =>
    firestore().collection("_unicos").doc(`${tipo}_${createHash("sha256").update(String(valor)).digest("hex")}`);
