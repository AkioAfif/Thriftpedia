# Wishlist, Review, and API Security

## Shared contracts

- JWT middleware sets `req.user = { id, role }`.
- Roles currently use `user` for buyers and `admin` for administrators.
- Product ids and user ids are MongoDB ObjectId strings.
- A review is allowed only when an Order exists with the same buyer and product
  and has status `COMPLETED`.
- Client requests never supply `buyer`; it is always obtained from the JWT.

## Endpoints

### Add a product to the authenticated buyer's wishlist

`POST /api/wishlist`

Authorization: Bearer token, buyer only.

```json
{
  "productId": "507f1f77bcf86cd799439011"
}
```

Responses: `201` created, `400` invalid input, `401` invalid/missing token,
`403` wrong role, `404` product not found, `409` duplicate wishlist item.

### Get the authenticated buyer's wishlist

`GET /api/wishlist`

Authorization: Bearer token, buyer only. The buyer id is read exclusively from
the token, so one buyer cannot request another buyer's wishlist.

### Remove a product from the authenticated buyer's wishlist

`DELETE /api/wishlist/:productId`

Authorization: Bearer token, buyer only.

Responses: `200` removed, `400` invalid id, `404` item not found.

### Get reviews for a product

`GET /api/products/:productId/reviews`

Public endpoint. Returns `200` with an array or `404` when the product does not
exist.

### Create a review

`POST /api/products/:productId/reviews`

Authorization: Bearer token, buyer only.

```json
{
  "rating": 5,
  "comment": "Barang sesuai deskripsi."
}
```

Responses: `201` created, `400` invalid rating/comment, `401` invalid/missing
token, `403` no completed order or wrong role, `404` product not found, `409`
review already exists.

## Required Postman evidence

1. Add wishlist successfully.
2. Reject a duplicate wishlist item.
3. Return only the authenticated buyer's wishlist.
4. Remove a wishlist item.
5. Reject wishlist access without a token.
6. List product reviews publicly.
7. Create a review after a completed order.
8. Reject a review without a completed order.
9. Reject a duplicate review.
10. Reject a rating outside 1-5.
11. Reject a client-supplied `buyer` field.

## Integration dependency

The Product module has not yet been merged into `main`. Until it registers the
Mongoose model named `Product`, Product-dependent requests return a controlled
service-unavailable response. The Express application itself can still start.
