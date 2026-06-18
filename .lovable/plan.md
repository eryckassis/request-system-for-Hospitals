
# Sistema de Chamados — Plano de Implementação

## Adaptações ao stack atual

O documento pede **Next.js 14 (App Router)**, mas este projeto Lovable roda em **TanStack Start + React 19 + Tailwind v4 + Lovable Cloud (Supabase gerenciado)**. Toda a especificação funcional/visual será mantida; apenas trocamos a casca:

| Spec original | Implementação real |
|---|---|
| Next.js App Router (`src/app/...`) | TanStack Router file-based (`src/routes/...`) |
| Server Actions | `createServerFn` do TanStack Start |
| `middleware.ts` para guard | Layout route `_authenticated` + `requireSupabaseAuth` |
| `next/font` (Inter) | `<link>` Google Fonts em `__root.tsx` |
| `next-themes` | App é dark-only fixo (`<html class="dark">`), sem toggle — dispensa a lib |
| SWR | TanStack Query (já no projeto) com mesmo padrão de paginação |
| Supabase direto | Lovable Cloud (Supabase por baixo, sem mencionar ao usuário final) |

Tudo o que é UX, regras de negócio, validações, design tokens, animações GSAP, fluxos, CSV, dropzone etc. é mantido conforme o md.

## Fases de entrega

Projeto é grande (público + admin + super-admin + relatórios). Vou entregar em **4 fases** para você validar cada etapa antes de avançar.

### Fase 1 — Fundação (esta entrega)
1. Habilitar **Lovable Cloud**.
2. Migration SQL: tabelas `sectors`, `users`, `admins`, `tickets` + enum de status + `user_roles` (`super`, `ti`, `manutencao`) usando o padrão seguro de roles (tabela separada + `has_role` SECURITY DEFINER). Grants explícitos no schema `public`. RLS:
   - `tickets`: SELECT/INSERT públicos (anon+auth); UPDATE/DELETE só admin com `has_role` do departamento (super pode tudo).
   - `sectors`/`users`: SELECT público; escrita só admin do departamento.
   - `admins`/`user_roles`: SELECT autenticado; escrita só super.
3. Buckets Storage: `ticket-images` (público, 5MB, jpg/png/webp/gif) e `avatars` (público).
4. Design system dark-only no `src/styles.css` com os tokens exatos do md (background `#000`, surface `#0a0a0a`, border `#1a1a1a`, etc.), radius 6px, fonte Inter via `<link>` no `__root.tsx`, `font-feature-settings: "ss01"`.
5. Helpers GSAP reutilizáveis (`usePageEnter`, `useStaggerList`, `useButtonHover`) e instalar `gsap`, `react-dropzone`, `react-hook-form`, `zod`, `@hookform/resolvers`, `date-fns`, `papaparse`.
6. Rota raiz `/` — seletor **TI / Manutenção** com animação de entrada e hover GSAP. Layout shell público.

### Fase 2 — Fluxo público de chamados
- `/chamados/novo?dept=ti|manutencao` — form com react-hook-form + zod (schema do md), select de setor (filtrado por departamento), select/free-text de usuário, dropzone (máx 5, 5MB, preview inline), upload paralelo ao bucket, insert no ticket, tela de sucesso com ID copiável.
- `/chamados/$id` — visualização pública por ID, badge de status, galeria de imagens, bloco de resolução quando `resolved`.
- Página 404 amigável quando o ID não existe.

### Fase 3 — Painel Admin
- `/admin/login` (Supabase Auth email/senha, sem signup público).
- Layout `_authenticated` com sidebar/header, guard via `requireSupabaseAuth` + leitura do papel.
- `/admin` Dashboard: 4 cards de stats, lista de chamados do departamento do admin (super vê todos), filtros (status, setor, intervalo de datas, busca por título/nome), paginação 10/página com IntersectionObserver e lazy-load de imagens.
- `/admin/chamados/$id`: edição de status, formulário de resolução validado (notes ≥30 chars + boolean obrigatórios quando `resolved`), editar campos, excluir com modal de confirmação.
- `/admin/setores` e `/admin/usuarios`: CRUD escopado ao departamento; bloqueio de exclusão quando há chamados vinculados.

### Fase 4 — Super Admin, relatórios e polimento
- `/admin/configuracoes` (super apenas): CRUD de admins, troca de departamento, upload de avatar.
- `/admin/relatorios`: tabela do mês corrente com filtro de datas, paginação + IO, botão **Exportar CSV** (PapaParse) com os campos exatos do md.
- Passe final de animações GSAP (page-enter em todas as rotas, stagger nas listas, hover scale 1.02 nos botões primários), responsividade `sm/md/lg`, revisão de RLS, smoke test do fluxo end-to-end.

## Detalhes técnicos relevantes

- **Server functions**: criação de chamado, upload de imagens e mutações admin via `createServerFn` em `src/lib/*.functions.ts`. Mutações admin usam `.middleware([requireSupabaseAuth])` + checagem de `has_role`.
- **Loaders protegidos**: chamados só são pré-buscados sob `_authenticated/` para não quebrar o prerender; rotas públicas buscam no componente via `useServerFn` + `useQuery`.
- **Paginação**: TanStack Query no lugar do SWR, mesmo padrão `.range()` + `count: 'exact'` do md, IntersectionObserver como descrito.
- **CSV**: gerado client-side com PapaParse, nome `chamados-YYYY-MM.csv`.
- **Seed**: a migration cria um super-admin de exemplo apenas se o usuário fornecer email (ver pergunta abaixo) — caso contrário, o primeiro signup manual via Cloud vira super via SQL helper documentado no chat.

## Pendência antes de começar

Confirmação para seguir com a **Fase 1** já nesta próxima execução. Se quiser, me diga também o **email do super-admin inicial** para eu já deixar pré-configurado o papel `super` (caso contrário, eu te mostro como promover após o primeiro login).
