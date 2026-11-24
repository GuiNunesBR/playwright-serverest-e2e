# Playwright + TypeScript · ServeRest

[![Tests](https://github.com/GuiNunesBR/playwright-serverest-e2e/actions/workflows/tests.yml/badge.svg)](https://github.com/GuiNunesBR/playwright-serverest-e2e/actions/workflows/tests.yml)

[Português](README.md) · **English**

An **end-to-end (UI) and API** test suite in **Playwright + TypeScript** against [ServeRest](https://serverest.dev), a public online store built for practising test automation. The focus is not the number of tests but the **architecture**: isolated data, guaranteed cleanup, contract validation, a reused session, and CI with a published report.

> There is an equivalent **Cypress** version with the same scenarios: [cypress-serverest-e2e](https://github.com/GuiNunesBR/cypress-serverest-e2e). Its README compares the two tools (time, parallelism, API testing, network interception, reporting and debugging).

The test names, comments and report steps are in Portuguese, like the app under test.

## What is tested

| Layer | Coverage |
|---|---|
| **API** | users (sign-up, duplicates, required fields, lookup, update, deletion, and deletion blocked by a cart), login (valid, wrong password, unknown email), products (CRUD, token, duplicates, invalid price, filter, deletion blocked by a cart), cart (checkout, stock reserved and given back on cancellation, insufficient stock, one cart per user) |
| **UI · admin** | login (success, error and logout), user sign-up through the public page and the admin panel, required sign-up fields, product creation and deletion |
| **UI · customer** | product search in the store, a search with no results, and building the shopping list (quantity and price) |
| **Accessibility** | 9 pages audited with axe-core (WCAG 2.1 A and AA), against a baseline of known issues |
| **Contract** | every relevant API response is validated with [Zod](https://zod.dev) schemas |
| **Visual** | public pages (login, sign-up and failed login) compared pixel by pixel with a baseline |
| **Unit** | data factories, schemas and the list of audited pages, with no browser and no network |

`npm test` runs **61 tests** (15 unit, 24 API, 11 UI, 9 accessibility and 2 setup/cleanup), plus 3 visual regression tests that run separately. The most important scenarios are tagged `@smoke` (`npm run test:smoke`) and the accessibility ones `@a11y` (`npm run test:a11y`).

## Running

Requires Node 20 or later.

```bash
npm install           # the first time; npm ci afterwards
npm run browsers      # installs Playwright's Chromium
npm test              # unit, API and UI (visual regression runs separately)
npm run test:unit     # unit only (no browser, no network)
npm run test:api      # API only (no browser)
npm run test:ui       # UI only
npm run test:smoke    # @smoke scenarios only
npm run test:a11y     # accessibility only
npm run test:visual   # visual regression only (see below)
npm run report        # opens the HTML report
npm run lint          # checks the layers (who may import what)
```

To target another environment, copy `.env.example` to `.env` and set `FRONT_URL` and `API_URL`.

## Evidence in the report

The Playwright HTML report doubles as execution evidence:

- **API calls.** Every call made by the test shows up as a step (`API POST /usuarios → 201`) with the request and response attached as JSON.
- **Responses received by the front end.** In UI tests, the call the page makes is intercepted (`Front DELETE /produtos/:id → 200`), attached and validated with the same Zod schema as the API tests.
- **Screenshots.** Each UI scenario attaches screenshots at key points (`Evidência: produto na listagem`). On failure, the final screenshot, the video and the trace are kept too.
- **Back-end confirmation.** After the action on the page, the test queries the API to check that the data was really saved (or removed).

## Accessibility

The 9 front-end pages (public, admin panel and customer store) go through [axe-core](https://github.com/dequelabs/axe-core) with the **WCAG 2.1 A and AA** criteria. The page list and the baseline are the same in the Playwright and Cypress projects.

The front end already has violations, so the test does not require zero: each page has a **baseline** of known rules, and the test **fails when a new rule appears**. The full axe result (rule, impact, affected elements and reference link) is attached to each test in the report.

Known ServeRest issues:

| Rule | Impact | Where | What it is |
|---|---|---|---|
| `image-alt` | critical | all pages | images (logo and product photos) without alternative text |
| `color-contrast` | serious | all pages | text and buttons below the 4.5:1 minimum contrast |
| `link-name` | serious | customer store (`/home`) | each product link wraps only an image with no `alt`, so screen readers get no name |

## Visual regression

`tests/visual` compares screenshots of the public pages with a baseline in `tests/visual/__telas__`, with no pixel tolerance: changing a button's text is enough to fail. These pages show nobody's data, so the screenshot is stable.

Font rendering differs between operating systems, so the baseline is valid for one environment only: the Linux of the Playwright image used in CI. The files carry the platform in their name (`login-linux.png`), and only the Linux ones are committed.

- **Creating or updating the baselines:** run the **Linhas de base visuais** workflow (Actions → *Run workflow*), download the artifact, review each image and commit the PNG files to `tests/visual/__telas__`.
- **In CI:** the visual regression step turns itself on once Linux baselines are in the repository. When a page changes, the report shows the expected image, the actual one and the diff.
- **Locally:** `npm run test:visual:update` creates a baseline for your own platform (ignored by Git), and `npm run test:visual` compares against it. Useful to check a change before pushing.

It stays out of `npm test` because, without a baseline for the platform it runs on, the test fails by design.

## Structure

```
src/
  a11y/         audited pages, baseline and axe analysis
  api/          API client (one method per endpoint) and Zod schemas
  config/       environment variables and paths
  data/         unique data factories (faker)
  fixtures/     Playwright fixtures: api, admin (isolated per test) and cleanup
  helpers/      session creation (admin/customer) and evidence attachments
  pages/        Page Objects
tests/
  unit/         unit tests for the support code
  api/          API tests
  visual/       visual regression of the public pages and baselines (__telas__)
  e2e/          UI tests + auth.setup / auth.teardown
.github/workflows/tests.yml              CI (GitHub Actions) with the report on GitHub Pages
.github/workflows/baselines-visuais.yml  creates the visual baselines on the CI Linux
```

## Execution model

`npm test` goes through the projects in `playwright.config.ts` in this order:

1. **`unit` and `api`** start right away: they depend on nothing and open no browser.
2. **`setup`** creates an admin through the API, logs in through the page once and saves the session in `.auth/` (`storageState`).
3. **`chromium`** starts only after `setup`; each test opens a fresh browser context that already has that session.
4. **`cleanup`** is the teardown of `setup`: it runs at the end, even when tests fail, and deletes the admin.

- **Workers.** With `fullyParallel`, any test can land on any worker, including tests from the same file. Locally Playwright uses half of the CPU cores; in CI there are 2. That is why no test depends on another one, on the order, or on fixed data.
- **Fixtures** (`src/fixtures`). All of them are per test and are only created when the test asks for them. Creation follows the dependencies (`api` → `limpeza` → `admin`/`cliente`) and teardown runs in reverse: when `limpeza` deletes what the test registered, the `api` context is still open. A UI test gets both the `setup` session (in the browser) and, if it asks, an `admin` of its own (only to prepare and clean data through the API).
- **Failures and retries.** Each test has 30 s, and each `expect` waits up to 7 s. In CI, a failing test runs once more, recording the trace; if it passes the second time, the report marks it as *flaky* instead of hiding the failure.

## Design decisions

- **Isolated, unique data.** ServeRest is shared, so each test creates its own data with a unique suffix (no fixed emails or names). That makes parallel runs collision-free.
- **Guaranteed cleanup.** The `limpeza` fixture deletes what the test created (cancelling an open cart first), even when the test fails. Data created through the UI is found at the end by email or name.
- **Contracts with Zod.** Instead of checking only the status, the test validates the shape of the response. When the API changes, the error names the field.
- **Reused session.** The `setup` project creates an admin through the API, logs in through the UI once and saves the `storageState`. UI tests start authenticated, and the `cleanup` project removes the admin at the end.
- **Layers checked by the linter.** [oxlint](https://oxc.rs/docs/guide/usage/linter) applies ESLint's `no-restricted-imports` rule per folder (`.oxlintrc.json`): `api`, `config` and `a11y` depend on nothing, Page Objects and factories only use the API *types*, `helpers` and `fixtures` don't drive the page, and specs import `test` from `src/fixtures`, never straight from `@playwright/test`. oxlint is used instead of ESLint because `typescript-eslint` does not support TypeScript 7 yet.
- **Stable selectors.** Page Objects use `data-testid` and accessibility roles; the only coupling to the DOM is the front end's own contract.
- **API without a browser.** The `api` project only uses Playwright's `request`: fast and cheap in CI.
- **CI.** Runs inside the official Playwright image (browser and dependencies preinstalled, no `apt-get` on every run), with type checking, the layers lint, unit tests, the full run, the report as an artifact and publication to GitHub Pages on `main`. The image tag follows the `@playwright/test` version.

## Notes on the target

- It is a **public, shared** service: data is wiped periodically and availability is not guaranteed. Run it sparingly.
- The `data-testid` of the front end's create-product button is `cadastarProdutos` (missing an "r"). It was kept as is.
- The "Adicionar no carrinho" button on the shopping list does not call the API: it leads to an "Em construção" (under construction) page. That is why the customer flow ends at the shopping list.
- When a product is deleted, the front end reloads the page right after the `DELETE`. That is why the response is captured with `page.route` instead of `waitForResponse`, which would lose the body during navigation.
- Study finding: the JWT returned by login carries the **user's password in its payload**. In a real system this would be a serious security flaw; here it is a useful example for exploratory testing.
- A real bug found by this suite: on 2026-11-16, creating a product through the UI started returning 400. ServeRest 3.4.0 ([ServeRest#571](https://github.com/ServeRest/ServeRest/pull/571)) made the API reject `preco` and `quantidade` as text, and the front end still sent text. The test was marked with `test.fail` and a link to the fix, proposed and accepted in [ServeRest/front#42](https://github.com/ServeRest/front/pull/42). Once the fix was deployed, `test.fail` itself reported `Expected to fail, but passed`, and the marker was removed.

## Next steps

- A simple load test (k6) on the login and products endpoints.
- A browser matrix in CI and an Allure report.
- Visual baselines for the admin pages, with the user name masked.

## License

[MIT](./LICENSE). ServeRest belongs to its authors; this repository only uses it as a test target.
