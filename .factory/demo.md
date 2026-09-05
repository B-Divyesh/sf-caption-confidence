# Caption Confidence demo

## Entry point

Open <https://caption-confidence.sociobot.in/demo/> or select **Try it with sample data** on the home page.

The first demo screen is already populated with four realistic caption lines. The sample includes the exact pairs `sip / ship`, `fine / vine`, and `tin / kin`. It also includes source-marked uncertainty, compressed timing, and overlapping timing.

## What to try

- Select any caption line.
- Change a word pair and see the rendered mark change.
- Press **R** or **Replay current caption** and watch the displayed playback position move to the 0.8-second lead-in.
- Hide tight-timing labels or change the caption size.
- Import a local VTT or SRT file into the in-page demo.

## Isolation and reset

The demo never reads or writes extension storage or the website license keys. Its only storage value is the session marker `demo:caption-confidence:active`. Caption content and setting changes remain in page memory.

**Reset demo** removes every `demo:caption-confidence:` session key and restores the four shipped cues. **Start for real** removes the demo namespace before opening the extension download section. It does not copy sample data into real storage.
