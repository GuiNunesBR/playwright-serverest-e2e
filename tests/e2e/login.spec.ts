import { test, expect } from '../../src/fixtures';
import { LoginPage } from '../../src/pages/login.page';
import { AdminHomePage } from '../../src/pages/admin-home.page';

// Estes testes começam sem sessão (não herdam o storageState do admin).
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('UI · Login', () => {
  test('admin entra e vê a home administrativa', { tag: '@smoke' }, async ({ page, admin }) => {
    const login = new LoginPage(page);
    await login.abrir();
    await login.entrar(admin.email, admin.password);

    await expect(page).toHaveURL(/\/admin\/home$/);
    await expect(new AdminHomePage(page).saudacao).toContainText(`Bem Vindo ${admin.nome}`);
  });

  test('mostra erro com credenciais inválidas', async ({ page }) => {
    const login = new LoginPage(page);
    await login.abrir();
    await login.entrar('nao.existe@teste.com', 'senha-errada');

    await expect(login.alerta).toContainText('Email e/ou senha inválidos');
    await expect(page).toHaveURL(/\/login$/);
  });
});
