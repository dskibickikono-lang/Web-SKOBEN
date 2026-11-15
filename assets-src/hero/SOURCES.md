# Hero imagery — sources and licences

Download date for every file below: **2026-11-14**.
These are candidates for art direction, not final assets. Previews and contact sheets: `docs/art-direction/candidates/`.

## Licences (as read on 2026-11-14)

**Unsplash License** — https://unsplash.com/license
- Free download and use, commercial and non-commercial; no permission needed; attribution appreciated but not required ("Photo by <author> on Unsplash").
- Not permitted: selling the images without significant modification; compiling Unsplash images to replicate a similar or competing service.
- The licence page says nothing about trademarks, logos, property or people visible in a photo — those are not cleared by the licence.
- Unsplash+ (plus.unsplash.com / "premium") photos fall under a different licence; none were downloaded.

**Mixkit Stock Video Free License** — https://mixkit.co/license/#videoFree
- Free for commercial and non-commercial projects (online marketing, commercial projects, social media, YouTube etc.).
- Permitted: download, copy, modify, distribute, publicly perform and broadcast. Rights are non-exclusive, worldwide, sub-licensable and ongoing. Attribution not required (credit to Mixkit appreciated).
- Limits from the Mixkit User Terms (https://mixkit.co/terms/): no selling copies without real alteration, no redistribution on a stock/inventory basis, no building a competing service, no mass/bot downloading of the library; third-party components inside an item (trade marks, brands) are not cleared — clause 13.
- Mixkit also has a **Stock Video Restricted License** (personal projects only, no commercial or company use, free download capped at 720p). Each video page states which licence applies. All five clips below are marked Free License on their pages. Clips rejected because they are Restricted: 45667 "Blank laptop screen on a desk", 15478 "Empty office space", 14770 "Modern corporate offices", 17438 "Lamp on in a dark room", 17450 "Working on a laptop at night".

## Stills — `stills/`

| File | Source page | Author | Licence | Original size |
|---|---|---|---|---|
| `01-jon-tyson-empty-desk-window-bw_HsMVmGngmWM.jpg` | https://unsplash.com/photos/HsMVmGngmWM | Jon Tyson (@jontyson) | Unsplash License | 5336×4002 |
| `02-cuvii-laptop-snowy-mountains-window_cP72_Ns2nIc.jpg` | https://unsplash.com/photos/cP72_Ns2nIc | Cuvii (@cuvii) | Unsplash License | 7728×5152 |
| `03-chuttersnap-laptop-desk-morning-haze_jMV-I82HYjg.jpg` | https://unsplash.com/photos/jMV-I82HYjg | CHUTTERSNAP (@chuttersnap) | Unsplash License | 6048×4024 |
| `04-nathan-defiesta-monitor-amber-wall_jmPcf3acdps.jpg` | https://unsplash.com/photos/jmPcf3acdps | Nathan DeFiesta (@natedefiesta) | Unsplash License | 4096×2731 |
| `05-roland-denes-empty-chair-wood-wall_65-KSl_58p4.jpg` | https://unsplash.com/photos/65-KSl_58p4 | Roland Denes (@denesroland) | Unsplash License | 6720×4159 |
| `06-jayanth-muppaneni-laptop-blind-shadows_AiHe7YW1IOo.jpg` | https://unsplash.com/photos/AiHe7YW1IOo | Jayanth Muppaneni (@jay_5) | Unsplash License | 5041×3049 |
| `07-geert-pieters-laptop-white-wall-portrait_XAg7CqxcIx4.jpg` | https://unsplash.com/photos/XAg7CqxcIx4 | Geert Pieters (@shotsbywolf) | Unsplash License | 5000×7500 (portrait) |
| `08-evan-wise-desk-nook-dusk-portrait_Ca_WFsAa-cE.jpg` | https://unsplash.com/photos/Ca_WFsAa-cE | Evan Wise (@evanthewise) | Unsplash License | 2166×3243 (portrait) |

Files are the originals served by `images.unsplash.com/<photo id>` with no resize parameters.

## Video — `video/`

| File | Source page | Author | Licence | Format |
|---|---|---|---|---|
| `mixkit-3091-minimalist-room-with-wooden-furniture-1080p.mp4` | https://mixkit.co/free-stock-video/minimalist-room-with-wooden-furniture-3091/ | Mixkit contributor @edgarfernandez | Mixkit Stock Video Free License | 1920×1080, 23.976 fps, 12.0 s |
| `mixkit-3092-minimalist-room-with-coffee-table-1080p.mp4` | https://mixkit.co/free-stock-video/minimalist-room-with-coffee-table-with-books-and-magazines-3092/ | Mixkit contributor @edgarfernandez | Mixkit Stock Video Free License | 1920×1080, 23.976 fps, 12.0 s |
| `mixkit-3113-room-with-coffee-table-at-night-1080p.mp4` | https://mixkit.co/free-stock-video/room-with-coffee-table-at-night-3113/ | Mixkit contributor @edgarfernandez | Mixkit Stock Video Free License | 1920×1080, 23.976 fps, 10.2 s |
| `mixkit-3090-modern-living-room-with-wooden-furniture-1080p.mp4` | https://mixkit.co/free-stock-video/modern-living-room-with-wooden-furniture-3090/ | Mixkit contributor @edgarfernandez | Mixkit Stock Video Free License | 1920×1080, 23.976 fps, 10.3 s |
| `mixkit-3977-view-of-a-window-with-a-curtain-1080p.mp4` | https://mixkit.co/free-stock-video/view-of-a-window-with-a-curtain-3977/ | Mixkit contributor @edgarfernandez | Mixkit Stock Video Free License | 1920×1080, 23.976 fps, 11.0 s |

All five are slow lateral slider moves, not push-ins, and none shows a screen.

## Scrub-ready derivatives — `scrub/`

Synthetic push-ins made with ffmpeg `zoompan` from the stills above (1.0× → 1.5×, cosine ease-in-out, 150 frames, 30 fps, 5.0 s). H.264 High, yuv420p, CRF 22, `-g 1` (every frame a keyframe), `+faststart`, no audio.

| File | Made from | Size |
|---|---|---|
| `hero-01-jon-tyson-pushin-1920x1080.mp4` | still 01 (Jon Tyson, Unsplash License) | 7.7 MB |
| `hero-01-jon-tyson-pushin-1080x1920.mp4` | still 01 (Jon Tyson, Unsplash License) | 8.5 MB |
| `hero-02-cuvii-pushin-1920x1080.mp4` | still 02 (Cuvii, Unsplash License) | 10.8 MB |
| `hero-02-cuvii-pushin-1080x1920.mp4` | still 02 (Cuvii, Unsplash License) | 17.5 MB |

## Things to clear before publishing

- Still 01: laptop screen shows a wallpaper image; takeaway cups and a plastic bottle on the desk; a car and a parking garage through the window. Hardware is recognisably a MacBook (no logo visible).
- Still 02: the laptop is out of focus (focus is on the mountains), which shows at 1.5×. MacBook, no logo visible.
- Still 03: hotel desk phone in the foreground.
- Still 06: a faint Apple logo on the laptop lid.
- Still 07: a skull-and-crossbones mark on the laptop lid — retouch before use.
- No people in any still or clip.
