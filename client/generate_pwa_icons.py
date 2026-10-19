import os
from PIL import Image, ImageDraw

def create_icon(size, is_maskable=False):
    # Render at 4x for super sampling / smooth antialiasing
    scale = 4
    canvas_size = size * scale
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    center = canvas_size // 2
    
    # Colors
    primary_green = (5, 150, 105, 255)      # #059669
    dark_green = (4, 120, 87, 255)         # #047857
    white = (255, 255, 255, 255)
    light_mint = (209, 250, 229, 255)      # #D1FAE5
    accent_emerald = (16, 185, 129, 255)   # #10B981

    if is_maskable:
        # Full background bleed for maskable safe-zone compliance
        # Radial / vertical gradient effect
        for y in range(canvas_size):
            ratio = y / canvas_size
            r = int(primary_green[0] * (1 - ratio) + dark_green[0] * ratio)
            g = int(primary_green[1] * (1 - ratio) + dark_green[1] * ratio)
            b = int(primary_green[2] * (1 - ratio) + dark_green[2] * ratio)
            draw.line([(0, y), (canvas_size, y)], fill=(r, g, b, 255))
        
        # Safe zone radius is 40% of canvas_size -> total width 80%
        # Emblem sized comfortably within safe zone (60% of canvas)
        emblem_scale = 0.58
    else:
        # Rounded squircle container for regular icon
        corner_radius = int(canvas_size * 0.22)
        # Background squircle
        draw.rounded_rectangle(
            [(int(canvas_size * 0.04), int(canvas_size * 0.04)),
             (int(canvas_size * 0.96), int(canvas_size * 0.96))],
            radius=corner_radius,
            fill=primary_green
        )
        emblem_scale = 0.62

    # Draw Emblem in center: Modern House + Sync/Heart motif
    # Center is at (center, center)
    w = int(canvas_size * emblem_scale)
    h = int(canvas_size * emblem_scale)
    top = center - h // 2
    bottom = center + h // 2
    left = center - w // 2
    right = center + w // 2

    # Roof vertices:
    roof_peak = (center, top + int(h * 0.08))
    roof_left = (left + int(w * 0.06), top + int(h * 0.44))
    roof_right = (right - int(w * 0.06), top + int(h * 0.44))

    # Roof thickness / overhanging polygon
    roof_thickness = int(w * 0.085)
    draw.polygon([
        roof_peak,
        roof_right,
        (roof_right[0] - roof_thickness, roof_right[1] + roof_thickness // 2),
        (roof_peak[0], roof_peak[1] + int(roof_thickness * 1.2)),
        (roof_left[0] + roof_thickness, roof_left[1] + roof_thickness // 2),
        roof_left
    ], fill=white)

    # Chimney
    chimney_left = center + int(w * 0.22)
    chimney_right = chimney_left + int(w * 0.1)
    chimney_top = top + int(h * 0.14)
    chimney_bottom = top + int(h * 0.32)
    draw.rounded_rectangle(
        [(chimney_left, chimney_top), (chimney_right, chimney_bottom)],
        radius=scale * 4,
        fill=light_mint
    )

    # House body walls
    wall_left = left + int(w * 0.18)
    wall_right = right - int(w * 0.18)
    wall_top = top + int(h * 0.44)
    wall_bottom = bottom - int(h * 0.05)
    wall_radius = int(w * 0.08)

    draw.rounded_rectangle(
        [(wall_left, wall_top), (wall_right, wall_bottom)],
        radius=wall_radius,
        fill=white
    )

    # Interior cutout / Sync ring and coins / pantry icon
    # Central circle inside the house
    house_cx = center
    house_cy = wall_top + (wall_bottom - wall_top) // 2
    ring_radius = int(w * 0.18)

    # Green circle inside
    draw.ellipse(
        [(house_cx - ring_radius, house_cy - ring_radius),
         (house_cx + ring_radius, house_cy + ring_radius)],
        fill=primary_green
    )

    # Inside green circle: Two curved sync arrows forming a cycle
    inner_r = int(ring_radius * 0.65)
    draw.arc(
        [(house_cx - inner_r, house_cy - inner_r),
         (house_cx + inner_r, house_cy + inner_r)],
        start=30, end=150,
        fill=white,
        width=int(scale * 5)
    )
    draw.arc(
        [(house_cx - inner_r, house_cy - inner_r),
         (house_cx + inner_r, house_cy + inner_r)],
        start=210, end=330,
        fill=white,
        width=int(scale * 5)
    )
    
    # Arrow heads for sync cycle
    arrow_size = int(scale * 8)
    # Arrow 1 near 150 deg:
    draw.polygon([
        (house_cx - int(inner_r * 0.86), house_cy + int(inner_r * 0.5)),
        (house_cx - int(inner_r * 0.86) - arrow_size, house_cy + int(inner_r * 0.5) - arrow_size // 2),
        (house_cx - int(inner_r * 0.86) + arrow_size // 2, house_cy + int(inner_r * 0.5) - arrow_size),
    ], fill=white)

    # Arrow 2 near 330 deg:
    draw.polygon([
        (house_cx + int(inner_r * 0.86), house_cy - int(inner_r * 0.5)),
        (house_cx + int(inner_r * 0.86) + arrow_size, house_cy - int(inner_r * 0.5) + arrow_size // 2),
        (house_cx + int(inner_r * 0.86) - arrow_size // 2, house_cy - int(inner_r * 0.5) + arrow_size),
    ], fill=white)

    # Center coin dot in white
    dot_r = int(scale * 4.5)
    draw.ellipse(
        [(house_cx - dot_r, house_cy - dot_r),
         (house_cx + dot_r, house_cy + dot_r)],
        fill=light_mint
    )

    # Downsample with Lanczos for smooth results
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

def main():
    icons_dir = os.path.join("public", "icons")
    os.makedirs(icons_dir, exist_ok=True)

    sizes = [
        (192, False, "icon-192x192.png"),
        (192, True, "icon-192x192-maskable.png"),
        (512, False, "icon-512x512.png"),
        (512, True, "icon-512x512-maskable.png"),
        (180, False, "apple-touch-icon.png"),
    ]

    for size, is_maskable, filename in sizes:
        icon = create_icon(size, is_maskable)
        dest_path = os.path.join(icons_dir, filename)
        icon.save(dest_path, "PNG", optimize=True)
        print(f"Generated {dest_path} ({size}x{size}, maskable={is_maskable})")

if __name__ == "__main__":
    main()
