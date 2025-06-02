#!/usr/bin/env python3
"""
Create professional icons for Chrome extension
Run: python3 create-icons.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create a new image with a modern blue background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Background circle
    margin = size // 8
    draw.ellipse([margin, margin, size-margin, size-margin], 
                fill='#4285F4', outline='#1A73E8', width=2)
    
    # Robot icon - simplified
    center = size // 2
    
    # Robot head (rectangle with rounded corners)
    head_size = size // 3
    head_left = center - head_size // 2
    head_top = center - head_size // 2
    draw.rounded_rectangle(
        [head_left, head_top, head_left + head_size, head_top + head_size],
        radius=size//20, fill='white', outline='#1A73E8', width=2
    )
    
    # Eyes
    eye_size = size // 20
    eye_y = center - head_size // 6
    draw.ellipse([center - head_size//4 - eye_size//2, eye_y - eye_size//2,
                  center - head_size//4 + eye_size//2, eye_y + eye_size//2], 
                 fill='#1A73E8')
    draw.ellipse([center + head_size//4 - eye_size//2, eye_y - eye_size//2,
                  center + head_size//4 + eye_size//2, eye_y + eye_size//2], 
                 fill='#1A73E8')
    
    # Simple "AI" text for larger icons
    if size >= 48:
        try:
            font_size = max(8, size // 8)
            font = ImageFont.truetype("/System/Library/Fonts/Arial.ttf", font_size)
            text = "AI"
            bbox = draw.textbbox((0, 0), text, font=font)
            text_width = bbox[2] - bbox[0]
            text_height = bbox[3] - bbox[1]
            text_x = center - text_width // 2
            text_y = center + head_size // 4
            draw.text((text_x, text_y), text, fill='#1A73E8', font=font)
        except:
            pass  # Skip text if font not available
    
    # Save the image
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

# Create icons directory if it doesn't exist
os.makedirs('icons', exist_ok=True)

# Create all required icon sizes
sizes = [16, 48, 128]
for size in sizes:
    create_icon(size, f'icons/icon{size}.png')

print("✅ All icons created successfully!")
print("📁 Icons are in the ./icons/ directory")
