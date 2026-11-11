import { readFile } from 'node:fs/promises';
import { ADMIN_FILE } from '../config/paths';
import type { ServeRestClient } from '../api/client';
import { CadastroSchema, ListaProdutosSchema, LoginSchema, validar } from '../api/schemas';
import { novoUsuario } from '../data/factories';

export interface AdminSessao {
  id: string;
  nome: string;
  email: string;
  password: string;
  token: string;
}

/** Cria um administrador pela API e já devolve o token de acesso. */
export async function criarAdmin(api: ServeRestClient): Promise<AdminSessao> {
  const dados = novoUsuario({ administrador: 'true' });
  const cadastro = await api.criarUsuario(dados);
  if (cadastro.status() !== 201) {
    throw new Error(`Não foi possível criar o admin: ${cadastro.status()} ${await cadastro.text()}`);
  }
  const { _id } = validar(CadastroSchema, await cadastro.json());
  const token = await obterToken(api, dados.email, dados.password);
  return { id: _id, nome: dados.nome, email: dados.email, password: dados.password, token };
}

export async function obterToken(api: ServeRestClient, email: string, password: string): Promise<string> {
  const login = await api.login(email, password);
  if (login.status() !== 200) {
    throw new Error(`Login falhou: ${login.status()} ${await login.text()}`);
  }
  return validar(LoginSchema, await login.json()).authorization;
}

/** Lê o admin criado pelo projeto "setup" (usado pelos testes de interface). */
export async function lerAdminDoSetup(): Promise<Omit<AdminSessao, 'token'>> {
  return JSON.parse(await readFile(ADMIN_FILE, 'utf-8'));
}

/** Remove produtos pelo nome exato (usado para limpar o que a interface criou). */
export async function removerProdutosPorNome(api: ServeRestClient, nome: string, token: string): Promise<void> {
  const resposta = await api.listarProdutos({ nome });
  const { produtos } = validar(ListaProdutosSchema, await resposta.json());
  for (const produto of produtos) {
    await api.excluirProduto(produto._id, token);
  }
}
