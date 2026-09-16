# Site Logo Settings Design

## Goal

Allow editors to upload one organization logo in `/studio` and use it consistently in the campaign header, campaign footer, and legal pages without coupling the logo to a campaign document.

## Content model

Add a `siteSettings` Sanity document managed as a singleton with the fixed document ID `siteSettings`. It contains:

- `organizationName`: optional string used beside the logo.
- `logo`: optional Sanity image with hotspot enabled and a nested `alt` field. Alt text produces a Studio warning when omitted rather than blocking publishing.

The Studio structure exposes one Site settings entry and removes the ordinary document-type list entry so editors cannot create duplicates.

## Data flow

Add a dedicated `SITE_SETTINGS_QUERY` and `SiteSettings` TypeScript type. The query projects the asset ID, URL, dimensions, LQIP, crop, hotspot, and alt text.

Public routes obtain settings through a shared server-side query helper. Campaign data remains unchanged. The campaign route loads campaign content and site settings together, then passes settings to the page. Legal pages use the same helper through their shared page component.

## Rendering

Create one reusable `SiteBrand` component for logo plus organization name. It renders the uploaded Sanity logo when present and otherwise falls back to `/sample-logo.svg` and `Open Hands Relief`.

- Campaign header uses `SiteBrand`.
- Footer uses `SiteBrand` in its organization block.
- Legal page header uses `SiteBrand`.

The uploaded image retains its natural dimensions through `next/image`, while CSS constrains its displayed size. The image uses its authored alt text; the decorative fallback uses an empty alt because the adjacent organization name provides the accessible label.

## Failure behavior

If the settings document, logo asset, or organization name is absent, public pages continue rendering with existing fallback branding. A missing global setting must not make a campaign return 404.

## Testing

Follow red-green TDD with focused tests that prove:

- The settings GROQ query includes the logo fields required for rendering.
- `SiteBrand` uses the uploaded logo and organization name.
- `SiteBrand` falls back to the existing static brand.
- Campaign header, footer, and legal page render the shared branding path.
- Existing campaign story types and tests remain unchanged.

Run the targeted tests first, then the full test suite, TypeScript check, lint, and production build.
