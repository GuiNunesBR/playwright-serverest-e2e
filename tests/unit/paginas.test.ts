import { test, expect } from '@playwright/test';
import { PAGINAS, TAGS_WCAG } from '../../src/a11y/paginas';

// A lista de páginas e a linha de base são dados: um erro aqui faria a auditoria pular uma tela sem ninguém notar.
test.describe('Unidade · páginas auditadas', () => {
  test('cada rota aparece uma vez só', () => {
    const rotas = PAGINAS.map((p) => p.rota);
    expect(new Set(rotas).size).toBe(rotas.length);
    expect(rotas).toHaveLength(9);
  });

  test('toda página tem seletor de pronta e linha de base com regras do axe', () => {
    for (const pagina of PAGINAS) {
      expect(pagina.rota).toMatch(/^\//);
      expect(pagina.pronta.trim()).not.toBe('');
      expect(pagina.conhecidas.length).toBeGreaterThan(0);
      expect(new Set(pagina.conhecidas).size).toBe(pagina.conhecidas.length);
    }
  });

  test('a auditoria cobre WCAG 2.1 níveis A e AA', () => {
    expect(TAGS_WCAG).toEqual(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);
  });
});
