# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

Three independent Node projects, each with its own `package.json` / `node_modules`:

- `backend/` — Express 5 + MongoDB (Mongoose) API, ES modules (`"type": "module"`).
- `frontend/` — Vite + React 19 patient-facing app.
- `admin/` — Vite + React 19 SPA used by **both** admins and doctors (single-page routes gated on which token is present).

There is no workspace tool / monorepo runner; install and run each project separately.

## Commands

Backend (`cd backend`):
- `npm run server` — start with nodemon (dev).
- `npm start` — run once with node.
- No test runner is wired up (`npm test` is a placeholder that exits 1).

Frontend and Admin (`cd frontend` or `cd admin`):
- `npm run dev` — Vite dev server.
- `npm run build` — production build.
- `npm run preview` — preview built bundle.
- `npm run lint` — ESLint.

## Required Environment

Backend (`backend/.env`):
- `MONGODB_URI`, `JWT_SECRET`
- `CLOUDINARY_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_SECRET_KEY`
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — admin login is a hardcoded env credential check, not a DB record (see Auth below).
- `PAYSTACK_SECRET_KEY` — for the Paystack flow in `userController.js`.
- `PORT` (optional, defaults 4000).

Frontend / Admin: `VITE_BACKEND_URL` — base URL of the Express API. Used as `${VITE_BACKEND_URL}/api/...`.

## Architecture

### API surface (mounted in [backend/server.js](backend/server.js))

- `/api/admin/*` — [backend/routes/adminRoute.js](backend/routes/adminRoute.js)
- `/api/doctor/*` — [backend/routes/doctorRoute.js](backend/routes/doctorRoute.js)
- `/api/user/*` — [backend/routes/userRoute.js](backend/routes/userRoute.js)

Data models live in [backend/models/](backend/models/): `userModel`, `doctorModel`, `appointmentModel`. The appointment document embeds snapshots of `userData` and `docData` at booking time plus `slotDate`, `slotTime`, `amount`, and flags `cancelled`, `payment`, `isCompleted`.

### Auth model (three tokens, all JWT in `Authorization: Bearer <token>`)

- **User** ([authUser.js](backend/middleware/authUser.js)) — JWT payload is `{ id: userId }`. The middleware **injects `userId` into `req.body`** (and creates `req.body` for GET requests). Controllers therefore read the caller's id from `req.body.userId`, not from `req.user`. Preserve this pattern when adding endpoints.
- **Doctor** ([authDoctor.js](backend/middleware/authDoctor.js)) — same shape for doctors.
- **Admin** ([authAdmin.js](backend/middleware/authAdmin.js)) — token payload is the literal string `ADMIN_EMAIL + ADMIN_PASSWORD`; on each request the middleware re-computes that string from env and compares. There is no admin user record; rotating the env vars invalidates existing admin sessions.

### File uploads

[backend/middleware/multer.js](backend/middleware/multer.js) + Cloudinary ([config/cloudinary.js](backend/config/cloudinary.js)). The admin `add-doctor` and user `update-profile` routes use `upload.single("image")`. Note the ordering on `update-profile`: `upload` runs **before** `authUser` so multipart parsing happens first.

### Payments

Paystack integration lives inline in [userController.js](backend/controllers/userController.js) (`initiatePayment` / `verifyPayment`). The frontend redirects to Paystack's hosted page and returns to `/payment-success` ([frontend/src/pages/PaymentSuccess.jsx](frontend/src/pages/PaymentSuccess.jsx)) which calls `/api/user/verify-payment` with the `reference` query param. Currency symbol on the UI is ₦ (NGN).

### Frontend state

Each SPA holds auth/session state in a single React Context, not a store:

- [frontend/src/context/AppContext.jsx](frontend/src/context/AppContext.jsx) — `token` (in `localStorage` key `token`), `userData`, `doctors`, `backendUrl`, `currencySymbol`.
- [admin/src/context/AdminContext.jsx](admin/src/context/AdminContext.jsx) — `aToken` (localStorage `aToken`), admin-scoped fetchers.
- [admin/src/context/DoctorContext.jsx](admin/src/context/DoctorContext.jsx) — `dToken` (localStorage `dToken`), doctor-scoped fetchers.
- [admin/src/App.jsx](admin/src/App.jsx) renders `<Login />` until either `aToken` **or** `dToken` is set, then renders the full shell; both admin and doctor routes coexist in the same `<Routes>` block and the sidebar decides what to show based on which token is present.

### Non-obvious detail: components folder name

The frontend folder is literally named `components ` with a **trailing space** — imports look like `from "./components /Navbar"`. Do not "fix" this by renaming without updating every import; it's how the path is referenced throughout [frontend/src/App.jsx](frontend/src/App.jsx) and siblings. The admin app uses the normal `components/` (no space).

### Deployment

All three projects deploy to Vercel. `backend/vercel.json` routes everything through `server.js` as a `@vercel/node` function — the Express app is the handler, no separate build step.
