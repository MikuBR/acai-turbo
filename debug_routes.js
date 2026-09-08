// Simula o que o bundle faz: importa o router e verifica se as rotas estão corretas
import { createBrowserRouter } from 'react-router';
import routes from './src/router/routes.jsx';

console.log('=== Rotas carregadas ===');
console.log('Numero de rotas:', routes.length);
routes.forEach((r, i) => {
  console.log(`  [${i}] path=${r.path}, has Component: ${!!r.Component}, has children: ${!!r.children}, has loader: ${!!r.loader}`);
  if (r.children) {
    r.children.forEach((c, j) => {
      console.log(`      child [${j}]: ${c.path || 'index'}`);
    });
  }
});

const router = createBrowserRouter(routes);
console.log('\n=== Router criado ===');
console.log('Tipo:', router.type);
console.log('Numero de handlers:', Object.keys(router).length);

// Testa match das rotas
const testPaths = ['/', '/login', '/pdv', '/pdv/builder/acai', '/settings', '/reports', '/checkout', '/change-password', '/nonexistent'];
console.log('\n=== Teste de matching ===');
for (const path of testPaths) {
  try {
    const match = router.match(path);
    console.log(`  ${path}: ${match ? 'ENCONTROU' : 'NÃO ENCONTROU'}`);
  } catch (e) {
    console.log(`  ${path}: ERRO - ${e.message}`);
  }
}
