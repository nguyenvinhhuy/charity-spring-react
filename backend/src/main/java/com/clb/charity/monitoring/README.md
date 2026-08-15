# Monitoring — Giám sát hệ thống

Trang giám sát nội bộ (chỉ `ADMIN`) theo dõi tình trạng 3 dịch vụ free-tier mà dự án
đang chạy trên đó: **Render** (host backend), **Supabase/Postgres** (database),
**Cloudinary** (lưu ảnh). Mục tiêu: phát hiện sớm khi sắp hết hạn mức free tier hoặc
dịch vụ lỗi, trước khi ảnh hưởng người dùng thật.

---

## 1. Luồng tổng thể

```
Frontend (/dashboard/monitoring)
   │  GET /api/v1/monitoring/overview?range=ONE_DAY   (load trang / đổi khung thời gian / bấm nút Làm mới)
   ▼
MonitoringController  ───▶  MonitoringService.getOverview(range)
                                          │
                  ┌───────────────────────┼──────────────────────┐
                  ▼                       ▼                      ▼
            fetchRenderStatus     fetchDatabaseStatus    fetchCloudinaryStatus
             (Render REST API)    (query trực tiếp        (Cloudinary SDK
                                  qua JDBC hiện có)        usage() API)
                  │                       │                      │
                  └───────────────────────┴──────────┬───────────┘
                                                       ▼
                                        MonitoringOverviewResponse
                                                    │
                                                    ▼
                                3 card + biểu đồ (recharts) trên dashboard

⚠️ [LƯU Ý KỸ THUẬT 01] RỦI RO NGHẼN LUỒNG API DO CHẬM KẾT NỐI (BLOCKING I/O)

- Rủi ro: Nếu gọi tuần tự lần lượt từng dịch vụ, chỉ cần 1 bên (ví dụ Render hoặc Cloudinary) bị chậm hoặc timeout 5-10 giây, API /overview sẽ bị treo cứng, dẫn đến sập UI Monitor của Admin.
- Giải pháp bắt buộc: Tầng Service phải kích hoạt gọi bất đồng bộ song song (dùng CompletableFuture trong Java hoặc Promise.all trong NodeJS). Đồng thời phải cài đặt Timeout tối đa cho mỗi luồng gọi (Khuyến nghị: Tối đa 4 giây). Quá thời gian này, hệ thống tự động ngắt kết nối riêng nguồn đó, trả về trạng thái ERROR để cứu các nguồn còn lại.

Song song, độc lập với request trên:

@Scheduled(fixedRate = 15 phút)
checkThresholdsAndAlert()
   │  fetch lại Render/DB/Cloudinary (Render dùng lookback/resolution mịn hơn:
   │  15 phút / 30 giây, để không bỏ sót spike ngắn giữa 2 lần chạy)
   ▼
evaluate(resource, isAlerting, message)   — so với trạng thái lần trước (in-memory)
   │
   ├─ mới vượt ngưỡng (false→true)  → gửi email "Cảnh báo: {resource}"
   ├─ mới hồi phục   (true→false)   → gửi email "Đã phục hồi: {resource}"
   └─ giữ nguyên trạng thái          → không gửi gì (chống spam)
                                          │
                                          ▼
                              AlertServiceImpl → Resend REST API
```

---

## 2. Chi tiết từng nguồn

### 2.1 Render (backend host)

- Không cấu hình (`RENDER_API_KEY`/`RENDER_SERVICE_ID` trống) → `NOT_CONFIGURED`, không gọi API.
- Gọi `GET /v1/services/{id}` lấy `suspended` (chuỗi `"suspended"`/`"not_suspended"`) và `serviceDetails.url`.
- Gọi `GET /v1/services/{id}/deploys?limit=1` lấy trạng thái + thời gian lần deploy gần nhất.
- Trạng thái: deploy lỗi (status chứa "fail") → `ERROR`; else suspended → `SUSPENDED`; else `LIVE`.
- CPU/RAM: gọi `GET /v1/metrics/{cpu|memory}?...&aggregationMethod=AVG`.
  - `aggregationMethod=AVG` bắt buộc phải có — Render free-plan tự spin-down/spin-up cấp
    instance id mới mỗi lần restart; không gộp thì mỗi instance trả về 1 series riêng.
  - Timestamp phải là RFC3339 (`Instant#toString()`), Render từ chối epoch giây.
  - RAM % = bytes / **512MB** (giới hạn RAM Render free-plan) × 100.
  - CPU % = số core / **0.1 core** (giới hạn CPU Render free-plan) × 100.
  - Trục Y biểu đồ luôn cố định `[0, 100]` — không auto-scale, tránh phóng đại mức dùng thấp.

### 2.2 Database (Supabase/Postgres)

- Không có trạng thái "chưa cấu hình" — luôn query trực tiếp qua kết nối JDBC hiện có
  của app (không cần token Supabase Management API riêng). Lỗi thì trả `errorMessage`.
- 3 native query: `pg_database_size(current_database())` (dung lượng),
  `pg_stat_activity` đếm connection đang mở, và top 7 bảng lớn nhất theo
  `pg_total_relation_size`.
- Giới hạn mặc định: **500MB** (`DB_STORAGE_LIMIT_BYTES`, khớp Supabase free tier).

### 2.3 Cloudinary (lưu ảnh)

- Không cấu hình (`cloudName`/`apiKey` trống) → `configured=false`, số liệu = 0.
- Gọi Cloudinary SDK `cloudinary.api().usage()` lấy `storage.usage` và `bandwidth.usage`.
- **Giới hạn đã biết**: API `usage()` không tách được dung lượng theo loại resource
  (ảnh/video/raw) một cách đáng tin cậy, nên biểu đồ chỉ hiện **1 khối tổng** ("Tổng
  dung lượng"), không phải breakdown thật theo loại — khác với mô tả trong Javadoc DTO.
- Giới hạn mặc định: **25GB** (`CLOUDINARY_STORAGE_LIMIT_BYTES`, khớp free tier).

---

## 3. Khung thời gian & độ phân giải biểu đồ

Độ phân giải (bucket size) tăng dần theo khung thời gian:

| Khung  | Lookback | Bucket (resolution) | Số điểm ước tính |
| ------ | -------- | ------------------- | ---------------- |
| 12 giờ | 12h      | 30s                 | ~1440            |
| 1 ngày | 24h      | 1 phút              | ~1440            |
| 3 ngày | 72h      | 2 phút              | ~2160            |
| 7 ngày | 168h     | 5 phút              | ~2016            |

Đây là lựa chọn thiết kế có chủ đích (`MetricRange.java`), **không phải** app lấy dữ
liệu từng phút rồi tự vẽ thưa — Render tự gộp trung bình (AVG) theo `resolutionSeconds`
truyền vào trước khi trả kết quả.

Riêng job cảnh báo (`checkThresholdsAndAlert`) luôn dùng độ phân giải mịn hơn cố định
(15 phút lookback / 30 giây bucket), **độc lập** với khung thời gian người dùng đang
xem trên UI — để không bỏ sót spike ngắn giữa 2 lần chạy job (15 phút/lần).

---

## 4. Luồng cảnh báo email

- `@Scheduled(fixedRate = 900_000)` — chạy mỗi **15 phút**.
- Ngưỡng cảnh báo: `app.alert.threshold-fraction` = **0.8 (80%)**, hard-code trong
  `application.yml`, không có biến môi trường riêng để override.
- Với mỗi nguồn (RENDER/DATABASE/CLOUDINARY), tính `isAlerting` rồi so với
  trạng thái lần chạy job trước đó (lưu trong `ConcurrentHashMap` in-memory —
  **chỉ đúng khi backend chạy 1 instance duy nhất**, restart sẽ mất trạng thái debounce).
- Chỉ gửi email khi **đổi trạng thái**:
  - Chưa cảnh báo → cảnh báo: `"[CLB Charity] Cảnh báo: {RESOURCE}"`
  - Đang cảnh báo → hết cảnh báo: `"[CLB Charity] Đã phục hồi: {RESOURCE}"`
  - Giữ nguyên trạng thái (2 lần liên tiếp đều alerting hoặc đều không): im lặng.
- Nội dung cảnh báo Render nêu rõ chỉ số nào vượt ngưỡng (CPU/RAM) kèm giá trị đỉnh
  và thời điểm (giờ Việt Nam), hoặc báo deploy lỗi nếu lần deploy gần nhất fail.
- Gửi qua **Resend REST API** (`AlertServiceImpl`), dùng chung `RestClient` (không thêm
  Spring Mail). Nếu `RESEND_API_KEY` trống → im lặng bỏ qua, không throw lỗi, không
  làm job cảnh báo bị hỏng. Lỗi gọi Resend cũng chỉ log warning, không propagate.

---

## 5. API

```
GET /api/v1/monitoring/overview?range={TWELVE_HOURS|ONE_DAY|THREE_DAYS|SEVEN_DAYS}
```

- Yêu cầu role `ADMIN` (`SecurityConfig`: `.requestMatchers(API + "/monitoring/**").hasRole("ADMIN")`).
- `range` mặc định `ONE_DAY` nếu không truyền.
- Trả về `MonitoringOverviewResponse` gồm cả 3 nguồn + `fetchedAt`.

---

## 6. Cấu hình (biến môi trường)

| Biến                                    | Mặc định                   | Ý nghĩa                                      |
| --------------------------------------- | -------------------------- | -------------------------------------------- |
| `RENDER_API_KEY`, `RENDER_SERVICE_ID`   | (trống)                    | trống → Render hiện `NOT_CONFIGURED`         |
| `RESEND_API_KEY`                        | (trống)                    | trống → tắt hẳn gửi email cảnh báo           |
| `ALERT_EMAIL_TO`                        | `nguyenvana0258@gmail.com` | người nhận cảnh báo                          |
| `ALERT_EMAIL_FROM`                      | `onboarding@resend.dev`    | địa chỉ gửi (Resend sandbox mặc định)        |
| `DB_STORAGE_LIMIT_BYTES`                | 500MB                      | ngưỡng dung lượng DB tính % cảnh báo         |
| `CLOUDINARY_STORAGE_LIMIT_BYTES`        | 25GB                       | ngưỡng dung lượng Cloudinary tính % cảnh báo |

`CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET` dùng chung với tính năng upload ảnh, không
phải config riêng cho monitoring.

---

## 7. Frontend

- Vị trí: `frontend/src/features/monitoring/` (page + api + types + 3 card component).
- Route: `/dashboard/monitoring`, chỉ `ADMIN` (`router/routes.tsx`).
- Không tự động polling — chỉ fetch khi load trang, đổi khung thời gian, hoặc bấm nút
  "Làm mới" (`refetch()` từ TanStack Query). Khi đổi khung thời gian, dữ liệu cũ vẫn
  hiện mờ (`opacity-60`) trong lúc tải khung mới thay vì nhảy về loading trắng.
- Ngưỡng 80% hiển thị màu cảnh báo trên UI là **hard-code riêng ở frontend**
  (`monitoring-page.tsx`, `THRESHOLD_PERCENT = 80`), phải tự đồng bộ tay với
  `app.alert.threshold-fraction` bên backend nếu đổi.
- Badge trạng thái: `OK` (xanh) / `DEGRADED` (vàng — cảnh báo) / `ERROR` (đỏ) /
  `NOT_CONFIGURED` (xám).

---

## 8. File liên quan

**Backend** (`com.clb.charity.monitoring`):

- `domain/` — `MetricRange`, `MonitoringResource`, `RenderState`
- `dto/response/` — `MonitoringOverviewResponse` + 3 DTO con + `CategoryAmount`/`MetricPoint`
- `service/MonitoringService.java`, `service/impl/MonitoringServiceImpl.java`
- `service/AlertService.java` + impl (gửi email qua Resend)
- `controller/MonitoringController.java`
- `common/config/AppProperties.java` — nested record `Render`/`Alert`/`Cloudinary`

**Frontend** (`frontend/src/features/monitoring/`):

- `api.ts`, `types.ts`, `lib.ts`
- `pages/monitoring-page.tsx`
- `components/{render,database,cloudinary}-status-card.tsx`, `service-status-card.tsx`

**i18n**: namespace `monitoring` trong `frontend/src/i18n/locales/{vi,en}.json`.
