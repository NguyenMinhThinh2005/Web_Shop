# Product Import JSON Schema

Step 17 imports normalized JSON only. The system does not read XLSX files,
does not upload images, and does not store the JSON file on the server.

## Shape

```json
{
  "schemaVersion": "1.0",
  "source": "manual_agent_normalized",
  "products": [
    {
      "importKey": "NSD-007",
      "sku": "NSD-007",
      "sourceProductId": "1784174405",
      "name": "Ten san pham",
      "slug": "ten-san-pham",
      "categoryName": "Nhong sen dia",
      "price": 480000,
      "salePrice": null,
      "priceMode": "fixed",
      "thumbnailUrl": "https://example.com/main.jpg",
      "images": [
        {
          "url": "https://example.com/main.jpg",
          "role": "thumbnail",
          "alt": "Ten san pham",
          "sortOrder": 0
        },
        "https://example.com/2.jpg"
      ],
      "shortDescription": "Mo ta ngan",
      "description": "Mo ta day du",
      "status": "draft",
      "attributes": {
        "vehicleLine": "Wave, Dream",
        "sourceCategory": "Phu tung xe may"
      }
    }
  ]
}
```

## Rules

- `products` must be an array and is limited to 500 products per request.
- `importKey` is required and is the primary import identity inside a shop.
- `name` is required.
- `sku` is optional. If missing, backend uses `importKey` as `sku`.
- Existing products are matched by `shopId + importKey`; if none exists,
  backend falls back to `shopId + sku`.
- `sourceProductId` and `source` are optional.
- Empty `categoryName` becomes `Sản phẩm cần tư vấn`.
- Missing or zero `price` becomes `price = 0` and `priceMode = contact`.
- Valid `priceMode`: `fixed`, `contact`, `hidden`.
- Valid `status`: `active`, `draft`, `inactive`; default is `draft`.
- `images` may be an array of URL strings or image objects with `url`.
- Duplicate images are removed by URL.
- Empty `thumbnailUrl` uses the first valid image URL.
- Invalid image URLs are ignored with warnings; images are not fetched.
- Import ignores internal or manual fields such as `isPinned`, `pinnedOrder`,
  `pinnedAt`, `internalNote`, `commission`, `activityLogs`, and `sheetSync`.
- Re-importing must not reset manual pin fields.

## Admin API

Dry-run:

```http
POST /api/admin/shops/:shopId/products/import-json/validate
```

Commit:

```http
POST /api/admin/shops/:shopId/products/import-json
```

Both endpoints accept the full JSON document above or any object containing a
`products` array.
