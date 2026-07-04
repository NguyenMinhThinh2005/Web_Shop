# MVP QA Checklist

## Public

- [ ] Shop loads at `/shop/chu-tam-tan-xe-demo`.
- [ ] Product detail direct link opens correctly.
- [ ] Add product to cart.
- [ ] Cart quantity update and remove item work.
- [ ] Checkout validation shows clear errors.
- [ ] Successful order shows an order code.
- [ ] Contact modal opens from public CTAs.
- [ ] Contact modal can open Messenger or Zalo when configured.
- [ ] Contact modal can copy the hotline.

## Admin

- [ ] Admin login works.
- [ ] Orders list loads.
- [ ] Order detail drawer opens.
- [ ] Shop is visible in order list and detail.
- [ ] Activity logs appear after order updates.
- [ ] Commission auto calculate works.
- [ ] Reports can filter by shop.
- [ ] Shop CRUD works.
- [ ] Category CRUD works.
- [ ] Product CRUD works.

## Backend

- [ ] `npm test` passes in `backend`.
- [ ] `npm run seed:admin` creates or updates the admin user.
- [ ] `npm run seed:demo` creates or updates demo shop data.
- [ ] Running `npm run seed:demo` twice does not create duplicates.

## Known Not Included

- [ ] Payment
- [ ] Customer login
- [ ] Bulk import
- [ ] Shipping API
- [ ] Warehouse management
