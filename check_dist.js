import { readFileSync, readdirSync } from 'fs';
import { join, relative } from 'path';

const distDir = join(process.cwd(), 'dist');
const assetsDir = join(distDir, 'assets');

console.log('=== dist/ atual ===');
try {
  readdirSync(assetsDir).forEach(f => {
    const stat = readdirSync(assetsDir).find(() => true);
    console.log(f);
  });
} catch (e) {
  console.log('ERRO lendo dist/assets:', e.message);
}

const jsFiles = readdirSync(assetsDir).filter(f => f.endsWith('.js') && !f.endsWith('.map'));
console.log('\n=== Busca no bundle principal ===');
const mainJs = jsFiles.find(f => f.startsWith('index-'));
if (!mainJs) {
  console.log('NÃO ENCONTROU arquivo index-*.js!');
  console.log('Arquivos disponíveis:', jsFiles);
  process.exit(1);
}

const bundle = readFileSync(join(assetsDir, mainJs), 'utf8');
console.log(`Arquivo: ${mainJs} (${bundle.length} bytes)\n`);

const checks = [
  ['createBrowserRouter', 'função de criação do router'],
  ['RouterProvider', 'componente de renderização do router'],
  ['/pdv', 'rota PDV'],
  ['/login', 'rota login'],
  ['/settings', 'rota settings'],
  ['/reports', 'rota reports'],
  ['/checkout', 'rota checkout'],
  ['/change-password', 'rota change-password'],
  ['/pdv/builder/acai', 'rota builder acai'],
  ['/pdv/builder/quick', 'rota builder quick'],
  ['/pdv/new-table', 'rota new-table'],
  ['AppLayout', 'layout principal'],
  ['Outlet', 'componente Outlet do router'],
  ['Navigate', 'componente Navigate'],
  ['requireAuth', 'loader de auth'],
  ['Sincronizando', 'string de sincronização'],
  ['error-404', 'estratégia de erro 404'],
  ['Hey developer', 'mensagem Hey developer'],
  ['No routes matched', 'mensagem no routes matched'],
  ['useNavigate', 'hook useNavigate'],
];

let pass = 0, fail = 0;
checks.forEach(([term, desc]) => {
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const count = (bundle.match(re) || []).length;
  if (count > 0) {
    console.log(`✓ ${term.padEnd(25)} (${count}x) — ${desc}`);
    pass++;
  } else {
    console.log(`✗ ${term.padEnd(25)} — NÃO ENCONTRADO — ${desc}`);
    fail++;
  }
});

console.log(`\n=== RESUMO: ${pass} encontrados, ${fail} NÃO encontrados ===`);

if (fail > 0) {
  console.log('\n⚠️  O bundle está INCORRETO — faltam componentes/rotas.');
  console.log('O dist/ foi gerado a partir do commit errado ou o Vite não está incluindo os módulos.');
  process.exit(1);
} else {
  console.log('\n✓ Bundle correto — todos os componentes e rotas presentes.');
}
