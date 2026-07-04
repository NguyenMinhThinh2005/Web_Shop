# Web Shop

Multi-shop quick order system for public storefronts and admin order operations.

## Requirements

- Node.js
- Local MongoDB

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run seed:admin
npm run seed:demo
npm run dev
```

On Windows PowerShell, use this copy command if `cp` is not available:

```powershell
Copy-Item .env.example .env
```

## Frontend Setup

```bash
cd frontend/web_shop
npm install
cp .env.example .env
npm run dev
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

## Default URLs

- Backend: `http://localhost:5000`
- Frontend: `http://localhost:5173`
- Public demo shop: `http://localhost:5173/shop/chu-tam-tan-xe-demo`
- Admin login: `http://localhost:5173/admin/login`

If Vite starts on a different port such as `5174`, either run it on port `5173` or update `FRONTEND_URL` in `backend/.env`.

## Test and Build

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend/web_shop
npm run lint
npm run build
```

## Main Flows

1. Public order flow
2. Admin order management
3. Commission tracking
4. Reports by shop
5. Shop, category, and product management

## Notes

- Google Sheet sync is optional and inactive by default in demo seed data.
- Shipping is manual tracking only.
- Payment, customer login, bulk import, shipping API, and warehouse management are not included in the MVP.
- Do not put real secrets in `.env.example` or documentation. Put local secrets only in `.env`.
