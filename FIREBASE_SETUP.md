# Hướng dẫn cài đặt Firebase

## 1. Tạo Firebase Project

1. Truy cập [Firebase Console](https://console.firebase.google.com/)
2. Nhấn **"Add project"** (hoặc "Tạo dự án")
3. Đặt tên dự án (ví dụ: `damcuoi-thinhthu`)
4. Bật/tắt Google Analytics tùy ý
5. Nhấn **"Create project"**

## 2. Tạo Web App

1. Trong Firebase Console, vào **Project Settings** (biểu tượng bánh răng)
2. Cuộn xuống phần **"Your apps"** > nhấn biểu tượng **Web** (`</>`)
3. Đặt nickname (ví dụ: `wedding-web`)
4. Nhấn **"Register app"**
5. Copy đoạn `firebaseConfig` và dán vào file `js/firebase-config.js`

```javascript
const firebaseConfig = {
    apiKey: "AI...",
    authDomain: "damcuoi-thinhthu.firebaseapp.com",
    projectId: "damcuoi-thinhthu",
    storageBucket: "damcuoi-thinhthu.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abc123"
};
```

## 3. Bật Firestore Database

1. Vào **Build > Firestore Database**
2. Nhấn **"Create database"**
3. Chọn vị trí server gần nhất (ví dụ: `asia-southeast1` cho Việt Nam)
4. Chọn **"Start in test mode"** (để test trước)
5. Sau khi tạo xong, vào tab **Rules** và dán nội dung từ file `firestore.rules`

## 4. Bật Authentication

1. Vào **Build > Authentication**
2. Nhấn **"Get started"**
3. Bật phương thức **"Email/Password"**
4. Vào tab **Users** > nhấn **"Add user"**
5. Nhập email và mật khẩu cho tài khoản admin

## 5. Tạo config ban đầu (tùy chọn)

Vào **Firestore Database** > nhấn **"Start collection"**:
- Collection ID: `config`
- Document ID: `settings`
- Fields:
  - `can_reply` (boolean): `true`
  - `can_edit` (boolean): `true`  
  - `can_delete` (boolean): `true`

## 6. Deploy

Upload các file HTML/CSS/JS lên hosting của bạn. Firebase Hosting cũng là một lựa chọn tốt:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## Cấu trúc Firestore

### Collection: `comments`

| Field | Type | Mô tả |
|-------|------|-------|
| name | string | Tên người gửi |
| comment | string | Nội dung lời chúc |
| presence | boolean | Có tham dự không |
| parentId | string/null | ID comment cha (null nếu là comment gốc) |
| likes | number | Số lượt thích |
| isAdmin | boolean | Là admin hay không |
| createdAt | timestamp | Thời gian tạo |
| updatedAt | timestamp | Thời gian cập nhật (khi sửa) |

### Collection: `config`

| Document | Field | Type | Mô tả |
|----------|-------|------|-------|
| settings | can_reply | boolean | Cho phép trả lời |
| settings | can_edit | boolean | Cho phép sửa |
| settings | can_delete | boolean | Cho phép xóa |
| settings | updatedAt | timestamp | Thời gian cập nhật |
