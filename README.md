# Pranav Kushwaha: Portfolio

Personal portfolio of Pranav Kushwaha, graphics and engine programmer. It replaces the old Wix site at <https://pksimpleid2.wixsite.com/pranavgamedev>.

It is a static site generated from JSON data by a small Node script with zero dependencies. GitHub Actions builds it and deploys it to GitHub Pages on every push to `main`.

## Quick start

You need Node.js 18 or newer. Nothing to install.

```bash
npm run dev     # build, serve on http://localhost:4321, rebuild + live-reload on save
npm run build   # build to dist/
npm run check   # validate data/*.json only
```

## Project layout

Content, presentation and behaviour are kept apart. To change what the site *says*, you only touch `data/`.

```text
data/                 ← CONTENT: edit these
  site.json           name, role, bio, contact, socials, SEO text
  projects.json       every project, in display order
  career.json         CV profile, core skills, skills, experience, education, awards, testimonials
assets/img/           images referenced from data (WebP)
static/               files copied to the site root as-is (favicon, icons)

src/templates/        PRESENTATION: HTML generated from data
  layout.mjs          <head>, SEO meta, header, footer
  home.mjs            home page sections
  project.mjs         project detail page and 404
  cv.mjs              full CV page at /cv/ (prints to PDF)
  components.mjs      cards, badges, images, buttons
  seo.mjs             schema.org JSON-LD
  icons.mjs           inline SVG icons
src/styles/main.css   design tokens and all styles
src/scripts/          BEHAVIOUR: progressive enhancement only
  main.js             nav, copy email, video embeds, reveal on scroll
  hero.js             WebGL lensing shader in the hero
src/lib/              html escaping helper, data validator

scripts/build.mjs     data + templates → dist/
scripts/serve.mjs     local dev server with live reload
.github/workflows/    GitHub Pages deployment
PORTFOLIO_UPDATE.md   how to update Project V after each engine PR
```

## Common edits

**Home page vs CV page.** The home page stays short on purpose. About shows the two `about` paragraphs from `site.json` and the `coreSkills` row. Experience shows one line per role, taken from each role's `headline`. Everything else in `career.json` (`profile`, every bullet in `points` and `groups`, all skill groups) appears only on `/cv/`. That page has a "Save as PDF" button that uses a print stylesheet tuned for A4.

**Add a project.** Add an object to `data/projects.json`. Copy an existing entry as a template. The order in the file is the order on the page. Exactly one project can have `"featured": true`; it gets the large card at the top.

| Field | Required | Notes |
| --- | --- | --- |
| `slug` | yes | URL: `/projects/<slug>/`. Lowercase kebab-case, unique. |
| `title`, `shortTitle` | title | `shortTitle` is used in cards and breadcrumbs. |
| `status` | yes | `"wip"` or `"complete"`. |
| `category`, `role`, `tagline`, `summary` | yes | Short text. |
| `overview` | yes | Array of paragraphs. |
| `architecture` | no | One paragraph. |
| `highlights`, `highlightsTitle` | no | Bullet list. The title defaults to "Highlights". |
| `knownIssues`, `roadmap` | no | Lists. The roadmap is numbered. |
| `tech`, `platforms` | tech | Arrays of strings. |
| `image` | yes | `src`, `srcSmall`, `width`, `height`, `alt`. |
| `gallery` | no | Images with `title` and `caption`. |
| `video` | no | Self-hosted MP4 demo: `src`, `srcSmall`, `poster`, `width`, `height`, `duration`, `uploadDate`, `caption`, and optional `cropTop`. |
| `metrics` | no | Headline numbers: `[{ "value": "42%", "label": "fewer draw calls" }]`. |
| `youtube` | no | YouTube video ID (11 characters), used only when there is no `video`. |
| `links` | no | `{ "label", "url", "icon" }`. Icon names are in `src/templates/icons.mjs`. |
| `updated`, `updateNote` | no | `YYYY-MM-DD`, and a note shown under the title. |

**Add images.** Export a 16:9 screenshot as WebP at two widths, named `name-1600.webp` and `name-800.webp`. Put them in `assets/img/projects/`. The `-800` suffix tells the build which width the small file is. For code screenshots, use lossless WebP so text stays sharp.

```bash
python -c "from PIL import Image; im=Image.open('shot.png').convert('RGB'); [im.resize((w, round(im.height*w/im.width)), Image.LANCZOS).save(f'assets/img/projects/name-{w}.webp', 'WEBP', quality=82, method=6) for w in (800, 1600)]"
```

**Add a video.** Videos are self-hosted MP4s in `assets/video/`. Export two H.264 versions, a full one and a 480p preview, with the index at the start of the file so they stream:

```bash
ffmpeg -i capture.mp4 -c:v libx264 -crf 23 -preset slow -pix_fmt yuv420p -movflags +faststart -an assets/video/name-1080.mp4
ffmpeg -i capture.mp4 -vf scale=-2:480 -c:v libx264 -crf 26 -preset slow -pix_fmt yuv420p -movflags +faststart -an assets/video/name-480.mp4
ffmpeg -i capture.mp4 -frames:v 1 poster.png   # then convert to assets/img/projects/name-poster.webp
```

The project page plays the full video with controls. Cards play the 480p preview on hover. If a capture includes a window title bar, set `cropTop` to its height in pixels and the player hides it.

**Add a contact form.** Set `contact.formAction` in `data/site.json` to a form endpoint such as Formspree. The form appears automatically. Leave it empty for the email-only layout.

**Show the phone number.** Set `showPhone` to `true` in `data/site.json`. It is off by default because public numbers attract spam.

The build validates the data first. A missing image, a duplicate slug, an unsafe link or a malformed date stops the build with a message saying which entry and field is wrong.

## Deploying to GitHub Pages

The site lives in `TheBossBaby/TheBossBaby.github.io` on the `main` branch. The old site is kept on the `archive/master` branch and the `archive-master-2026-10-25` tag.

1. **Settings → General → Default branch**: switch to `main`. The Pages environment only accepts deployments from allowed branches, and the default branch is allowed automatically.
2. **Settings → Pages → Build and deployment → Source**: choose **GitHub Actions**.
3. **Actions** tab: re-run the latest "Deploy to GitHub Pages" run, or push any commit to `main`. Every later push to `main` deploys automatically.
4. Optional: delete the old `master` branch once `main` is the default. Its history stays in `archive/master`.

**The repository name decides the URL.**

| Repository name | Site URL | `siteUrl` in `data/site.json` |
| --- | --- | --- |
| `<username>.github.io` | `https://<username>.github.io/` | `https://<username>.github.io` |
| any other name, e.g. `portfolio` | `https://<username>.github.io/portfolio/` | `https://<username>.github.io/portfolio` |

`siteUrl` is the only thing to change. Canonical URLs, the sitemap, Open Graph tags and all internal links are derived from it, including the `/portfolio` sub-path. It is set to `https://thebossbaby.github.io` for the `TheBossBaby/TheBossBaby.github.io` repository.

For a custom domain, add a `static/CNAME` file containing the domain, configure it under Settings → Pages, and set `siteUrl` to `https://yourdomain.com`.

## SEO

- Every page is pre-rendered HTML with a unique title, description and canonical URL.
- Open Graph and Twitter card tags give link previews on LinkedIn, Slack and X.
- JSON-LD describes a `Person` (with `sameAs` links to GitHub and LinkedIn), the `WebSite`, a `ProfilePage`, and each project as `SoftwareSourceCode` or `CreativeWork` with breadcrumbs.
- `sitemap.xml` and `robots.txt` are generated on each build.
- Images carry explicit dimensions and alt text, and load lazily below the fold.

After the first deploy, add the site to Google Search Console and submit `sitemap.xml`. Then add the new URL to LinkedIn, GitHub and your CV, and redirect or retire the Wix site so the two don't compete in search.

## Analytics

The site supports Google Analytics 4. It ships with no analytics code until a measurement ID is set.

**Turn it on**

1. In [Google Analytics](https://analytics.google.com), open **Admin → Create → Property**, then add a **Web** data stream for `https://thebossbaby.github.io`.
2. Copy the stream's **Measurement ID**. It looks like `G-XXXXXXXXXX`. The old `UA-128634648-1` ID from the previous site belongs to Universal Analytics, which Google shut down in 2023, so it no longer collects data.
3. Put the ID in `analytics.gaMeasurementId` in `data/site.json` and push to `main`.
4. Optional: in the data stream, keep **Enhanced measurement** on for scroll depth and outbound clicks. Mark `contact_email` as a key event so recruiters' emails show up as conversions.

**How consent works.** Nothing is requested from Google and no cookie is set until a visitor clicks **Accept** on the banner, as UK GDPR and PECR require. The choice is stored in `localStorage` and can be changed from **Cookie settings** in the footer. Declining after accepting stops collection and clears the `_ga` cookies. Browsers that send Global Privacy Control are treated as declining and don't see the banner. Google signals and ad personalisation are switched off.

**Events sent after consent**

| Event | When |
| --- | --- |
| `page_view` | Every page load (automatic). |
| `contact_email` | A click on any email link. |
| `copy_email` | The Copy button next to the email address. |
| `github_click` | A click on any GitHub link, with the URL. |
| `cv_save_pdf` | "Save as PDF" on the CV page. |
| `video_unmute` | A visitor unmutes a project video. Autoplaying muted clips are not counted. |
| `video_play` | A video that doesn't autoplay is played. |

The logic is in `src/scripts/analytics.js`, the markup in `src/templates/analytics.mjs`, and the banner text in `data/site.json`.

## Performance and accessibility

- No framework and no runtime dependencies. Each page loads one stylesheet and one or two small scripts.
- The hero shader caps resolution, pauses off-screen and in background tabs, and renders a single still frame when the visitor prefers reduced motion. Without WebGL, a CSS gradient stands in.
- YouTube embeds load only when clicked, from the privacy-enhanced domain.
- The site works without JavaScript. It has a skip link, visible focus styles, semantic landmarks, and colour contrast that meets WCAG AA.
