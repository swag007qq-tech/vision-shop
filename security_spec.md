# Security Specification & Payload-First TDD (`security_spec.md`)

## 1. Data Invariants
1. **Catalog Integrity (`/products/{productId}`)**: Only verified admins (`swag007qq@gmail.com` or an UID recorded in `/admins/{uid}`) may create, update, or delete products. All string lengths, numeric ranges (`0..1000000`), `rarity` enum (`"" | "N" | "M" | "R" | "F"`), and `visibility == "public"` are enforced on every write.
2. **Admin Isolation (`/admins/{adminUid}`)**: Only the bootstrapped admin (`swag007qq@gmail.com`, `email_verified == true`) may create or revoke admin records. Shoppers cannot self-assign admin roles or list all admins.
3. **PII Split Isolation (`/users/{userId}` vs `/users/{userId}/private/profile`)**: Email and display name are isolated inside `/users/{userId}/private/profile`, strictly readable and writable only by the verified owner (`request.auth.uid == userId`). Root `/users/{userId}` locks `role` to `'customer'`.
4. **Master Gate & Relational Consistency (`/favorites` & `/cart`)**: Favorites and cart items under `/users/{userId}` require the parent `/users/{userId}` document to exist, require `ownerId == request.auth.uid`, enforce `exists()` against `/products/{productId}` on creation, and enforce `resource.data.ownerId == request.auth.uid` on list queries.
5. **Temporal & Immutable Integrity**: `createdAt`, `createdBy`, `ownerId`, `productId`, and `uid` are immutable after creation; timestamps must strictly equal `request.time`.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Unauthenticated Product Create**: Anonymous request creating `/products/99` -> `PERMISSION_DENIED`.
2. **Non-Admin Verified User Product Create**: Regular verified shopper creating `/products/99` -> `PERMISSION_DENIED`.
3. **Shadow Field Injection on Product Update**: Admin sending extra `isFeatured: true` field -> `PERMISSION_DENIED` (`hasOnly` + `isValidProduct`).
4. **Invalid Rarity Enum Value**: Admin creating product with `rarity: "SSS"` -> `PERMISSION_DENIED`.
5. **Resource Exhaustion / Oversized String**: Admin sending 100-char `name` or >128-char `productId` -> `PERMISSION_DENIED`.
6. **Spoofed Email Without Verification**: Auth token with `email: "swag007qq@gmail.com"` and `email_verified: false` -> `PERMISSION_DENIED`.
7. **Self-Assigned Admin Escalation**: Customer creating `/admins/{theirUid}` or updating `/users/{theirUid}` `role: "admin"` -> `PERMISSION_DENIED`.
8. **Cross-User PII Read**: Authenticated user A reading `/users/userB/private/profile` -> `PERMISSION_DENIED`.
9. **Blanket List Scraping on Favorites/Cart**: User listing `/users/userB/favorites` -> `PERMISSION_DENIED`.
10. **Orphaned Favorite Without Parent User or Product**: Creating `/users/userA/favorites/99999` when product `99999` does not exist -> `PERMISSION_DENIED`.
11. **Backdated Client Timestamp**: Submitting `createdAt: Timestamp(2020-01-01)` instead of `request.time` -> `PERMISSION_DENIED`.
12. **Out-of-Bounds Cart Quantity**: Creating or updating cart item with `quantity: 0` or `quantity: 9999` -> `PERMISSION_DENIED`.
