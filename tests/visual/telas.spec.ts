import { test, expect } from '../../src/fixtures';
import { CadastroUsuarioPage } from '../../src/pages/cadastro-usuario.page';
import { LoginPage } from '../../src/pages/login.page';

// Regressão visual das telas públicas, que não mostram dados de ninguém: o print é comparado pixel a pixel
// com a linha de base guardada em __telas__. As linhas de base valem para o Linux da imagem do Playwright usada no CI.
test.describe('Visual · telas públicas', { tag: '@visual' }, () => {
  test('tela de login', async ({ page }) => {
    const login = new LoginPage(page);
    await login.abrir();
    await expect(login.entrarBotao).toBeVisible();
    await expect(page).toHaveScreenshot('login.png', { fullPage: true });
  });

  test('tela de cadastro de usuário', async ({ page }) => {
    const cadastro = new CadastroUsuarioPage(page);
    await cadastro.abrir();
    await expect(cadastro.cadastrarBotao).toBeVisible();
    await expect(page).toHaveScreenshot('cadastro.png', { fullPage: true });
  });

  test('login com credenciais inválidas', async ({ page }) => {
    const login = new LoginPage(page);
    await login.abrir();
    await login.entrar('nao.existe@teste.com', 'senha-errada');
    await expect(login.alerta).toContainText('Email e/ou senha inválidos');
    await expect(page).toHaveScreenshot('login-invalido.png', { fullPage: true });
  });
});
