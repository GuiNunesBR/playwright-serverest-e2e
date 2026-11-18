# Playwright + TypeScript · ServeRest

[![Testes](https://github.com/GuiNunesBR/playwright-serverest-e2e/actions/workflows/tests.yml/badge.svg)](https://github.com/GuiNunesBR/playwright-serverest-e2e/actions/workflows/tests.yml)

Suíte de automação **E2E (interface) e de API** em **Playwright + TypeScript** contra o [ServeRest](https://serverest.dev), uma loja virtual pública criada para estudo de testes. O foco não é a quantidade de testes, e sim a **arquitetura**: dados isolados, limpeza garantida, validação de contrato, sessão reaproveitada e CI com relatório publicado.

> Existe uma versão equivalente em **Cypress**, com os mesmos cenários: [cypress-serverest-e2e](https://github.com/GuiNunesBR/cypress-serverest-e2e). O README de lá traz o comparativo entre as duas ferramentas (tempo, paralelismo, API, interceptação de rede, relatório e depuração).

## O que é testado

| Camada | Cobertura |
|---|---|
| **API** | usuários (cadastro, duplicidade, campos obrigatórios, consulta, exclusão), login (válido, senha errada, e-mail inexistente), produtos (CRUD, token, duplicidade, preço inválido, filtro), carrinho e conclusão de compra |
| **UI · admin** | login (sucesso, erro e logout), cadastro de usuário pela tela pública e pelo painel, cadastro e exclusão de produto |
| **UI · cliente** | busca de produto na loja e montagem da lista de compras (quantidade e preço) |
| **Acessibilidade** | 9 telas auditadas com axe-core (WCAG 2.1 A e AA), com linha de base das pendências conhecidas |
| **Contrato** | toda resposta relevante da API é validada com schemas [Zod](https://zod.dev) |
| **Visual** | telas públicas (login, cadastro e login inválido) comparadas pixel a pixel com uma linha de base |
| **Unidade** | fábricas de dados, schemas e lista de páginas auditadas, sem navegador e sem rede |

São **51 execuções** no `npm test` (13 de unidade, 18 de API, 9 de UI, 9 de acessibilidade e 2 de preparação/limpeza), mais 3 de regressão visual, que rodam à parte. Os cenários mais importantes levam a tag `@smoke` (`npm run test:smoke`) e os de acessibilidade, `@a11y` (`npm run test:a11y`).

## Como rodar

Requisitos: Node 20 ou superior.

```bash
npm install           # na primeira vez (gera o package-lock.json); depois pode usar npm ci
npm run browsers      # instala o Chromium do Playwright
npm test              # tudo (API + UI)
npm run test:unit     # só unidade (sem navegador e sem rede)
npm run test:api      # só API (não abre navegador)
npm run test:ui       # só interface
npm run test:smoke    # só os cenários @smoke
npm run test:a11y     # só acessibilidade
npm run test:visual   # só regressão visual (veja abaixo)
npm run report        # abre o relatório HTML
npm run lint          # confere as camadas (quem pode importar o quê)
```

Para apontar para outro ambiente, copie `.env.example` para `.env` e ajuste `FRONT_URL` e `API_URL`.

## Evidências no relatório

O relatório HTML do Playwright funciona como evidência de execução:

- **Chamadas de API.** Toda chamada feita pelo teste aparece como um passo (`API POST /usuarios → 201`) com a requisição e a resposta anexadas em JSON.
- **Respostas recebidas pelo front.** Nos testes de UI, a chamada que a tela dispara é interceptada (`Front DELETE /produtos/:id → 200`), anexada e validada com o mesmo schema Zod dos testes de API.
- **Prints.** Cada cenário de UI anexa prints da tela nos pontos-chave (`Evidência: produto na listagem`). Em caso de falha, ficam também o print final, o vídeo e o trace.
- **Confirmação no backend.** Depois da ação na tela, o teste consulta a API para conferir que o dado foi gravado (ou removido) de verdade.

## Acessibilidade

As 9 telas do front (públicas, painel do admin e loja do cliente) passam pelo [axe-core](https://github.com/dequelabs/axe-core) com os critérios **WCAG 2.1 A e AA**. A lista de páginas e a linha de base são as mesmas nos projetos Playwright e Cypress.

O front já tem violações hoje, então o teste não exige zero: cada página tem uma **linha de base** com as regras já conhecidas, e o teste **falha se aparecer uma regra nova**. O resultado completo do axe (regra, impacto, elementos afetados e link de referência) fica anexado a cada teste no relatório.

Pendências conhecidas do ServeRest:

| Regra | Impacto | Onde | O que é |
|---|---|---|---|
| `image-alt` | crítico | todas as telas | imagens (logo e fotos de produto) sem texto alternativo |
| `color-contrast` | sério | todas as telas | textos e botões abaixo do contraste mínimo de 4.5:1 |
| `link-name` | sério | vitrine do cliente (`/home`) | o link de cada produto envolve só a imagem sem `alt`, então fica sem nome para leitores de tela |

## Regressão visual

`tests/visual` compara o print das telas públicas com uma linha de base em `tests/visual/__telas__`, sem tolerância de pixels: trocar o texto de um botão já reprova. São telas sem dados de ninguém, então o print é estável.

A renderização de fontes muda de um sistema para outro, por isso a linha de base vale para um ambiente só: o Linux da imagem do Playwright usada no CI. Os arquivos levam o sistema no nome (`login-linux.png`) e só os do Linux vão para o repositório.

- **Gerar ou atualizar as linhas de base:** rode o workflow **Linhas de base visuais** (Actions → *Run workflow*), baixe o artefato, confira cada imagem e faça o commit dos PNG em `tests/visual/__telas__`.
- **No CI:** o passo de regressão visual entra sozinho quando há linhas de base do Linux no repositório. Se uma tela mudar, o relatório traz a imagem esperada, a recebida e a diferença.
- **Localmente:** `npm run test:visual:update` gera uma linha de base do seu sistema (ignorada pelo Git) e `npm run test:visual` compara com ela. Serve para conferir uma mudança antes de subir.

Fica fora do `npm test` porque, sem a linha de base do sistema em que roda, o teste falha por definição.

## Estrutura

```
src/
  a11y/         páginas auditadas, linha de base e análise com axe
  api/          cliente da API (um método por endpoint) e schemas Zod
  config/       variáveis de ambiente e caminhos
  data/         fábricas de dados únicos (faker)
  fixtures/     fixtures do Playwright: api, admin (isolado por teste) e limpeza
  helpers/      criação de sessão (admin/cliente) e anexos de evidência
  pages/        Page Objects da interface
tests/
  unit/         testes de unidade do código de apoio
  api/          testes de API
  visual/       regressão visual das telas públicas e linhas de base (__telas__)
  e2e/          testes de interface + auth.setup / auth.teardown
.github/workflows/tests.yml              CI (GitHub Actions) com relatório no GitHub Pages
.github/workflows/baselines-visuais.yml  gera as linhas de base visuais no Linux do CI
```

## Decisões de projeto

- **Dados isolados e únicos.** O ServeRest é compartilhado, então cada teste cria seus próprios dados com sufixo único (nada de e-mails ou nomes fixos). Isso permite rodar em paralelo sem colisão.
- **Limpeza garantida.** A fixture `limpeza` apaga o que o teste criou (cancelando carrinho aberto antes), mesmo quando o teste falha. O que nasce pela interface é localizado no final pelo e-mail ou pelo nome.
- **Contratos com Zod.** Em vez de só checar o status, o teste valida a forma da resposta. Se a API mudar, o erro aponta o campo.
- **Sessão reaproveitada.** O projeto `setup` cria um admin pela API, faz login pela interface uma vez e salva o `storageState`. Os testes de UI já começam autenticados, e o projeto `cleanup` remove o admin ao final.
- **Camadas conferidas no lint.** O [oxlint](https://oxc.rs/docs/guide/usage/linter) aplica a regra `no-restricted-imports` do ESLint por pasta (`.oxlintrc.json`): `api`, `config` e `a11y` não dependem de ninguém, Page Objects e fábricas só usam os *tipos* da API, `helpers` e `fixtures` não dirigem a tela, e os specs importam `test` de `src/fixtures`, nunca direto do `@playwright/test`. O oxlint entra no lugar do ESLint porque o `typescript-eslint` ainda não suporta o TypeScript 7.
- **Seletores estáveis.** Page Objects com `data-testid` e papéis de acessibilidade; o único acoplamento ao DOM é o próprio contrato do front.
- **API sem navegador.** O projeto `api` usa apenas o `request` do Playwright: rápido e barato no CI.
- **CI.** Roda dentro da imagem oficial do Playwright (navegador e dependências já instalados, sem `apt-get` a cada execução), com checagem de tipos, execução completa, relatório como artefato e publicação no GitHub Pages na branch `main`. A tag da imagem acompanha a versão do `@playwright/test`.

## Observações sobre o alvo

- É um serviço **público e compartilhado**: os dados são limpos periodicamente e a disponibilidade não é garantida. Rode com moderação.
- O `data-testid` do botão de cadastrar produto no front é `cadastarProdutos` (sem o "r"). Foi mantido como está.
- O botão "Adicionar no carrinho" da lista de compras não chama a API: leva a uma tela "Em construção". Por isso o fluxo do cliente vai até a lista de compras.
- Ao excluir um produto, o front recarrega a página logo após o `DELETE`. Por isso a captura da resposta usa `page.route` em vez de `waitForResponse`, que perderia o corpo na navegação.
- Achado de estudo: o token JWT devolvido pelo login carrega a **senha do usuário no payload**. Em um sistema real isso seria uma falha de segurança grave; aqui é útil como exemplo para testes exploratórios.
- Bug real encontrado por esta suíte: em 16/11/2026 o cadastro de produto pela tela passou a receber 400. O ServeRest 3.4.0 ([ServeRest#571](https://github.com/ServeRest/ServeRest/pull/571)) fez a API recusar `preco` e `quantidade` em texto, e o front ainda enviava texto. O teste ficou marcado com `test.fail` e o link da correção, proposta e aceita em [ServeRest/front#42](https://github.com/ServeRest/front/pull/42). Quando ela foi publicada, o próprio `test.fail` acusou `Expected to fail, but passed`, e a marcação saiu.

## Próximos passos

- Teste de carga simples (k6) nos endpoints de login e produtos.
- Matriz de navegadores no CI e relatório Allure.
- Linhas de base visuais das telas do admin, com o nome do usuário mascarado.

## Licença

[MIT](./LICENSE). O ServeRest pertence aos seus autores; este repositório apenas o utiliza como alvo de testes.
