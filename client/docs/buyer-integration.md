# Wishlist and product reviews integration

The existing Next.js client now calls the existing Express endpoints. No
production backend schema, route, order status, or database migration changes
are required. The Figma pages remain design references, not running API clients.

## Run with your existing backend

1. Keep the backend's existing `server/.env`, including its own `MONGO_URI` and
   `JWT_SECRET`. Do not commit or copy secrets into the frontend.
2. In `server/`, run `npm ci` and `npm run dev`.
3. In `client/`, copy `.env.example` to `.env.local` if you have not configured it.
   For the default local backend, use:

   ```dotenv
   API_URL=http://localhost:5000/api
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

   Server rendering prefers `API_URL`. Browser requests go through the Next
   same-origin `/api` rewrite. Set both to the same backend URL and restart Next
   after changing them. Cloudinary credentials stay exclusively on the server.
4. In `client/`, run `npm ci` and `npm run dev`.
5. Log in with an existing BUYER account. Open `/wishlist`, `/catalog/<productId>`,
   `/orders`, or `/orders/<orderId>`.

## Connected contracts

| UI | Existing API |
| --- | --- |
| Saved items, hearts, navbar badge | `GET /api/wishlist` |
| Save a find, including after contextual login | `POST /api/wishlist` with `{ productId }` |
| Remove a find | `DELETE /api/wishlist/:productId` |
| Public product review | `GET /api/products/:productId/reviews` |
| Write a review | `POST /api/products/:productId/reviews` with `{ rating, comment }` |
| Review eligibility on Product Detail | `GET /api/orders?status=COMPLETED` |
| Buyer order history/detail | `GET /api/orders` and `GET /api/orders/:orderId` |

Wishlist state is shared by all hearts and the navbar, keyed by the authenticated
session. Pending controls prevent repeat submissions; failed requests keep the
previous card/count. A successful save/removal updates the cache, then refreshes
the authoritative server list. SOLD items remain readable and removable.

Login synchronizes the buyer AuthContext token and the existing admin token key.
The login page preserves the admin redirect, adds a buyer redirect, and supports
an internal `returnTo`. Contextual wishlist login resumes the pending product.

Reviews are public. A buyer sees Write a review only for their COMPLETED purchase
when they have not reviewed the product. All four ineligible order statuses have
no write action. The backend remains authoritative for ownership, eligibility,
integer rating validation and the unique buyer/product constraint. Reviewed is
display state under COMPLETED, not a new order status.

The responsive review dialog uses native modal focus handling and restores
focus on close. Dirty drafts require confirmation; failed submissions retain the
rating/comment; submitting disables controls. Success refetches the review and
shows Your review without a second submit action.

## Validation

Use Node.js 22+ (validated with Node.js 24):

```sh
npm run lint
npm run build
npm run test:unit
```

The four UI integration tests use DOM rendering, the real API client, and
controlled HTTP responses. They cover authentication headers/payloads, resumed
save, failure retention, duplicate-click protection, final-item removal, review
validation/draft confirmation, submission, eligibility, and public reading.

The browser suite uses the real Express application and a temporary MongoDB
database, never the database in `server/.env`. Install both folders' dependencies
and a Playwright browser first:

```sh
npx playwright install chromium
npm run test:e2e
```

It runs on isolated local ports 3100/5000 and includes 1440/834/390 screenshots.
Keep the normal development servers off those ports while it runs. To use a
locally installed Chromium, set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Browser end-to-end execution could not complete in the implementation environment:
MongoDB and Chromium were denied required local process/socket operations.
The suite is provided for execution on a machine that supports those processes;
DOM integration tests, lint, production build, and the existing nine backend
security/index tests were used for validation here. The user's live database
was not accessed.
