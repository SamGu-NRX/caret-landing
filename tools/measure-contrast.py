"""Sample the real action-material composite and report WCAG contrast.

Replicates what material.css actually paints, in the same order the browser
does: the base radial, then the white specular blended with `overlay`, then
the optional hover specular (an ::after at element opacity). Blending runs on
non-linear sRGB, which is what CSS does, so the values here are comparable to
a screenshot sample rather than to an estimate from the stop colours.

Two figures per state, matching the source file's convention:
  footprint-min  worst sample in x 0.20-0.80, y 0.30-0.70, where glyphs sit
  face-min       worst sample over the whole face

Run: python3 tools/measure-contrast.py
"""

from __future__ import annotations

PAPER = "#f9f7f2"

# Values as declared in src/styles/tokens.css.
ACTION_LIFT = "#2a58c2"
ACTION_BASE = "#142a70"
ACTION_SPEC = 0.32
ACTION_SPEC_HOVER = 0.58
HOVER_LAYER_OPACITY = 0.58
ACTION_INK = "#f6f7fb"

PILL_LIFT = "#2b4fa8"
PILL_BASE = "#1a327a"
PILL_SPEC = 0.22
PILL_INK = "#f9f7f2"

# Glass accent face stops, declared with alpha, so they composite onto paper.
GLASS_STOPS = [((18, 30, 78), 0.96), ((31, 58, 134), 0.90), ((50, 92, 184), 0.84)]

TEXT = {
    "primary #17181c": "#17181c",
    "secondary #47494f": "#47494f",
    "tertiary #6b6d75": "#6b6d75",
    "accent #23418f": "#23418f",
}


def rgb(value: str) -> tuple[float, float, float]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) / 255 for i in (0, 2, 4))  # type: ignore[return-value]


def hex_of(color: tuple[float, float, float]) -> str:
    return "#%02x%02x%02x" % tuple(round(max(0.0, min(1.0, c)) * 255) for c in color)


def luminance(color: tuple[float, float, float]) -> float:
    def channel(c: float) -> float:
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4

    r, g, b = (channel(c) for c in color)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: tuple[float, float, float], b: tuple[float, float, float]) -> float:
    la, lb = luminance(a), luminance(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)


def over(fg: tuple[float, float, float], alpha: float, bg: tuple[float, float, float]):
    return tuple(f * alpha + b * (1 - alpha) for f, b in zip(fg, bg))


def radial_t(x: float, y: float, cx: float, cy: float, rx: float, ry: float) -> float:
    """Gradient position at (x, y) for a radial whose ending shape is rx x ry."""
    return min(1.0, (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2) ** 0.5)


def face(x: float, y: float, lift: str, base: str) -> tuple[float, float, float]:
    """radial-gradient(114.65% 114.65% at 9.73% 17.27%, lift, base)"""
    t = radial_t(x, y, 0.0973, 0.1727, 1.1465, 1.1465)
    a, b = rgb(lift), rgb(base)
    return tuple(p + (q - p) * t for p, q in zip(a, b))  # type: ignore[return-value]


def specular_alpha(x: float, y: float, peak: float) -> float:
    """radial-gradient(101.79% 101.79% at 65.61% 81.79%, white peak, white 0)"""
    return peak * (1 - radial_t(x, y, 0.6561, 0.8179, 1.0179, 1.0179))


def overlay_white(backdrop: tuple[float, float, float], alpha: float):
    """White source through `overlay`: doubles a channel below 0.5, pins above."""
    blended = tuple(min(2 * c, 1.0) if c <= 0.5 else 1.0 for c in backdrop)
    return tuple(b * alpha + d * (1 - alpha) for b, d in zip(blended, backdrop))


def sample(lift: str, base: str, spec: float, hover: float | None):
    def at(x: float, y: float):
        composite = overlay_white(face(x, y, lift, base), specular_alpha(x, y, spec))
        if hover is not None:
            composite = overlay_white(composite, specular_alpha(x, y, hover))
        return composite

    steps = 80
    grid = [(i / steps, j / steps) for i in range(steps + 1) for j in range(steps + 1)]
    footprint = [p for p in grid if 0.20 <= p[0] <= 0.80 and 0.30 <= p[1] <= 0.70]
    return at, footprint, grid


def report(name: str, lift: str, base: str, spec: float, ink: str, hover: float | None = None):
    at, footprint, grid = sample(lift, base, spec, hover)
    ink_rgb = rgb(ink)
    foot = min((contrast(ink_rgb, at(x, y)), (x, y)) for x, y in footprint)
    whole = min((contrast(ink_rgb, at(x, y)), (x, y)) for x, y in grid)
    mid = contrast(ink_rgb, at(0.5, 0.5))
    print(
        f"{name:<22} footprint-min {foot[0]:.2f}:1   face-min {whole[0]:.2f}:1"
        f"   midpoint {mid:.2f}:1   worst face {hex_of(at(*whole[1]))}"
    )
    return foot[0], whole[0]


def main() -> None:
    paper = rgb(PAPER)

    print("Action material, measured on the real composite")
    hover_alpha = ACTION_SPEC_HOVER * HOVER_LAYER_OPACITY
    report("action rest", ACTION_LIFT, ACTION_BASE, ACTION_SPEC, ACTION_INK)
    report("action hover", ACTION_LIFT, ACTION_BASE, ACTION_SPEC, ACTION_INK, hover_alpha)
    report("pill-raised rest", PILL_LIFT, PILL_BASE, PILL_SPEC, PILL_INK)
    print(f"  (hover specular is {ACTION_SPEC_HOVER} at {HOVER_LAYER_OPACITY} layer opacity = {hover_alpha:.2f} effective)")
    ratio = (luminance(rgb(ACTION_LIFT)) + 0.05) / (luminance(rgb(ACTION_BASE)) + 0.05)
    print(f"  action stop-luminance ratio {ratio:.2f}:1")

    print("\nGlass accent face, stops composited onto paper")
    for label, (stop, alpha) in zip(("top", "mid", "bottom"), GLASS_STOPS):
        composited = over(tuple(c / 255 for c in stop), alpha, paper)
        print(f"  {label:<7} {hex_of(composited)}  {contrast(composited, paper):.2f}:1 on paper")

    print("\nText on paper")
    for label, value in TEXT.items():
        print(f"  {label:<20} {contrast(rgb(value), paper):.2f}:1")

    print("\nText on the glass panel face (white 0.52 -> 0.14 over paper)")
    for alpha in (0.52, 0.14):
        panel = over((1.0, 1.0, 1.0), alpha, paper)
        primary = contrast(rgb(TEXT["primary #17181c"]), panel)
        tertiary = contrast(rgb(TEXT["tertiary #6b6d75"]), panel)
        print(f"  face {alpha}: {hex_of(panel)}  primary {primary:.2f}:1  tertiary {tertiary:.2f}:1")

    print("\nText on tinted demo surfaces")
    soft = over(rgb("#23418f"), 0.10, paper)
    mark = over((1.0, 205 / 255, 60 / 255), 0.42, paper)
    print(f"  accent-soft row {hex_of(soft)}  primary {contrast(rgb(TEXT['primary #17181c']), soft):.2f}:1"
          f"  secondary {contrast(rgb(TEXT['secondary #47494f']), soft):.2f}:1"
          f"  tertiary {contrast(rgb(TEXT['tertiary #6b6d75']), soft):.2f}:1")
    print(f"  highlighter     {hex_of(mark)}  primary {contrast(rgb(TEXT['primary #17181c']), mark):.2f}:1")


if __name__ == "__main__":
    main()
