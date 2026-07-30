const fs = require('fs');

function escapeHTMLChars(str) {
  return str.replace(/`/g, '\\`')
    .replace(/\${/g, '\\\${');
}

function processTemplateLiteral(template) {
  let escaped = template.replace(/`/g, '\\\`');
  return escaped;
}

// Read the main.cjs file
let content = fs.readFileSync('main.cjs', 'utf8');

// Fix the getLoadingPageHTML function
const fixedFunction = `function getLoadingPageHTML(message = 'Inicializando banco de dados...') {
  return '\\'\\<!DOCTYPE html>\\'\\n    <html lang=\\'pt-BR\\'>\\n      <head>\\n        <meta charset=\\'utf-8\\' \\n        <meta name=\\'viewport\\' content=\\'width=device-width, initial-scale=1\\' \\n        <title>A\\'\\\xc3\\x81\\'\\xc3\\xa9 Wave — Carregando</title>\\n        <style>\\n          * { box-sizing: border-box; }\\n          body {\\n            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, sans-serif;\\n            background: #020617;\\n            color: #f8fafc;\\n            display: grid;\\n            place-items: center;\\n            min-height: 100vh;\\n            margin: 0;\\n            padding: 24px;\\n            text-align: center;\\n          }\\n          .card {\\n            max-width: 420px;\\n            padding: 32px;\\n            border: 1px solid #334155;\\n            border-radius: 16px;\\n            background: #0f172a;\\n          }\\n          .spinner {\\n            width: 48px;\\n            height: 48px;\\n            border: 3px solid #334155;\\n            border-top-color: #22d3ee;\\n            border-radius: 50%;\\n            animation: spin 1s linear infinite;\\n            margin: 0 auto 24px;\\n          }\\n          @keyframes spin { to { transform: rotate(360deg); } }\\n          h1 { font-size: 1.25rem; font-weight: 600; margin: 0 0 8px; }\\n          p { color: #94a3b8; font-size: 0.9rem; margin: 0; }\\n          .hint { font-size: 0.75rem; color: #64748b; margin-top: 16px; }\\n        </style>\\n      </head>\\n      <body>\\n        <div class=\\'card\\'>\\n          <div class=\\'spinner\\' aria-hidden=\\'true\\'></div>\\n          <h1>\\${message}\\</h1>\\n          <p>Aguarde enquanto preparamos tudo.<\\/p>\\n          <p class=\\'hint\\'>Isso pode levar alguns segundos na primeira execu\\'\\xc3\\xa7\\'\\xc3\\xa3o.</p>\\n        </div>\\n      </body>\\n    </html>\\';\n}'
;

// Find and replace the function
const regex = /function getLoadingPageHTML\(message = 'Inicializando banco de dados\.\.\.'\)( \{[^}]*\} else \{[^}]*\})/gs;
content = content.replace(regex, fixedFunction);

// Also need to fix the duplicate in the original app whenReady
const appWhenReadyMatch = /app\.whenReady\(\) \.then\(\(\) => \{.*mainWindow\.loadURL\([^)]+getLoadingPageHTML\(\)/gs;
content = content.replace(appWhenReadyMatch, '');

// Write back
fs.writeFileSync('main.cjs', content, 'utf8');
console.log('Fixed template literal syntax issues');
