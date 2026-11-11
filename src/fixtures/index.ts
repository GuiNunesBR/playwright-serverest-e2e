import { test as base, expect, request as playwrightRequest } from '@playwright/test';
import { env } from '../config/env';
import { ServeRestClient } from '../api/client';
import { criarAdmin, type AdminSessao } from '../helpers/sessao';

interface Limpeza {
  /** Registra um usuário para ser apagado no fim do teste (com o token, cancela carrinho aberto antes). */
  usuario(id: string, token?: string): void;
  /** Registra um produto para ser apagado no fim do teste (precisa do token do dono). */
  produto(id: string, token: string): void;
}

interface Fixtures {
  api: ServeRestClient;
  limpeza: Limpeza;
  admin: AdminSessao;
}

export const test = base.extend<Fixtures>({
  // Cliente de API independente do `baseURL` do projeto (os testes de UI usam o front como baseURL).
  api: async ({}, use) => {
    const contexto = await playwrightRequest.newContext({ baseURL: env.apiUrl });
    await use(new ServeRestClient(contexto));
    await contexto.dispose();
  },

  // Tudo que o teste cria é apagado ao final, mesmo se o teste falhar.
  limpeza: async ({ api }, use) => {
    const usuarios: { id: string; token?: string }[] = [];
    const produtos: { id: string; token: string }[] = [];
    await use({
      usuario: (id, token) => void usuarios.push({ id, token }),
      produto: (id, token) => void produtos.push({ id, token }),
    });
    for (const u of usuarios) if (u.token) await api.cancelarCompra(u.token);
    for (const p of produtos) await api.excluirProduto(p.id, p.token);
    for (const u of usuarios) await api.excluirUsuario(u.id);
  },

  // Um administrador novo e isolado para cada teste.
  admin: async ({ api, limpeza }, use) => {
    const sessao = await criarAdmin(api);
    limpeza.usuario(sessao.id, sessao.token);
    await use(sessao);
  },
});

export { expect };
