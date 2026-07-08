# Production Deployment

This document records how Web Shop MVP v1.0 is deployed to production. Do not put real passwords, tokens, JWT secrets, or MongoDB connection strings in this file.

## Architecture

```text
MongoDB Atlas
    |
    v
Render backend Express API
    |
    v
Vercel frontend Vite React
```

Current production URLs:

- Frontend: https://web-shop-peach-nine.vercel.app
- Backend: https://web-shop-sex4.onrender.com
- Health check: https://web-shop-sex4.onrender.com/api/health
- Demo shop: https://web-shop-peach-nine.vercel.app/shop/chu-tam-tan-xe-demo
- Admin login: https://web-shop-peach-nine.vercel.app/admin/login

## MongoDB Atlas

- Production database name: `web_shop_prod`
- Connection string format:

```text
mongodb+srv://<USER>:<PASSWORD>@webshop.r1m8dqk.mongodb.net/web_shop_prod?retryWrites=true&w=majority&appName=WebShop
```

Never commit the real connection string. Store it only in Render environment variables.

Network Access:

- For MVP on free Render, `0.0.0.0/0` is used so Render can connect to Atlas.
- Later, if a fixed outbound IP or suitable hosting plan is available, restrict this allowlist.

If a test database was created by an accidental seed during setup, remove it only after confirming `web_shop_prod` has the required production data.

## Render Backend

- Service type: Web Service
- Root Directory: `backend`
- Branch: `master`
- Build Command: `npm install`
- Start Command: `npm start`
- Backend URL: https://web-shop-sex4.onrender.com
- Health check: https://web-shop-sex4.onrender.com/api/health

Environment variables:

```text
NODE_ENV=production
MONGODB_URI=<atlas uri>
JWT_ACCESS_SECRET=<long random secret>
JWT_REFRESH_SECRET=<long random secret>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
FRONTEND_URL=https://web-shop-peach-nine.vercel.app
DEFAULT_ORDER_PREFIX=NLAI
DEFAULT_SHEET_WEBHOOK_URL=
SEED_ADMIN_NAME=<admin name>
SEED_ADMIN_EMAIL=<admin email>
SEED_ADMIN_PASSWORD=<admin password>
```

Do not set `PORT` manually on Render unless the platform configuration requires it.

## Vercel Frontend

- Root Directory: `frontend/web_shop`
- Framework: Vite
- Branch: `master`
- Build Command: `npm run build`
- Output Directory: `dist`
- Frontend URL: https://web-shop-peach-nine.vercel.app

Environment variables:

```text
VITE_API_BASE_URL=https://web-shop-sex4.onrender.com/api
```

SPA routing is handled by `frontend/web_shop/vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/"
    }
  ]
}
```

## Post-Deploy Checklist

- [ ] Open public demo shop.
- [ ] Add product to cart.
- [ ] Checkout successfully.
- [ ] Success page shows an `NLAI` order code.
- [ ] Admin login works.
- [ ] Admin orders show the new order.
- [ ] Shop column shows the correct shop.
- [ ] Order detail opens.
- [ ] Update commission to 10%.
- [ ] Reports by shop reflect revenue and commission.

## Troubleshooting

### MongoDB Connection Failed

Check:

- Atlas Network Access allows Render traffic. MVP currently uses `0.0.0.0/0`.
- `MONGODB_URI` points to `web_shop_prod`.
- Database username and password are correct.
- The Atlas database user has the required privileges.

### Vercel 404 On `/shop/:slug`

Check `frontend/web_shop/vercel.json` and confirm the SPA rewrite sends all paths to `/`.

### CORS Error

Check Render `FRONTEND_URL`. It must exactly match the production Vercel URL:

```text
https://web-shop-peach-nine.vercel.app
```

For local development, use `http://localhost:5173` in `backend/.env`.

### Frontend Cannot Call API

Check Vercel `VITE_API_BASE_URL` and make sure it includes `/api`:

```text
https://web-shop-sex4.onrender.com/api
```

### Render Slow First Request

Render free instances can spin down when idle. The first request after sleep may be slow while the service wakes up.
