import { createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { fileURLToPath } from 'node:url';

const rulesetPath = fileURLToPath(
  new URL('../ruleset/ruleset.template.html', import.meta.url),
);
const host = process.env.HOST || '0.0.0.0';
const port = Number.parseInt(process.env.PORT || '4173', 10);

createServer((request, response) => {
  const path = new URL(request.url, `http://${request.headers.host}`).pathname;

  if (path === '/healthz') {
    response.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('ok');
    return;
  }

  if (path !== '/' && path !== '/index.html') {
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'cache-control': 'no-store',
    'content-type': 'text/html; charset=utf-8',
  });
  createReadStream(rulesetPath).pipe(response);
}).listen(port, host, () => {
  console.log(`Domico visual ruleset available at http://${host}:${port}`);
});
