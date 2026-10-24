# Project V: Portfolio Update Instructions (for Claude Code)

Use this file after a Project V PR is merged to update the Project V entry on my portfolio. The portfolio is this repository: a static site generated from `data/*.json` and deployed to GitHub Pages on every push to `main`.

## Hard rules

1. **Never push, and never deploy.** Pushing to `main` publishes the site. I review and push myself. Committing to a local branch is fine when I ask for it.
2. **Show me the proposed changes (a diff of `data/projects.json`, plus any new or replaced images) and wait for my approval before writing them.**
3. Only touch the Project V entry (`"slug": "project-v"`) in `data/projects.json` and its images in `assets/img/projects/project-v-*`. Don't edit other projects, `data/site.json`, `data/career.json`, templates, styles or anything else.
4. Be honest about the state of the engine. Don't claim features that aren't merged. Anything visibly broken goes under **Known issues**.
5. Run `npm run check` and `npm run build` after editing. Both must pass before you show me the diff.

## Where Project V lives

| What | Value |
| --- | --- |
| Data | `data/projects.json`, the object with `"slug": "project-v"` |
| Live page | `/projects/project-v/` (also featured on the home page) |
| Cover image | `assets/img/projects/project-v-1280.webp` and `project-v-800.webp` (16:9) |
| Snippet 1: "Frames in flight & draw loop" | `gallery[0]`, `assets/img/projects/project-v-frames.webp` (1273×1300) |
| Snippet 2: "Pipeline creation with RAII + builders" | `gallery[1]`, `assets/img/projects/project-v-pipeline.webp` (1209×840) |
| Repos | `TheBossBaby/project-v-engine`, `project-v-core`, `project-v-vulkan` (in `links`) |

## How the description maps to data

The Wix version was one plain-text block. Here each part is its own field, and the page renders each as its own section.

| Template part | Field in `projects.json` | Notes |
| --- | --- | --- |
| "Work in progress, updated after every PR." | `updateNote` | Keep as is while WIP. |
| One-line pitch | `tagline` and `overview[0]` | `tagline` is short; `overview` is the full sentence. |
| Wormhole goal sentence | `summary` | Shown on the home-page card. |
| Architecture | `architecture` | One or two sentences. |
| Working now | `highlights` (with `highlightsTitle: "Working now"`) | One array item per feature. The home card shows the first four, so order by impressiveness. |
| Known issues | `knownIssues` | One array item per issue. Delete the array items when fixed. |
| Roadmap | `roadmap` | In order. The first item is highlighted as "next". Always ends with the compute-pipeline wormhole. |
| Date of this update | `updated` | `YYYY-MM-DD`. Drives "Last update" and the sitemap. |
| Title | `title` | Stays `Project V — Vulkan Engine` until I say it's no longer WIP. Then also change `status` from `"wip"` to `"complete"`. |

## Workflow after each PR

1. **Work out what changed.** Read the PR or the commits since the last update (`git log` across the root repo and the `engine/project-v-engine` and `renderer/project-v-vulkan` submodules). Summarise it in one or two lines.
2. **Update the fields** using the mapping above:
   - Move newly finished work into `highlights`.
   - Add or remove entries in `knownIssues`. Check the current render before removing one, e.g. depth buffer present → back faces no longer bleed through.
   - Advance `roadmap`.
   - Set `updated` to today.
3. **Media (optional):**
   - If I give you a new clip, extract a clean frame with ffmpeg, crop off the window title bar, and keep it 16:9. Export `project-v-1280.webp` (1280×720) and `project-v-800.webp` (800×450). Propose it as the new cover and update `image.alt`.
   - If a snippet's source has changed a lot, regenerate that snippet image (see "Snippet images" below) and propose replacing it. Update `width`, `height`, `title`, `caption` and `alt` in `gallery`.
   - If I give you a YouTube upload, put its 11-character ID in `video`. The page shows a click-to-play embed over the cover.
4. **Show me** the diff of `data/projects.json` plus any new images. **Wait for my OK.**
5. **Apply:** write the changes, run `npm run check` and `npm run build`, and commit to a branch if I ask. Don't push.
6. **Report** what changed and which files were touched.

## Current text (as of 24 Oct 2026)

This is the content now in `data/projects.json`, written out as the original Wix template for reference.

```text
Work in progress, updated after every PR.

A C++20 game engine with a hand-written Vulkan 1.3 renderer, built from scratch as the foundation for rendering an Interstellar-style wormhole and skybox.

Architecture: three modules. There's an abstract core interface (IRenderer, IWindow), an engine layer (EnTT ECS, mesh and shader managers, Assimp import), and a Vulkan backend that implements the core interface. Every Vulkan object is a move-only RAII wrapper paired with a fluent, validating builder.

Working now: FBX meshes loaded from disk and uploaded to the GPU, a pipeline cache keyed on shader pairs, an ECS rotate system, a perspective camera (left-handed, Z-up), per-object MVP matrices sent as push constants, and frames in flight with fence and semaphore synchronisation.

Known issues:
- No depth buffer yet, so back faces can draw over front faces (visible in the current clip).
- Vertex and index buffers are host-visible and not yet staged into device-local memory.
- Swapchain resize isn't handled.

Roadmap: depth attachment, then staging buffers, then descriptor sets, then a skybox. After that comes a compute pipeline that ray-marches light paths through curved spacetime to render the wormhole's gravitational lensing.
```

## Snippet images

The goal is 1–2 snippets that impress graphics or engine hiring managers. Prefer code that shows GPU and Vulkan understanding over boilerplate.

- **Current picks:** the frame loop and sync code (`renderer/project-v-vulkan/src/vulkanRenderer.cpp`: `beginFrame` / `draw` / `endFrame`), and `createGraphicsPipeline` using the builders.
- **Strong future candidates:** the staging-buffer upload with its copy and barrier, and especially the **wormhole compute shader**, plus its dispatch and the barrier between compute and graphics. Once that exists, it should replace one of the current snippets.
- Keep each snippet to 20–50 lines. Trim unrelated code, but keep it faithful to the real implementation. Add short `//` comments that explain *why*, not *what*.
- Render it as a PNG: Pygments `ImageFormatter`, style `monokai`, `DejaVu Sans Mono` at 17 px, no line numbers, on a dark rounded "window" frame with a title bar showing `<file> — <topic>`.
- Convert it to **lossless** WebP so the code stays sharp: `Image.open(p).save(out, 'WEBP', lossless=True, method=6)`.
- Give each snippet a `title`, a one-sentence `caption` and `alt` text.

## Context about me (for tone)

I'm a graphics and engine programmer with 7 years' experience (Unreal Engine, C++, rendering) and I'm applying for senior Unreal and graphics roles. Keep the copy concise and technical, with no hype.

## Appendix: legacy Wix identifiers

The old Wix site is no longer the source of truth. These IDs are kept only for reference, in case the Wix project needs a final update or removal.

| What | Value |
| --- | --- |
| Wix site | `Pranavgamedev`, site ID `b01efafa-4fd0-4420-b13e-4f2008b3bc5e` |
| Live URL | <https://pksimpleid2.wixsite.com/pranavgamedev> |
| Portfolio project | `Project V — Vulkan Engine [WIP]`, project ID `8708abe8-69c5-40db-94a9-cc60471fae91`, slug `project-v` |
| Cover image | media ID `f16606_8ee83561d38049c98fa68e4b99feadd4~mv2.png` (1280×720) |
| Item 1: "Frames in flight & draw loop" | item ID `30a5aadb-b373-4ce5-8037-181a1bbfa4c4`, media `f16606_8849c0f8a4974d55804697d9b87168db~mv2.png` (1273×1300) |
| Item 2: "Pipeline creation with RAII + builders" | item ID `cabd218d-34ce-40ca-b7cf-b8bfb07a0649`, media `f16606_11fcbd6050ba4481843f2412d6b18c79~mv2.png` (1209×840) |
