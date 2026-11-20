# AutoRate full stack (React + Express + MongoDB)

- `frontend/` : Vite + React (http://localhost:5173)
- `backend/`  : Express + MongoDB API with JWT login and Socket.IO live reviews (http://localhost:5000)

## First time
1. Start MongoDB (local MongoDB Community Server runs automatically after install),
   or put your Atlas connection string in `backend\.env` (MONGODB_URI) after step 2 and re-run `npm run seed` in `backend`.
2. In this folder run:  `powershell -ExecutionPolicy Bypass -File .\setup.ps1`
   This installs both projects, fetches real car photos from Wikipedia, and seeds 60 cars, 140+ sample reviews and the admin account.
3. Start everything:  `powershell -ExecutionPolicy Bypass -File .\start.ps1`  then open http://localhost:5173

If you only need to populate or repair the car catalog without resetting reviews or other collections, run `npm run seed:cars` from `backend/`. To add or repair the generated sample reviews without deleting existing user reviews, run `npm run seed:reviews`. Both commands are idempotent.

## Logins
- Admin: username `admin` / password `admin123` (use the normal Log in page; opens the Admin dashboard)
- Users: register with email + password from "Join free"
- Usernames are optional at registration; when supplied, they are stored with submitted reviews. Existing users without usernames use their display name.

## Admin details in MongoDB
Admins are stored in their own collection, `admins` (database `autorate`), separate from the public `users` collection.
Each admin has: name, username, email, phone, bcrypt-hashed password, role, lastLoginAt, createdAt.
- The first admin is created automatically from `ADMIN_*` values in `backend\.env` (see `.env.example`) when you run `npm run seed` or start the server.
- Admin dashboard -> **My profile**: edit your details and change your password (saved to MongoDB).
- Admin dashboard -> **Admins**: add or remove other admin accounts (you cannot delete yourself or the last admin).
- Old-style admins (a `users` record with role admin) are moved into `admins` automatically.
- View it in VS Code with the MongoDB extension, MongoDB Compass or `mongosh`: `use autorate` then `db.admins.find()`.

## Theme
TorqueDark: charcoal surfaces with orange accents. All colours are variables at the top of `frontend/src/styles.css` (`--accent`, `--bg`, `--surface`).

## Dashboards and live car updates
- The user dashboard (`/dashboard`) shows the latest car guides and photos for signed-in users.
- The admin dashboard (`/admin`) can add/edit/delete cars, preview photos, find Wikipedia images, moderate reviews, manage users and read contact messages.
- Car additions, edits and deletions are pushed live to the homepage, Explore, car detail pages and open dashboards through Socket.IO.

## Car photos
Photos come from each model's Wikipedia article when you run either seed command (saved in backend/src/data/image-cache.json).
If a photo is missing or wrong, log in as admin -> Cars -> Edit and paste a better image URL, or leave it empty to show a labelled placeholder.
Re-running `npm run seed` resets cars/reviews to the original data (admin edits to cars/reviews are overwritten; users and admin accounts are kept).
