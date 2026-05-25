# Family Health Care Server

Node.js + Express + MongoDB (Mongoose) backend with basic JWT auth.

## Setup

1. Copy `.env.example` to `.env` and set values:

```
MONGODB_URI=mongodb://127.0.0.1:27017/family_healthcare
JWT_SECRET=your-strong-secret
PORT=5000
```

2. Install dependencies:

```
npm install
```

3. Run in development:

```
npm run dev
```

## API

- POST `/api/auth/register` { name, email, password, role? }
- POST `/api/auth/login` { email, password }
- GET `/api/protected` with `Authorization: Bearer <token>`
