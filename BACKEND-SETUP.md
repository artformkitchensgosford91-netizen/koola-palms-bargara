# Koola Palms Website Backend

This package adds a private content manager at:

https://koolapalmsbargara.au/admin/

Once connected to a Git repository and Netlify Identity/Git Gateway, the admin can update:

- homepage hero text and images
- apartment gallery photos, order, captions and alt text
- local-area gallery photos, order, captions and alt text
- direct booking and Booking.com links
- phone, email and address

## One-time activation

1. Put this site in a GitHub repository with the default branch named `main`.
2. In Netlify, connect the existing Koola Palms site to that repository for continuous deployment.
3. In Netlify, enable Identity for the site and set registration to Invite only.
4. Enable Git Gateway for the site.
5. Invite the site owner as an Identity user.
6. When HTTPS is working, open `https://koolapalmsbargara.au/admin/` and sign in.

## Editing photos

Use Website content > Apartment gallery or Local area gallery. Upload a new image, edit the caption/alt text, reorder items, then save. Decap CMS commits the change to the repository and Netlify publishes it automatically.

## Notes

The public site keeps its existing hard-coded content as a fallback. `content/site.json` is loaded by `assets/cms-content.js` and overrides the editable areas when available.
