# ORDER_MODULE_PLAN.md — Order &amp; Single-Stock Module (Thriftpedia Backend, Milestone 1)

> **Owner of this module:** Akio (module "Order &amp; Single-Stock" in the team's work-division doc). Note: the README numbers team members differently from the work-division doc. Always refer to modules by **name** (Auth, Product, Order, Wishlist/Review), never by "Anggota N".
>
> **Hard deadline:** module merged to `main` **before Wednesday, 30 September 2026**. **Working window:** Fri 25 Sep → Tue 29 Sep 2026 (5 working days, Day 5 is integration + PR + buffer).
>
> **Suggested location in repo:** `server/Note/ORDER_MODULE_PLAN.md` (do NOT put it in a `Docs/` folder — `server/.gitignore` ignores `Docs/`, and on case-insensitive filesystems `docs/` may be ignored too).

---

## 0. How to use this file

### For the human (Akio)

1. Each morning, open Claude Code in the repo root and say: `Read server/Note/ORDER_MODULE_PLAN.md fully. We are on Day N. Execute only Day N tasks, respecting Sections 2, 3 and 9. Stop and ask me if any assumption in Section 3 turns out to be false.`
2. At the end of the day, review the diff, run tests, commit, push to `feature/order`.
3. Tick the checkboxes in **Section 11 (Progress Log)** and write any decision that changed.

### For Claude Code (read this carefully)

- This file is the **single source of truth** for the Order module. If code on `main` contradicts this file, **stop and report** the contradiction instead of silently choosing.
- Work **only** on branch `feature/order`.
- Edit **only** files listed as "Owned" in Section 2. Files listed as "Shared" may only be created if they do not exist yet, following the exact contract in Section 3. Files listed as "Not ours" must **never** be edited.
- Do **not** add features, fields or dependencies that are not in this plan (PRD scope is locked: no payment, no cart, no quantity, no Redis, no Docker, etc.).
- After every task: run `npm test` inside `server/` and make sure it passes before proposing a commit.
- At the end of each day: append a short entry to Section 11 (what was done, what is blocked, which assumptions changed).

---

## 1. Project context (condensed from PRD v1.0 Final + work-division doc)

**Product:** Web Thrift Store "Thriftpedia" (US6 — Rebranding). Every item is unique: `1 Product = 1 physical item = 1 stock`. No quantity field, no cart.

**Core business rule this module owns (FR-12):**

> Under concurrent requests, **only one purchase may succeed** for a single-stock product. All other concurrent attempts must be rejected (409).

**Functional requirements owned by this module:**


| ID    | Requirement                                                             | Actor  |
| ----- | ----------------------------------------------------------------------- | ------ |
| FR-11 | Buyer can create an order                                               | Buyer  |
| FR-12 | System prevents a single-stock product from being bought more than once | System |
| FR-13 | Buyer can view their own orders                                         | Buyer  |
| FR-14 | Admin can view orders                                                   | Admin  |
| FR-15 | Admin can update order status according to the rules                    | Admin  |


**Also provided by this module to other modules:**

- Review module (Wishlist/Review owner) needs: "has this buyer completed a purchase of this product?" → `hasCompletedPurchase()` helper (Section 5.6).
- Product module needs: "does this product have orders?" (PRD 24: deleting a product with orders must not make order data inconsistent) → `productHasOrders()` helper.

**Stack (locked, do not change):** Node.js, ExpressJS, JavaScript (CommonJS), MongoDB, Mongoose, JWT, bcrypt, dotenv, Postman, Git/GitHub.

**Versions actually installed (from** `server/package.json` **/ lockfile):**

- `express@5.2.1` → **Express 5** (see gotchas in Section 9)
- `mongoose@9.10.0` → **Mongoose 9**, requires **Node &gt;= 20.19**
- CI (`.github/workflows/ci.yml`) runs on Node 20: `npm ci`, `npm run lint --if-present`, `npm test --if-present` inside `server/`.

**Layered architecture (PRD §10):** Router → Middleware (auth, role, validation, error) → Controller → Service (business logic) → Mongoose Model → MongoDB.

- Controllers must be thin: parse request, call service, send response.
- All business rules (availability, ownership, status transitions) live in `order.service.js`.

### 1.1 Repo state as of 25 Sep 2026 (verify on Day 1 — it may have changed)

- `server/index.js` is still a hello-world on hard-coded port 3000 (ignores `PORT=5000` in `.env.example`). The PRD structure `src/app.js` + `src/server.js` does **not** exist yet.
- `server/src/models/User.js` exists but **does not match the PRD**:
  - field is `passwordHash` (PRD says `password`, storing the hash) — cosmetic, not our problem;
  - `role` enum is `['user', 'admin']` with default `'user'` — **PRD says** `ADMIN` **/** `BUYER`. This affects our authorization checks → see Decision D1.
- `Product.js`, auth middleware, role middleware, error middleware do **not** exist yet.
- Dependencies `jsonwebtoken`, `bcrypt`, `dotenv` are **not** installed yet.
- `npm test` currently just echoes "No tests yet".

---

## 2. File ownership

### Owned by the Order module (create/edit freely)

```
server/src/models/Order.js
server/src/routes/order.routes.js
server/src/controllers/order.controller.js
server/src/services/order.service.js
server/src/validators/order.validator.js
server/src/constants/order.js
server/tests/order/*.test.js
server/tests/helpers/*.js            (test-only helpers: db, tokens, factories)
server/scripts/concurrent-purchase.js
server/postman/order.postman_collection.json
server/Note/ORDER_MODULE_PLAN.md

```

### Shared (create ONLY if missing on `main`, following Section 3 contracts exactly; flag in PR)

```
server/src/app.js                    (Express app, exports app, NO listen)
server/src/server.js                 (connect DB + listen)
server/src/config/database.js
server/src/constants/roles.js
server/src/constants/product.js      (PRODUCT_STATUS)
server/src/utils/AppError.js
server/src/middleware/auth.middleware.js   (owner: Auth module — temporary minimal version only)
server/src/middleware/role.middleware.js   (owner: Auth + Security)
server/src/middleware/error.middleware.js  (owner: Security/Wishlist-Review module)
server/package.json / package-lock.json    (adding deps + test script)

```

If any shared file already exists on `main`, **use it as-is** and adapt our code to it. Never rewrite another member's implementation.

### Not ours — never edit

```
server/src/models/User.js
server/src/models/Product.js
server/src/models/Wishlist.js
server/src/models/Review.js
server/src/routes|controllers|services|validators/{auth,product,wishlist,review}.*
client/**
.github/**

```

Exception: none. If one of these is buggy or blocks us, write the issue in Section 11 and tell Akio.

---

## 3. Contracts &amp; assumptions with other modules

These are the interfaces the Order module depends on. **On Day 1, confirm them with the team** (group chat). If `main` differs, update this section first, then the code.

### 3.1 Authenticated user on the request (from Auth module)

```js
// set by auth.middleware.js after verifying "Authorization: Bearer <JWT>"
req.user = {
  id: '<User _id as string>',
  role: 'ADMIN' | 'BUYER',
};

```

- Missing/invalid/expired token → auth middleware responds **401**.
- JWT payload assumed: `{ id, role }` signed with `process.env.JWT_SECRET`. (If Auth uses `sub` instead of `id`, only `tests/helpers/tokens.js` changes.)

### 3.2 Role middleware

```js
// role.middleware.js
authorize(...allowedRoles) // → 403 if req.user.role not in allowedRoles

```

### 3.3 Role constants

```js
// src/constants/roles.js
module.exports = Object.freeze({ ADMIN: 'admin', BUYER: 'user' });

```

> **Updated Day 1 (D1):** the values match the current `User.js` enum `['user','admin']` on `main`. `req.user.role` is therefore `'admin' | 'user'`, not `'ADMIN' | 'BUYER'` as written in 3.1.

Order code must **only** reference roles through this constant, never string literals. That way, if D1 resolves to lowercase values, we change one file.

### 3.4 Product model (from Product module)

- Model name `'Product'`, collection `products`.
- Field `status: 'AVAILABLE' | 'SOLD'`, new products default to `AVAILABLE` (set by server, PRD §24).
- Other fields: `name, photos[], size, condition, price` (we only read them for populate).

```js
// src/constants/product.js (create only if Product module hasn't)
module.exports = { PRODUCT_STATUS: Object.freeze({ AVAILABLE: 'AVAILABLE', SOLD: 'SOLD' }) };

```

### 3.5 Error &amp; response format

```js
// src/utils/AppError.js
class AppError extends Error {
  constructor(statusCode, message, details) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    if (details) this.details = details;
  }
}
module.exports = AppError;

```

- Error response body: `{ "message": "...", "details"?: ... }` with the status from `err.statusCode` (default 500, generic message for 500s — never leak stack traces).
- Success body: `{ "message": "...", "data": ... }`.

### 3.6 Open decisions (resolve on Day 1, record the result here)


| #   | Decision                                                                                | Recommended                                                                               | Owner      | Status |
| --- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ---------- | ------ |
| D1  | Role values: PRD `ADMIN/BUYER` vs current `User.js` `user/admin`                        | Follow PRD (`ADMIN`/`BUYER`); Auth module updates `User.js`                               | Auth       | ☑ Akio (25 Sep): match `User.js` → `{ ADMIN: 'admin', BUYER: 'user' }` |
| D2  | `req.user` shape `{ id, role }` and JWT payload `{ id, role }`                          | As in 3.1                                                                                 | Auth       | ☐ open |
| D3  | When admin CANCELs an order, does the product go back to `AVAILABLE`?                   | **Yes** — the item was never handed over, so it can be sold again. Done atomically (5.5). | Order (us) | ☐ open |
| D4  | Who may PATCH an order?                                                                 | **Admin only** (PRD matrix + work-division doc). Buyer cannot cancel.                     | Order      | ☐ open |
| D5  | Error/success body format                                                               | As in 3.5                                                                                 | Security   | ☐ open |
| D6  | Product PATCH must **not** allow changing `status` (only our purchase/cancel logic may) | Whitelist fields in product validator                                                     | Product    | ☐ open |
| D7  | Product DELETE when orders exist → 409, using our `productHasOrders()`                  | Yes                                                                                       | Product    | ☐ open |
| D8  | Who scaffolds `src/app.js` + `src/server.js` + `config/database.js`?                    | Whoever needs it first, as a tiny separate PR `chore/app-scaffold`                        | Team       | ☐ open |
| D9  | Test runner: `node --test` + `supertest` + `mongodb-memory-server` for all modules      | Yes (no Jest needed, zero config)                                                         | Team       | ☐ open |
| D10 | How to get an ADMIN account for testing (register always creates BUYER)                 | Seed script from Auth module; fallback: `mongosh` update of `role`                        | Auth       | ☐ open |


---

## 4. Target design (what "done" looks like)

### 4.1 Order model (PRD §17 — do not add fields)


| Field                    | Type                 | Required | Notes                                                    |
| ------------------------ | -------------------- | -------- | -------------------------------------------------------- |
| `_id`                    | ObjectId             | auto     |                                                          |
| `buyer`                  | ObjectId → `User`    | yes      | always from JWT, immutable                               |
| `product`                | ObjectId → `Product` | yes      | from request body, immutable                             |
| `status`                 | String               | yes      | `PENDING` / `COMPLETED` / `CANCELLED`, default `PENDING` |
| `createdAt`, `updatedAt` | Date                 | auto     | `timestamps: true`                                       |


Intentionally **not** added (out of PRD scope): price snapshot, quantity, payment info, shipping address.

### 4.2 Order status state machine

```
             Admin PATCH {status: COMPLETED}
 PENDING ─────────────────────────────────────► COMPLETED   (terminal)
    │
    │        Admin PATCH {status: CANCELLED}
    └─────────────────────────────────────────► CANCELLED   (terminal)
                                                   └─ side effect: Product SOLD → AVAILABLE (D3)

```

- Any other transition (COMPLETED→*, CANCELLED→*, PENDING→PENDING) → **409 Conflict**.
- Transitions are applied with a **conditional atomic update** (`{ _id, status: <current> }`), so two admins clicking at once cannot both succeed.

### 4.3 Product status coupling

```
Product AVAILABLE ──(successful POST /api/orders, atomic claim)──► SOLD
Product SOLD ──(order CANCELLED by admin)──► AVAILABLE
Product SOLD ──(order COMPLETED)──► stays SOLD forever

```

### 4.4 Endpoints


| Method | Path                   | Roles                   | Body / Query                                     | Success     | Errors                                                                          |
| ------ | ---------------------- | ----------------------- | ------------------------------------------------ | ----------- | ------------------------------------------------------------------------------- |
| POST   | `/api/orders`          | BUYER                   | `{ "productId": "<24-hex>" }`                    | 201 + order | 400 invalid id, 401, 403 (admin/other), 404 product not found, 409 product SOLD |
| GET    | `/api/orders`          | BUYER, ADMIN            | `?status=PENDING|COMPLETED|CANCELLED` (optional) | 200 + list  | 400 bad status, 401                                                             |
| GET    | `/api/orders/:orderId` | BUYER (own only), ADMIN | —                                                | 200 + order | 400 invalid id, 401, 403 not owner, 404                                         |
| PATCH  | `/api/orders/:orderId` | ADMIN                   | `{ "status": "COMPLETED" | "CANCELLED" }` only   | 200 + order | 400 invalid body, 401, 403, 404, 409 invalid transition / concurrent change     |


Rules:

- Buyer **never** sends `buyer` or `status` in POST. If sent, they are **ignored** (we never read them). Tests must prove this.
- GET list: BUYER sees only `{ buyer: [req.user.id](http://req.user.id) }`; ADMIN sees all.
- Populate `product` with `name photos size condition price status` and `buyer` with `name email` **only** (never the password hash).
- Ownership denial returns **403** (as specified in the work-division doc example), checked **before** populating.

### 4.5 Purchase algorithm (PRD §25, steps 1–7)

```
1. Authenticate buyer                      → auth.middleware (401)
2. Authorize role BUYER                    → role.middleware (403)
3. Validate productId format               → order.validator (400)
4+5. Check availability AND claim atomically:
     Product.findOneAndUpdate(
       { _id: productId, status: 'AVAILABLE' },   ← condition inside the filter
       { $set: { status: 'SOLD' } })
     - returns doc  → we won the race
     - returns null → Product.exists({_id}) ? 409 : 404
6. Create Order { buyer: req.user.id, product, status: PENDING }
     - if creation throws → compensate: set product back to AVAILABLE
       (filter { _id, status: 'SOLD' }), then rethrow
7. Return 201 with the order

```

**Forbidden pattern** (race condition — two buyers can both pass the `if`):

```js
const p = await Product.findById(id);
if (p.status === 'AVAILABLE') { p.status = 'SOLD'; await p.save(); } // ❌ NEVER

```

Why the chosen pattern is safe: a write to a single MongoDB document is atomic, and the condition `status: 'AVAILABLE'` is re-evaluated by the server for the second concurrent update, which therefore matches nothing.

**Optional upgrade (only if MONGO\_URI is a replica set / Atlas):** wrap steps 4–6 in `session.withTransaction()`. A standalone local `mongod` does **not** support transactions, so the compensation approach is the default and must work without a replica set.

---

## 5. Reference implementation

Claude Code: use these as the baseline. Adjust imports only if the shared files on `main` differ from Section 3.

### 5.1 `src/constants/order.js`

```js
const ORDER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
});

// allowed next states for each current state
const ORDER_TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING]: [ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.COMPLETED]: [],
  [ORDER_STATUS.CANCELLED]: [],
});

// statuses an admin may set via PATCH
const ADMIN_SETTABLE_STATUSES = Object.freeze([ORDER_STATUS.COMPLETED, ORDER_STATUS.CANCELLED]);

module.exports = { ORDER_STATUS, ORDER_TRANSITIONS, ADMIN_SETTABLE_STATUSES };

```

### 5.2 `src/models/Order.js`

```js
const { Schema, model } = require('mongoose');
const { ORDER_STATUS } = require('../constants/order');

const orderSchema = new Schema(
  {
    buyer: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true },
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, immutable: true },
    status: {
      type: String,
      enum: Object.values(ORDER_STATUS),
      default: ORDER_STATUS.PENDING,
      required: true,
    },
  },
  { timestamps: true }
);

orderSchema.index({ buyer: 1, createdAt: -1 }); // buyer's order history
orderSchema.index({ product: 1 });              // review eligibility / product delete check

module.exports = model('Order', orderSchema);

```

### 5.3 `src/validators/order.validator.js`

No validation library is in the stack → plain middleware. Express 5: `req.body` is `undefined` when no body was sent, and `req.query` is read-only (never reassign it).

```js
const AppError = require('../utils/AppError');
const { ORDER_STATUS, ADMIN_SETTABLE_STATUSES } = require('../constants/order');

// Strict 24-hex check. Do NOT use mongoose.isValidObjectId: it accepts any 12-char string.
const OBJECT_ID_RE = /^[a-f\d]{24}$/i;
const isObjectIdString = (v) => typeof v === 'string' && OBJECT_ID_RE.test(v);

function validateCreateOrder(req, res, next) {
  const body = req.body ?? {};
  if (!isObjectIdString(body.productId)) {
    return next(new AppError(400, 'productId is required and must be a valid id'));
  }
  next();
}

function validateOrderIdParam(req, res, next) {
  if (!isObjectIdString(req.params.orderId)) {
    return next(new AppError(400, 'orderId must be a valid id'));
  }
  next();
}

function validateListQuery(req, res, next) {
  const { status } = req.query;
  if (status !== undefined && !Object.values(ORDER_STATUS).includes(status)) {
    return next(new AppError(400, `status must be one of ${Object.values(ORDER_STATUS).join(', ')}`));
  }
  next();
}

function validateUpdateStatus(req, res, next) {
  const body = req.body ?? {};
  const keys = Object.keys(body);
  if (keys.length !== 1 || keys[0] !== 'status') {
    return next(new AppError(400, 'Only the "status" field can be updated'));
  }
  if (!ADMIN_SETTABLE_STATUSES.includes(body.status)) {
    return next(new AppError(400, `status must be one of ${ADMIN_SETTABLE_STATUSES.join(', ')}`));
  }
  next();
}

module.exports = { validateCreateOrder, validateOrderIdParam, validateListQuery, validateUpdateStatus };

```

### 5.4 `src/services/order.service.js` — purchase

```js
const Order = require('../models/Order');
const Product = require('../models/Product');
const AppError = require('../utils/AppError');
const ROLES = require('../constants/roles');
const { PRODUCT_STATUS } = require('../constants/product');
const { ORDER_STATUS, ORDER_TRANSITIONS } = require('../constants/order');

const PRODUCT_FIELDS = 'name photos size condition price status';
const BUYER_FIELDS = 'name email'; // never expose password/passwordHash

async function createOrder({ buyerId, productId }) {
  // Steps 4+5: availability check and claim in ONE atomic, conditional write.
  const claimed = await Product.findOneAndUpdate(
    { _id: productId, status: PRODUCT_STATUS.AVAILABLE },
    { $set: { status: PRODUCT_STATUS.SOLD } },
    { returnDocument: 'after', runValidators: true }
  );

  if (!claimed) {
    // Only used to pick the right error message; safe even under races.
    const exists = await Product.exists({ _id: productId });
    if (!exists) throw new AppError(404, 'Product not found');
    throw new AppError(409, 'Product has already been sold');
  }

  // Step 6: create the order. If it fails, release the claim (compensation).
  try {
    return await Order.create({
      buyer: buyerId,
      product: claimed._id,
      status: ORDER_STATUS.PENDING,
    });
  } catch (err) {
    await Product.updateOne(
      { _id: claimed._id, status: PRODUCT_STATUS.SOLD },
      { $set: { status: PRODUCT_STATUS.AVAILABLE } }
    ).catch((rollbackErr) => {
      console.error('[order] compensation failed for product', String(claimed._id), rollbackErr);
    });
    throw err;
  }
}

```

### 5.5 `src/services/order.service.js` — read &amp; status update

```js
async function listOrders(user, { status } = {}) {
  const filter = {};
  if (user.role === ROLES.BUYER) filter.buyer = user.id; // object-level authorization
  if (status) filter.status = status;

  return Order.find(filter)
    .sort({ createdAt: -1 })
    .populate('product', PRODUCT_FIELDS)
    .populate('buyer', BUYER_FIELDS)
    .lean();
}

async function getOrderById(user, orderId) {
  const order = await Order.findById(orderId);
  if (!order) throw new AppError(404, 'Order not found');

  // Ownership check BEFORE populate (buyer is still a raw ObjectId here).
  if (user.role !== ROLES.ADMIN && !order.buyer.equals(user.id)) {
    throw new AppError(403, 'You are not allowed to access this order');
  }

  await order.populate([
    { path: 'product', select: PRODUCT_FIELDS },
    { path: 'buyer', select: BUYER_FIELDS },
  ]);
  return order;
}

async function updateOrderStatus(orderId, nextStatus) {
  const current = await Order.findById(orderId);
  if (!current) throw new AppError(404, 'Order not found');

  const allowed = ORDER_TRANSITIONS[current.status] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(409, `Cannot change order status from ${current.status} to ${nextStatus}`);
  }

  // Conditional update: only succeeds if nobody changed the status in between.
  const updated = await Order.findOneAndUpdate(
    { _id: orderId, status: current.status },
    { $set: { status: nextStatus } },
    { returnDocument: 'after', runValidators: true }
  );
  if (!updated) {
    throw new AppError(409, 'Order was modified by another request, please reload and retry');
  }

  // D3: cancelling releases the single stock back to the storefront.
  if (nextStatus === ORDER_STATUS.CANCELLED) {
    await Product.updateOne(
      { _id: updated.product, status: PRODUCT_STATUS.SOLD },
      { $set: { status: PRODUCT_STATUS.AVAILABLE } }
    );
  }

  return updated;
}

```

### 5.6 Helpers exported for other modules

```js
// Review module: eligibility (PRD §19). Only COMPLETED orders count.
async function hasCompletedPurchase(buyerId, productId) {
  return Boolean(await Order.exists({ buyer: buyerId, product: productId, status: ORDER_STATUS.COMPLETED }));
}

// Product module: block deletion of products that have order history (PRD §24).
async function productHasOrders(productId) {
  return Boolean(await Order.exists({ product: productId }));
}

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus,
  hasCompletedPurchase,
  productHasOrders,
};

```

### 5.7 `src/controllers/order.controller.js`

Express 5 forwards rejected promises from async handlers to the error middleware automatically → **no try/catch, no asyncHandler wrapper needed**.

```js
const orderService = require('../services/order.service');

async function create(req, res) {
  const order = await orderService.createOrder({
    buyerId: req.user.id,            // from JWT, never from body
    productId: req.body.productId,   // the ONLY field read from body
  });
  res.status(201).json({ message: 'Order created', data: order });
}

async function list(req, res) {
  const orders = await orderService.listOrders(req.user, { status: req.query.status });
  res.status(200).json({ message: 'Orders retrieved', data: orders });
}

async function getById(req, res) {
  const order = await orderService.getOrderById(req.user, req.params.orderId);
  res.status(200).json({ message: 'Order retrieved', data: order });
}

async function updateStatus(req, res) {
  const order = await orderService.updateOrderStatus(req.params.orderId, req.body.status);
  res.status(200).json({ message: 'Order status updated', data: order });
}

module.exports = { create, list, getById, updateStatus };

```

### 5.8 `src/routes/order.routes.js`

```js
const { Router } = require('express');
const { authenticate } = require('../middleware/auth.middleware');
const { authorize } = require('../middleware/role.middleware');
const ROLES = require('../constants/roles');
const v = require('../validators/order.validator');
const controller = require('../controllers/order.controller');

const router = Router();

router.use(authenticate); // every order endpoint requires a valid JWT

router.post('/', authorize(ROLES.BUYER), v.validateCreateOrder, controller.create);
router.get('/', authorize(ROLES.BUYER, ROLES.ADMIN), v.validateListQuery, controller.list);
router.get('/:orderId', authorize(ROLES.BUYER, ROLES.ADMIN), v.validateOrderIdParam, controller.getById);
router.patch('/:orderId', authorize(ROLES.ADMIN), v.validateOrderIdParam, v.validateUpdateStatus, controller.updateStatus);

module.exports = router;

```

Mounted in `src/app.js` as `app.use('/api/orders', orderRoutes);`.

### 5.9 Minimal shared scaffolding (ONLY if missing on `main` — see D8)

```js
// src/app.js
const express = require('express');
const orderRoutes = require('./routes/order.routes');
const { errorHandler } = require('./middleware/error.middleware');

const app = express();
app.use(express.json());
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/orders', orderRoutes);
// other modules mount their routers here
app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);
module.exports = app;

// src/server.js
require('dotenv').config();
const app = require('./app');
const { connectDatabase } = require('./config/database');
const PORT = process.env.PORT || 5000;
connectDatabase(process.env.MONGO_URI).then(() => {
  app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
});

// src/config/database.js
const mongoose = require('mongoose');
async function connectDatabase(uri) {
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
module.exports = { connectDatabase };

```

Temporary middleware (replace with the owners' versions at merge — "take theirs"):

```js
// src/middleware/auth.middleware.js  (TEMPORARY, owner: Auth module)
const jwt = require('jsonwebtoken');
const AppError = require('../utils/AppError');
function authenticate(req, res, next) {
  const header = req.headers.authorization ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(new AppError(401, 'Authentication required'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: String(payload.id), role: payload.role };
    next();
  } catch {
    next(new AppError(401, 'Invalid or expired token'));
  }
}
module.exports = { authenticate };

// src/middleware/role.middleware.js  (TEMPORARY)
const AppError = require('../utils/AppError');
const authorize = (...roles) => (req, res, next) =>
  roles.includes(req.user?.role) ? next() : next(new AppError(403, 'Forbidden'));
module.exports = { authorize };

// src/middleware/error.middleware.js  (TEMPORARY, owner: Security module)
function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ message: 'Malformed JSON body' });
  const status = err.statusCode ?? 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 ? 'Internal server error' : err.message,
    ...(err.details && status < 500 ? { details: err.details } : {}),
  });
}
module.exports = { errorHandler };

```

`package.json` scripts (coordinate, shared file):

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "node --watch src/server.js",
  "test": "node --test"
}

```

---

## 6. Day-by-day timeline

Each day: **Goal → Tasks → Acceptance criteria → Commit(s) → Prompt for Claude Code.**

---

### Day 1 — Fri 25 Sep 2026 · Sync, contracts, branch, model

**Goal:** remove uncertainty before writing business logic.

**Tasks**

1. `git checkout main && git pull`, then `git checkout -b feature/order` (or rebase it if it exists).
2. Inspect `main`: does `src/app.js`, `Product.js`, `auth.middleware.js`, `role.middleware.js`, `error.middleware.js`, `constants/roles.js` exist? Record findings in Section 11.
3. Post decisions D1–D10 (Section 3.6) to the team chat. **Priority: D1 (role values), D2 (req.user shape), D3 (cancel releases product).** Fill in the Status column as answers come in.
4. Create `src/constants/order.js` (5.1), `src/models/Order.js` (5.2).
5. Create `src/constants/roles.js`, `src/constants/product.js`, `src/utils/AppError.js` **only if missing** (3.3–3.5).
6. If `src/app.js` scaffold is missing and nobody claims D8 today, create it in a tiny separate branch `chore/app-scaffold` → PR to `main` (5.9 app/server/database only, plus `dotenv` dependency). This unblocks everyone.
7. Copy this plan into `server/Note/ORDER_MODULE_PLAN.md` and commit it.

**Acceptance criteria**

- `node -e "require('./src/models/Order')"` runs without error inside `server/`.
- Order schema has exactly: buyer, product, status, timestamps.
- Decisions D1–D3 posted to the team (answers may still be pending).

**Commits**

- `docs(order): add order module implementation plan`
- `feat(order): add Order model and order status constants`

**Prompt for Claude Code**

> Read `server/Note/ORDER_MODULE_PLAN.md`. We are on Day 1. Check which shared files from Section 2 already exist on the current branch and report them. Then implement Day 1 tasks 4–5 exactly as in Sections 5.1–5.2 and 3.3–3.5 (shared files only if missing). Do not touch files marked "Not ours". Update Section 11 with the findings.

---

### Day 2 — Sat 26 Sep 2026 · Purchase endpoint + single-stock atomic claim

**Goal:** `POST /api/orders` works end-to-end and is race-safe.

**Tasks**

1. `git pull --rebase origin main` — pick up any auth/product work merged overnight.
2. If `Product.js` still does not exist on `main`: ask the Product owner for an ETA. Meanwhile, continue coding against the contract in 3.4; for local manual testing only, insert products directly with `mongosh`. **Do not create** `Product.js` **on our branch.**
3. If auth/role/error middleware are missing: add the TEMPORARY versions from 5.9 and install `jsonwebtoken` + `dotenv` (`npm install jsonwebtoken dotenv`). Mark them in the PR description as "replace with owner's version at merge".
4. Implement `order.validator.js` → `validateCreateOrder` (5.3).
5. Implement `order.service.js` → `createOrder` (5.4). Use the atomic conditional `findOneAndUpdate`. **Never** the find-then-save pattern.
6. Implement `order.controller.js` → `create` (5.7).
7. Implement `order.routes.js` with the POST route (5.8) and mount it in `app.js`.
8. Manual smoke test (Postman or curl) with a buyer token:
   - valid AVAILABLE product → 201, product now SOLD in DB;
   - same product again → 409;
   - random valid-format id → 404;
   - `"abc"` → 400; no token → 401; admin token → 403;
   - body with extra `"buyer": "<other id>", "status": "COMPLETED"` → 201 and the saved order has `buyer = token user`, `status = PENDING`.

**Acceptance criteria**

- All 8 manual checks above behave as listed.
- `grep -rn "findById" src/services/order.service.js` shows no find-then-save purchase logic.
- Code review of `createOrder` matches Section 4.5 step by step.

**Commits**

- `feat(order): add create-order validation`
- `feat(order): implement atomic single-stock purchase (POST /api/orders)`

**Prompt for Claude Code**

> Read `server/Note/ORDER_MODULE_PLAN.md`. We are on Day 2. Implement Sections 5.3 (only `validateCreateOrder` + helpers), 5.4, 5.7 (`create`), 5.8 (POST route only) and mount the router. If the auth/role/error middleware are missing, create the TEMPORARY versions from 5.9 and install `jsonwebtoken` and `dotenv` (commit the updated package-lock.json). Do NOT create Product.js. Explain in 3–5 sentences why the claim is race-safe, then update Section 11.

---

### Day 3 — Sun 27 Sep 2026 · Read endpoints, ownership, admin status workflow

**Goal:** complete FR-13, FR-14, FR-15 + helpers for other modules.

**Tasks**

1. `git pull --rebase origin main`.
2. Validators: `validateOrderIdParam`, `validateListQuery`, `validateUpdateStatus` (5.3).
3. Service: `listOrders`, `getOrderById`, `updateOrderStatus`, `hasCompletedPurchase`, `productHasOrders` (5.5, 5.6).
4. Controller: `list`, `getById`, `updateStatus` (5.7).
5. Routes: GET `/`, GET `/:orderId`, PATCH `/:orderId` (5.8).
6. Send the Review owner and the Product owner a short message with the helper signatures: 
   ```js
   const { hasCompletedPurchase, productHasOrders } = require('../services/order.service');await hasCompletedPurchase(buyerId, productId); // → boolean, true only for COMPLETED ordersawait productHasOrders(productId);              // → boolean
   
   ```
7. Manual smoke tests:
   - Buyer A lists orders → only A's orders; Admin lists → all; `?status=PENDING` filters; `?status=FOO` → 400.
   - Buyer A GETs Buyer B's order → 403; unknown id → 404; admin GET any → 200.
   - Populated `buyer` contains only name/email (no password hash).
   - Admin PATCH PENDING→COMPLETED → 200; then →CANCELLED → 409.
   - Admin PATCH PENDING→CANCELLED → 200 and product back to AVAILABLE; another buyer can now buy it (201).
   - PATCH body `{ "status": "COMPLETED", "buyer": "x" }` → 400; `{ "status": "PENDING" }` → 400; buyer token PATCH → 403.

**Acceptance criteria**

- All smoke tests pass.
- Ownership is enforced in the service (not only by filtering in the frontend).
- No endpoint returns the password/passwordHash field.

**Commits**

- `feat(order): add order list and detail with ownership checks`
- `feat(order): add admin order status workflow with atomic transitions`
- `feat(order): export review-eligibility and product-deletion helpers`

**Prompt for Claude Code**

> Read `server/Note/ORDER_MODULE_PLAN.md`. We are on Day 3. Implement the remaining validators (5.3), `listOrders`, `getOrderById`, `updateOrderStatus` (5.5), the helpers (5.6), the remaining controllers (5.7) and routes (5.8). Follow the state machine in 4.2 exactly and keep D3 behaviour (cancel releases the product). Do not add endpoints beyond Section 4.4. Update Section 11.

---

### Day 4 — Mon 28 Sep 2026 · Automated tests + concurrency proof + Postman

**Goal:** prove FR-12 with a **real** concurrent test, and deliver the Postman collection for the report.

Why automated: Postman's collection runner sends requests **sequentially**, so it cannot prove concurrency. The concurrency proof must come from `Promise.all` (test + script).

**Tasks**

1. Install dev deps: `npm install -D supertest mongodb-memory-server` (commit lockfile — CI uses `npm ci` and fails if the lockfile is out of sync).
2. Set `"test": "node --test"` in `package.json` (coordinate: shared script; D9). Test files live in `tests/` and end with `.test.js`; helpers live in `tests/helpers/` without `.test` in the name.
3. `tests/helpers/db.js` — start `MongoMemoryServer`, connect mongoose, clear collections between tests, stop at the end.
4. `tests/helpers/tokens.js` — `signToken({ id, role })` using `jsonwebtoken` and `process.env.JWT_SECRET = 'test-secret'` (set before requiring the app).
5. `tests/helpers/factories.js` — `createProduct(overrides)` via the Product model with valid required fields (name, photos, size, condition, price, status AVAILABLE).
6. `tests/order/purchase.test.js`, `tests/order/order-access.test.js`, `tests/order/order-status.test.js` covering the matrix in **Section 7**.
7. **The key test** (skeleton): 
   ```js
   test('only one of N concurrent purchases succeeds', async () => {  const product = await createProduct();  const buyers = Array.from({ length: 10 }, () => signToken({ id: newId(), role: ROLES.BUYER }));  const responses = await Promise.all(    buyers.map((token) =>      request(app).post('/api/orders')        .set('Authorization', `Bearer ${token}`)        .send({ productId: String(product._id) })    )  );  const codes = responses.map((r) => r.status);  assert.equal(codes.filter((c) => c === 201).length, 1);  assert.equal(codes.filter((c) => c === 409).length, buyers.length - 1);  assert.equal(await Order.countDocuments({ product: product._id }), 1);  assert.equal((await Product.findById(product._id)).status, PRODUCT_STATUS.SOLD);});
   
   ```

   Run it several times (`for i in 1 2 3 4 5; do npm test || break; done`) — it must be green every time, not "usually".
8. `scripts/concurrent-purchase.js` — manual demo against a running server (for the report/presentation): 
   ```js
   // Usage: node scripts/concurrent-purchase.js <productId> <buyerToken1> <buyerToken2> [...]const BASE_URL = process.env.BASE_URL ?? 'http://localhost:5000';async function main() {  const [productId, ...tokens] = process.argv.slice(2);  if (!productId || tokens.length < 2) {    console.error('Usage: node scripts/concurrent-purchase.js <productId> <token1> <token2> [...]');    process.exit(1);  }  const results = await Promise.all(tokens.map(async (token, i) => {    const res = await fetch(`${BASE_URL}/api/orders`, {      method: 'POST',      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },      body: JSON.stringify({ productId }),    });    return { buyer: i + 1, status: res.status, body: await res.json().catch(() => null) };  }));  console.table(results.map(({ buyer, status, body }) => ({ buyer, status, message: body?.message })));  const wins = results.filter((r) => r.status === 201).length;  console.log(wins === 1 ? 'PASS: exactly one purchase succeeded' : `FAIL: ${wins} purchases succeeded`);}main();
   
   ```
9. Postman collection `postman/order.postman_collection.json`, folder per endpoint, using variables `{{baseUrl}}`, `{{buyerAToken}}`, `{{buyerBToken}}`, `{{adminToken}}`, `{{productId}}`, `{{orderId}}`; each request has a `pm.test` on the status code. Include: create 201, duplicate 409, invalid id 400, no token 401, admin create 403, list as buyer/admin, get own/other (403), patch complete/cancel/invalid transition (409), patch extra field (400).

**Acceptance criteria**

- `npm test` green locally 5 runs in a row.
- Every row of Section 7 has a corresponding automated test or Postman request.
- `node scripts/concurrent-purchase.js` against the running server prints `PASS`.

**Commits**

- `test(order): add purchase, access and status tests with in-memory MongoDB`
- `test(order): add concurrent purchase test and demo script`
- `docs(order): add Postman collection for order endpoints`

**Prompt for Claude Code**

> Read `server/Note/ORDER_MODULE_PLAN.md`. We are on Day 4. Set up the test infrastructure (Day 4 tasks 1–5), then write tests covering every row of Section 7, including the concurrency test in task 7. Run `npm test` 5 times and report results. If a test fails, fix the implementation, not the test expectation, unless the expectation contradicts Section 4. Then create the demo script (task 8) and the Postman collection (task 9). Update Section 11.

---

### Day 5 — Tue 29 Sep 2026 · Integration with real Auth/Product, PR, buffer

**Goal:** merged into `main` before 30 Sep.

**Tasks**

1. `git fetch && git rebase origin/main`. Resolve conflicts:
   - `auth.middleware.js`, `role.middleware.js`, `error.middleware.js`, `app.js`: **take the owner's version** from `main`, then adapt our routes/tests to their export names.
   - `package.json` / `package-lock.json`: merge dependency lists by hand, then run `npm install` to regenerate the lockfile, then `npm ci` to verify.
2. Re-check contracts against real code: JWT payload key, `req.user` shape, role values (D1), Product required fields (update `tests/helpers/factories.js`).
3. Update `tests/helpers/tokens.js` if the real auth middleware looks the user up in the DB (then factories must create real User documents).
4. Full run: `npm ci && npm test` (same as CI).
5. End-to-end manual flow with real endpoints: register 2 buyers → login → admin creates product → buyer A buys (201) → buyer B buys (409) → admin completes → buyer A can review (coordinate with Review owner) → run `concurrent-purchase.js` with fresh product → PASS.
6. Self-review with the checklist in **Section 8**.
7. Open PR `feature/order → main`. PR description template: 
   ```
   ## Order & Single-Stock module- Endpoints: POST/GET /api/orders, GET/PATCH /api/orders/:orderId- Single-stock: atomic conditional claim (findOneAndUpdate with status: AVAILABLE in filter) + compensation- Status workflow: PENDING → COMPLETED | CANCELLED (cancel releases product)- Helpers for other modules: hasCompletedPurchase, productHasOrders- Tests: node --test + supertest + mongodb-memory-server, incl. 10-way concurrent purchase test- Temporary shared files (replace with owner versions if still present): ...- Decisions taken: D1..D10 (see ORDER_MODULE_PLAN.md §3.6)
   
   ```
8. Ask one teammate to review; address comments; merge after CI is green.
9. Buffer for anything that slipped.

**Acceptance criteria**

- CI green on the PR.
- PR merged into `main` on 29 Sep.
- Section 11 completed; Section 3.6 has no ☐ open items affecting this module.

**Commits**

- `chore(order): integrate with auth and product modules from main`
- `fix(order): ...` (as needed)

**Prompt for Claude Code**

> Read `server/Note/ORDER_MODULE_PLAN.md`. We are on Day 5. Rebase `feature/order` on `origin/main`. For conflicts in shared files, keep the owner's version from main and adapt our code. Re-verify every contract in Section 3 against the real code and list any mismatch before changing anything. Run `npm ci && npm test`. Then walk through the checklist in Section 8 and report each item as pass/fail with file:line evidence. Draft the PR description from the Day 5 template.

---

## 7. Test matrix (every row must be covered)


| #   | Scenario                                                                                | Actor  | Expected                                               |
| --- | --------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------ |
| T1  | Buy AVAILABLE product                                                                   | Buyer  | 201, order PENDING, buyer = token user, product → SOLD |
| T2  | Buy SOLD product                                                                        | Buyer  | 409, no new order                                      |
| T3  | Buy non-existent product (valid id format)                                              | Buyer  | 404                                                    |
| T4  | `productId` missing / `"abc"` / number / 12-char string                                 | Buyer  | 400                                                    |
| T5  | No token / malformed token / wrong secret                                               | —      | 401                                                    |
| T6  | Admin tries to create order                                                             | Admin  | 403                                                    |
| T7  | Body includes `buyer` and `status`                                                      | Buyer  | 201, both ignored                                      |
| T8  | **10 concurrent buyers, same product**                                                  | Buyers | exactly 1×201, 9×409, 1 order in DB, product SOLD      |
| T9  | Same buyer double-submits concurrently                                                  | Buyer  | 1×201, 1×409                                           |
| T10 | Buyer lists orders                                                                      | Buyer  | only own orders                                        |
| T11 | Admin lists orders, with and without `?status=`                                         | Admin  | all / filtered                                         |
| T12 | `?status=INVALID`                                                                       | Any    | 400                                                    |
| T13 | Buyer gets own order                                                                    | Buyer  | 200                                                    |
| T14 | Buyer gets another buyer's order                                                        | Buyer  | 403                                                    |
| T15 | Get unknown order / invalid id                                                          | Any    | 404 / 400                                              |
| T16 | Response never contains password / passwordHash                                         | Any    | field absent                                           |
| T17 | Admin PENDING → COMPLETED                                                               | Admin  | 200, product stays SOLD                                |
| T18 | Admin PENDING → CANCELLED                                                               | Admin  | 200, product → AVAILABLE, can be bought again          |
| T19 | Admin COMPLETED → CANCELLED, CANCELLED → COMPLETED                                      | Admin  | 409                                                    |
| T20 | PATCH `{status:"PENDING"}` / extra fields / empty body                                  | Admin  | 400                                                    |
| T21 | Buyer PATCHes an order                                                                  | Buyer  | 403                                                    |
| T22 | Two concurrent admin PATCHes (COMPLETED vs CANCELLED) on same PENDING order             | Admin  | exactly one 200, other 409                             |
| T23 | `hasCompletedPurchase` true only for COMPLETED; `productHasOrders` true after any order | unit   | as stated                                              |


---

## 8. Definition of Done / self-review checklist

- \[ \] FR-11: POST `/api/orders` creates an order for the authenticated buyer.
- \[ \] FR-12: purchase uses a single conditional atomic update; T8 and T9 green on repeated runs.
- \[ \] FR-13: buyer sees only own orders (list + detail).
- \[ \] FR-14: admin sees all orders.
- \[ \] FR-15: admin transitions follow Section 4.2; invalid transitions → 409; concurrent transitions safe (T22).
- \[ \] `buyer` always comes from [`req.user.id`](http://req.user.id); `status` always set by the server.
- \[ \] Only `productId` is read from the POST body; only `status` accepted in PATCH.
- \[ \] All ids validated with strict 24-hex regex before hitting the DB.
- \[ \] No sensitive user fields in any response.
- \[ \] Controllers contain no business logic; services contain no `req`/`res`.
- \[ \] Roles referenced only via `constants/roles.js`.
- \[ \] No new fields in the Order model beyond PRD §17; no out-of-scope features.
- \[ \] `package-lock.json` in sync (`npm ci` works).
- \[ \] Postman collection exported and committed.
- \[ \] Helpers communicated to the Review and Product owners.
- \[ \] CI green, PR reviewed, merged before 30 Sep.

---

## 9. Gotchas &amp; guardrails (read before coding)

**Express 5**

- Async route handlers: rejected promises go to the error middleware automatically. Don't wrap in try/catch just to call `next(err)`.
- `req.body` is `undefined` if the request has no body → always use `req.body ?? {}` in validators.
- `req.query` is a getter and read-only — never assign to it.
- Malformed JSON → body-parser error with `err.type === 'entity.parse.failed'`, must become 400, not 500.

**Mongoose 9**

- Use `{ returnDocument: 'after' }` with `findOneAndUpdate` to get the updated doc.
- Validators do **not** run on update queries unless `runValidators: true`.
- No callbacks anywhere — async/await only. For any `pre` hooks, use `async function` hooks (don't rely on `next`).
- `mongoose.isValidObjectId('aaaaaaaaaaaa')` is `true` (any 12-char string) → use the strict regex.
- `Model.exists()` returns `{ _id }` or `null` → wrap in `Boolean()`.

**MongoDB**

- Single-document writes are atomic → our claim is safe without transactions.
- Multi-document transactions require a replica set; local standalone `mongod` will throw. Don't make transactions mandatory.

**Security**

- Never trust `buyer`, `status`, or `role` from the client.
- Object-level authorization is checked in the service for every single-order read.
- 500 responses must not leak stack traces or Mongo error messages.

**Process**

- CI runs `npm ci` → every dependency change must commit the updated `package-lock.json`.
- Node must be ≥ 20.19 locally (Mongoose 9 / MongoDB driver 7 requirement).
- `mongodb-memory-server` downloads a MongoDB binary on first run (slow first time, cached afterwards; works in GitHub Actions).
- Postman runner is sequential → never claim Postman proves concurrency; use T8 + the demo script.
- Small commits, conventional messages (`feat(order): …`, `test(order): …`, `fix(order): …`).

---

## 10. Risks &amp; mitigations


| Risk                                             | Impact                                  | Mitigation                                                                          |
| ------------------------------------------------ | --------------------------------------- | ----------------------------------------------------------------------------------- |
| Auth module not merged by Day 2–3                | Can't test with real tokens             | Temporary middleware (5.9) against contract 3.1; swap on Day 5                      |
| Product model not merged by Day 2                | Can't claim products                    | Code against contract 3.4; insert products via `mongosh`; escalate to team on Day 2 |
| D1 role mismatch (`user/admin` vs `ADMIN/BUYER`) | Every authorize check fails after merge | Roles only via constants; resolve D1 on Day 1                                       |
| Product PATCH lets admin set `status` freely     | Breaks single-stock invariant           | D6: Product validator whitelist excludes `status`                                   |
| Merge conflicts in shared files on Day 5         | Lost time on deadline day               | Rebase daily from Day 2; keep shared-file edits minimal                             |
| Flaky concurrency test                           | False confidence                        | Run 5×; test asserts DB state, not just status codes                                |


---

## 11. Progress log (update at the end of each day)

### Day 1 — Fri 25 Sep

- \[x\] Branch `feature/order` created locally from `origin/main` @ `acab3d4` (upstream unset; not pushed)
- \[x\] Shared files present on main: **none**. `origin/main` (and teammate branches 535709/535820/539400) contain only `src/models/User.js` + hello-world `index.js` (port 3000). Missing: `app.js`, `server.js`, `config/database.js`, `Product.js`, auth/role/error middleware, `constants/roles.js`, `constants/product.js`, `utils/AppError.js`. Deps `jsonwebtoken`/`bcrypt`/`dotenv` not installed. Local Node v22.23.1 (≥ 20.19 OK).
- \[ \] D1–D10 posted to team; answers: *(Akio to post — pending)*
- \[ \] Order model + constants committed — files created (`constants/order.js`, `models/Order.js`, `constants/product.js`, `constants/roles.js`, `utils/AppError.js`), not yet committed. Acceptance: `require('./src/models/Order')` OK, schema paths = buyer/product/status/timestamps, `npm test` passes.
- Notes / blockers:
  - D1 resolved by Akio: `roles.js` = `{ ADMIN: 'admin', BUYER: 'user' }` to match `User.js` on main (3.3 updated).
  - Plan location: kept at `server/Note/ORDER_MODULE_PLAN.md` (all path references updated).
  - Task 6 (`chore/app-scaffold`) skipped today, waiting for a team answer on D8.

### Day 2 — Sat 26 Sep

- \[ \] POST /api/orders implemented with atomic claim + compensation
- \[ \] 8 manual checks passed
- Notes / blockers:

### Day 3 — Sun 27 Sep

- \[ \] GET list/detail with ownership
- \[ \] PATCH with state machine + cancel releases product
- \[ \] Helpers shared with Review/Product owners
- Notes / blockers:

### Day 4 — Mon 28 Sep

- \[ \] Test infra + all Section 7 rows covered
- \[ \] Concurrency test green 5× in a row
- \[ \] Demo script prints PASS
- \[ \] Postman collection committed
- Notes / blockers:

### Day 5 — Tue 29 Sep

- \[ \] Rebased on main, shared files reconciled
- \[ \] `npm ci && npm test` green; CI green
- \[ \] E2E flow verified with real auth/product
- \[ \] PR opened, reviewed, merged
- Notes / blockers:

