# Show Manager Server (Firestore)

## Local
1) Create `.env` at project root:
```
FIREBASE_PROJECT_ID=showbiz-873a0
GOOGLE_APPLICATION_CREDENTIALS=./config/firebase-key.json
```

2) Put your Firebase service account JSON at `config/firebase-key.json`

3) Run:
```
npm install
npm run dev
```

Health check:
- http://localhost:3000/health

## Railway (recommended)
Set Variables:
- FIREBASE_PROJECT_ID=showbiz-873a0
- FIREBASE_SERVICE_ACCOUNT_JSON=<your service account json in one line>

Railway will run:
- Build: `npm run build`
- Start: `npm start`
