# Hero scene "pier" — sources (iteration 4)

Generated with Higgsfield under the owner's account (second temporary key, budget 4.77 USD), 2026-11-15.
No credentials are stored here.

| File | Model / endpoint | Parameters | Cost USD |
|---|---|---|---|
| `l05-pier-front-b.png` (2560×1440) | Ideogram 4.0 (`ideogram/v4.0`) | 16:9, QUALITY | 0.100 |
| `l06-pier-portrait.png` (1440×2560) | Ideogram 4.0 | 9:16, QUALITY | 0.100 |
| `v03-pier-landscape.mp4` (1920×1080, 24 fps, 241 frames) | Kling 3.0 Pro image-to-video (`kling-video/v3.0/pro/image-to-video`) | first frame = `l05`, 10 s, sound off, cfg 0.5 | 0.962 |
| `v04-pier-portrait.mp4` (1080×1920, 24 fps, 241 frames) | Kling 3.0 Pro image-to-video | first frame = `l06`, 10 s, sound off, cfg 0.5 | 0.962 |

Rejected candidates (not kept in the repo): `l01` pier with the laptop turned aside, `l02` hilltop meadow (too close to the
benchmark's own scene), `l03` dune (0.100 each, first key), `l04` pier with a more dramatic sky (0.100).
Spend on the second key: 2.224 USD. Spend on the first key: 3.755 USD.

Still prompt (landscape; the portrait adds "Vertical composition: the upper half of the frame is calm open sky, the desk
stands in the lower third."):

> A simple modern oak desk with a slim open aluminium laptop stands at the end of a wide weathered wooden pier on a vast
> calm lake just before sunrise. The laptop sits in the exact centre of the desk, perfectly square to the camera, its
> screen facing the camera straight-on with no rotation, so the screen is a clean upright rectangle. The screen is
> switched on but uniformly dark matte charcoal, with no content and no reflections. An empty mid-century office chair in
> tan leather is pulled out to the left side of the desk in the foreground, seen from behind, not blocking the laptop.
> The camera stands on the pier, centred, at laptop height, looking straight down the pier; the desk is centred, slightly
> below the middle of the frame. Beyond it still water with forested pine islands fading into mist. Early dawn: the upper
> sky is deep dusky blue, fading through violet to rose and peach at the horizon, thin high clouds, the sun just touching
> the horizon, gentle mist. The upper third of the frame is calm open sky. Cinematic editorial landscape photograph, 35mm
> full-frame lens, natural colours, soft light, fine film grain, everything in focus. No people, no logos, no text.
> Symmetrical composition.

Video prompt:

> Steady, continuous forward dolly along the centre of the wooden pier, at constant speed, gliding past the chair on the
> left and straight toward the open laptop on the desk, moving closer and closer until at the end the dark laptop screen
> fills almost the entire frame. Locked horizon: no pan, no tilt, no roll, no orbit, no handheld shake, no zoom breathing.
> Nothing in the scene moves or changes: the desk, the chair and the laptop stay perfectly still; the laptop screen stays
> uniformly dark matte charcoal with no content and no reflections. The lake is perfectly calm; only a very subtle drift
> of mist over the water. Photorealistic, cinematic, 35mm lens.

## Production files (`public/media/hero/`)

- `pier-landscape-1080.mp4` — frames 1–224, all-intra H.264 (`-g 1`), CRF 29, 4.7 MB
- `pier-landscape-720.mp4` — frames 1–224, CRF 28, 2.7 MB
- `pier-portrait-720.mp4` — frames 1–214, 720×1280, CRF 27, 3.3 MB
- posters: first frame of each clip (WebP)

The clips are cut before the laptop leaves the frame. In the last seconds the generated screen shows reflections
(including a human silhouette); the live console is drawn opaque over the screen, so they are never visible.

## Screen tracking

`scripts/track-screen.py <frames dir> <last frame> <out.json>` finds the dark laptop lid in every frame (edge scans from
a seed point, robust line fits, rigid-aspect correction for the bottom edge, temporal smoothing) and writes the four
corners per frame. `src/data/hero-track.json` holds every third frame; the page interpolates between them and maps the
console onto the display area with a projective transform.
