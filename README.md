# Playwright + TypeScript · ServeRest

[![Testes](https://github.com/GuiNunesBR/playwright-serverest-e2e/actions/workflows/tests.yml/badge.svg)](https://github.com/GuiNunesBR/playwright-serverest-e2e/actions/workflows/tests.yml)

Suíte de automação **E2E (interface) e de API** em **Playwright + TypeScript** contra o [ServeRest](https://serverest.dev), uma loja virtual pública criada para estudo de testes. O foco não é a quantidade de testes, e sim a **arquitetura**: dados isolados, limpeza garantida, validação de contrato, sessão reaproveitada e CI com relatório publicado.

> Existe uma versão equivalente em **Cypress** (mesmos cenários) para comparar as duas ferramentas: _em breve_.

## O que é testado

| Camada | Cobertura |
|---|---|
| **API** | usuários (cadastro, duplicidade, campos obrigatórios, consulta, exclusão), login (válido, senha errada, e-mail inexistente), produtos (CRUD, token, duplicidade, preço inválido, filtro), carrinho e conclusão de compra |
| **UI · admin** | login (sucesso, erro e logout), cadastro de usuário pela tela pública e pelo painel, cadastro e exclusão de produto |
| **UI · cliente** | busca de produto na loja e montagem da lista de compras (quantidade e preço) |
| **Contrato** | toda resposta relevante da API é validada com schemas [Zod](https://zod.dev) |

São **29 execuções** (18 de API, 9 de UI e 2 de preparação/limpeza). Os cenários mais importantes levam a tag `@smoke` (`npm run test:smoke`).

## Como rodar

Requisitos: Node 20 ou superior.

```bash
npm install           # na primeira vez (gera o package-lock.json); depois pode usar npm ci
npm run browsers      # instala o Chromium do Playwright
npm test              # tudo (API + UI)
npm run test:api      # só API (não abre navegador)
npm run test:ui       # só interface
npm run test:smoke    # só os cenários @smoke
npm run report        # abre o relatório HTML
```

Para apontar para outro ambiente, copie `.env.example` para `.env` e ajuste `FRONT_URL` e `API_URL`.

## Evidências no relatório

O relatório HTML do Playwright funciona como evidência de execução:

- **Chamadas de API.** Toda chamada feita pelo teste aparece como um passo (`API POST /usuarios → 201`) com a requisição e a resposta anexadas em JSON.
- **Respostas recebidas pelo front.** Nos testes de UI, a chamada que a tela dispara é interceptada (`Front DELETE /produtos/:id → 200`), anexada e validada com o mesmo schema Zod dos testes de API.
- **Prints.** Cada cenário de UI anexa prints da tela nos pontos-chave (`Evidência: produto na listagem`). Em caso de falha, ficam também o print final, o vídeo e o trace.
- **Confirmação no backend.** Depois da ação na tela, o teste consulta a API para conferir que o dado foi gravado (ou removido) de verdade.

## Estrutura

```
src/
  api/          cliente da API (um método por endpoint) e schemas Zod
  config/       variáveis de ambiente e caminhos
  data/         fábricas de dados únicos (faker)
  fixtures/     fixtures do Playwright: api, admin (isolado por teste) e limpeza
  helpers/      criação de sessão (admin/cliente) e anexos de evidência
  pages/        Page Objects da interface
tests/
  api/          testes de API
  e2e/          testes de interface + auth.setup / auth.teardown
.github/workflows/tests.yml   CI (GitHub Actions) com relatório no GitHub Pages
```

## Decisões de projeto

- **Dados isolados e únicos.** O ServeRest é compartilhado, então cada teste cria seus próprios dados com sufixo único (nada de e-mails ou nomes fixos). Isso permite rodar em paralelo sem colisão.
- **Limpeza garantida.** A fixture `limpeza` apaga o que o teste criou (cancelando carrinho aberto antes), mesmo quando o teste falha. O que nasce pela interface é localizado no final pelo e-mail ou pelo nome.
- **Contratos com Zod.** Em vez de só checar o status, o teste valida a forma da resposta. Se a API mudar, o erro aponta o campo.
- **Sessão reaproveitada.** O projeto `setup` cria um admin pela API, faz login pela interface uma vez e salva o `storageState`. Os testes de UI já começam autenticados, e o projeto `cleanup` remove o admin ao final.
- **Seletores estáveis.** Page Objects com `data-testid` e papéis de acessibilidade; o único acoplamento ao DOM é o próprio contrato do front.
- **API sem navegador.** O projeto `api` usa apenas o `request` do Playwright: rápido e barato no CI.
- **CI.** Checagem de tipos, execução completa, relatório como artefato e publicação no GitHub Pages na branch `main`.

## Observações sobre o alvo

- É um serviço **público e compartilhado**: os dados são limpos periodicamente e a disponibilidade não é garantida. Rode com moderação.
- O `data-testid` do botão de cadastrar produto no front é `cadastarProdutos` (sem o "r"). Foi mantido como está.
- O botão "Adicionar no carrinho" da lista de compras não chama a API: leva a uma tela "Em construção". Por isso o fluxo do cliente vai até a lista de compras.
- Ao excluir um produto, o front recarrega a página logo após o `DELETE`. Por isso a captura da resposta usa `page.route` em vez de `waitForResponse`, que perderia o corpo na navegação.
- Achado de estudo: o token JWT devolvido pelo login carrega a **senha do usuário no payload**. Em um sistema real isso seria uma falha de segurança grave; aqui é útil como exemplo para testes exploratórios.

## Próximos passos

- Acessibilidade com `@axe-core/playwright`.
- Teste de carga simples (k6) nos endpoints de login e produtos.
- Matriz de navegadores no CI e relatório Allure.
- Versão Cypress com os mesmos cenários e um comparativo (velocidade, depuração, API, CI).

## Licença

[MIT](./LICENSE). O ServeRest pertence aos seus autores; este repositório apenas o utiliza como alvo de testes.
