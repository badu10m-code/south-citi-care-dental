# South Citi Care Dental Clinic - Website (v2)

Multi-page demo website for South Citi Care Dental Clinic, New Alipore, Kolkata.

## Pages
- index.html: 3D hero (floating tooth mascot, parallax, word-by-word title, typewriter, animated counters), services marquee, reviews
- services.html: 9 services in detail
- doctors.html: both dentists, awards
- gallery.html: all clinic photos from Google Maps (enhanced), lightbox viewer
- contact.html: booking form, map, hours
- admin.html: staff dashboard (password: scc-admin-2026, change before real use)

## Appointments
The booking form saves to a shared cloud store, so appointments from every patient device
appear in the admin panel from any device. The store is demo-grade (public JSON bin);
replace with the Cloudflare Pages Function + D1 backend before real patient data.

## Deploy
GitHub Pages works out of the box. For Cloudflare Pages: connect the repo, and add a
Pages Function at functions/api/appointments.js plus a D1 store to replace the demo bin.
