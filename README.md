# ansa shop web

Merchant dashboard + public storefront for the ansa shop prototype.

- API: `http://localhost:5000` (`VITE_API_URL`)
- App: `http://localhost:3000`

From workspace root:

```bash
pnpm docker:up
pnpm api:migrate
pnpm api:seed    # demo merchants (optional, repeatable)
pnpm api:dev
pnpm shop:dev
```

**Demo sign-in** (after seed): `zola@demo.ansa` / `password123` → storefront `/shop/zola-atelier`

**Customer flow:** `/shop/:slug` → product → cart → checkout → mock payment → `/order/:reference`
