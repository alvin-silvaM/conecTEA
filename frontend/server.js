// Servidor simples (sem dependências): serve a pasta /public e encaminha /escolas, /cuidadores, /alunos e /health para o backend.
// O backend não habilita CORS, então o proxy evita o bloqueio do navegador.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = process.env.PORT || 8080;                                // porta do frontend
const API = new URL(process.env.API_URL || 'http://localhost:3000');  // URL do backend local

const PUBLIC = path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
const TIPOS = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };

http.createServer((req, res) => {
  if (/^\/(escolas|cuidadores|alunos|health)(\/|\?|$)/.test(req.url)) {
    const proxy = http.request(
      { hostname: API.hostname, port: API.port, path: req.url, method: req.method, headers: { ...req.headers, host: API.host } },
      (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); }
    );
    proxy.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Não foi possível conectar ao backend em ' + API.origin }));
    });
    req.pipe(proxy);
    return;
  }

  const arquivo = path.join(PUBLIC, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  if (!arquivo.startsWith(PUBLIC + path.sep) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
    res.writeHead(404); return res.end('Não encontrado');
  }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
  fs.createReadStream(arquivo).pipe(res);
}).listen(PORT, () => {
  console.log(`Frontend: http://localhost:${PORT}  |  API: ${API.origin}`);
});
