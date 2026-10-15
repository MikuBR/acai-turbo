// ============================================================
// sourcemaps.ts — Utilitários para verificação de source maps
// ============================================================
// Responsável por:
// - Validar a estrutura de um source map
// - Verificar se os arquivos JS referenciam source maps corretamente
// - Fornecer informações sobre o estado dos source maps no build
//
// Este módulo é usado tanto pelo script de verificação (CJS)
// quanto por testes automatizados (Vitest).
// ============================================================

export interface SourceMapInfo {
  version: number;
  sources: string[];
  sourcesContent: (string | null)[];
  mappings: string;
  file?: string;
}

export interface SourceMapValidationResult {
  valid: boolean;
  issues: string[];
  stats?: {
    version: number;
    sourcesCount: number;
    sourcesContentCount: number;
    mappingsLength: number;
    fileSize: number;
  };
}

/**
 * Valida um objeto de source map.
 * Retorna true se o source map é válido e completo.
 */
export function validateSourceMap(content: SourceMapInfo, fileSize: number = 0): SourceMapValidationResult {
  const issues: string[] = [];

  // Verificar versão
  if (content.version !== 3) {
    issues.push(`Versão do source map inválida: ${content.version} (esperado: 3)`);
  }

  // Verificar sources
  if (!content.sources || !Array.isArray(content.sources)) {
    issues.push('Campo "sources" ausente ou inválido');
  } else if (content.sources.length === 0) {
    issues.push('Campo "sources" está vazio');
  }

  // Verificar mappings
  if (typeof content.mappings !== 'string') {
    issues.push('Campo "mappings" ausente ou inválido');
  } else if (content.mappings.length === 0) {
    issues.push('Campo "mappings" está vazio');
  }

  // Verificar sourcesContent
  if (!content.sourcesContent || !Array.isArray(content.sourcesContent)) {
    issues.push('Campo "sourcesContent" ausente — código fonte não embutido');
  } else if (content.sourcesContent.length === 0) {
    issues.push('Campo "sourcesContent" está vazio');
  } else {
    const nonNullContent = content.sourcesContent.filter(c => c !== null && c !== '');
    if (nonNullContent.length === 0) {
      issues.push('Todos os "sourcesContent" estão null ou vazios');
    }
  }

  // Verificar tamanho mínimo
  if (fileSize > 0 && fileSize < 100) {
    issues.push(`Arquivo muito pequeno (${fileSize} bytes) — provavelmente inválido`);
  }

  const valid = issues.length === 0;

  return {
    valid,
    issues,
    stats: valid ? {
      version: content.version,
      sourcesCount: content.sources?.length || 0,
      sourcesContentCount: content.sourcesContent?.filter(c => c !== null && c !== '').length || 0,
      mappingsLength: content.mappings?.length || 0,
      fileSize,
    } : undefined,
  };
}

/**
 * Verifica se um arquivo JS tem referência a um source map.
 */
export function hasSourceMappingURL(jsContent: string): boolean {
  return jsContent.includes('//# sourceMappingURL=') ||
         jsContent.includes('//@ sourceMappingURL=');
}

/**
 * Extrai o nome do arquivo de source map a partir do conteúdo JS.
 */
export function extractSourceMapFilename(jsContent: string): string | null {
  const match = jsContent.match(/\/\/[#@]\s*sourceMappingURL=(.+)/);
  return match ? match[1].trim() : null;
}

/**
 * Verifica se um arquivo de source map corresponde ao arquivo JS.
 */
export function sourceMapMatchesJs(jsFilename: string, mapFilename: string): boolean {
  return mapFilename === jsFilename + '.map';
}

/**
 * Retorna informações sobre o estado esperado dos source maps
 * com base nas configurações do Vite.
 */
export function getExpectedSourceMapConfig(): {
  enabled: boolean;
  minify: string;
  deleteAfterUpload: boolean;
} {
  return {
    enabled: true,
    minify: 'terser',
    deleteAfterUpload: true,
  };
}
