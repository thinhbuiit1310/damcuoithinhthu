import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

// TODO: Thay th\u1ebf b\u1eb1ng Firebase config c\u1ee7a b\u1ea1n
// L\u1ea5y t\u1eeb Firebase Console > Project Settings > General > Your apps > SDK setup and configuration
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const hasPlaceholder = Object.values(firebaseConfig).some(
    (v) => typeof v === 'string' && v.includes('YOUR_')
);

if (hasPlaceholder) {
    throw new Error('Firebase config ch\u01b0a \u0111\u01b0\u1ee3c c\u1eadp nh\u1eadt. Vui l\u00f2ng s\u1eeda js/firebase-config.js tr\u01b0\u1edbc khi deploy.');
}

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
