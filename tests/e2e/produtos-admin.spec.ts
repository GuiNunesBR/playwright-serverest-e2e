import { test, expect } from '../../src/fixtures';
import { novoProduto } from '../../src/data/factories';
import { lerAdminDoSetup, obterToken, removerProdutosPorNome } from '../../src/helpers/sessao';
import { CadastrarProdutoPage, ListarProdutosPage } from '../../src/pages/produtos.page';

// Usa a sessão de admin criada em auth.setup.ts (storageState definido no playwright.config.ts).
test.describe('UI · Produtos (admin)', () => {
  test('cadastra um produto e o encontra na listagem', { tag: '@smoke' }, async ({ page, api }) => {
    const admin = await lerAdminDoSetup();
    const token = await obterToken(api, admin.email, admin.password);
    const produto = novoProduto();

    try {
      const cadastro = new CadastrarProdutoPage(page);
      await cadastro.abrir();
      await cadastro.preencher(produto);
      await cadastro.enviar();

      await expect(page).toHaveURL(/\/admin\/listarprodutos$/);
      const linha = new ListarProdutosPage(page).linhaDe(produto.nome);
      await expect(linha).toBeVisible();
      await expect(linha).toContainText(String(produto.preco));
    } finally {
      await removerProdutosPorNome(api, produto.nome, token);
    }
  });
});
