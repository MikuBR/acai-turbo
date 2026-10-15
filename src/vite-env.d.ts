/// <reference types="vite/client" />

// pdfmake não publica tipos para os entrypoints de build usados via import()
// dinâmico (pdfmake/build/pdfmake, pdfmake/build/vfs_fonts). O código já trata
// o retorno como `any`, então declaramos os módulos para satisfazer o tsc.
declare module 'pdfmake/build/pdfmake';
declare module 'pdfmake/build/vfs_fonts';
