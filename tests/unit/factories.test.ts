import { test, expect } from '@playwright/test';
import { novoProduto, novoUsuario, termoSemResultado } from '../../src/data/factories';

// As fábricas rodam sem navegador e sem API: aqui só se confere o que elas prometem aos testes.
test.describe('Unidade · fábricas de dados', () => {
  test('usuários gerados em sequência nunca repetem e-mail', () => {
    const emails = Array.from({ length: 200 }, () => novoUsuario().email);
    expect(new Set(emails).size).toBe(emails.length);
    for (const email of emails) expect(email).toMatch(/^qa\.[a-z0-9]+@teste\.com$/);
  });

  test('usuário padrão não é administrador e os overrides prevalecem', () => {
    expect(novoUsuario().administrador).toBe('false');
    const admin = novoUsuario({ administrador: 'true', nome: 'Fulano de Tal' });
    expect(admin).toMatchObject({ administrador: 'true', nome: 'Fulano de Tal' });
    expect(admin.password.length).toBeGreaterThanOrEqual(10);
  });

  test('produtos gerados em sequência nunca repetem nome', () => {
    const nomes = Array.from({ length: 200 }, () => novoProduto().nome);
    expect(new Set(nomes).size).toBe(nomes.length);
  });

  // A API recusa preço e quantidade em texto (ServeRest 3.4.0): a fábrica precisa gerar números inteiros.
  test('preço e quantidade são inteiros dentro da faixa aceita pela API', () => {
    for (let i = 0; i < 100; i++) {
      const { preco, quantidade } = novoProduto();
      expect(Number.isInteger(preco)).toBe(true);
      expect(Number.isInteger(quantidade)).toBe(true);
      expect(preco).toBeGreaterThanOrEqual(10);
      expect(preco).toBeLessThanOrEqual(5000);
      expect(quantidade).toBeGreaterThanOrEqual(1);
      expect(quantidade).toBeLessThanOrEqual(50);
    }
  });

  // A busca da loja filtra pelo nome contendo o termo: o termo não pode aparecer no nome de nenhum produto gerado.
  test('o termo sem resultado não repete e não aparece em nome de produto', () => {
    const termos = Array.from({ length: 200 }, () => termoSemResultado());
    expect(new Set(termos).size).toBe(termos.length);
    const nomes = Array.from({ length: 200 }, () => novoProduto().nome.toLowerCase());
    for (const termo of termos) expect(nomes.some((nome) => nome.includes(termo))).toBe(false);
  });

  test('overrides do produto prevalecem sobre os valores gerados', () => {
    expect(novoProduto({ preco: 1, quantidade: 0 })).toMatchObject({ preco: 1, quantidade: 0 });
  });
});
