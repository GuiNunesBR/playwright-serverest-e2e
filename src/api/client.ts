import type { APIRequestContext, APIResponse } from '@playwright/test';

export type Booleano = 'true' | 'false';

export interface NovoUsuario {
  nome: string;
  email: string;
  password: string;
  administrador: Booleano;
}

export interface NovoProduto {
  nome: string;
  preco: number;
  descricao: string;
  quantidade: number;
}

export interface ItemCarrinho {
  idProduto: string;
  quantidade: number;
}

/** Cliente fino da API do ServeRest: uma função por endpoint, sem asserções (quem testa é o teste). */
export class ServeRestClient {
  constructor(private readonly request: APIRequestContext) {}

  private auth(token?: string) {
    return token ? { headers: { Authorization: token } } : {};
  }

  // ---- usuários
  criarUsuario(dados: object): Promise<APIResponse> {
    return this.request.post('/usuarios', { data: dados });
  }
  buscarUsuario(id: string): Promise<APIResponse> {
    return this.request.get(`/usuarios/${id}`);
  }
  buscarUsuarioPorEmail(email: string): Promise<APIResponse> {
    return this.request.get('/usuarios', { params: { email } });
  }
  excluirUsuario(id: string): Promise<APIResponse> {
    return this.request.delete(`/usuarios/${id}`);
  }

  // ---- login
  login(email: string, password: string): Promise<APIResponse> {
    return this.request.post('/login', { data: { email, password } });
  }

  // ---- produtos
  criarProduto(dados: object, token?: string): Promise<APIResponse> {
    return this.request.post('/produtos', { data: dados, ...this.auth(token) });
  }
  buscarProduto(id: string): Promise<APIResponse> {
    return this.request.get(`/produtos/${id}`);
  }
  listarProdutos(params: Record<string, string> = {}): Promise<APIResponse> {
    return this.request.get('/produtos', { params });
  }
  excluirProduto(id: string, token?: string): Promise<APIResponse> {
    return this.request.delete(`/produtos/${id}`, this.auth(token));
  }

  // ---- carrinhos
  criarCarrinho(produtos: ItemCarrinho[], token?: string): Promise<APIResponse> {
    return this.request.post('/carrinhos', { data: { produtos }, ...this.auth(token) });
  }
  concluirCompra(token?: string): Promise<APIResponse> {
    return this.request.delete('/carrinhos/concluir-compra', this.auth(token));
  }
  cancelarCompra(token?: string): Promise<APIResponse> {
    return this.request.delete('/carrinhos/cancelar-compra', this.auth(token));
  }
}
