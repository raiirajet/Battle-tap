#!/usr/bin/env python3
"""Generate PWA icons from the SAME launcher art as the Android app."""
from pathlib import Path
from PIL import Image

source = Image.open('assets/branding/app_icon.png').convert('RGBA')
target = Path('web/icons')
target.mkdir(parents=True, exist_ok=True)
background = (9, 13, 22, 255)

def output(size, path, padding=0):
    icon = source.resize((size - 2 * padding, size - 2 * padding), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (size, size), background)
    canvas.alpha_composite(icon, (padding, padding))
    canvas.convert('RGB').save(path, 'PNG', optimize=True)

output(192, target / 'Icon-192.png')
output(512, target / 'Icon-512.png')
output(512, target / 'Icon-maskable-512.png', padding=90)
output(48, Path('web/favicon.png'))
print('PWA icons generated from app launcher artwork')
