# Hướng dẫn Setup JSONBin.io

Website sử dụng [JSONBin.io](https://jsonbin.io) làm database miễn phí để lưu lời chúc và cài đặt.

## Bước 1: Tạo tài khoản JSONBin.io

1. Truy cập [https://jsonbin.io/login](https://jsonbin.io/login)
2. Đăng ký tài khoản miễn phí (chỉ cần email)
3. Sau khi đăng nhập, vào [API Keys](https://jsonbin.io/app/api-keys) để lấy **X-Master-Key**

## Bước 2: Tạo Bin dữ liệu

1. Vào [https://jsonbin.io/app/bins](https://jsonbin.io/app/bins)
2. Click **"Create a Bin"**
3. Dán nội dung sau vào:

```json
{
  "comments": [],
  "config": {
    "can_reply": true,
    "can_edit": true,
    "can_delete": true
  }
}
```

4. Đặt tên bin: `damcuoithinhthu`
5. Click **Create**
6. Copy **Bin ID** (dạng `6xxxxxxxxxxxxxxxxxxxxxxx`)

## Bước 3: Tạo mật khẩu Admin

Mở Console trình duyệt (F12 → Console) và chạy:

```javascript
async function hashPassword(password) {
    const buffer = new TextEncoder().encode(password);
    const hash = await crypto.subtle.digest('SHA-256', buffer);
    const hex = Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    console.log('Hash:', hex);
    return hex;
}
hashPassword('MẬT_KHẨU_CỦA_BẠN');
```

Thay `MẬT_KHẨU_CỦA_BẠN` bằng mật khẩu bạn muốn dùng. Copy kết quả hash.

## Bước 4: Cập nhật config

Mở file `js/api-config.js` và thay thế:

```javascript
const jsonbinConfig = {
    masterKey: '$2a$10$YOUR_MASTER_KEY_HERE',    // X-Master-Key từ JSONBin.io
    binId: 'YOUR_BIN_ID_HERE',                    // Bin ID từ bước 2
    adminPasswordHash: 'YOUR_HASH_HERE'           // Hash từ bước 3
};
```

## Bước 5: Deploy

Push code lên GitHub và deploy lên hosting tĩnh (GitHub Pages, Netlify, Vercel...).

---

## Cấu trúc dữ liệu

### Bin chính

| Trường | Mô tả |
|--------|-------|
| `comments` | Mảng chứa tất cả lời chúc |
| `config` | Cài đặt website |

### Comment object

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | string | ID duy nhất (tự động tạo) |
| `name` | string | Tên người gửi |
| `comment` | string | Nội dung lời chúc |
| `presence` | boolean | Xác nhận tham dự |
| `parentId` | string\|null | ID comment cha (null nếu là comment gốc) |
| `likes` | number | Số lượt thích |
| `isAdmin` | boolean | Đánh dấu comment từ admin |
| `ownerId` | string | ID trình duyệt người tạo |
| `createdAt` | string | Thời gian tạo (ISO 8601) |
| `updatedAt` | string\|null | Thời gian cập nhật |

### Config object

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `can_reply` | boolean | Cho phép trả lời lời chúc |
| `can_edit` | boolean | Cho phép sửa lời chúc |
| `can_delete` | boolean | Cho phép xóa lời chúc |

---

## Giới hạn Free Tier

- **10,000 requests/tháng** (đủ cho ~100 khách mời)
- **100KB/bin** (đủ cho ~500 lời chúc)
- Xem thêm: [JSONBin.io Pricing](https://jsonbin.io/pricing)

## Lưu ý bảo mật

- Master Key được lưu trong code client-side. Đây là giải pháp phù hợp cho website thiệp cưới với mức độ bảo mật thấp.
- Mật khẩu admin được lưu dạng SHA-256 hash, không thể reverse.
- Nếu cần bảo mật cao hơn, hãy cân nhắc sử dụng Firebase hoặc backend riêng.
