import { test, expect } from '../../src/fixtures';
import { CadastroSchema, CarrinhoSchema, MensagemSchema, ProdutoSchema, validar } from '../../src/api/schemas';
import { novoProduto } from '../../src/data/factories';

test.describe('API · Carrinhos', () => {
  test('monta um carrinho e conclui a compra', { tag: '@smoke' }, async ({ api, admin, limpeza }) => {
    const criado = await api.criarProduto(novoProduto({ quantidade: 10 }), admin.token);
    const { _id: idProduto } = validar(CadastroSchema, await criado.json());
    limpeza.produto(idProduto, admin.token);

    const carrinho = await api.criarCarrinho([{ idProduto, quantidade: 2 }], admin.token);
    expect(carrinho.status()).toBe(201);
    expect(validar(CadastroSchema, await carrinho.json()).message).toBe('Cadastro realizado com sucesso');

    const compra = await api.concluirCompra(admin.token);
    expect(compra.status()).toBe(200);
    expect(validar(MensagemSchema, await compra.json()).message).toBe('Registro excluído com sucesso');
  });

  test('reserva o estoque no carrinho e o devolve ao cancelar a compra', async ({ api, admin, limpeza }) => {
    const produto = novoProduto({ quantidade: 5 });
    const criado = await api.criarProduto(produto, admin.token);
    const { _id: idProduto } = validar(CadastroSchema, await criado.json());
    limpeza.produto(idProduto, admin.token);

    const carrinho = await api.criarCarrinho([{ idProduto, quantidade: 2 }], admin.token);
    const { _id: idCarrinho } = validar(CadastroSchema, await carrinho.json());

    const consulta = validar(CarrinhoSchema, await (await api.buscarCarrinho(idCarrinho)).json());
    expect(consulta).toMatchObject({
      produtos: [{ idProduto, quantidade: 2, precoUnitario: produto.preco }],
      precoTotal: produto.preco * 2,
      quantidadeTotal: 2,
      idUsuario: admin.id,
    });
    expect(validar(ProdutoSchema, await (await api.buscarProduto(idProduto)).json()).quantidade).toBe(3);

    const cancelamento = await api.cancelarCompra(admin.token);

    expect(cancelamento.status()).toBe(200);
    expect(validar(MensagemSchema, await cancelamento.json()).message).toBe(
      'Registro excluído com sucesso. Estoque dos produtos reabastecido',
    );
    expect(validar(ProdutoSchema, await (await api.buscarProduto(idProduto)).json()).quantidade).toBe(5);
  });

  test('rejeita quantidade maior que o estoque', async ({ api, admin, limpeza }) => {
    const criado = await api.criarProduto(novoProduto({ quantidade: 5 }), admin.token);
    const { _id: idProduto } = validar(CadastroSchema, await criado.json());
    limpeza.produto(idProduto, admin.token);

    const carrinho = await api.criarCarrinho([{ idProduto, quantidade: 6 }], admin.token);

    expect(carrinho.status()).toBe(400);
    expect(await carrinho.json()).toEqual({
      message: 'Produto não possui quantidade suficiente',
      item: { idProduto, quantidade: 6, quantidadeEstoque: 5, index: 0 },
    });
  });

  test('não permite mais de um carrinho por usuário', async ({ api, admin, limpeza }) => {
    const criado = await api.criarProduto(novoProduto({ quantidade: 10 }), admin.token);
    const { _id: idProduto } = validar(CadastroSchema, await criado.json());
    limpeza.produto(idProduto, admin.token);
    const primeiro = await api.criarCarrinho([{ idProduto, quantidade: 1 }], admin.token);
    expect(primeiro.status()).toBe(201);

    const segundo = await api.criarCarrinho([{ idProduto, quantidade: 1 }], admin.token);

    expect(segundo.status()).toBe(400);
    expect(validar(MensagemSchema, await segundo.json()).message).toBe('Não é permitido ter mais de 1 carrinho');
  });
});
