# AutoVideo Batch Studio - Phần Mềm Sản Xuất Kịch Bản & Video AI Hàng Loạt

Ứng dụng Full-Stack chuyên nghiệp hỗ trợ sản xuất video ngắn (TikTok, Reels, YouTube Shorts) hàng loạt từ ý tưởng kịch bản, tự động phân tích phân cảnh, tạo ảnh nhân vật đồng bộ phong cách, lồng tiếng AI tiếng Việt và render ghép video tự động.

---

## 🚀 Tính Năng Chính
1. **Phân tích kịch bản thông minh (Gemini Flash)**: Tách kịch bản thành 5 đến 100 phân cảnh với prompt tiếng Anh chuẩn, mô tả tiếng Việt, chuyển động máy quay và câu thoại.
2. **Đồng bộ nhân vật (Character Consistency)**: Hỗ trợ ảnh mẫu chân dung và token nhận diện khuôn mặt đồng nhất trên mọi khung hình.
3. **Bố cục phân cảnh hàng ngang đồng bộ (Unified Scene Row)**: Dễ dàng đối soát prompt ảnh, ảnh đã tạo, prompt video và video hoàn thiện trên một hàng.
4. **Bộ lọc thông minh (Scene Filtering)**: Lọc nhanh theo phân cảnh Đã tạo xong, Đang chờ xử lý, hoặc Có lỗi, kèm ô tìm kiếm nhanh.
5. **Thanh trượt điều hướng 100 cảnh**: Hỗ trợ sản xuất quy mô lớn với thanh cuộn gọn gàng và nút nhảy nhanh đến cảnh bất kỳ.
6. **Lồng tiếng AI tiếng Việt (TTS)**: Hỗ trợ giọng Bắc, Trung, Nam với ghi chú sắc thái (nhẹ, nhanh, trầm ấm...).
7. **Tự động lưu LocalStorage & Xuất/Nhập JSON**: Chống mất dữ liệu khi tải lại trang, dễ dàng lưu trữ và chia sẻ kịch bản dự án.
8. **Render video trình duyệt**: Tự động tạo video chuyển động điện ảnh (Ken Burns zoom/pan) với phụ đề thoại và âm thanh lồng tiếng.

---

## 🛠️ Yêu Cầu Hệ Thống
- **Node.js**: Phiên bản `>= 20.x`
- **npm** hoặc **pnpm / bun**
- **Gemini API Key**: Đăng ký tại [Google AI Studio](https://aistudio.google.com/)

---

## 📦 Hướng Dẫn Cài Đặt & Chạy Cục Bộ (Local)

### 1. Chuẩn bị file môi trường
Tạo file `.env` từ file `.env.example`:
```bash
cp .env.example .env
```
Mở file `.env` và điền API key của bạn:
```env
GEMINI_API_KEY=AIzaSy... (API Key của bạn từ Google AI Studio)
PORT=3000
NODE_ENV=development
```

### 2. Cài đặt thư viện
```bash
npm install
```

### 3. Khởi chạy môi trường phát triển (Dev)
```bash
npm run dev
```
Truy cập trình duyệt tại: `http://localhost:3000`

### 4. Build & Chạy môi trường sản xuất (Production)
```bash
npm run build
npm start
```

---

## 🐳 Triển Khai Bằng Docker (Khuyến Nghị Cho Server/VPS)

Đã có sẵn `Dockerfile` và `docker-compose.yml` tối ưu hóa:

```bash
# 1. Tạo file .env chứa GEMINI_API_KEY
echo "GEMINI_API_KEY=AIzaSy..." > .env

# 2. Khởi chạy với docker-compose
docker compose up -d --build
```
Ứng dụng sẽ tự động chạy ngầm tại cổng `3000`.

---

## 🌐 Hướng Dẫn Đưa Lên Môi Trường Internet (Thương Mại Hóa)

### Lựa chọn 1: Triển khai trên Railway / Render (Đơn giản nhất, có tên miền miễn phí)
1. Đưa mã nguồn lên tài khoản **GitHub** của bạn (Private hoặc Public repository).
2. Đăng nhập vào [Railway.app](https://railway.app) hoặc [Render.com](https://render.com).
3. Chọn **New Project** -> Chọn **GitHub Repository** chứa dự án này.
4. Cấu hình phần **Variables / Environment**:
   - `GEMINI_API_KEY`: Điền key của bạn.
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
5. Nhấn **Deploy**. Nền tảng sẽ tự động build và cấp cho bạn tên miền HTTPS (ví dụ: `https://ten-du-an.up.railway.app`).

---

### Lựa chọn 2: Triển khai trên VPS riêng (Ubuntu / Debian + Nginx + PM2)
Phù hợp nhất khi bạn muốn gắn tên miền riêng và tối ưu chi phí server:

1. **Cài đặt Node.js 20 và PM2 trên VPS**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs nginx git
   sudo npm install -g pm2 tsx
   ```

2. **Tải mã nguồn về VPS**:
   ```bash
   cd /var/www
   git clone <URL_REPO_CUA_BAN> autovideo
   cd autovideo
   npm install
   npm run build
   ```

3. **Cấu hình file .env**:
   ```bash
   nano .env
   # Điền GEMINI_API_KEY=... và PORT=3000
   ```

4. **Khởi chạy ứng dụng với PM2**:
   ```bash
   pm2 start "npm start" --name "autovideo-studio"
   pm2 save
   pm2 startup
   ```

5. **Cấu hình Nginx Proxy ngược (Reverse Proxy)**:
   ```nginx
   server {
       server_name yourdomain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```
   Cài đặt chứng chỉ SSL Let's Encrypt miễn phí:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

---

## 💼 Các Lưu Ý Khi Thương Mại Hóa

1. **Hạn mức Google Gemini API (Billing Account)**:
   - Trong quá trình phát triển, tài khoản Google dùng gói Free Tier sẽ bị giới hạn tần suất (ví dụ: 3 lượt TTS/phút hoặc giới hạn lượt gọi hình ảnh flash-image).
   - Để thương mại hóa phục vụ nhiều khách hàng cùng lúc, hãy kích hoạt **Pay-as-you-go** trên Google Cloud Console liên kết với Google AI Studio. Chi phí tính theo lượt sử dụng thực tế rất rẻ và hạn mức sẽ được nâng lên hàng nghìn request/phút.

2. **Quản lý người dùng & Đăng nhập (Auth)**:
   - Khi kinh doanh thương mại theo hình thức SaaS thu phí người dùng, bạn có thể tích hợp thêm Firebase Auth hoặc Clerk / Supabase để quản lý tài khoản thành viên và gói đăng ký (gói Free, Pro, VIP).

3. **Bản quyền & Tên miền**:
   - Mua tên miền đẹp (.vn, .com, .ai) và trỏ DNS về IP của máy chủ.
