# Hướng dẫn chạy dự án trên Localhost

Để chạy dự án này trên máy tính cá nhân (localhost), bạn cần thực hiện các bước sau:

### 1. Cài đặt môi trường
- Cài đặt **Node.js** (phiên bản 18 trở lên).
- Cài đặt **PostgreSQL** để làm cơ sở dữ liệu.

### 2. Tải mã nguồn
- Tải toàn bộ thư mục dự án về máy tính của bạn.

### 3. Cấu hình biến môi trường
Tạo một file `.env` tại thư mục gốc của dự án và thêm các thông tin sau:
```env
DATABASE_URL=postgres://username:password@localhost:5432/database_name
SESSION_SECRET=your_random_secret_key
```
*(Thay thế `username`, `password`, `localhost`, `5432`, và `database_name` bằng thông tin cấu hình PostgreSQL của bạn)*

### 4. Cài đặt thư viện
Mở terminal tại thư mục dự án và chạy lệnh:
```bash
npm install
```

### 5. Khởi tạo cơ sở dữ liệu
Chạy lệnh sau để tạo các bảng cần thiết trong database:
```bash
npm run db:push
```

### 6. Chạy ứng dụng
Để bắt đầu chạy ứng dụng ở chế độ phát triển (development):
```bash
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:5000`

### Lưu ý
- **Admin mặc định**: `admin` / `admin123`
- Đảm bảo dịch vụ PostgreSQL đang chạy trước khi thực hiện lệnh `db:push` hoặc `dev`.
