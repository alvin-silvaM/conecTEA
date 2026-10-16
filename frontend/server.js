// Servidor do front-end: entrega os arquivos de public/ e encaminha as rotas da API
// (/escolas, /cuidadores, /alunos, /health) para o back-end. Sem dependências.
// Como o navegador só fala com esta origem, não é preciso configurar CORS no back-end.
import http from "node:http";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const PORT = Number(process.env.PORT) || 8080;
const API = new URL(process.env.API_URL || "http://localhost:3000");
const ROTAS_API = ["/escolas", "/cuidadores", "/alunos", "/health"];

const TIPOS = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".svg": "image/svg+xml"
};

const ehRotaApi = (caminho) => ROTAS_API.some((r) => caminho === r || caminho.startsWith(`${r}/`));

const encaminhar = (req, res) => {
    const saida = http.request(
        { hostname: API.hostname, port: API.port, path: req.url, method: req.method, headers: { ...req.headers, host: API.host } },
        (resposta) => {
            res.writeHead(resposta.statusCode, resposta.headers);
            resposta.pipe(res);
        }
    );
    saida.on("error", () => {
        res.writeHead(502, { "Content-Type": "application/json; charset=utf-8" });
        res.end(JSON.stringify({ message: "Servidor indisponível. Verifique se o back-end está rodando." }));
    });
    req.pipe(saida);
};

const servirArquivo = async (caminho, res) => {
    const relativo = caminho === "/" ? "index.html" : decodeURIComponent(caminho).replace(/^\/+/, "");
    const arquivo = path.join(PUBLIC, relativo);
    if (!arquivo.startsWith(PUBLIC + path.sep)) {
        res.writeHead(403).end("Acesso negado");
        return;
    }
    try {
        const conteudo = await readFile(arquivo);
        res.writeHead(200, { "Content-Type": TIPOS[path.extname(arquivo)] || "application/octet-stream" });
        res.end(conteudo);
    } catch {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("Página não encontrada");
    }
};

http.createServer((req, res) => {
    const { pathname } = new URL(req.url, "http://localhost");
    if (ehRotaApi(pathname)) return encaminhar(req, res);
    servirArquivo(pathname, res);
}).listen(PORT, () => {
    console.log(`Front-end em http://localhost:${PORT} (API: ${API.origin})`);
});
