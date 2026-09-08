import { readFileSync } from 'fs';

const bundlePath = 'dist/assets/index-Caq7SMJL.js';
const bundle = readFileSync(bundlePath, 'utf8');

console.log('=== Verificação do bundle com HashRouter ===');
console.log('Arquivo:', bundlePath);
console.log('Tamanho:', bundle.length, 'bytes\n');

const checks = [
  ['createHashRouter', 'createHashRouter (CORRETO para Electron file://)'],
  ['createBrowserRouter', 'createBrowserRouter (DEVERIA SER 0 — incompatível com file://)'],
  ['/pdv', 'rota /pdv'],
  ['/login', 'rota /login'],
  ['/settings', 'rota /settings'],
  ['/reports', 'rota /reports'],
  ['/checkout', 'rota /checkout'],
  ['/change-password', 'rota /change-password'],
  ['RouterProvider', 'RouterProvider'],
  ['Outlet', 'Outlet'],
  ['Navigate', 'Navigate'],
  ['Hey developer', 'mensagem Hey developer'],
  ['Sincronizando', 'string de sincronização'],
  ['window.AudioContext', 'window.AudioContext'],
  ['880', 'frequência 880Hz do beep'],
];

let pass = 0, fail = 0;
checks.forEach(([term, desc]) => {
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const count = (bundle.match(re) || []).length;
  if (count > 0) {
    console.log('✓'.padEnd(2) + ' ' + term.padEnd(25) + (count > 1 ? ` → ${count}x` : '') + ' — ' + desc);
    pass++;
  } else {
    console.log('✗'.padEnd(2) + ' ' + term.padEnd(25) + ' — NÃO ENCONTRADO — ' + desc);
    fail++;
  }
});

console.log('\n=== RESUMO: ' + pass + ' encontrados, ' + fail + ' NÃO encontrados ===');

if (fail > 0) {
  console.log('\n⚠️  O bundle está INCORRETO.');
  process.exit(1);
} else {
  console.log('\n✓ Bundle correto — todos os componentes e rotas presentes.');
  process.exit(0);
}
