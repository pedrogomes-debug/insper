// Servidor HTTP local minimalista para servir a carteira na LAN.
// Uso: `node server.js` na pasta do projeto.
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 8000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function safeJoin(root, urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const safe = path.normalize(decoded).replace(/^(\.\.[\\/])+/g, '');
  const full = path.join(root, safe);
  if (!full.startsWith(root)) return null;
  return full;
}

const server = http.createServer((req, res) => {
  // Endpoint usado pelo front para descobrir o IP da LAN
  // (assim o QR pode codificar uma URL escaneável de outro celular).
  if (req.url && req.url.split('?')[0] === '/lan-host') {
    const ips = getLanIPs();
    const host = ips[0] ? ips[0] + ':' + PORT : null;
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    });
    return res.end(JSON.stringify({ host, ips, port: PORT }));
  }

  let target = safeJoin(ROOT, req.url || '/');
  if (!target) {
    res.writeHead(400);
    return res.end('Bad request');
  }

  fs.stat(target, (err, stat) => {
    if (err || !stat) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('404 - arquivo nao encontrado');
    }
    if (stat.isDirectory()) {
      target = path.join(target, 'index.html');
    }
    fs.readFile(target, (err2, data) => {
      if (err2) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        return res.end('404 - ' + err2.message);
      }
      const ext = path.extname(target).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-store',
      });
      res.end(data);
    });
  });
});

function getLanIPs() {
  const ifaces = os.networkInterfaces();
  const ips = [];
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) ips.push(iface.address);
    }
  }
  return ips;
}

server.listen(PORT, '0.0.0.0', () => {
  const ips = getLanIPs();
  console.log(`Carteira de estudante rodando em:`);
  console.log(`  Local : http://localhost:${PORT}/`);
  ips.forEach((ip) => console.log(`  Rede  : http://${ip}:${PORT}/`));
  console.log('\nPressione Ctrl+C para parar.');
});
