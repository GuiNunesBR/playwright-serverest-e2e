import { test, expect } from '../../src/fixtures';
import { CadastroSchema, ListaUsuariosSchema, validar } from '../../src/api/schemas';
import { novoUsuario } from '../../src/data/factories';
import { CadastroUsuarioPage } from '../../src/pages/cadastro-usuario.page';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('UI · Cadastro de usuário', () => {
  test('cadastra um administrador e entra direto na home', { tag: '@smoke' }, async ({ page, api, limpeza }) => {
    const usuario = novoUsuario({ administrador: 'true' });
    const cadastro = new CadastroUsuarioPage(page);

    try {
      await cadastro.abrir();
      await cadastro.preencher(usuario);
      await cadastro.enviar();

      await expect(cadastro.alerta).toContainText('Cadastro realizado com sucesso');
      await expect(page).toHaveURL(/\/admin\/home$/);
    } finally {
      // Limpeza garantida: localiza o usuário pelo e-mail, mesmo que o teste tenha falhado no meio.
      const busca = await api.buscarUsuarioPorEmail(usuario.email);
      for (const u of validar(ListaUsuariosSchema, await busca.json()).usuarios) limpeza.usuario(u._id);
    }
  });

  test('não permite cadastrar um e-mail que já existe', async ({ page, api, limpeza }) => {
    const usuario = novoUsuario();
    const criado = await api.criarUsuario(usuario);
    limpeza.usuario(validar(CadastroSchema, await criado.json())._id);

    const cadastro = new CadastroUsuarioPage(page);
    await cadastro.abrir();
    await cadastro.preencher(usuario);
    await cadastro.enviar();

    await expect(cadastro.alerta).toContainText('Este email já está sendo usado');
  });
});
