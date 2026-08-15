#!/usr/bin/env node
/**
 * Cria os templates de licença/EULA em build/.
 *
 * FONTE DOS DADOS PESSOAIS (SEGURANÇA):
 *   - Lê de .env.local (ignorado pelo git) as variáveis:
 *       BUILD_LICENSE_OWNER="Nome Completo"
 *       BUILD_LICENSE_DOCUMENT="CPF ou CNPJ"
 *   - Se as variáveis existirem, os arquivos são gerados com os dados reais.
 *   - Se NÃO existirem, usa {{PLACEHOLDERS}} (seguro para o CI).
 *
 * O .env.local NUNCA é commitado. Seus dados pessoais NUNCA vão ao GitHub.
 *
 * Uso: node scripts/generate-license-templates.cjs
 */
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const buildDir = path.join(__dirname, '..', 'build');

// Dados pessoais vindos do .env.local (ou placeholders seguros)
const OWNER = process.env.BUILD_LICENSE_OWNER || '{{NOME_COMPLETO}}';
const DOCUMENT = process.env.BUILD_LICENSE_DOCUMENT || '{{CNPJ_OU_CPF}}';
const hasRealData = !OWNER.startsWith('{{') && !DOCUMENT.startsWith('{{');

const LICENSE = `AÇAÍ WAVE - LICENÇA PROPRIETÁRIA
=================================

Titular: ${OWNER} ("Licenciante")
CNPJ/CPF: ${DOCUMENT}
Software: Açaí Wave ("Software")
Versão: 1.1.1

1. CONCESSÃO DE LICENÇA
   1.1 O Licenciante concede ao Licenciado uma licença NÃO EXCLUSIVA,
       INTRANSFERÍVEL, REVOGÁVEL e LIMITADA para usar o Software
       exclusivamente para fins internos de operação do estabelecimento
       licenciado.

   1.2 É EXPRESSAMENTE VEDADO ao Licenciado:
       a) Copiar, modificar, adaptar, traduzir ou criar obras derivadas
          do Software, no todo ou em parte;
       b) Distribuir, sublicenciar, alugar, arrendar, emprestar ou
          disponibilizar o Software a terceiros;
       c) Realizar engenharia reversa, descompilar, desmontar, deobfuscar
          ou tentar obter o código-fonte do Software, exceto onde a lei
          brasileira (Lei 9.609/98, art. 6º) proíba expressamente tal
          restrição;
       d) Remover, alterar ou ocultar avisos de copyright, marcas d'água,
          identificadores de versão ou quaisquer mecanismos de proteção;
       e) UTILIZAR O SOFTWARE PARA PRESTAÇÃO DE SERVIÇOS A TERCEIROS,
          MODELO SAAS, BUREAU, FRANQUIA OU QUALQUER FORMA DE
          COMERCIALIZAÇÃO EXTERNA DO SOFTWARE OU DE SUAS FUNCIONALIDADES;
       f) Competir com o Licenciante utilizando o Software como base
          tecnológica, direta ou indiretamente.

2. PROPRIEDADE INTELECTUAL
   2.1 Todos os direitos de propriedade intelectual sobre o Software,
       incluindo mas não se limitando a: copyright (Lei 9.610/98),
       segredos de negócio, know-how, algoritmos, estrutura de banco
       de dados, interface de usuário, marcas e nomes comerciais,
       pertencem EXCLUSIVAMENTE ao Licenciante.

   2.2 O Licenciado não adquire nenhum direito de propriedade sobre o
       Software, apenas o direito de uso limitado aqui concedido.

3. DADOS E PRIVACIDADE
   3.1 Todos os dados inseridos no Software (clientes, produtos, vendas,
       financeiro) são de propriedade exclusiva do Licenciado.
   3.2 O Licenciante não tem acesso, não coleta e não transmite quaisquer
       dados do Licenciado para servidores externos.

4. VIGÊNCIA E RESCISÃO
   4.1 Esta licença vigorará por prazo indeterminado a partir da
       instalação do Software.
   4.2 Violação de qualquer cláusula desta licença encerra
       AUTOMATICAMENTE a concessão, devendo o Licenciado cessar
       imediatamente o uso e destruir todas as cópias.

5. LIMITAÇÃO DE RESPONSABILIDADE
   5.1 O Software é fornecido "NO ESTADO EM QUE SE ENCONTRA" (AS IS),
       sem garantias de qualquer natureza, expressas ou implícitas.
   5.2 O Licenciante não se responsabiliza por lucros cessantes, danos
       emergentes, perda de dados ou interrupção de negócio decorrentes
       do uso ou incapacidade de uso do Software.

6. INDENIZAÇÃO
   O Licenciado indenizará e isentará o Licenciante de quaisquer
   reclamações, perdas, danos, honorários advocatícios e custas
   processuais decorrentes de uso do Software em violação a esta licença.

7. LEI APLICÁVEL E FORO
   7.1 Esta licença é regida pelas leis da República Federativa do Brasil.
   7.2 Fica eleito o foro da Comarca de Cornélio Procópio, Estado do
       Paraná, para dirimir quaisquer controvérsias oriundas desta
       licença, com renúncia a qualquer outro, por mais privilegiado
       que seja.

8. DISPOSIÇÕES GERAIS
   8.1 A nulidade de qualquer cláusula não invalida as demais.
   8.2 A tolerância a eventual descumprimento não constitui novação
       ou renúncia de direito.
   8.3 Esta licença constitui o acordo integral entre as partes.

---
Açaí Wave v1.1.1 - Licença Proprietária
© 2024 ${OWNER}. Todos os direitos reservados.
`;

const EULA = `AÇAÍ WAVE - CONTRATO DE LICENÇA DE USUÁRIO FINAL (EULA)
========================================================

Ao instalar e usar o Açaí Wave ("Software"), você ("Licenciado")
concorda com os seguintes termos:

1. LICENÇA
   - Licença NÃO EXCLUSIVA, INTRANSFERÍVEL, REVOGÁVEL e LIMITADA
   - Uso exclusivamente interno para operação do SEU estabelecimento

2. PROIBIÇÕES ABSOLUTAS
   - Copiar, modificar, criar obras derivadas
   - Distribuir, sublicenciar, alugar, emprestar
   - Engenharia reversa, descompilar, deobfuscar
   - Remover avisos de copyright/proteção
   - USAR PARA PRESTAR SERVIÇOS A TERCEIROS (SAAS, BUREAU, etc.)
   - Comercializar o Software de qualquer forma

3. PROPRIEDADE
   Todos os direitos (copyright, segredos de negócio, marcas)
   pertencem EXCLUSIVAMENTE ao Licenciante:

   ${OWNER}
   CNPJ/CPF: ${DOCUMENT}

4. SEUS DADOS
   Seus dados (clientes, vendas, financeiro) são SEUS.
   Nós não acessamos, não coletamos, não transmitimos.

5. RESCISÃO AUTOMÁTICA
   Qualquer violação encerra a licença imediatamente.

6. SEM GARANTIAS
   Software fornecido "COMO ESTÁ" (AS IS).
   Sem garantias de funcionamento ininterrupto ou livre de erros.

7. FORO
   Cornélio Procópio, Paraná.

---
Açaí Wave v1.1.1 - EULA
© 2024 ${OWNER}. Todos os direitos reservados.
`;

const CUSTOM_NSH = `; custom.nsh — Strings PT-BR do instalador Açaí Wave
; Referenciado em package.json > build.nsis.customLanguage

!define MUI_WELCOMEPAGE_TITLE "Bem-vindo ao Assistente de Instalação do Açaí Wave"
!define MUI_WELCOMEPAGE_TEXT "Este assistente instalará o Açaí Wave \${PRODUCT_VERSION} no seu computador.$\r$\n$\r$\nRecomenda-se fechar outros programas antes de continuar.$\r$\n$\r$\nClique em Avançar para continuar."

!define MUI_LICENSEPAGE_TITLE "Contrato de Licença de Uso"
!define MUI_LICENSEPAGE_TEXT "Leia o contrato de licença abaixo. Você deve aceitar os termos para continuar a instalação.$\r$\n$\r$\nRole até o final para habilitar o botão 'Concordo'."

!define MUI_DIRECTORYPAGE_TITLE "Escolher Pasta de Instalação"
!define MUI_DIRECTORYPAGE_TEXT "Selecione a pasta onde o Açaí Wave será instalado:$\r$\n$\r$\n\${MUI_DIRECTORYPAGE_TEXT_DEFAULT}"

!define MUI_INSTFILESPAGE_TITLE "Instalando Açaí Wave"
!define MUI_INSTFILESPAGE_TEXT "Aguarde enquanto o Açaí Wave é instalado no seu computador.$\r$\n$\r$\n\${MUI_INSTFILESPAGE_TEXT_INSTALLING}"

!define MUI_FINISHPAGE_TITLE "Instalação Concluída"
!define MUI_FINISHPAGE_TEXT "O Açaí Wave foi instalado com sucesso!$\r$\n$\r$\nClique em Concluir para sair do assistente."

!define MUI_UNWELCOMEPAGE_TITLE "Desinstalar Açaí Wave"
!define MUI_UNWELCOMEPAGE_TEXT "Este assistente removerá o Açaí Wave do seu computador.$\r$\n$\r$\nClique em Avançar para continuar."

!define MUI_UNCONFIRMPAGE_TITLE "Confirmar Desinstalação"
!define MUI_UNCONFIRMPAGE_TEXT "Tem certeza que deseja remover o Açaí Wave?$\r$\n$\r$\nSeus dados (banco de dados) NÃO serão removidos."

!define MUI_UNINSTFILESPAGE_TITLE "Removendo Açaí Wave"
!define MUI_UNINSTFILESPAGE_TEXT "Aguarde enquanto o Açaí Wave é removido."

!define MUI_UNFINISHPAGE_TITLE "Desinstalação Concluída"
!define MUI_UNFINISHPAGE_TEXT "O Açaí Wave foi removido com sucesso.$\r$\n$\r$\nClique em Concluir para sair."
`;

if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

const licensePath = path.join(buildDir, 'LICENSE.txt');
const eulaPath = path.join(buildDir, 'EULA.txt');
const customNshPath = path.join(buildDir, 'custom.nsh');

// Sempre escreve LICENSE/EULA: se há dados reais no .env.local, aplica-os;
// caso contrário, usa placeholders. Não há risco de "vazar" dados para o git
// porque build/ é ignorado (.gitignore) e o .env.local nunca é commitado.
fs.writeFileSync(licensePath, LICENSE);
console.log(`[generate-license] OK  build/LICENSE.txt (${hasRealData ? 'dados do licenciante (env/.env.local)' : 'placeholders'})`);

fs.writeFileSync(eulaPath, EULA);
console.log(`[generate-license] OK  build/EULA.txt (${hasRealData ? 'dados do licenciante (env/.env.local)' : 'placeholders'})`);

if (!fs.existsSync(customNshPath)) {
  fs.writeFileSync(customNshPath, CUSTOM_NSH);
  console.log('[generate-license] OK  criado build/custom.nsh (strings PT-BR)');
} else {
  console.log('[generate-license] Já existe build/custom.nsh — mantido');
}

if (!hasRealData) {
  console.log('\n[generate-license] AVISO: nenhum dado pessoal configurado.');
  console.log('[generate-license] Para o instalador final com seus dados, crie .env.local:');
  console.log('[generate-license]   BUILD_LICENSE_OWNER="Seu Nome"');
  console.log('[generate-license]   BUILD_LICENSE_DOCUMENT="Seu CPF/CNPJ"');
  console.log('[generate-license] (o .env.local é ignorado pelo git — seus dados nunca são commitados)');
}