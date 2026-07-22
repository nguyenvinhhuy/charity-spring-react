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
| Storage | MinIO | 8.5.17, S3-compatible |
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
│   ├── config/                   # @ConfigurationProperties, beans (OpenAPI, MinIO, RestClient)
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
- Unit tests must not require a running DB/MinIO.

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
```
