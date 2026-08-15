# CLAUDE.md — CLB Charity Web App

Engineering guide for this repository. Read this before writing code. It defines
the tech stack (with pinned versions), coding conventions, and folder structure.
See [README.md](README.md) for how to run the app.

---

## 1. What this project is

A charity web app for a Vietnamese student club (CLB): public pages for donation
campaigns and news, plus an internal dashboard for members. **No payments are
processed** — donations happen externally via VietQR / `thiennguyen.app`; admins
update progress manually.

- Roles: `ADMIN`, `CONTRIBUTOR`, `MEMBER`, anonymous donor.
- Architecture: **modular monolith** (not microservices). Features are isolated
  so any one can later be extracted into a microservice.

---

## 2. Tech stack (pinned versions)

### Backend
| Thing | Version | Notes |
|---|---|---|
| Java | **26** | `<release>26</release>`; use modern language features (below) |
| Spring Boot | **4.1.0** | brings Spring Framework 7.0.x, Jakarta EE 11 |
| Spring Framework | 7.0.x | managed by Boot |
| Hibernate ORM | 7.x | managed by Boot |
| Jackson | **3.x** | package is `tools.jackson.*` (NOT `com.fasterxml.jackson.*`) |
| Build | **Maven** | `backend/pom.xml`; no Gradle |
| Migrations | Flyway | via the `spring-boot-flyway` module (not bare `flyway-core`) |
| Auth | Spring Security + JWT | JJWT 0.12.6, access 15m / refresh 7d |
| Storage | Cloudinary | `cloudinary-http5` 2.4.0 (free 25GB) |
| PDF | iText 7 | 7.2.5 |
| Mapping | **MapStruct** | 1.6.3 (+ `lombok-mapstruct-binding` 0.2.0) |
| Boilerplate | **Lombok** | 1.18.46 (JDK 26 support) |
| API docs | springdoc-openapi | 3.0.0, Swagger UI at `/swagger-ui.html` |

### Frontend
| Thing | Version | Notes |
|---|---|---|
| React / react-dom | **19.2.x** | functional components only |
| TypeScript | **5.9.x** | strict mode; TS 7.0 (native compiler) is GA but pin 5.9 until tooling catches up |
| Build | Vite | latest |
| Styling | TailwindCSS 3.4 + Shadcn/ui | |
| Data | TanStack Query v5 | |
| Forms | React Hook Form + Zod | |
| Auth state | Zustand | access token in memory only |
| Editor | Tiptap | |
| HTTP | Axios | JWT-refresh interceptors |

> When adding a dependency, check the latest stable release rather than guessing.

---

## 3. Backend folder structure (modular monolith)

Package base `com.clb.charity`. **Package-by-feature**; each feature is
self-contained and references other features **by id only** (no cross-feature
JPA relations, no cross-feature entity imports).

```
com.clb.charity/
├── common/                       # shared kernel (no feature logic)
│   ├── config/                   # @ConfigurationProperties, beans (OpenAPI, Cloudinary, RestClient)
│   ├── security/                 # SecurityConfig, JWT provider/filter, AuthPrincipal
│   ├── exception/                # ApiException hierarchy + GlobalExceptionHandler (ProblemDetail)
│   └── util/                     # pure helpers (e.g. SlugUtil)
├── <feature>/                    # campaign, post, member, auth, report, storage, vietqr
│   ├── domain/                   # JPA entities + enums
│   ├── dto/
│   │   ├── request/              # *Request records (inbound, validated)
│   │   └── response/             # *Response records (outbound)
│   ├── repository/               # Spring Data JPA interfaces
│   ├── mapper/                   # MapStruct @Mapper interfaces
│   ├── service/                  # service INTERFACE
│   │   └── impl/                 # *ServiceImpl (@Service)
│   └── controller/               # @RestController
└── CharityApplication.java
```

**Rules**
- A feature package must not import another feature's `domain`, `repository`, or
  `service/impl`. Cross-feature needs go through the other feature's `service`
  interface, passing/returning ids or DTOs.
- `common` never depends on a feature (exception: `Role` and `AuthProvider` live
  in `member/domain`; `Role` is imported by `common/security` plus any feature
  doing an RBAC check (campaign, comment, inquiry, auth), and `AuthProvider` by
  `auth` and `common/security/oauth2` — accepted since both are thin,
  JPA-persisted classification enums with no relations/behavior, needed
  everywhere authorization/login logic lives).
- Discriminator/vocabulary enums that multiple features must reference by design
  (e.g. `CommentTargetType`, `ReactionTargetType`, `NotificationType`,
  `NotificationReferenceType`, `Granularity`) live in `common/model/`, not in the
  "owning" feature's `domain` — a feature exposing a polymorphic target (comment,
  reaction, notification) shouldn't force every caller to import its `domain`
  package just to pass the discriminator value.

**Enforcement**: there is no lint/boundary tool wired up for this (same tradeoff as
§5.0a's frontend equivalent). This section **is** the enforcement — new code must
follow it; existing violations get migrated opportunistically, one feature at a
time, not in a big-bang pass.

---

## 4. Backend coding conventions

### 4.1 Java 26 language use
- **DTOs are `record`s** — immutable request/response objects. Do not use Lombok
  on DTOs.
- Prefer `switch` expressions, pattern matching, text blocks, `var` for obvious
  local types (never for fields or public API).
- No `null` returns from services for "not found" — throw the domain exception.
- Constants over magic numbers/strings (`private static final`).

### 4.2 Lombok (use it, but scoped)
- **Entities**: `@Getter @Setter @NoArgsConstructor` (add `@AllArgsConstructor`/
  `@Builder` only if needed). Keep all JPA annotations and field initializers.
- **DI**: `@RequiredArgsConstructor` on `@Service`/`@RestController`/config beans
  with `private final` dependencies — no hand-written constructors.
- **Logging**: `@Slf4j` then `log.info(...)` — no hand-declared loggers.
- **Do NOT** use `@Data` on entities (breaks equals/hashCode with JPA) and do NOT
  use Lombok on records.

### 4.3 MapStruct (all entity↔DTO mapping)
- `@Mapper(componentModel = "spring", unmappedTargetPolicy = ReportingPolicy.IGNORE)`.
- Mappers are Spring beans, injected into service impls. No hand-written mapping.
- Use `@Mapping(target = "...", ignore = true)` for fields the service sets
  itself (slug, createdBy, status, timestamps), and `@MappingTarget` for updates.

### 4.4 Service layer
- Public **interface** in `service/`, `@Service` implementation in `service/impl/`.
- `@Transactional(readOnly = true)` at class level; `@Transactional` on write
  methods. Business rules and validation live here, not in controllers.

### 4.5 Controllers
- Thin. `@RestController` under `/api/v1/...`. Validate inbound with `@Valid`.
- Return the DTO **directly** — never wrap in a custom success envelope.
  `201` for creates, `204` for deletes.
- Paginated endpoints: service returns `Page<T>`, controller wraps it as
  `new PagedModel<>(page)` before returning (never return `Page<T>` directly —
  its raw JSON leaks internals). JSON: `{content, page: {size, number,
  totalElements, totalPages}}`.
- Every handler carries an `@Operation(summary = "...")` for OpenAPI.

### 4.6 Errors — RFC 9457 ProblemDetail only
- Throw a subclass of `common/exception/ApiException` (carries status/title/type).
- `GlobalExceptionHandler` converts everything to `ProblemDetail`. Never build a
  custom error envelope, and never construct `ProblemDetail` inside a
  service/controller.
- **Exception**: `common/security`'s `AuthenticationEntryPoint`/`AccessDeniedHandler`
  build `ProblemDetail` directly — a rejection there never reaches
  `GlobalExceptionHandler`, so there's no other way to emit RFC 9457 for it.

### 4.7 Persistence & migrations
- Flyway files in `src/main/resources/db/migration/`. The initial schema is
  `V1__init_schema.sql`; seed is `V2__seed_data.sql`. **Never edit an applied
  migration** — add a new `V{n}__*.sql`.
- `spring.jpa.hibernate.ddl-auto=validate` — the schema is owned by Flyway.

### 4.8 Security
- Stateless JWT. Access token 15 min (memory on the client); refresh token 7 days
  in an HttpOnly cookie, rotated on refresh, revocable server-side.
- Authorization is centralized in `SecurityConfig` request matchers; roles map to
  `ROLE_<NAME>` authorities.

### 4.9 Comments (STRICT)
- **Every method** gets a **single one-sentence Javadoc stating WHAT it does**
  (no why), then **one blank Javadoc line**, then `@param` for each parameter
  (and `@return` when not obvious):
  ```java
  /**
   * Changes a campaign's status, enforcing the allowed lifecycle transitions.
   *
   * @param id campaign id
   * @param target the desired status
   * @return the updated campaign
   */
  ```
- The WHAT line stays on **one line** — do not wrap it while it still fits within
  the **120-column** line width (only wrap if it would exceed 120 columns).
- Always keep the blank line separating the WHAT sentence from the `@param`/
  `@return`/`@throws` block.
- Explain **why** only for genuinely non-obvious or long logic, as a `//` comment
  **inside** the method body — **exactly one line, never wrapped across two or
  more `//` lines**, no exceptions.
- Do not document Lombok-generated accessors. Do not restate the obvious.

### 4.10 Tests
- JUnit 5 + Mockito. Mock repositories and collaborators; use the **real**
  MapStruct mapper (`Mappers.getMapper(XMapper.class)`) so mapping is exercised.
- Unit tests must not require a running DB/Cloudinary.

---

## 5. Frontend coding conventions (for the rebuild)

- **Strict TypeScript**, no `any`. `interface` for object shapes, `type` for
  unions. Response types must mirror backend JSON exactly (camelCase).
- **Functional components only.** Data via TanStack Query hooks; forms via React
  Hook Form + Zod; auth state via Zustand (access token in memory, never
  localStorage — the refresh cookie is HttpOnly).
- Axios instance with `baseURL: '/api/v1'`, `withCredentials: true`, and a
  single-flight 401→`/auth/refresh`→retry interceptor.
- Every function in `src/api/*.ts` has a JSDoc comment.
- Errors surface `ProblemDetail.detail` (toast). No magic numbers (extract
  constants).
- **i18n is mandatory app-wide, including internal/admin pages.** All
  user-facing text — labels, toasts, placeholders, empty states, and form
  validation messages — must go through `react-i18next`'s `t()`, backed by
  `src/i18n/locales/{vi,en}.json`. Vietnamese is the default/fallback locale;
  never hardcode a string directly in JSX or in a validation message. Enum-keyed
  label maps (status, category, role, ...) are functions that call `t()`, not
  static `Record<Enum, string>` objects. Zod schemas that need translated
  messages are built by a factory function (`buildXxxSchema(t)`) invoked inside
  the component via `useMemo(() => buildXxxSchema(t), [t])`, since schemas
  declared at module scope can't call `t()`. This does not apply to
  user-generated bilingual *content* (e.g. a campaign's title/titleEn) — that
  continues to use the existing `localized(i18n.language, vi, en)` helper.
### 5.0a Frontend architecture: feature-sliced (target — migrating incrementally)

**Rationale.** The backend already organizes by feature (`com.clb.charity.<feature>/{domain,dto,repository,service,controller}`, §3). The frontend is moving to the same organizing principle — group by *domain*, not by *technical layer* — so a `campaign`'s types/api/components live together instead of being spread across a flat `types/`, `api/`, `components/`. This is a real, deliberate architecture choice, not a cosmetic rename: it makes new code land in the right place by construction, instead of drifting into flat shared folders and needing periodic manual cleanup (as happened before this rule existed).

**Target layout:**

```
frontend/src/
├── features/
│   └── <name>/                 # campaign, member, auth, post, donation, event, faq,
│       ├── api.ts              # partner, reaction, comment, registration, inquiry,
│       ├── types.ts            # notification, dashboard, settings
│       ├── components/         # feature-specific components (dialogs, cards, sections)
│       ├── pages/              # route-level pages owned by this feature (public + admin)
│       └── hooks.ts            # only if the feature needs its own hooks
├── shared/
│   ├── ui/                     # shadcn primitives (unchanged, just relocated)
│   ├── components/             # generic, multi-feature components (logo, mode-toggle,
│   │                            # language-toggle, notification-bell, error-boundary...)
│   ├── layouts/                # base-layout, public-layout + their single-consumer parts
│   │                            # (site-header, site-footer, app-sidebar, nav-main, nav-user,
│   │                            # scroll-to-top-button, command-search, facebook-page-widget)
│   ├── hooks/ lib/ config/ store/ types/ (common.ts, theme*.ts only) i18n/
├── router/
└── App.tsx / main.tsx
```

**Boundary rule** (mirrors the backend's "cross-feature by id only", §3): a feature must not
reach into another feature's internals (`features/campaign/components/x` must not import
`features/post/api`). Cross-feature needs go through the other feature's exported `api`
functions, passing/returning ids — same discipline as the backend's service-interface rule.

**Enforcement**: there is no lint/boundary tool wired up for this (deliberately skipped —
not worth the setup cost at this project's size). This section of CLAUDE.md **is** the
enforcement: every new file placed by an assistant or contributor must follow this layout;
don't add a new flat file to the old `types/`, `api/`, or `components/` locations.

**Migration policy (incremental, never a big-bang rewrite):**
- All **new** features/files follow this layout from now on.
- **Existing** code (still under the old flat `types/`, `api/`, `components/`, `app/`
  layout) migrates one domain at a time, opportunistically — when a domain is touched for
  an unrelated task, or in a dedicated small pass — never all at once.
- Every migration batch is small (one domain, or a handful of clearly-related files),
  followed immediately by `tsc --noEmit` + `npm run build` + a browser smoke check before
  starting the next batch. This is a hard rule after a real incident: an earlier attempt to
  bulk-rewrite ~67 files' imports via a single regex script silently deleted unrelated
  import lines in 8 files (the regex's lazy quantifier backtracked across an adjacent,
  unrelated `import` statement whenever the immediately-following text didn't match). The
  bug was only caught because `tsc` was run right after — bulk automated rewrites across many
  files must always be followed by an immediate full type-check, and are only ever done in
  small, individually-verified batches, never as one large unverified pass.
- During the transition, the codebase will have some features migrated and some not — this
  is expected and fine; do not "fix" this by rushing a full migration.

### 5.1 UI verification (STRICT — no exceptions)
- **"It renders and the click works" is NOT "verified."** DOM structure checks
  (`getComputedStyle`, `getBoundingClientRect`, text content, `read_page`) only prove
  a component is functionally present — they cannot tell you whether it looks good.
  Any change to a page, dialog, or component that affects visual layout MUST be
  checked against a real rendered screenshot before it is reported as done.
- If the in-app Browser tool's screenshot capability is unavailable (it has failed
  entirely in past sessions — "the Browser pane is not displayed, so the page is
  not compositing frames"), fall back to **Playwright**: `npx --yes
  playwright@1.61.1` (Chromium is normally already cached locally — this does not
  trigger a real download), a small throwaway `.mjs` script in the scratchpad
  directory that logs in, navigates, interacts, and calls `page.screenshot()`, then
  read the resulting PNG with the Read tool.
- Wait **~500ms after a dialog/modal opens** before screenshotting — Radix's open
  animation makes a mid-transition screenshot look broken (missing overlay, no
  card/shadow) even when the fully-rendered state is completely fine. Screenshot
  too early and you'll "find" a bug that doesn't exist, or (worse) not notice one
  that does.
- Actually look critically at the screenshot before calling something done: do
  same-purpose elements (icon circles, field rows, buttons) share identical
  alignment/spacing/border treatment across the whole component? A dialog where
  one row uses `items-center` with a border and three rows use `items-start`
  without one is not "verified," no matter how many DOM assertions passed.

### 5.2 Admin table & dialog UI patterns
- **Never** use a generic "..." (`MoreHorizontal`) overflow menu for row actions.
  Every action gets its own icon button with a real, specific icon (`Pencil` =
  edit, `Trash2` = delete, `HandCoins` = donations, `Users` = registrants, ...). A
  dropdown triggered from an icon is fine when the icon itself represents picking
  one of several choices (e.g. `ArrowRightLeft` for "change status" opening a list
  of valid transitions) — it is never acceptable as a bare "show me more actions"
  catch-all.
- Consolidate edits to different fields of the **same** record into one Edit
  dialog (e.g. role + active status + public display title all live in one "Edit
  member" dialog) rather than one icon per field. Only genuinely separate
  sub-resources (a donations ledger, a registrations roster) get their own dialog
  and their own row icon.
- Within one dialog, every field row uses the **same** layout primitive (e.g.
  `flex items-center gap-3 rounded-lg border p-3` for an icon + label + control
  row) — pick one pattern per dialog and apply it to every row in that dialog, no
  mixing.

### 5.3 Icon-only controls & interactive-element hygiene (STRICT)
- **Every icon-only interactive control** — a `Button` showing only an icon, a
  `Switch`, a `Toggle`, or any other control with no visible text label — MUST
  get both an `aria-label` and a shared `Tooltip` (`components/ui/tooltip.tsx`
  — `Tooltip`/`TooltipTrigger`/`TooltipContent`, never a plain HTML `title=`
  attribute, which is slow and unstyled) using the same text for both. Add this
  the moment the control is created — don't rely on a later audit to catch it,
  see the two rounds of misses in this project's history (icon buttons missed
  first, then `Switch`/`SidebarTrigger` missed in the very next pass because the
  first audit only looked for `<Button>`).
- **Radix `data-state` collision gotcha**: never make a component that uses its
  *own* `data-state` attribute for visual styling (`Switch`, `Toggle`, `Tabs`,
  `Accordion`, ...) the **direct** child of `TooltipTrigger asChild` (or any
  other Radix `asChild` trigger). The wrapping primitive's own `data-state`
  (e.g. Tooltip's open/closed) silently overwrites the inner component's
  `data-state` (e.g. Switch's checked/unchecked) on the same DOM node, breaking
  its color styling — the bug is invisible in a lint/typecheck/build pass and
  only shows up as a wrong color on hover. Fix: wrap the inner component in a
  plain `<span className="inline-flex">` first and make **that span** the
  `asChild` target instead.
- **Every new interactive/clickable primitive** (in `components/ui/` or
  elsewhere) must include `cursor-pointer` in its base className. Browsers do
  **not** give `<button>` a pointer cursor by default (only `<a>` tags get
  one) — this has already been missed, in one pass each, across `Tabs`,
  `Dialog`/`Sheet` close buttons, `Switch`, `Checkbox`, `Toggle`,
  `RadioGroup`, `Accordion`, `NavigationMenu`, `Sidebar` menu buttons/actions,
  and `DropdownMenu`/`Command`/`Select` items (which shipped with an explicit
  `cursor-default` override). When adding any new clickable shadcn primitive,
  check it against this list rather than assuming the base component already
  handles it.

---

## 6. Build & run

```bash
# infra
docker compose up -d

# backend (IntelliJ imports pom.xml directly; or with Maven installed)
cd backend && mvn spring-boot:run          # mvn test / mvn clean package
# frontend
cd frontend && npm install && npm run dev
```

Seeded admin: `admin@clb.vn` / `Admin@123`.

> ⚠️ **MANDATORY: run all `docker build` / `docker run -v` commands via
> PowerShell, never Bash. No exceptions.**

> ⚠️ **PowerShell `${PWD}` can silently point at the wrong directory** if the
> tool's session cwd has drifted (e.g. into `frontend`) — always use an explicit
> absolute path for docker volume mounts, never `${PWD}`.

> ⚠️ **Never chain multi-command bash strings through PowerShell → `docker run` →
> `bash -c "..."`** — escaping (e.g. `\$`) breaks silently and the command can
> report exit 0 while having done nothing. Write anything beyond a single command
> to a script file and run that file instead.

> ⚠️ **`CharityApplicationTests` always fails in the ephemeral no-Maven test
> container — exclude it, don't re-diagnose it.** It needs Testcontainers to spin
> up a real Postgres, which needs the Docker socket; the ephemeral container
> doesn't have one. Run `mvn -Dtest='!CharityApplicationTests' test` (or mount
> `/var/run/docker.sock` if you specifically need this test) instead of treating
> the failure as a regression each time.

> ⚠️ **Ad-hoc test containers/images must be cleaned up, but not the reusable base
> image**: this project has no local Maven, so backend tests are often run via a
> throwaway `docker run --rm -v backend:/app -v .m2:/root/.m2 eclipse-temurin:26-jdk
> ...` container. `--rm` only removes the *container* — the base image and any
> Docker build cache are left behind and accumulate across sessions (grew to
> 3.76GB of build cache in one sitting). Rule: **keep `eclipse-temurin:26-jdk`
> cached** (it's reused constantly for this pattern and re-pulling it every time
> just wastes time), but **always remove any other one-off image** created for a
> single inspection or test (e.g. a throwaway `alpine` container, or
> `testcontainers/ryuk` pulled in by a Testcontainers run) and run
> `docker builder prune -f` right after a build/test verification pass — don't
> leave it for the user to notice their disk filling up. Before reporting "just
> this one leftover image," diff `docker images` against `docker-compose.yml`'s
> `image:`/`build:` entries — don't eyeball-guess the count.

---

## 7. Known state / TODO

- Frontend template cleanup is **done** — every folder under `frontend/src/app/`
  is a real feature; `src/config`/`src/contexts` hold the app's real theme/sidebar
  infra (not template leftovers). If a suspiciously generic-SaaS-sounding file
  turns up again (`pricing-section.tsx`, `testimonials-section.tsx`, etc.), grep
  for its import before assuming it's live — 14 such orphaned files were found
  and deleted from `landing/components/` well after the initial cleanup pass.

---

## 8. Hard rules (do / don't)

- ✅ **Before executing any non-trivial or multi-step task (and always before any
  delete/rename/rewrite of existing files), list out the concrete steps you plan
  to take and wait for the user's explicit confirmation before doing them.**
  Don't jump straight from "I found X" to "I fixed X" — present the plan, let the
  user say yes, then act. This applies even when the fix seems obviously correct
  (e.g. "these files are unused, deleting them") — the user decides what counts
  as safe to do, not the model.
- ✅ Modular monolith, package-by-feature, cross-feature by id only.
- ✅ **MANDATORY: `docker build` / `docker run -v` always via PowerShell, never
  Bash** — see §6.
- ✅ **Frontend is migrating to feature-sliced** (§5.0a): new code always follows
  `features/<name>/{api,types,components,pages}` + `shared/`; existing flat
  `types/`/`api/`/`components/` code migrates incrementally, one small
  verified batch at a time — never a single big-bang rewrite, and never via an
  unverified bulk automated script (see §5.0a for why).
- ✅ Records for DTOs (request/response); Lombok for entities + DI + logging.
- ✅ MapStruct for all mapping; RFC 9457 ProblemDetail for all errors.
- ✅ Return DTO directly; paginated endpoints wrap `Page<T>` in `PagedModel<T>`
  at the controller (§4.5). `@Valid` on inbound; `@Operation` on handlers.
- ✅ One-sentence WHAT Javadoc + `@param` on every method; WHY only inline for hard logic.
- ❌ No Jackson 2 imports (`com.fasterxml.jackson`) — Boot 4 uses `tools.jackson`.
- ❌ No custom response/error envelope. ❌ No `@Data` on entities. ❌ No editing applied migrations.
- ❌ No cross-feature entity/repository imports.
- ✅ Screenshot-verify (Playwright fallback if the Browser tool's screenshot is
  broken) any UI change before reporting it done — see §5.1.
- ❌ No "..." (`MoreHorizontal`) catch-all row-action menus anywhere — see §5.2.
- ❌ No mixing layout primitives (e.g. `items-start` vs `items-center`) across
  field rows within the same dialog — see §5.2.
- ✅ Every icon-only control (`Button`, `Switch`, `Toggle`, ...) gets an
  `aria-label` + shared `Tooltip` the moment it's created, not as a later
  audit — see §5.3.
- ❌ Never nest a `data-state`-styled component (`Switch`/`Toggle`/`Tabs`/
  `Accordion`) directly inside `TooltipTrigger asChild` — wrap it in a plain
  `<span>` first, or its own `data-state` gets silently overwritten — see §5.3.
- ✅ Every new clickable primitive gets `cursor-pointer` in its base
  className — check it against the known-missed list in §5.3.
- ❌ Never leave a stray `*;C` junk folder in the repo root after `docker build`
  — check and delete it every time, see §6.
- ✅ After any ad-hoc test-container run, remove one-off images (`alpine`,
  `testcontainers/ryuk`, ...) and `docker builder prune -f` the build cache —
  but keep `eclipse-temurin:26-jdk` cached since it's reused constantly. Diff
  `docker images` vs `docker-compose.yml` before reporting what's leftover, see §6.
- ✅ **When asked to fix one occurrence of a text/wording/pattern, grep the whole
  repo (source only, not `dist`/`build`) for other occurrences of the same thing
  and surface them before finishing** — e.g. "sửa Hội → Câu lạc bộ" in one file
  means checking i18n locales, component source, alt text, and comments for the
  same string, not just the one spot pointed at. **"Same thing" means the same
  category/family of issue, not just the same literal substring** — e.g. if the
  reported instance is one deprecated API of a library (`z.string().email()`),
  check the library's own list of deprecated APIs (its `@deprecated`-annotated
  type defs are authoritative) for sibling deprecated methods (`.url()`,
  `.uuid()`, `.datetime()`, ...) in the same pass, don't just grep the one
  method name from the report. Report what else was found and fix it in the
  same pass (still following the confirm-before-destructive-action rule above
  where that applies) instead of waiting to be told again per spot.
- ✅ **This applies to code-bug patterns just as much as text**: once a bug turns
  out to be caused by a mechanical edit applied across several files in the same
  change (e.g. wrapping mapped children in a new `motion.div`, which silently
  breaks Tailwind `first:`/`last:`/`nth-*` selectors that assumed the old direct-
  child structure), re-open every other file touched by that same edit in the
  same pass and check for the identical defect — don't wait for the user to spot
  each broken instance one at a time. State explicitly which files were re-checked
  and what was found (even "checked, none affected, here's why") so the user
  doesn't have to ask "did you check the others?"
- ✅ **A UI change that "renders with no errors" is not done — critically look at
  whether it looks intentionally designed before reporting it, and check the
  states adjacent to the one you're fixing in the same pass**, not one at a time
  as the user keeps catching them. Concretely, on every visual fix:
  1. Use realistic test data shaped like the real use case (e.g. a square logo to
     test a "logo" field) — a convenient-but-wrong placeholder (a landscape banner
     image standing in for a logo) biases the whole design toward the wrong shape.
  2. Screenshot it and actually critique the screenshot — does this look designed,
     or like a rough first draft with too much bare whitespace / no visual
     hierarchy? Don't just confirm "it rendered."
  3. In that same pass, check the states next to the one just fixed: hover state,
     dark mode, empty/one-item/many-items, and whichever edge (top/bottom vs
     left/right, first vs last) mirrors the one that was just fixed — a fix that
     only addresses horizontal fade/spacing without checking vertical, or light
     mode without dark mode, leaves the identical class of bug for the user to
     find next.
  4. When a decision is genuinely subjective (spacing density, how much
     decoration, layout balance) and you're not confident it matches what the
     user pictures, ask before implementing — don't silently pick one
     interpretation and make the user spend several turns pointing out, one at a
     time, that it "looks off."
```
