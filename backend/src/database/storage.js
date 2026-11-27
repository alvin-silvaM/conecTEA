import { createHash, createHmac } from "node:crypto";
import { ErroHttp } from "../utils/erros.js";

// Backblaze B2 via S3-compatible API. The bucket must be private.
// Credentials are an Application Key ID + Application Key created in Backblaze.
const configuracao = () => {
    const { B2_ENDPOINT, B2_REGION, B2_BUCKET, B2_KEY_ID, B2_APPLICATION_KEY } = process.env;
    if (![B2_ENDPOINT, B2_REGION, B2_BUCKET, B2_KEY_ID, B2_APPLICATION_KEY].every(Boolean)) {
        throw new ErroHttp(503, "Armazenamento de áudios indisponível");
    }

    let endpoint;
    try {
        endpoint = new URL(B2_ENDPOINT);
        if (endpoint.protocol !== "https:" || endpoint.pathname !== "/" || endpoint.search || endpoint.hash) {
            throw new Error("endpoint inválido");
        }
    } catch {
        throw new ErroHttp(503, "Configuração do armazenamento inválida");
    }

    return { endpoint, region: B2_REGION, bucket: B2_BUCKET, keyId: B2_KEY_ID, applicationKey: B2_APPLICATION_KEY };
};

const sha256 = (valor) => createHash("sha256").update(valor).digest("hex");
const hmac = (chave, valor, encoding) => createHmac("sha256", chave).update(valor).digest(encoding);
const awsEncode = (valor) => encodeURIComponent(valor).replace(/[!'()*]/g, (c) =>
    `%${c.charCodeAt(0).toString(16).toUpperCase()}`
);
const caminhoObjeto = (bucket, key) =>
    `/${awsEncode(bucket)}/${String(key).split("/").map(awsEncode).join("/")}`;

const assinar = ({ method, key, body = Buffer.alloc(0), contentType }) => {
    const cfg = configuracao();
    const agora = new Date();
    const amzDate = agora.toISOString().replace(/[:-]|\.\d{3}/g, "");
    const data = amzDate.slice(0, 8);
    const payloadHash = sha256(body);
    const uri = caminhoObjeto(cfg.bucket, key);
    const host = cfg.endpoint.host;

    const headers = {
        host,
        "x-amz-content-sha256": payloadHash,
        "x-amz-date": amzDate
    };
    if (contentType) headers["content-type"] = contentType;

    const nomesAssinados = Object.keys(headers).sort();
    const canonicalHeaders = nomesAssinados.map((nome) => `${nome}:${headers[nome].trim()}`).join("\n");
    const signedHeaders = nomesAssinados.join(";");
    const canonicalRequest = [
        method,
        uri,
        "",
        canonicalHeaders,
        signedHeaders,
        payloadHash
    ].join("\n");

    const scope = `${data}/${cfg.region}/s3/aws4_request`;
    const stringToSign = [
        "AWS4-HMAC-SHA256",
        amzDate,
        scope,
        sha256(canonicalRequest)
    ].join("\n");

    const kDate = hmac(`AWS4${cfg.applicationKey}`, data);
    const kRegion = hmac(kDate, cfg.region);
    const kService = hmac(kRegion, "s3");
    const kSigning = hmac(kService, "aws4_request");
    const signature = hmac(kSigning, stringToSign, "hex");

    headers.authorization =
        `AWS4-HMAC-SHA256 Credential=${cfg.keyId}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

    return {
        url: `${cfg.endpoint.origin}${uri}`,
        headers,
        body: method === "PUT" ? body : undefined
    };
};

const requisitar = async (method, key, body, contentType) => {
    const request = assinar({ method, key, body, contentType });
    let response;
    try {
        response = await fetch(request.url, {
            method,
            headers: request.headers,
            body: request.body,
            signal: AbortSignal.timeout(Number(process.env.B2_TIMEOUT_MS) || 30000)
        });
    } catch (erro) {
        console.error("Falha de comunicação com Backblaze B2:", erro?.cause?.code ?? erro?.message);
        throw new ErroHttp(503, "Não foi possível acessar o armazenamento de áudios");
    }

    if (!response.ok) {
        const detalhe = (await response.text().catch(() => "")).slice(0, 500);
        if (response.status !== 404) {
            console.error(`Backblaze B2 respondeu ${response.status}:`, detalhe);
        }
        return { response, detalhe };
    }
    return { response, detalhe: "" };
};

// Grava o WAV em um objeto privado. O caminho é guardado no Firestore.
export const salvarArquivo = async (caminho, conteudo, contentType) => {
    const { response, detalhe } = await requisitar("PUT", caminho, conteudo, contentType);
    if (!response.ok) {
        console.error("Falha no upload para Backblaze B2:", response.status, detalhe);
        throw new ErroHttp(503, "Não foi possível armazenar o áudio");
    }
};

export const arquivoExiste = async (caminho) => {
    const { response } = await requisitar("HEAD", caminho);
    if (response.status === 404) return false;
    if (!response.ok) throw new ErroHttp(503, "Não foi possível verificar o áudio armazenado");
    return true;
};

// Devolve o WAV em Buffer, ou null se o objeto não existir.
export const lerArquivo = async (caminho) => {
    const { response } = await requisitar("GET", caminho);
    if (response.status === 404) return null;
    if (!response.ok) throw new ErroHttp(503, "Não foi possível obter o áudio armazenado");
    return Buffer.from(await response.arrayBuffer());
};

// Permite ao app validar configuração incompleta sem expor valores sensíveis.
export const validarConfigStorage = () => {
    const campos = ["B2_ENDPOINT", "B2_REGION", "B2_BUCKET", "B2_KEY_ID", "B2_APPLICATION_KEY"];
    const preenchidos = campos.filter((campo) => Boolean(process.env[campo])).length;
    if (preenchidos === 0) return [];
    if (preenchidos !== campos.length) return ["defina todas as variáveis B2_* no .env"];
    return [];
};

export const storageConfigurado = () =>
    ["B2_ENDPOINT", "B2_REGION", "B2_BUCKET", "B2_KEY_ID", "B2_APPLICATION_KEY"]
        .every((campo) => Boolean(process.env[campo]));
