# Hướng dẫn test các tính năng Auth - từng bước

## Chuẩn bị

1. **Đảm bảo PostgreSQL đang chạy**  
   Kiểm tra `DATABASE_URL` trong file `.env`.

2. **Chạy server:**
   ```bash
   npm run dev
   ```

3. **Mở trình duyệt:** `http://localhost:5000`

---

## Bước 1: Đăng nhập Admin

1. Truy cập: `http://localhost:5000/admin/login`
2. Nhập:
   - **Username:** `admin`
   - **Password:** `admin123`
3. Nhấn **Sign In**
4. **Kỳ vọng:** Chuyển đến Dashboard (`/admin`).

---

## Bước 2: Đăng ký tài khoản mới

1. Từ trang Login, nhấn **"Create account"** (hoặc truy cập `/auth/register`)
2. Nhập:
   - **Username:** `testuser` (tối thiểu 3 ký tự)
   - **Email:** `test@example.com`
   - **Password:** `Test123!@#` (phải có: chữ hoa, số, ký tự đặc biệt)
3. Nhấn **Create Account**
4. **Kỳ vọng:** Thông báo đăng ký thành công, chuyển về trang Login.
5. **Lưu ý:** Tài khoản mới cần xác thực email. Nếu chưa cấu hình SMTP, link xác thực sẽ được log trong console.

---

## Bước 3: Quên mật khẩu

1. Truy cập: `http://localhost:5000/auth/forgot-password`
2. Nhập email: `admin@hsc.com.vn`
3. Nhấn **Send Reset Link**
4. **Kỳ vọng:** Thông báo "If the email exists, a reset link has been sent".
5. **Nếu chưa cấu hình email:** Kiểm tra console của server để lấy link reset (dạng `http://localhost:5000/auth/reset-password?token=...`).

---

## Bước 4: Đặt lại mật khẩu (Reset Password)

1. Dùng link reset nhận được (qua email hoặc trong log):
   - Ví dụ: `http://localhost:5000/auth/reset-password?token=abc123...`
2. Nhập **New Password** và **Confirm Password**  
   Ví dụ: `NewPass123!@#`
3. Nhấn **Reset Password**
4. **Kỳ vọng:** Thông báo thành công, chuyển về Login.
5. **Gợi ý:** Sau khi reset, dùng mật khẩu mới để đăng nhập.

---

## Bước 5: Xem Profile và đổi mật khẩu

1. Đăng nhập (admin / admin123 hoặc mật khẩu mới sau khi reset)
2. Trong sidebar, nhấn **Settings**
3. **Profile:** Xem thông tin username, email.
4. **Change Password:**
   - **Current Password:** mật khẩu hiện tại
   - **New Password:** mật khẩu mới (ví dụ: `Admin123!@#`)
5. Nhấn **Update Password**
6. **Kỳ vọng:** Thông báo "Password changed".

---

## Bước 6: Bật 2FA (Two-Factor Authentication)

1. Vào **Settings** (đã đăng nhập)
2. Trong mục **Two-Factor Authentication**, nhấn **Enable 2FA**
3. **Kỳ vọng:** Xuất hiện QR code
4. Quét QR bằng app Google Authenticator hoặc Authy
5. Nhập mã 6 số từ app
6. Nhấn **Verify & Enable**
7. **Kỳ vọng:** Thông báo "2FA enabled", lưu backup codes hiển thị

---

## Bước 7: Đăng nhập với 2FA

1. Đăng xuất (Sign Out trong sidebar)
2. Vào trang Login
3. Nhập: `admin` / mật khẩu hiện tại
4. Nhấn **Sign In**
5. **Kỳ vọng:** Chuyển sang trang `/admin/2fa` (nhập mã 2FA)
6. Nhập mã 6 số từ Google Authenticator
7. Nhấn **Verify**
8. **Kỳ vọng:** Đăng nhập thành công, vào Dashboard.

---

## Bước 8: Tắt 2FA

1. Vào **Settings**
2. Trong mục **Two-Factor Authentication**, nhập **password** vào ô "Enter password to disable"
3. Nhấn **Disable 2FA**
4. **Kỳ vọng:** Thông báo "2FA disabled".

---

## Bước 9: Google OAuth (nếu đã cấu hình)

1. Trên trang Login, nhấn **Sign in with Google**
2. Đăng nhập bằng tài khoản Google
3. **Kỳ vọng:** Quay lại trang Login với `?google=success`, sau đó tự động vào Dashboard.
4. **Lưu ý:** Cần cấu hình `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_CALLBACK_URL` trong `.env`.

---

## Bước 10: Xác thực email (Verify Email)

1. Đăng ký tài khoản mới (Bước 2)
2. Nếu có SMTP: mở email và nhấn link xác thực.
3. Nếu chưa có SMTP: lấy link trong log server (dạng `http://localhost:5000/auth/verify-email?token=...`)
4. Truy cập link đó
5. **Kỳ vọng:** Thông báo "Email verified", rồi chuyển về Login.

---

## Thứ tự các trang

| Trang | Đường dẫn |
|-------|-----------|
| Login | `/admin/login` |
| Register | `/auth/register` |
| Forgot Password | `/auth/forgot-password` |
| Reset Password | `/auth/reset-password?token=...` |
| Verify Email | `/auth/verify-email?token=...` |
| 2FA Verify | `/admin/2fa` |
| Dashboard | `/admin` |
| Employees | `/admin/employees` |
| Settings | `/admin/settings` |

---

## Xử lý lỗi thường gặp

- **401 Unauthorized:** Token hết hạn → Đăng nhập lại.
- **Port 5000 đã được sử dụng:** Tắt ứng dụng đang dùng port 5000 hoặc đổi `PORT` trong `.env`.
- **Database connection error:** Kiểm tra PostgreSQL và `DATABASE_URL` trong `.env`.
- **Invalid credentials:** Sai username/password hoặc tài khoản chưa được verify email.
