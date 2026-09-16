# Global Site Logo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add one Sanity-managed organization logo and name that render consistently in the campaign header, both responsive footer instances, and every legal page.

**Architecture:** A fixed-ID `siteSettings` singleton owns global branding independently of campaign documents. A dedicated server query returns a typed settings object, and a presentational `SiteBrand` component centralizes uploaded-image and fallback rendering. Public entry points fetch the singleton while existing campaign fields and story types remain untouched.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Sanity 5, next-sanity/GROQ, Next Image, Vitest, Testing Library.

---

## File map

**Create:**

- `sanity/schemaTypes/site-settings.ts` — global singleton schema.
- `sanity/types/site-settings.ts` — frontend contract for global branding.
- `sanity/lib/site-settings.ts` — singleton GROQ query and server fetch helper.
- `components/site/site-brand.tsx` — reusable logo/name/subtitle renderer.
- `tests/unit/site-settings.test.ts` — schema and query contract tests.
- `tests/unit/site-brand.test.tsx` — uploaded and fallback rendering tests.

**Modify:**

- `sanity/schemaTypes/index.ts` — register `siteSettings`.
- `sanity/structure.ts` — expose one fixed-ID singleton and hide its ordinary list.
- `components/campaign/campaign-page.tsx` — render `SiteBrand` in the campaign header and forward settings to footers.
- `components/campaign/site-footer.tsx` — render the shared brand in the footer.
- `app/gaza-food/page.tsx` — fetch campaign, content, and global settings in parallel.
- `components/legal/legal-page.tsx` — fetch and render global settings for every legal route.
- `tests/unit/campaign-page.test.tsx` — prove campaign header/footer integration.
- `tests/unit/legal-page.test.tsx` — prove legal header integration.
- `tests/unit/sanity-queries.test.ts` — retain campaign query regression coverage unchanged.

### Task 1: Sanity singleton schema and query contract

**Files:**

- Create: `tests/unit/site-settings.test.ts`
- Create: `sanity/schemaTypes/site-settings.ts`
- Create: `sanity/types/site-settings.ts`
- Create: `sanity/lib/site-settings.ts`
- Modify: `sanity/schemaTypes/index.ts`
- Modify: `sanity/structure.ts`

- [ ] **Step 1: Write the failing schema/query tests**

Create `tests/unit/site-settings.test.ts`:

```ts
import { describe, expect, it } from "vitest";

import { SITE_SETTINGS_QUERY } from "@/sanity/lib/site-settings";
import { siteSettingsType } from "@/sanity/schemaTypes/site-settings";

describe("site settings", () => {
  it("defines organization name and an uploadable logo", () => {
    expect(siteSettingsType.name).toBe("siteSettings");

    const fieldNames = siteSettingsType.fields.map((field) => field.name);

    expect(fieldNames).toEqual(
      expect.arrayContaining(["organizationName", "logo"]),
    );

    const logoField = siteSettingsType.fields.find(
      (field) => field.name === "logo",
    );

    expect(logoField).toMatchObject({
      type: "image",
      options: { hotspot: true },
    });
  });

  it("projects all logo data needed by the frontend", () => {
    const normalizedQuery = SITE_SETTINGS_QUERY.replace(/\s+/g, " ");

    expect(normalizedQuery).toContain('_id == "siteSettings"');
    expect(normalizedQuery).toContain("organizationName");
    expect(normalizedQuery).toContain("logo {");
    expect(normalizedQuery).toContain("asset->");
    expect(normalizedQuery).toContain("dimensions");
    expect(normalizedQuery).toContain("lqip");
    expect(normalizedQuery).toContain("alt");
    expect(normalizedQuery).toContain("hotspot");
    expect(normalizedQuery).toContain("crop");
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npm test -- tests/unit/site-settings.test.ts
```

Expected: FAIL because `sanity/lib/site-settings.ts` and `sanity/schemaTypes/site-settings.ts` do not exist.

- [ ] **Step 3: Add the typed data contract**

Create `sanity/types/site-settings.ts`:

```ts
export type SiteLogo = {
  asset?: {
    _id: string;
    url: string;
    metadata?: {
      dimensions?: {
        width: number;
        height: number;
        aspectRatio: number;
      };
      lqip?: string;
    };
  };
  alt?: string;
  hotspot?: {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
  };
  crop?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
};

export type SiteSettings = {
  _id: string;
  organizationName?: string;
  logo?: SiteLogo;
};
```

- [ ] **Step 4: Add the singleton schema**

Create `sanity/schemaTypes/site-settings.ts`:

```ts
import { defineField, defineType } from "sanity";

export const siteSettingsType = defineType({
  name: "siteSettings",
  title: "Site settings",
  type: "document",
  fields: [
    defineField({
      name: "organizationName",
      title: "Organization name",
      type: "string",
      initialValue: "Open Hands Relief",
    }),
    defineField({
      name: "logo",
      title: "Organization logo",
      type: "image",
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: "alt",
          title: "Alt text",
          type: "string",
          validation: (rule) =>
            rule
              .required()
              .warning("Alt text helps visitors using assistive technology."),
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: "organizationName",
      media: "logo",
    },
  },
});
```

Modify `sanity/schemaTypes/index.ts` to:

```ts
import { campaignType } from "./campaign";
import { siteSettingsType } from "./site-settings";

export const schema = {
  types: [
    campaignType,
    siteSettingsType,
  ],
};
```

- [ ] **Step 5: Add the query and fetch helper**

Create `sanity/lib/site-settings.ts`:

```ts
import { defineQuery } from "next-sanity";

import { sanityClient } from "@/sanity/lib/client";
import type { SiteSettings } from "@/sanity/types/site-settings";

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[
    _id == "siteSettings" &&
    _type == "siteSettings"
  ][0] {
    _id,
    organizationName,
    logo {
      asset-> {
        _id,
        url,
        metadata {
          dimensions,
          lqip
        }
      },
      alt,
      hotspot,
      crop
    }
  }
`);

export async function getSiteSettings() {
  return sanityClient.fetch<SiteSettings | null>(
    SITE_SETTINGS_QUERY,
    {},
    {
      cache: "no-store",
    },
  );
}
```

- [ ] **Step 6: Make the document a fixed-ID Studio singleton**

Replace `sanity/structure.ts` with:

```ts
import type { StructureResolver } from "sanity/structure";

const singletonType = "siteSettings";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Content")
    .items([
      S.listItem()
        .title("Site settings")
        .id(singletonType)
        .child(
          S.document()
            .schemaType(singletonType)
            .documentId(singletonType),
        ),
      ...S.documentTypeListItems().filter(
        (listItem) => listItem.getId() !== singletonType,
      ),
    ]);
```

- [ ] **Step 7: Run the targeted test to verify GREEN**

Run:

```bash
npm test -- tests/unit/site-settings.test.ts
```

Expected: 2 tests PASS.

- [ ] **Step 8: Type-check the Sanity contract**

Run:

```bash
npm run typecheck
```

Expected: exit code 0; existing campaign story fields remain valid.

- [ ] **Step 9: Commit the singleton data layer**

```bash
git add sanity/schemaTypes/site-settings.ts sanity/schemaTypes/index.ts sanity/structure.ts sanity/types/site-settings.ts sanity/lib/site-settings.ts tests/unit/site-settings.test.ts
git commit -m "feat: add global Sanity site settings"
```

### Task 2: Shared brand renderer

**Files:**

- Create: `tests/unit/site-brand.test.tsx`
- Create: `components/site/site-brand.tsx`

- [ ] **Step 1: Write failing uploaded-logo and fallback tests**

Create `tests/unit/site-brand.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SiteBrand } from "@/components/site/site-brand";
import type { SiteSettings } from "@/sanity/types/site-settings";

const siteSettings: SiteSettings = {
  _id: "siteSettings",
  organizationName: "Hunger Supports",
  logo: {
    asset: {
      _id: "image-logo",
      url: "https://cdn.sanity.io/images/project/dataset/logo.png",
      metadata: {
        dimensions: {
          width: 640,
          height: 320,
          aspectRatio: 2,
        },
      },
    },
    alt: "Hunger Supports logo",
  },
};

describe("SiteBrand", () => {
  it("renders uploaded Sanity branding", () => {
    render(<SiteBrand settings={siteSettings} />);

    expect(screen.getByText("Hunger Supports")).toBeVisible();
    expect(
      screen.getByRole("img", { name: "Hunger Supports logo" }),
    ).toHaveAttribute("src", expect.stringContaining("logo.png"));
  });

  it("renders the existing fallback branding", () => {
    const { container } = render(<SiteBrand settings={null} />);

    expect(screen.getByText("Open Hands Relief")).toBeVisible();
    expect(container.querySelector("img")).toHaveAttribute(
      "src",
      expect.stringContaining("sample-logo.svg"),
    );
  });

  it("renders an optional subtitle", () => {
    render(
      <SiteBrand
        settings={siteSettings}
        subtitle="Care, made tangible"
      />,
    );

    expect(screen.getByText("Care, made tangible")).toBeVisible();
  });
});
```

- [ ] **Step 2: Run the test to verify RED**

Run:

```bash
npm test -- tests/unit/site-brand.test.tsx
```

Expected: FAIL because `components/site/site-brand.tsx` does not exist.

- [ ] **Step 3: Implement the minimal shared renderer**

Create `components/site/site-brand.tsx`:

```tsx
import Image from "next/image";

import type { SiteSettings } from "@/sanity/types/site-settings";

type SiteBrandProps = {
  settings?: SiteSettings | null;
  subtitle?: string;
  containerClassName?: string;
  imageClassName?: string;
  nameClassName?: string;
  subtitleClassName?: string;
};

export function SiteBrand({
  settings,
  subtitle,
  containerClassName = "inline-flex min-w-0 items-center gap-3",
  imageClassName = "size-11 shrink-0 object-contain",
  nameClassName = "block truncate font-semibold",
  subtitleClassName = "block truncate text-xs text-[var(--muted)]",
}: SiteBrandProps) {
  const logo = settings?.logo;
  const dimensions = logo?.asset?.metadata?.dimensions;
  const organizationName =
    settings?.organizationName || "Open Hands Relief";

  return (
    <span className={containerClassName}>
      <Image
        src={logo?.asset?.url || "/sample-logo.svg"}
        alt={logo?.alt || ""}
        width={dimensions?.width || 46}
        height={dimensions?.height || 46}
        className={imageClassName}
      />

      <span className="min-w-0">
        <strong className={nameClassName}>
          {organizationName}
        </strong>

        {subtitle && (
          <small className={subtitleClassName}>
            {subtitle}
          </small>
        )}
      </span>
    </span>
  );
}
```

- [ ] **Step 4: Run the test to verify GREEN**

Run:

```bash
npm test -- tests/unit/site-brand.test.tsx
```

Expected: 3 tests PASS.

- [ ] **Step 5: Commit the shared renderer**

```bash
git add components/site/site-brand.tsx tests/unit/site-brand.test.tsx
git commit -m "feat: add shared site brand component"
```

### Task 3: Campaign header and footer integration

**Files:**

- Modify: `tests/unit/campaign-page.test.tsx`
- Modify: `components/campaign/campaign-page.tsx`
- Modify: `components/campaign/site-footer.tsx`
- Modify: `app/gaza-food/page.tsx`

- [ ] **Step 1: Write the failing campaign integration test**

Add this fixture beneath `sanityContent` in `tests/unit/campaign-page.test.tsx`:

```ts
const siteSettings = {
  _id: "siteSettings",
  organizationName: "Hunger Supports",
  logo: {
    asset: {
      _id: "image-logo",
      url: "https://cdn.sanity.io/images/project/dataset/logo.png",
      metadata: {
        dimensions: {
          width: 640,
          height: 320,
          aspectRatio: 2,
        },
      },
    },
    alt: "Hunger Supports logo",
  },
};
```

Add this test inside `describe("CampaignPage", ...)`:

```tsx
it("uses global branding in the campaign header and footers", () => {
  render(
    <CampaignPage
      campaign={sampleCampaign}
      content={sanityContent}
      siteSettings={siteSettings}
    />,
  );

  expect(
    screen.getAllByRole("img", { name: "Hunger Supports logo" }),
  ).toHaveLength(3);
  expect(screen.getAllByText("Hunger Supports")).toHaveLength(3);
});
```

Import the type and annotate the fixture:

```ts
import type { SiteSettings } from "@/sanity/types/site-settings";

const siteSettings: SiteSettings = {
  // fixture above
};
```

- [ ] **Step 2: Run the campaign test to verify RED**

Run:

```bash
npm test -- tests/unit/campaign-page.test.tsx
```

Expected: FAIL because `CampaignPage` does not accept `siteSettings`.

- [ ] **Step 3: Replace the hard-coded campaign header brand**

In `components/campaign/campaign-page.tsx`:

1. Remove `import Image from "next/image"` only if no other use remains; it remains required for the hero, so keep it.
2. Add:

```ts
import { SiteBrand } from "@/components/site/site-brand";
import type { SiteSettings } from "@/sanity/types/site-settings";
```

3. Change the props to:

```ts
export function CampaignPage({
  campaign,
  content,
  siteSettings,
}: {
  campaign: Campaign;
  content: SanityCampaign;
  siteSettings?: SiteSettings | null;
}) {
```

4. Replace the header's hard-coded `Image` plus name/subtitle span with:

```tsx
<SiteBrand
  settings={siteSettings}
  subtitle="Care, made tangible"
  nameClassName="block truncate text-[17px] font-semibold tracking-tight"
/>
```

5. Pass `siteSettings={siteSettings}` to both desktop and mobile `SiteFooter` calls.

- [ ] **Step 4: Replace the footer organization block**

In `components/campaign/site-footer.tsx`, add:

```ts
import { SiteBrand } from "@/components/site/site-brand";
import type { SiteSettings } from "@/sanity/types/site-settings";
```

Change the props:

```ts
type SiteFooterProps = {
  content: SanityCampaign;
  siteSettings?: SiteSettings | null;
};

export function SiteFooter({
  content,
  siteSettings,
}: SiteFooterProps) {
```

Replace the existing organization `<div>` with:

```tsx
<SiteBrand
  settings={siteSettings}
  subtitle={
    content.footerSubtitle ||
    "Sample organization · UI preview"
  }
  imageClassName="size-10 shrink-0 object-contain"
  nameClassName="block truncate font-semibold text-[var(--ink)]"
  subtitleClassName="mt-1 block text-sm text-[var(--muted)]"
/>
```

Do not use `content.organizationName` for the brand name; global `siteSettings` is now the single source of truth.

- [ ] **Step 5: Fetch global settings in the campaign route**

In `app/gaza-food/page.tsx`, add:

```ts
import { getSiteSettings } from "@/sanity/lib/site-settings";
```

Replace the sequential campaign/content fetches with:

```ts
const [campaign, content, siteSettings] = await Promise.all([
  getCampaignBySlug(CAMPAIGN_SLUG),
  sanityClient.fetch<SanityCampaign>(
    CAMPAIGN_QUERY,
    {
      slug: CAMPAIGN_SLUG,
    },
    {
      cache: "no-store",
    },
  ),
  getSiteSettings(),
]);

if (!campaign || !content) {
  notFound();
}
```

Pass the value:

```tsx
<CampaignPage
  campaign={campaign}
  content={content}
  siteSettings={siteSettings}
/>
```

- [ ] **Step 6: Run the campaign test to verify GREEN**

Run:

```bash
npm test -- tests/unit/campaign-page.test.tsx
```

Expected: all campaign page tests PASS, including exactly three global logo instances: one header and two responsive footer DOM instances.

- [ ] **Step 7: Run campaign story regression tests**

Run:

```bash
npm test -- tests/unit/campaign-story.test.tsx tests/unit/sanity-queries.test.ts
```

Expected: all tests PASS; `SanityCampaign` and `CAMPAIGN_QUERY` remain unchanged.

- [ ] **Step 8: Commit campaign integration**

```bash
git add app/gaza-food/page.tsx components/campaign/campaign-page.tsx components/campaign/site-footer.tsx tests/unit/campaign-page.test.tsx
git commit -m "feat: use global branding on campaign pages"
```

### Task 4: Legal page integration

**Files:**

- Modify: `tests/unit/legal-page.test.tsx`
- Modify: `components/legal/legal-page.tsx`

- [ ] **Step 1: Write the failing async legal-page test**

Replace `tests/unit/legal-page.test.tsx` with:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LegalPage } from "@/components/legal/legal-page";

vi.mock("@/sanity/lib/site-settings", () => ({
  getSiteSettings: vi.fn().mockResolvedValue({
    _id: "siteSettings",
    organizationName: "Hunger Supports",
    logo: {
      asset: {
        _id: "image-logo",
        url: "https://cdn.sanity.io/images/project/dataset/logo.png",
        metadata: {
          dimensions: {
            width: 640,
            height: 320,
            aspectRatio: 2,
          },
        },
      },
      alt: "Hunger Supports logo",
    },
  }),
}));

describe("LegalPage", () => {
  it("clearly labels sample legal content and uses global branding", async () => {
    const page = await LegalPage({
      title: "Privacy Policy",
      children: <p>Sample privacy text.</p>,
    });

    render(page);

    expect(
      screen.getByRole("heading", { name: "Privacy Policy" }),
    ).toBeVisible();
    expect(
      screen.getByText(/replace and obtain client\/legal approval/i),
    ).toBeVisible();
    expect(screen.getByText("Hunger Supports")).toBeVisible();
    expect(
      screen.getByRole("img", { name: "Hunger Supports logo" }),
    ).toHaveAttribute("src", expect.stringContaining("logo.png"));
  });
});
```

- [ ] **Step 2: Run the legal test to verify RED**

Run:

```bash
npm test -- tests/unit/legal-page.test.tsx
```

Expected: FAIL because `LegalPage` is synchronous and still renders the hard-coded fallback brand.

- [ ] **Step 3: Implement the server-backed legal brand**

Replace `components/legal/legal-page.tsx` with:

```tsx
import Link from "next/link";
import type { ReactNode } from "react";

import { SiteBrand } from "@/components/site/site-brand";
import { getSiteSettings } from "@/sanity/lib/site-settings";

export async function LegalPage({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const siteSettings = await getSiteSettings();

  return (
    <main className="min-h-screen bg-[var(--page)] px-5 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="min-w-0 rounded-lg">
            <SiteBrand
              settings={siteSettings}
              imageClassName="size-[42px] shrink-0 object-contain"
            />
          </Link>

          <Link
            href="/"
            className="shrink-0 rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold"
          >
            Back to campaign
          </Link>
        </header>

        <article className="mt-12 rounded-[30px] border border-[var(--border)] bg-white p-6 shadow-[0_20px_60px_rgba(20,43,78,.08)] sm:p-10">
          <p className="text-xs font-bold uppercase tracking-[.18em] text-[var(--accent)]">
            Organization information
          </p>

          <h1 className="mt-3 text-4xl font-semibold tracking-[-.04em] sm:text-5xl">
            {title}
          </h1>

          <div className="mt-8 rounded-2xl bg-[var(--amber-soft)] p-4 text-sm font-medium leading-6 text-[var(--amber)]">
            Sample content — replace and obtain client/legal approval before
            accepting live donations.
          </div>

          <div className="mt-8 space-y-5 text-[17px] leading-8 text-[var(--muted)]">
            {children}
          </div>
        </article>
      </div>
    </main>
  );
}
```

All existing routes continue importing `LegalPage`; Next App Router supports the returned async server component.

- [ ] **Step 4: Run the legal test to verify GREEN**

Run:

```bash
npm test -- tests/unit/legal-page.test.tsx
```

Expected: 1 test PASS.

- [ ] **Step 5: Commit legal integration**

```bash
git add components/legal/legal-page.tsx tests/unit/legal-page.test.tsx
git commit -m "feat: use global branding on legal pages"
```

### Task 5: Full verification

**Files:**

- Verify all modified files.
- Do not change production code unless a command exposes a real defect.

- [ ] **Step 1: Run focused feature tests**

Run:

```bash
npm test -- tests/unit/site-settings.test.ts tests/unit/site-brand.test.tsx tests/unit/campaign-page.test.tsx tests/unit/legal-page.test.tsx
```

Expected: all feature tests PASS with zero failures.

- [ ] **Step 2: Run the full test suite**

Run:

```bash
npm test
```

Expected: all tests PASS, including campaign story regressions.

- [ ] **Step 3: Run TypeScript**

Run:

```bash
npm run typecheck
```

Expected: exit code 0 and no `keyof SanityCampaign` errors.

- [ ] **Step 4: Run lint**

Run:

```bash
npm run lint
```

Expected: exit code 0.

- [ ] **Step 5: Run a production build**

Run:

```bash
npm run build
```

Expected: Next.js production build exits 0. The npm `allow-scripts` notices, if printed during install, are warnings rather than build failures.

- [ ] **Step 6: Inspect the final diff**

Run:

```bash
git status --short
git diff --check
git diff --stat HEAD~4
```

Expected: only planned files are changed, no whitespace errors, and no modifications to `sanity/types/campaign.ts` or campaign story fields.

- [ ] **Step 7: Optional manual Studio check**

Run:

```bash
npm run dev
```

Open `/studio`, edit the single Site settings document, upload a logo, add alt text, publish, then verify the campaign, footer, and one legal page. This supplements but does not replace automated verification.
