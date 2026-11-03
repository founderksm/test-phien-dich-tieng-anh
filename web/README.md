# KSMLOOK Phiên dịch – Web app

Ứng dụng tra cứu câu mẫu và thuật ngữ phiên dịch thương mại Việt – Anh – Trung. Dữ liệu gốc nằm ở `../translations/tong-hop-phien-dich-2026.md`, được nạp vào Postgres.

## Công nghệ

Next.js 16 (App Router, TypeScript), Tailwind 4, Drizzle ORM, Postgres (Neon), Auth.js v5 (Google, giới hạn tên miền), PWA.

## Chạy local

```bash
cd web
npm install
cp .env.example .env.local   # điền AUTH_SECRET; đặt DEV_AUTH_BYPASS=1 để đăng nhập giả lập
npm run dev
```

Khi không có `DATABASE_URL`, app dùng PGlite (Postgres nhúng) trong thư mục `.pglite/`, tự tạo bảng và nạp dữ liệu từ file markdown. Chế độ này **bị chặn ở production**.

## Kiểm tra

```bash
npm run typecheck && npm run lint && npm test
npm run e2e        # trình duyệt thật (Playwright cài sẵn trong môi trường), tự dựng server và dữ liệu tạm
```

## Triển khai (Vercel + Neon)

1. Tạo database Neon (qua Vercel Marketplace) và lấy `DATABASE_URL`.
2. Tạo Google OAuth Client (Web). Redirect URI: `https://<domain>/api/auth/callback/google`.
3. Đặt biến môi trường trên Vercel: `DATABASE_URL`, `AUTH_SECRET` (`npx auth secret`), `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `ALLOWED_EMAIL_DOMAIN`, `ADMIN_EMAILS`. **Không** đặt `DEV_AUTH_BYPASS`.
4. Đặt Root Directory của project Vercel là `web`.
5. Chạy một lần từ máy có `DATABASE_URL`:
   ```bash
   npm run db:migrate
   npm run db:seed     # chỉ nạp khi bảng còn trống, không ghi đè dữ liệu đã chỉnh sửa
   ```

## Phân quyền

- Mọi tài khoản thuộc `ALLOWED_EMAIL_DOMAIN` đăng nhập được và đề xuất câu (chờ duyệt).
- Email trong `ADMIN_EMAILS` là admin: duyệt/từ chối, sửa câu, đăng câu mới ngay.
- Mọi thao tác ghi đều được kiểm tra quyền phía server và lưu lịch sử vào `phrase_revisions`.
