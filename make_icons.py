"""Genera el logo de SafeShare y todos los iconos de la PWA.

Logo: un candado blanco sobre un círculo con degradado azul (accent),
representando el cifrado y la protección del dato compartido.

- icons/logo-source.png: el logo base (fondo transparente).
- icon-192 / icon-512: el logo tal cual.
- maskable-512: logo centrado sobre fondo blanco con zona segura.
- apple-touch-180: logo sobre fondo blanco opaco (iOS no admite transparencia).
- favicon-32: logo reducido.

Requiere Pillow: pip install pillow
"""
from PIL import Image, ImageDraw

ACCENT_A = (239, 138, 60, 255)  # #ef8a3c, naranja claro de marca (inicio degradado)
ACCENT_B = (200, 95, 20, 255)   # #c85f14, naranja profundo (fin degradado)
WHITE = (255, 255, 255, 255)
BG_WHITE = (255, 255, 255, 255)

SOURCE_SIZE = 512


def radial_or_diagonal_gradient(size):
    """Genera un degradado diagonal simple entre ACCENT_A y ACCENT_B."""
    grad = Image.new('RGBA', (size, size), ACCENT_A)
    px = grad.load()
    for y in range(size):
        for x in range(size):
            t = (x + y) / (2 * size)
            r = int(ACCENT_A[0] + (ACCENT_B[0] - ACCENT_A[0]) * t)
            g = int(ACCENT_A[1] + (ACCENT_B[1] - ACCENT_A[1]) * t)
            b = int(ACCENT_A[2] + (ACCENT_B[2] - ACCENT_A[2]) * t)
            px[x, y] = (r, g, b, 255)
    return grad


def draw_circle_bg(size):
    """Círculo con degradado azul de fondo para el logo."""
    grad = radial_or_diagonal_gradient(size)
    mask = Image.new('L', (size, size), 0)
    mdraw = ImageDraw.Draw(mask)
    margin = size * 0.03
    mdraw.ellipse([margin, margin, size - margin, size - margin], fill=255)
    out = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    out.paste(grad, (0, 0), mask)
    return out


def draw_lock(draw, size):
    """Dibuja un candado blanco simplificado centrado."""
    w, h = size, size
    cx = w / 2

    # Cuerpo del candado (rectángulo redondeado).
    body_w = w * 0.42
    body_h = h * 0.34
    body_top = h * 0.50
    body_left = cx - body_w / 2
    body_right = cx + body_w / 2
    body_bottom = body_top + body_h
    radius = w * 0.05
    draw.rounded_rectangle(
        [body_left, body_top, body_right, body_bottom], radius=radius, fill=WHITE
    )

    # Ojo de la cerradura: círculo + trazo pequeño.
    key_r = w * 0.045
    key_cx, key_cy = cx, body_top + body_h * 0.42
    draw.ellipse(
        [key_cx - key_r, key_cy - key_r, key_cx + key_r, key_cy + key_r],
        fill=ACCENT_A,
    )
    draw.rectangle(
        [key_cx - key_r * 0.4, key_cy, key_cx + key_r * 0.4, key_cy + key_r * 1.6],
        fill=ACCENT_A,
    )

    # Grillete (arco superior).
    shackle_r = w * 0.18
    shackle_stroke = max(int(w * 0.055), 6)
    bbox = [cx - shackle_r, body_top - shackle_r * 1.55, cx + shackle_r, body_top + shackle_r * 0.45]
    draw.arc(bbox, start=180, end=360, fill=WHITE, width=shackle_stroke)


def build_logo_source():
    img = draw_circle_bg(SOURCE_SIZE)
    draw = ImageDraw.Draw(img)
    draw_lock(draw, SOURCE_SIZE)
    img.save('icons/logo-source.png')
    print('-> icons/logo-source.png')
    return img


def load_logo():
    return Image.open('icons/logo-source.png').convert('RGBA')


def transparent(out, size):
    logo = load_logo().resize((size, size), Image.LANCZOS)
    logo.save(out)
    print('->', out)


def on_background(out, size, safe=0.80, opaque=False):
    canvas = Image.new('RGBA', (size, size), BG_WHITE)
    inner = int(size * safe)
    logo = load_logo().resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    canvas.alpha_composite(logo, (off, off))
    if opaque:
        canvas = canvas.convert('RGB')
    canvas.save(out)
    print('->', out)


if __name__ == '__main__':
    build_logo_source()
    transparent('icons/icon-192.png', 192)
    transparent('icons/icon-512.png', 512)
    on_background('icons/maskable-512.png', 512, safe=0.72)
    on_background('icons/apple-touch-180.png', 180, safe=0.82, opaque=True)
    transparent('icons/favicon-32.png', 32)
