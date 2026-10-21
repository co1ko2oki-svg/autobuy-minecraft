# AutoBuy Minecraft Discord Bot

Hệ thống Bot Discord bán tài khoản Minecraft tự động 24/7 với tích hợp thanh toán ngân hàng (SePay, PayOS), thẻ cào tự động (Card9s) và render thẻ card thông số người chơi.

## 🌟 Tính Năng Chính
- **Giao diện hiện đại**: Sử dụng chuẩn Discord Components V2 (Container, Section, Media Gallery).
- **Thanh toán đa cổng**:
  - Chuyển khoản ngân hàng tự động duyệt qua **SePay**.
  - Cổng thanh toán trực tuyến qua **PayOS**.
  - Nạp thẻ cào tự động qua **Card9s**.
- **Tự động hóa**:
  - Tự động tạo kênh ticket riêng biệt cho mỗi đơn hàng (`buy-<username>`).
  - Tự động hủy đơn và hoàn trả kho nếu quá thời hạn 10 phút.
  - Tự động cấp Role khách hàng (`Buyer`) và Role cấp bậc chi tiêu (`100k`, `500k`, `VIP`).
  - Tự động phát hiện Vouch tại kênh Legit và đóng ticket.
- **Render Card thông số**: Tạo ảnh thẻ động (GIF/PNG) hiển thị Skin 3D, Rank, Capes, thông số Hypixel và DonutSMP.
- **Bảng xếp hạng**: Tự động cập nhật TOP 10 đại gia chi tiêu nhiều nhất.

## 🚀 Cài Đặt & Chạy Bot

### 1. Cài đặt thư viện
```bash
npm install
```

### 2. Cấu hình
Sao chép file `.env.example` thành `.env` và điền các thông tin:
```bash
cp .env.example .env
```
Hoặc chỉnh sửa trực tiếp file `.env` theo hướng dẫn tiếng Việt bên trong file.

### 3. Khởi động bot
```bash
npm start
```
Hoặc chạy nền bằng PM2:
```bash
npm run pm2
```
