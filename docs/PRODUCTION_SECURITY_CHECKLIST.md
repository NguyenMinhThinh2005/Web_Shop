# Production Security Checklist

Use this checklist after setup, after any suspected exposure, and before meaningful production traffic. Do not write real secrets in this document.

## Secrets

- [ ] MongoDB Atlas password rotated after setup.
- [ ] `JWT_ACCESS_SECRET` rotated after setup.
- [ ] `JWT_REFRESH_SECRET` rotated after setup.
- [ ] `SEED_ADMIN_PASSWORD` or admin password changed after setup.
- [ ] No real secrets in README, docs, or `.env.example`.
- [ ] `.env` files ignored by git.
- [ ] Vercel env does not expose backend secrets.
- [ ] Render env contains backend secrets only.

## MongoDB Atlas

- [ ] Production DB name is `web_shop_prod`.
- [ ] Remove unused test database if confirmed unnecessary.
- [ ] Database user has only required privileges.
- [ ] Network Access reviewed.
- [ ] `0.0.0.0/0` accepted only for MVP/free Render limitation.

## Admin

- [ ] Admin password is strong.
- [ ] Seed admin command does not log password.
- [ ] Admin login tested after password rotation.
- [ ] No admin token logged in frontend or backend.

## Production URLs

- [ ] Render `FRONTEND_URL` points to Vercel production URL.
- [ ] Vercel `VITE_API_BASE_URL` points to Render backend URL with `/api`.
- [ ] `/api/health` works.
- [ ] Public demo shop works.
- [ ] Admin login works.

## Known Limitations

- Render free instance may sleep.
- No payment in MVP.
- No customer login in MVP.
- No bulk import in MVP.
- Shipping is manual tracking only.
- No warehouse management.

## Rotation Runbook

1. Rotate the MongoDB Atlas database user password.
2. Update Render `MONGODB_URI` with the new password.
3. Generate new long random values for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`.
4. Update Render environment variables.
5. Change the admin password.
6. Redeploy Render.
7. Test `/api/health`.
8. Test public shop, checkout, admin login, orders, commission, and reports.
