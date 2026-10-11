# South Citi Care Dental Clinic - Website

Demo website for South Citi Care Dental Clinic, New Alipore, Kolkata.

## Stack
- Static HTML/CSS/JS (no build step, no dependencies)
- Appointment booking form + staff admin panel (`admin.html`, demo password: `scc-admin-2026`, change before real use)
- LocalBusiness (Dentist) schema, sitemap, robots.txt for SEO
- Ready for Cloudflare Pages: add a Pages Function at `/api/appointments` and a D1/KV store to make the form and admin panel multi-device

## Local preview
Open `index.html` in a browser, or run: `python3 -m http.server 8080`

## Admin panel
Visit `/admin.html`. Demo mode stores appointments in the browser's localStorage on the
device where the form was submitted.
