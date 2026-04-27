# Testing the Wedding Invitation Site

## Local Dev Server

```bash
cd /home/ubuntu/repos/damcuoithinhthu
python3 -m http.server 8080
```

Pages:
- `http://localhost:8080/index.html` — Wedding invitation page
- `http://localhost:8080/dashboard.html` — Admin dashboard

## Testing Without Firebase

The `js/firebase-config.js` has a fail-fast guard that throws an error if config contains `YOUR_` placeholders. This breaks the entire ES module chain, preventing the page from loading.

To test UI rendering without a real Firebase project:
1. Replace placeholder values in `js/firebase-config.js` with fake but valid-format values (e.g., `apiKey: "AIzaSyTestingPlaceholder123"` instead of `"YOUR_API_KEY"`)
2. This allows Firebase SDK to initialize (though Firestore operations will fail at runtime)
3. Expected console errors: `FirebaseError: Failed to get document because the client is offline` — these are normal
4. **Remember to revert** firebase-config.js back to placeholder values before committing

## What's Testable Without Firebase

- Page rendering (welcome screen, main content, gallery, countdown)
- Dashboard login modal appearance
- Dashboard layout (4 tabs: Tổng quan, Lời chúc, Khách mời, Cài đặt)
- CSS styling and responsiveness
- JS module loading (no syntax/import errors)

## What Requires Real Firebase

- Comment CRUD (create, read, update, delete)
- Like/unlike functionality
- Dashboard login (Firebase Auth email/password)
- Dashboard statistics
- CSV export
- Settings toggles
- Pagination with real data

## Key Files

- `js/firebase-config.js` — Firebase initialization (placeholder config)
- `js/app.js` → imports `util.js` → imports `firebase-config.js` (module chain)
- `js/dashboard-app.js` — Dashboard logic (auth, stats, comments, guests, settings)
- `firestore.rules` — Firestore security rules
- `FIREBASE_SETUP.md` — Setup guide for Firebase

## Known Issues

- Vietnamese text must be stored as actual UTF-8 characters, NOT as `\uXXXX` escape sequences. If files show garbled text, run the encoding fix script.
- The `Josefin Sans` font from Google Fonts is used — verify Vietnamese diacritics render correctly.
