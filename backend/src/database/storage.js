
import {
    S3Client,
    PutObjectCommand,
    HeadObjectCommand,
    GetObjectCommand
} from "@aws-sdk/client-s3";

import { ErroHttp } from "../utils/erros.js";

// Backblaze B2 usando a API compatível com S3.
// O bucket permanece privado.

const configuracao = () => {
    const {
        B2_ENDPOINT,
        B2_REGION,
        B2_BUCKET,
        B2_KEY_ID,
        B2_APPLICATION_KEY
    } = process.env;

    if (
        ![
            B2_ENDPOINT,
            B2_REGION,
            B2_BUCKET,
            B2_KEY_ID,
            B2_APPLICATION_KEY
        ].every(Boolean)
    ) {
        throw new ErroHttp(
            503,
            "Armazenamento de áudios indisponível"
        );
    }

    let endpoint;

    try {
        endpoint = new URL(B2_ENDPOINT);

        if (
            endpoint.protocol !== "https:" ||
            endpoint.pathname !== "/" ||
            endpoint.search ||
            endpoint.hash
        ) {
            throw new Error("Endpoint inválido");
        }
    } catch {
        throw new ErroHttp(
            503,
            "Configuração do armazenamento inválida"
        );
    }

    return {
        endpoint: endpoint.origin,
        region: B2_REGION,
        bucket: B2_BUCKET,
        keyId: B2_KEY_ID,
        applicationKey: B2_APPLICATION_KEY
    };
};

let clienteS3 = null;

const obterCliente = () => {
    const cfg = configuracao();

    if (!clienteS3) {
        clienteS3 = new S3Client({
            region: cfg.region,
            endpoint: cfg.endpoint,
            forcePathStyle: true,

            credentials: {
                accessKeyId: cfg.keyId,
                secretAccessKey: cfg.applicationKey
            }
        });
    }

    return {
        cliente: clienteS3,
        bucket: cfg.bucket
    };
};

const arquivoNaoEncontrado = (erro) =>
    erro?.name === "NotFound" ||
    erro?.name === "NoSuchKey" ||
    erro?.$metadata?.httpStatusCode === 404;

// Grava o WAV no Backblaze B2.
export const salvarArquivo = async (
    caminho,
    conteudo,
    contentType
) => {
    try {
        const { cliente, bucket } = obterCliente();

        const buffer = Buffer.isBuffer(conteudo)
            ? conteudo
            : Buffer.from(conteudo);

        await cliente.send(
            new PutObjectCommand({
                Bucket: bucket,
                Key: caminho,
                Body: buffer,
                ContentType: contentType,
                ContentLength: buffer.length
            })
        );

    } catch (erro) {
        console.error(
            "Falha no upload para Backblaze B2:",
            erro?.name,
            erro?.$metadata?.httpStatusCode,
            erro?.message
        );

        throw new ErroHttp(
            503,
            "Não foi possível armazenar o áudio"
        );
    }
};

// Verifica se o arquivo já existe.
export const arquivoExiste = async (caminho) => {
    try {
        const { cliente, bucket } = obterCliente();

        await cliente.send(
            new HeadObjectCommand({
                Bucket: bucket,
                Key: caminho
            })
        );

        return true;

    } catch (erro) {
        if (arquivoNaoEncontrado(erro)) {
            return false;
        }

        console.error(
            "Falha ao verificar áudio no Backblaze:",
            erro?.name,
            erro?.message
        );

        throw new ErroHttp(
            503,
            "Não foi possível verificar o áudio armazenado"
        );
    }
};

// Baixa o WAV do Backblaze B2.
export const lerArquivo = async (caminho) => {
    try {
        const { cliente, bucket } = obterCliente();

        const resposta = await cliente.send(
            new GetObjectCommand({
                Bucket: bucket,
                Key: caminho
            })
        );

        return Buffer.from(
            await resposta.Body.transformToByteArray()
        );

    } catch (erro) {
        if (arquivoNaoEncontrado(erro)) {
            return null;
        }

        console.error(
            "Falha ao baixar áudio do Backblaze:",
            erro?.name,
            erro?.message
        );

        throw new ErroHttp(
            503,
            "Não foi possível obter o áudio armazenado"
        );
    }
};

// Validação da configuração.
export const validarConfigStorage = () => {
    const campos = [
        "B2_ENDPOINT",
        "B2_REGION",
        "B2_BUCKET",
        "B2_KEY_ID",
        "B2_APPLICATION_KEY"
    ];

    const preenchidos = campos.filter(
        campo => Boolean(process.env[campo])
    ).length;

    if (preenchidos === 0) return [];

    if (preenchidos !== campos.length) {
        return [
            "defina todas as variáveis B2_* no .env"
        ];
    }

    return [];
};

export const storageConfigurado = () =>
    [
        "B2_ENDPOINT",
        "B2_REGION",
        "B2_BUCKET",
        "B2_KEY_ID",
        "B2_APPLICATION_KEY"
    ].every(campo => Boolean(process.env[campo]));
