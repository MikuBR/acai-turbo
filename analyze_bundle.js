import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const assetsDir = join(process.cwd(), 'dist', 'assets');
const bundle = readFileSync(join(assetsDir, 'index-CtboBiv9.js'), 'utf8');

console.log('=== Análise do bundle pós-terser ===\n');

const patterns = [
  ['"{path:', 'objeto de rota com path'],
  ['"component"', 'propriedade component'],
  ['"loader"', 'propriedade loader'],
  ['"children"', 'propriedade children'],
  ['router', 'objeto router'],
  ['routes', 'array de rotas'],
  ['/pdv', 'rota pdv'],
  ['/login', 'rota login'],
];

patterns.forEach(([term, desc]) => {
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
  const matches = bundle.match(re);
  console.log((matches ? '✓' : '✗') + ' ' + term.padEnd(30) + (matches ? ' → ' + matches.length + 'x' : ' → NÃO ENCONTRADO') + ' — ' + desc);
});

console.log('\n=== Contexto ao redor de "/pdv" ===');
const idx = bundle.indexOf('"/pdv"');
if (idx >= 0) {
  console.log(bundle.substring(Math.max(0, idx - 300), idx + 300));
  console.log('\n...');
} else {
  console.log('NÃO ENCONTROU "/pdv"');
}

console.log('\n=== Procurando criação de rota ===');
const routePattern = /\{[\s\n]*path:\s*['"]/g;
const routeMatches = bundle.match(routePattern);
console.log('Padrões de criação de rota encontrados:', routeMatches ? routeMatches.length : 0);

if (routeMatches) {
  console.log('\nPrimeiras 3 ocorrências:');
  routeMatches.slice(0, 3).forEach((m, i) => {
    const pos = bundle.indexOf(m);
    console.log(`  [${i+1}] posição ${pos}: ...${bundle.substring(pos, pos + 150)}...`);
  });
}

console.log('\n=== Tamanho total do bundle ===');
console.log(bundle.length, 'bytes');
