# H\u01b0\u1edbng d\u1eabn c\u00e0i \u0111\u1eb7t Firebase

## 1. T\u1ea1o Firebase Project

1. Truy c\u1eadp [Firebase Console](https://console.firebase.google.com/)
2. Nh\u1ea5n **"Add project"** (ho\u1eb7c "T\u1ea1o d\u1ef1 \u00e1n")
3. \u0110\u1eb7t t\u00ean d\u1ef1 \u00e1n (v\u00ed d\u1ee5: `damcuoi-thinhthu`)
4. B\u1eadt/t\u1eaft Google Analytics t\u00f9y \u00fd
5. Nh\u1ea5n **"Create project"**

## 2. T\u1ea1o Web App

1. Trong Firebase Console, v\u00e0o **Project Settings** (bi\u1ec3u t\u01b0\u1ee3ng b\u00e1nh r\u0103ng)
2. Cu\u1ed9n xu\u1ed1ng ph\u1ea7n **"Your apps"** > nh\u1ea5n bi\u1ec3u t\u01b0\u1ee3ng **Web** (`</>`)
3. \u0110\u1eb7t nickname (v\u00ed d\u1ee5: `wedding-web`)
4. Nh\u1ea5n **"Register app"**
5. Copy \u0111o\u1ea1n `firebaseConfig` v\u00e0 d\u00e1n v\u00e0o file `js/firebase-config.js`

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

## 3. B\u1eadt Firestore Database

1. V\u00e0o **Build > Firestore Database**
2. Nh\u1ea5n **"Create database"**
3. Ch\u1ecdn v\u1ecb tr\u00ed server g\u1ea7n nh\u1ea5t (v\u00ed d\u1ee5: `asia-southeast1` cho Vi\u1ec7t Nam)
4. Ch\u1ecdn **"Start in test mode"** (\u0111\u1ec3 test tr\u01b0\u1edbc)
5. Sau khi t\u1ea1o xong, v\u00e0o tab **Rules** v\u00e0 d\u00e1n n\u1ed9i dung t\u1eeb file `firestore.rules`

## 4. B\u1eadt Authentication

1. V\u00e0o **Build > Authentication**
2. Nh\u1ea5n **"Get started"**
3. B\u1eadt ph\u01b0\u01a1ng th\u1ee9c **"Email/Password"**
4. V\u00e0o tab **Users** > nh\u1ea5n **"Add user"**
5. Nh\u1eadp email v\u00e0 m\u1eadt kh\u1ea9u cho t\u00e0i kho\u1ea3n admin

## 5. T\u1ea1o config ban \u0111\u1ea7u (t\u00f9y ch\u1ecdn)

V\u00e0o **Firestore Database** > nh\u1ea5n **"Start collection"**:
- Collection ID: `config`
- Document ID: `settings`
- Fields:
  - `can_reply` (boolean): `true`
  - `can_edit` (boolean): `true`  
  - `can_delete` (boolean): `true`

## 6. Deploy

Upload c\u00e1c file HTML/CSS/JS l\u00ean hosting c\u1ee7a b\u1ea1n. Firebase Hosting c\u0169ng l\u00e0 m\u1ed9t l\u1ef1a ch\u1ecdn t\u1ed1t:

```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

## C\u1ea5u tr\u00fac Firestore

### Collection: `comments`

| Field | Type | M\u00f4 t\u1ea3 |
|-------|------|-------|
| name | string | T\u00ean ng\u01b0\u1eddi g\u1eedi |
| comment | string | N\u1ed9i dung l\u1eddi ch\u00fac |
| presence | boolean | C\u00f3 tham d\u1ef1 kh\u00f4ng |
| parentId | string/null | ID comment cha (null n\u1ebfu l\u00e0 comment g\u1ed1c) |
| likes | number | S\u1ed1 l\u01b0\u1ee3t th\u00edch |
| isAdmin | boolean | L\u00e0 admin hay kh\u00f4ng |
| createdAt | timestamp | Th\u1eddi gian t\u1ea1o |
| updatedAt | timestamp | Th\u1eddi gian c\u1eadp nh\u1eadt (khi s\u1eeda) |

### Collection: `config`

| Document | Field | Type | M\u00f4 t\u1ea3 |
|----------|-------|------|-------|
| settings | can_reply | boolean | Cho ph\u00e9p tr\u1ea3 l\u1eddi |
| settings | can_edit | boolean | Cho ph\u00e9p s\u1eeda |
| settings | can_delete | boolean | Cho ph\u00e9p x\u00f3a |
| settings | updatedAt | timestamp | Th\u1eddi gian c\u1eadp nh\u1eadt |
