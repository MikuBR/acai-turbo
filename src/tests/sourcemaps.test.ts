import { describe, it, expect } from 'vitest';
import {
  validateSourceMap,
  hasSourceMappingURL,
  extractSourceMapFilename,
  sourceMapMatchesJs,
  getExpectedSourceMapConfig,
  type SourceMapInfo,
} from '../services/sourcemaps';

describe('SourceMaps Service', () => {
  describe('validateSourceMap', () => {
    it('should validate a correct source map', () => {
      const validMap: SourceMapInfo = {
        version: 3,
        sources: ['src/main.tsx', 'src/App.tsx'],
        sourcesContent: ['import React from "react";', 'export default function App() {}'],
        mappings: 'AAAA,CAAC;AACA',
        file: 'index.js',
      };

      const result = validateSourceMap(validMap, 1024);

      expect(result.valid).toBe(true);
      expect(result.issues).toHaveLength(0);
      expect(result.stats).toBeDefined();
      expect(result.stats!.version).toBe(3);
      expect(result.stats!.sourcesCount).toBe(2);
      expect(result.stats!.sourcesContentCount).toBe(2);
    });

    it('should reject invalid version', () => {
      const invalidMap: SourceMapInfo = {
        version: 2,
        sources: ['src/main.tsx'],
        sourcesContent: ['content'],
        mappings: 'AAAA',
      };

      const result = validateSourceMap(invalidMap, 1024);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Versão do source map inválida: 2 (esperado: 3)');
    });

    it('should reject missing sources', () => {
      const invalidMap: SourceMapInfo = {
        version: 3,
        sources: [],
        sourcesContent: [],
        mappings: 'AAAA',
      };

      const result = validateSourceMap(invalidMap, 1024);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Campo "sources" está vazio');
    });

    it('should reject missing mappings', () => {
      const invalidMap: SourceMapInfo = {
        version: 3,
        sources: ['src/main.tsx'],
        sourcesContent: ['content'],
        mappings: '',
      };

      const result = validateSourceMap(invalidMap, 1024);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Campo "mappings" está vazio');
    });

    it('should reject missing sourcesContent', () => {
      const invalidMap: SourceMapInfo = {
        version: 3,
        sources: ['src/main.tsx'],
        sourcesContent: [],
        mappings: 'AAAA',
      };

      const result = validateSourceMap(invalidMap, 1024);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Campo "sourcesContent" está vazio');
    });

    it('should reject all null sourcesContent', () => {
      const invalidMap: SourceMapInfo = {
        version: 3,
        sources: ['src/main.tsx', 'src/App.tsx'],
        sourcesContent: [null, null],
        mappings: 'AAAA',
      };

      const result = validateSourceMap(invalidMap, 1024);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Todos os "sourcesContent" estão null ou vazios');
    });

    it('should reject file too small', () => {
      const validMap: SourceMapInfo = {
        version: 3,
        sources: ['src/main.tsx'],
        sourcesContent: ['content'],
        mappings: 'AAAA',
      };

      const result = validateSourceMap(validMap, 50);

      expect(result.valid).toBe(false);
      expect(result.issues).toContain('Arquivo muito pequeno (50 bytes) — provavelmente inválido');
    });

    it('should accept partial null sourcesContent', () => {
      const partialMap: SourceMapInfo = {
        version: 3,
        sources: ['src/main.tsx', 'src/App.tsx'],
        sourcesContent: ['content', null],
        mappings: 'AAAA',
      };

      const result = validateSourceMap(partialMap, 1024);

      expect(result.valid).toBe(true);
      expect(result.stats!.sourcesContentCount).toBe(1);
    });
  });

  describe('hasSourceMappingURL', () => {
    it('should detect sourceMappingURL with //', () => {
      const js = 'console.log("test");\n//# sourceMappingURL=index.js.map';
      expect(hasSourceMappingURL(js)).toBe(true);
    });

    it('should detect sourceMappingURL with //@', () => {
      const js = 'console.log("test");\n//@ sourceMappingURL=index.js.map';
      expect(hasSourceMappingURL(js)).toBe(true);
    });

    it('should return false when no sourceMappingURL', () => {
      const js = 'console.log("test");';
      expect(hasSourceMappingURL(js)).toBe(false);
    });
  });

  describe('extractSourceMapFilename', () => {
    it('should extract filename from sourceMappingURL', () => {
      const js = 'console.log("test");\n//# sourceMappingURL=assets/index-BcKk3dV3.js.map';
      expect(extractSourceMapFilename(js)).toBe('assets/index-BcKk3dV3.js.map');
    });

    it('should return null when no sourceMappingURL', () => {
      const js = 'console.log("test");';
      expect(extractSourceMapFilename(js)).toBeNull();
    });
  });

  describe('sourceMapMatchesJs', () => {
    it('should match correct source map filename', () => {
      expect(sourceMapMatchesJs('index.js', 'index.js.map')).toBe(true);
    });

    it('should not match incorrect source map filename', () => {
      expect(sourceMapMatchesJs('index.js', 'other.js.map')).toBe(false);
    });
  });

  describe('getExpectedSourceMapConfig', () => {
    it('should return expected config', () => {
      const config = getExpectedSourceMapConfig();

      expect(config.enabled).toBe(true);
      expect(config.minify).toBe('terser');
      expect(config.deleteAfterUpload).toBe(true);
    });
  });
});
