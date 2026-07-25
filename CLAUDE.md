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

### Frontend (rebuild pending — see §7)
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
- `common` never depends on a feature (exception: `Role` lives in `member/domain`
  and is imported by security — the one accepted shared concept).

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
- Return the DTO or Spring `Page<T>` **directly** — never wrap in a custom
  success envelope. `201` for creates, `204` for deletes.
- Every handler carries an `@Operation(summary = "...")` for OpenAPI.

### 4.6 Errors — RFC 9457 ProblemDetail only
- Throw a subclass of `common/exception/ApiException` (carries status/title/type).
- `GlobalExceptionHandler` converts everything to `ProblemDetail`. Never build a
  custom error envelope, and never construct `ProblemDetail` inside a
  service/controller.

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
- Explain **why** only for genuinely non-obvious or long logic, as short inline
  `//` comments **inside** the method body.
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
- Target layout: `api/ components/{ui,layout,campaign,common} pages/{public,admin}
  hooks/ store/ types/ router/ lib/`.

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

> ⚠️ **Known Windows/Docker Desktop quirk**: running `docker build` from `backend/`
> on this machine has repeatedly left a stray, empty, junk folder literally named
> `backend;C` in the repo root (root cause not fully pinned down — likely a
> Windows PATH/WSL2 path-translation artifact). **After every `docker build` run,
> immediately `ls` the repo root and delete any stray `*;C` folder** before
> reporting the build result — do not wait to be told about it again.

---

## 7. Known state / TODO

- **Frontend needs cleanup**: `frontend/src/` currently contains an unrelated
  dashboard template (`src/app/**`, `src/config`, `src/contexts`, stray build
  artifacts). Rebuilding the frontend to the layout in §5 is a **later task** —
  do not treat the template files as the app.

---

## 8. Hard rules (do / don't)

- ✅ Modular monolith, package-by-feature, cross-feature by id only.
- ✅ Records for DTOs (request/response); Lombok for entities + DI + logging.
- ✅ MapStruct for all mapping; RFC 9457 ProblemDetail for all errors.
- ✅ Return DTO / `Page<T>` directly; `@Valid` on inbound; `@Operation` on handlers.
- ✅ One-sentence WHAT Javadoc + `@param` on every method; WHY only inline for hard logic.
- ❌ No Jackson 2 imports (`com.fasterxml.jackson`) — Boot 4 uses `tools.jackson`.
- ❌ No custom response/error envelope. ❌ No `@Data` on entities. ❌ No editing applied migrations.
- ❌ No cross-feature entity/repository imports.
- ✅ Screenshot-verify (Playwright fallback if the Browser tool's screenshot is
  broken) any UI change before reporting it done — see §5.1.
- ❌ No "..." (`MoreHorizontal`) catch-all row-action menus anywhere — see §5.2.
- ❌ No mixing layout primitives (e.g. `items-start` vs `items-center`) across
  field rows within the same dialog — see §5.2.
- ❌ Never leave a stray `*;C` junk folder in the repo root after `docker build`
  — check and delete it every time, see §6.
```
