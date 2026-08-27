# Caption Confidence — visual thesis

## Direction: brutalist concrete and moss

Caption Confidence is a listening utility, not a clinical dashboard. Its world is a quiet concrete listening room where dense caption slabs are made legible by living moss marks. Concrete gives the interface dependable weight; moss indicates the exact fragment that deserves a second look. Hard one-pixel rules, clipped corners, stamped labels, and exposed measurements make the local tool feel inspectable rather than mysterious.

The experience is deliberately single-mode: a warm daylight concrete surface. The in-video overlay is separately dark because captions must remain readable over arbitrary footage. This is not a theme omission—the product metaphor depends on paper-white aggregate and ink, while the caption stage needs stable optical contrast.

## Tokens

- `--concrete-0 #f3f0e7`: page background, like pale aggregate.
- `--concrete-1 #e4dfd1`: inset surfaces and ruled bands.
- `--ink #171b17`: primary text (15.3:1 on the background).
- `--muted #51584f`: secondary text (6.4:1 on the background).
- `--moss #325c32`: action and focus color (7.1:1 on the background).
- `--lichen #d6e35a`: uncertainty marker; always paired with underlining, weight, or a label.
- `--signal #b34d24`: timing-strain warning, paired with a hatched underline and “timing” label.
- `--danger #8d2f2f`, `--success #285a3a`: explicit status colors with text/icons.
- Video overlay: `#101410` at 94% with `#fffdf4` copy and lichen markers. Caption text remains above 12:1 regardless of the footage.

Spacing follows a 4/8 px rhythm: 4, 8, 12, 16, 24, 32, 48, 72. Controls are at least 44 px. Layout caps readable copy at 68 characters and uses broad breathing room before adding containers. Mobile drops the decorative measurement rail, stacks actions, and makes the caption specimen full bleed.

## Type

- Display and controls: `Arial Narrow`, `Roboto Condensed`, `Arial`, sans-serif. Narrow industrial letterforms evoke labeling tape without a font download.
- Reading and captions: `Georgia`, `Times New Roman`, serif. The open forms and serifs make phrase boundaries calmer at caption speed.
- Utility labels and measurements use the system monospace stack with tabular figures.

No remote fonts or font files are required. The scale is 14 / 16 / 20 / 28 / clamp(40–72) px, with body copy at 17 px and 1.55 line height.

## Interaction grammar and depth

Buttons are rectangular slabs with a 2 px ink edge and a 3 px offset shadow. Pressing moves the slab onto its shadow. Focus is a 3 px lichen outer ring plus a dark inner edge. Selected controls gain a left moss bar and explicit text. Status is expressed as a stamped word plus color, never color alone. File drop is also a keyboard-operable file button.

The overlay rises from the video’s lower edge over 180 ms. Highlight marks fade in over 140 ms; no element bounces, pulses, or loops. Under `prefers-reduced-motion: reduce`, transitions and smooth scrolling are disabled and state changes are instant.

## Original asset plan

One generated editorial hero still shows a small cast-concrete listening block with a precise caption slot and a narrow seam of moss, photographed as an accessibility instrument rather than a product mockup. It explains the “concrete certainty / moss attention” metaphor without claiming the extension can generate captions. Hand-authored SVG icons are limited to simple waveform, file, and replay marks and use no outside icon set.

### Prompt sheet

Subject: a small abstract caption-listening instrument made from cast concrete, two horizontal inset caption bars, a fine seam of living moss marking one uncertain segment. World/materials: quiet brutalist tabletop, mineral aggregate, soft paper backdrop, tactile moss, no electronics branding. Light/lens: overcast north-window light, orthographic editorial still life, 50 mm, crisp material detail, restrained shadow. Palette words: warm limestone, soot ink, forest moss, acid lichen accent. Negative list: people, ears, hearing aids, medical imagery, screens with legible words, logos, brands, gradients, neon, glossy plastic, clutter, watermark, text.

Asset prompt: “Editorial still life of a small abstract caption-listening instrument made from warm cast concrete, two long horizontal inset caption bars, a fine seam of living forest moss marking one uncertain segment, quiet brutalist tabletop, pale mineral paper backdrop, soft overcast north-window light, orthographic three-quarter view, 50mm lens, crisp aggregate and tactile moss detail, soot black and acid lichen accents, generous negative space, accessibility design object, no people, no ears, no medical device, no readable text, no logos, no brands, no gradients, no neon, no glossy plastic, no watermark.”

Provenance: generated for this product with the factory Azure OpenAI image deployment (`factory-image`) on 2026-08-27. Original AI-generated asset; no third-party source material or trademarks requested. Source PNG and prompt sidecar are retained in `assets/src/`; optimized WebP is shipped.
