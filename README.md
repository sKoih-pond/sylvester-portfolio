# Sylvester Koh Portfolio Website

Static deploy-ready portfolio site with time-based adaptive themes and iOS-style glass containers.

## Files

- `index.html` — homepage markup
- `styles.css` — responsive layout, glassmorphism, and time-of-day theme variables
- `theme.js` — automatically applies Morning, Day, Sunset, or Night mode based on the visitor's device local time
- `assets/profile.jpeg` — hero portrait

## Theme schedule

- Morning: 6:00 AM – 9:59 AM
- Day: 10:00 AM – 4:59 PM
- Sunset: 5:00 PM – 8:59 PM
- Night: 9:00 PM – 5:59 AM

Adjust this in `theme.js` under `THEME_SCHEDULE`.

## Deployment on VentraIP / cPanel

1. Open File Manager.
2. Go to `public_html`.
3. Upload the contents of this folder, not the folder itself.
4. Ensure `index.html`, `styles.css`, `theme.js`, and the `assets` folder are directly inside `public_html`.
5. Visit your domain and hard refresh the browser.

## Notes

- Replace placeholder LinkedIn/GitHub links in `index.html` if needed.
- Add your PDF CV at `assets/Sylvester-Koh-CV.pdf` if you want the Download CV button to work.
