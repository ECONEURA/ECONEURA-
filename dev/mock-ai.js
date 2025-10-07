// Minimal mock AI server for local preview. Run with: node dev/mock-ai.js
const http = require('http');
const port = process.env.PORT || 8787;

const server = http.createServer((req, res) => {
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      try {
        const j = JSON.parse(body || '{}');
        if (j.ping) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ ok: true, version: 'mock-ai-2025-10' }));
        }
        // basic echo assistant shape
        const out = {
          id: 'mock_resp_1',
          object: 'chat.completion',
          created: Date.now(),
          model: j.model || 'gpt-4o-mini',
          choices: [
            {
              index: 0,
              message: {
                role: 'assistant',
                content: `Mock reply to: ${String(j.prompt || j.message || '').slice(0, 200)}`,
              },
            },
          ],
        };
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(out));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'invalid json' }));
      }
    });
    return;
  }
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('ECONEURA mock-ai: POST JSON to interact');
});

server.listen(port, () => console.log(`Mock AI server listening on http://localhost:${port}`));
