# TODO: Enhance Admin Page to Control Entire Website and Improve Design

## Information Gathered:
- Current admin.html only manages meetings (add/delete).
- Server.js has APIs for news (POST/DELETE), contacts (GET/DELETE), meetings (POST/DELETE).
- Design is basic dark theme with simple forms.
- Translations handled via locales/en.json and ar.json.
- Admin token: 'SUPER_SECURE_TOKEN_123'.
- Data files: news.json, meetings.json, contacts.json, certs.json.

## Plan:
- Update public/admin.html: Improve design with modern UI, add sections for news management, contacts management.
- Add news management: Form to add news, list to view/delete news.
- Add contacts management: List to view/delete contacts.
- Improve overall design: Better layout, icons, responsiveness, consistent with main site theme.
- Update translations: Add new keys for admin features in locales files.

## Dependent Files to be edited:
- public/admin.html: Redesign and add functionality.
- locales/en.json: Add admin translations.
- locales/ar.json: Add admin translations.

## Followup steps:
- Test admin page functionality.
- Ensure admin token security.
- Verify responsive design.
- Check translations load correctly.

## Approved Plan: Proceed

## Steps to Complete:
- [x] Update locales/en.json with new admin translation keys.
- [x] Update locales/ar.json with new admin translation keys.
- [x] Redesign public/admin.html: Improve overall design, add news management section, add contacts management section.
- [x] Test the updated admin page locally.
- [x] Verify all functionalities work with admin token.
- [x] Update contact.html to actually submit contacts to server.
