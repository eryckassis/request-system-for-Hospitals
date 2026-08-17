# Sistema de Chamados Hospital Ubarana

Aplicacao web para abertura e gestao de chamados de TI e Manutencao do Hospital Ubarana. O fluxo publico permite abrir chamados sem cadastro; o painel administrativo permite acompanhar, filtrar, resolver chamados, gerenciar setores, usuarios, relatorios e administradores.

## Stack principal

- **Runtime/build:** Bun, Vite e TanStack Start.
- **UI:** React 19, Tailwind CSS v4, shadcn/ui, Radix UI, lucide-react, sonner.
- **Estado de servidor:** TanStack Query.
- **Rotas:** TanStack Router com file-based routing.
- **Backend/dados:** Supabase Auth, Postgres, Storage, RLS e Realtime.
- **Deploy:** Cloudflare Workers via Wrangler.

Requisitos importantes:

- Node.js `>=22.18.0`.
- Variaveis Supabase configuradas no ambiente local e no provedor de deploy.
- `routeTree.gen.ts` e gerado automaticamente; nao edite manualmente.

## Comandos

```bash
bun install
bun run dev
bun run build
bun run preview
bun run lint
bun run format
bun run deploy
```

O servidor de desenvolvimento usa a porta `8080`, conforme `vite.config.ts`.

## Estrutura do projeto

```text
src/
  components/
    ui/                 # componentes shadcn/ui copiados para o projeto
    animate-ui/         # componentes/icone animados de registries externos
    admin-shell.tsx     # layout principal do painel admin
    admin-avatar.tsx    # avatar do admin com upload para Storage
    status-badge.tsx    # badges e labels de status/departamento
  hooks/                # hooks de contexto admin, animacao, viewport e scroll
  integrations/
    supabase/           # clients Supabase, auth middleware e tipos gerados
  lib/                  # utilitarios, server functions e tratamento de erro
  routes/               # rotas TanStack Start
  router.tsx            # cria router e QueryClient
  start.ts              # configura middlewares globais do TanStack Start
  server.ts             # entrada SSR/Cloudflare com fallback de erro
supabase/
  migrations/           # schema, RLS, funcoes SQL e policies
public/
  images/               # imagens usadas na home
  fonts/                # fontes locais
docs/
  animated-toggle-group.md
```

## Arquitetura

O projeto segue uma arquitetura centrada em rotas, com componentes reutilizaveis e Supabase como backend operacional.

```text
Browser
  |
  | React + TanStack Router
  v
Routes em src/routes
  |
  +-- consultas/mutacoes diretas via Supabase client
  +-- server functions em src/lib/*.functions.ts
  |
  v
Supabase
  |
  +-- Auth: admins autenticados
  +-- Postgres: tickets, sectors, users, admins, roles
  +-- Storage: ticket-images, avatars
  +-- RLS: seguranca por papel/departamento
  +-- Realtime: atualizacao de tickets no dashboard
```

### Entradas globais

- `src/router.tsx` cria um `QueryClient` por router e injeta no contexto do TanStack Router.
- `src/routes/__root.tsx` define metadados globais, HTML shell, `QueryClientProvider`, `<Outlet />`, `Toaster`, pagina 404 e boundary de erro.
- `src/start.ts` registra:
  - `attachSupabaseAuth`, que adiciona `Authorization: Bearer <token>` nas chamadas de server functions feitas pelo browser.
  - `errorMiddleware`, que transforma erros inesperados SSR em uma pagina HTML de erro.
- `src/server.ts` e a entrada do Worker/SSR. Ela carrega o server entry do TanStack Start e normaliza respostas 500 problematicas do h3.

## Rotas e fluxos

As rotas ficam em `src/routes`. O projeto usa file-based routing do TanStack Router; veja tambem `src/routes/README.md`.

### Area publica

- `/` (`src/routes/index.tsx`)
  - Home com cards para TI e Manutencao.
  - Direciona para `/chamados/novo?dept=ti` ou `/chamados/novo?dept=manutencao`.

- `/chamados/novo` (`src/routes/chamados.novo.tsx`)
  - Valida `dept` via Zod.
  - Busca setores do departamento.
  - Usa autocomplete de usuarios existentes.
  - Faz upload de ate 5 imagens no bucket `ticket-images`.
  - Faz upsert best-effort em `users`.
  - Insere registro em `tickets`.

- `/chamados/$id` (`src/routes/chamados.$id.tsx`)
  - Mostra detalhes do chamado publico.
  - Resolve imagens privadas via URLs assinadas.

### Area administrativa

- `/admin/login` (`src/routes/admin.login.tsx`)
  - Login com Supabase Auth.

- `/_authenticated` (`src/routes/_authenticated/route.tsx`)
  - Layout guard client-side.
  - Redireciona para `/admin/login` se nao houver usuario autenticado.

- `/admin` (`src/routes/_authenticated/admin.tsx`)
  - Aplica `AdminShell` ao painel.

- `/admin/` (`src/routes/_authenticated/admin.index.tsx`)
  - Dashboard de chamados.
  - Filtra por status e departamento.
  - Usa Supabase Realtime para invalidar queries e exibir toast quando chegam novos chamados.

- `/admin/chamados/$id`
  - Detalhe administrativo do chamado.
  - Permite alterar status, notas de resolucao, sucesso/insucesso e responsavel.

- `/admin/setores`
  - CRUD de setores permitidos pelo papel do admin.

- `/admin/usuarios`
  - CRUD de usuarios finais usados no autocomplete e historico de setores.

- `/admin/relatorios`
  - Filtros por periodo/status/departamento.
  - Exportacao CSV e XLSX.
  - Visivel para super admin.

- `/admin/configuracoes`
  - Gestao de administradores.
  - Usa server functions protegidas em `src/lib/admins.functions.ts`.
  - Visivel para super admin.

## Componentes

### Componentes de UI base

`src/components/ui` contem componentes shadcn/ui. Eles sao codigo-fonte do proprio projeto, nao uma dependencia externa fechada. O `components.json` define:

- estilo `new-york`;
- Tailwind CSS em `src/styles.css`;
- aliases `@/components`, `@/components/ui`, `@/lib`, `@/hooks`;
- icones via `lucide-react`;
- registries extras `@react-bits` e `@animate-ui`.

Boas praticas para manter consistencia:

- Reutilize os componentes em `src/components/ui` antes de criar markup customizado.
- Use variantes existentes de `Button`, `Badge`, `Card`, `Select`, `Dialog`, `Tabs`, etc.
- Para novas telas, componha primitives existentes em vez de criar novos sistemas visuais.
- Se adicionar componentes shadcn, use o runner do projeto: `bunx --bun shadcn@latest add <componente>`.
- Evite editar componentes shadcn sem necessidade; quando editar, trate como customizacao permanente do projeto.

### Componentes de dominio

- `AdminShell`
  - Layout do painel admin.
  - Controla sidebar desktop, drawer mobile, links de navegacao, logout e exibicao de permissao.
  - Depende de `useAdmin` para saber papeis, departamentos e dados do usuario.

- `AdminAvatar`
  - Mostra avatar com fallback de iniciais.
  - Quando `editable`, faz upload para bucket `avatars` e atualiza `admins.avatar_url`.
  - Invalida `["admin-context"]` apos troca da imagem.

- `StatusBadge`
  - Centraliza labels e cores dos status `pending`, `in_progress`, `resolved`.
  - Exporta `departmentLabel`, usado em telas publicas, admin e relatorios.

- `HomeFooter`, `GlassSurface`, `GradualBlur`, `Silk`
  - Componentes visuais/decorativos usados na experiencia publica.
  - Antes de remover ou alterar, confira impacto na home e em paginas de login.

### Hooks

- `useAdmin`
  - Busca usuario autenticado, linha em `admins`, roles em `user_roles` e URL assinada do avatar.
  - Calcula `isSuper` e `departments`.

- `use-gsap`, `use-lenis`, `use-lenis-gsap`, `use-is-in-view`, `use-mobile`
  - Hooks de animacao, scroll suave e responsividade.
  - Ao criar telas operacionais do admin, prefira interfaces previsiveis e evite animacoes que atrapalhem fluxo repetitivo.

## Modelo de dados

As migrations ficam em `supabase/migrations`.

Enums principais:

- `department`: `ti`, `manutencao`.
- `ticket_status`: `pending`, `in_progress`, `resolved`.
- `app_role`: `super`, `ti`, `manutencao`.

Tabelas principais:

- `sectors`
  - Setores cadastrados por departamento.
  - Usado no formulario publico e filtros/admin.

- `users`
  - Usuarios finais sem autenticacao.
  - Alimenta autocomplete do formulario de chamados.

- `admins`
  - Perfil administrativo vinculado a `auth.users`.
  - Guarda nome, email e caminho do avatar.

- `user_roles`
  - Papeles dos admins.
  - Define acesso global (`super`) ou por departamento (`ti`, `manutencao`).

- `tickets`
  - Registro central de chamados.
  - Guarda titulo, descricao, departamento, setor, snapshot do nome do solicitante, status, anexos e dados de resolucao.

- `deleted_admins`
  - Snapshot de admins removidos.
  - Permite reativar a conta ao cadastrar novamente o mesmo email.

Funcoes SQL importantes:

- `has_role(_user_id, _role)`
- `is_super(_user_id)`
- `can_manage_department(_user_id, _dept)`
- `touch_updated_at()`
- `handle_new_admin()`

## Seguranca e permissoes

O projeto usa RLS como camada principal de seguranca.

- Chamados podem ser criados publicamente.
- Setores e usuarios podem ser lidos publicamente para viabilizar o formulario.
- Alteracoes administrativas respeitam `can_manage_department`.
- Super admins podem gerenciar administradores e roles.
- Server functions administrativas validam token com `requireSupabaseAuth` e reforcam `assertSuper`.

Pontos de atencao:

- `src/integrations/supabase/client.server.ts` usa service role e deve continuar restrito a codigo server-side confiavel.
- Rotas e arquivos que vao para o bundle do cliente nao devem importar service role no topo.
- Para server functions chamadas pelo browser, `attachSupabaseAuth` precisa continuar registrado em `src/start.ts`.
- As policies atuais permitem leitura publica de tickets; se os chamados passarem a conter dados sensiveis, essa regra deve ser revisada.

## Storage

Buckets usados:

- `ticket-images`
  - Recebe anexos do formulario publico.
  - O app salva caminhos no array `tickets.images`.
  - `resolveTicketImageUrls` gera URLs assinadas quando necessario.

- `avatars`
  - Recebe fotos dos administradores.
  - Caminho padrao: `<userId>/<uuid>.<ext>`.
  - `useAdmin` gera URL assinada por 1 hora.

## Variaveis de ambiente

Nao versionar valores reais. Use `.env` local e secrets no Cloudflare/Supabase.

Variaveis usadas no codigo:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_URL=
SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Observacoes:

- O client browser usa `VITE_SUPABASE_*` e tambem possui fallback SSR para `SUPABASE_*`.
- Server functions e middlewares usam `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` existe para operacoes server-side confiaveis, mas deve ser usado com muita cautela.
- `wrangler.jsonc` exige `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`; se uma rota server-side passar a depender diretamente do service role em producao, inclua o secret no ambiente de deploy.

## Escalabilidade

### Crescimento de codigo

- Mantenha rotas como orquestradoras de pagina: UI, query keys e composicao.
- Extraia regras de negocio reutilizaveis para `src/lib`.
- Extraia componentes que aparecem em mais de uma tela para `src/components`.
- Centralize labels de enum e formatadores de dominio para evitar divergencia entre dashboard, detalhe e relatorio.
- Se uma tela admin crescer demais, separe em componentes locais por responsabilidade: filtros, tabela/lista, formulario e acoes.

### Crescimento de dados

- Os indices atuais cobrem `tickets.department`, `tickets.status`, `tickets.created_at` e `tickets.sector_id`.
- Para volumes maiores, priorize queries paginadas no dashboard e relatorios.
- Evite buscar todos os tickets para depois filtrar no cliente; empurre filtros para o Supabase.
- Para relatorios grandes, considere exportacao server-side ou jobs assincronos em vez de gerar XLSX inteiro no browser.
- Para anexos, mantenha somente paths no banco e gere URLs assinadas sob demanda.

### Crescimento de permissoes

- Novos departamentos exigem alteracao no enum `department`, no enum `app_role`, nas labels e na funcao `can_manage_department`.
- Se os papeis ficarem mais granulares, considere uma tabela de permissoes em vez de continuar expandindo enums.
- Toda feature administrativa nova deve considerar:
  - quem pode ler;
  - quem pode criar;
  - quem pode alterar;
  - quem pode excluir;
  - qual policy RLS garante isso no banco.

### Performance e UX

- Use TanStack Query com `queryKey` estavel por tela/filtro.
- Invalide queries especificas apos mutacoes; evite limpar cache global fora de logout.
- Mantenha Realtime restrito aos eventos que a tela precisa.
- Em telas com listas grandes, adicione paginacao, busca server-side e skeleton/loading states.

## Padroes para proximo dev

1. Leia a rota que sera alterada e seus componentes importados.
2. Confira se a feature envolve dados publicos, dados autenticados ou server function.
3. Ajuste primeiro o schema/RLS quando a mudanca altera permissao ou modelo de dados.
4. Reutilize `StatusBadge`, `departmentLabel`, `useAdmin`, componentes shadcn e helpers existentes.
5. Mantenha `routeTree.gen.ts` fora de edicoes manuais.
6. Rode `bun run lint` e `bun run build` antes de entregar mudancas relevantes.
7. Em alteracoes de deploy, valide Node `>=22.18.0` e secrets do Wrangler.

## Como adicionar uma nova tela admin

1. Crie a rota em `src/routes/_authenticated/admin.<nome>.tsx` ou abaixo do grupo admin existente.
2. Adicione o link no array `nav` de `src/components/admin-shell.tsx`, se a tela entrar na navegacao.
3. Use `useAdmin()` para descobrir papel e departamentos do usuario.
4. Modele queries com TanStack Query e Supabase.
5. Garanta que a RLS no Supabase permita apenas o acesso esperado.
6. Use componentes de `src/components/ui` para formularios, selects, dialogs, tabelas e feedback.

## Como adicionar um novo campo em chamados

1. Crie uma migration em `supabase/migrations`.
2. Atualize tipos Supabase se o projeto tiver fluxo de geracao de types configurado.
3. Ajuste `src/routes/chamados.novo.tsx` se o campo vier do formulario publico.
4. Ajuste `src/routes/chamados.$id.tsx` para exibicao publica, se aplicavel.
5. Ajuste `src/routes/_authenticated/admin.chamados.$id.tsx` para exibicao/edicao admin.
6. Ajuste relatorios em `src/routes/_authenticated/admin.relatorios.tsx` se o campo precisar exportar.
7. Revise policies caso o campo seja sensivel.

## Deploy

O deploy principal e Cloudflare Workers:

```bash
bun run deploy
```

Esse comando executa `bun run build` e depois `wrangler deploy`.

Configuracoes relevantes:

- `vite.config.ts` adiciona o plugin Cloudflare apenas durante `build`.
- `wrangler.jsonc` define `name`, `compatibility_date`, `nodejs_compat`, observabilidade e secrets obrigatorios.
- O build valida Node.js `>=22.18.0` antes de prosseguir.

## Pontos de atencao conhecidos

- O projeto contem varios comentarios `eslint-disable prettier/prettier`; antes de grandes refactors, vale padronizar formatacao gradualmente.
- Algumas telas usam classes Tailwind com cores hex diretas. Para uma evolucao de design system, migrar esses valores para tokens em `src/styles.css`.
- O formulario publico faz leitura publica de setores, usuarios e tickets. Isso facilita uso sem login, mas deve ser reavaliado se os dados forem sensiveis.
- A gestao de senha de admins novos usa `signUp`; para reativacao de admins excluidos, o fluxo esperado e o usuario usar "Esqueci minha senha".
