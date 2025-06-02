from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Create a square image with blue background
    img = Image.new('RGBA', (size, size), (26, 115, 232, 255))  # Google Blue
    draw = ImageDraw.Draw(img)
    
    # Draw a simple robot emoji-style icon
    # Head circle (white)
    head_size = size * 0.6
    head_pos = (size * 0.2, size * 0.15)
    draw.ellipse([head_pos[0], head_pos[1], head_pos[0] + head_size, head_pos[1] + head_size], 
                 fill=(255, 255, 255, 255))
    
    # Eyes (dark)
    eye_size = size * 0.08
    left_eye = (size * 0.35, size * 0.35)
    right_eye = (size * 0.55, size * 0.35)
    draw.ellipse([left_eye[0], left_eye[1], left_eye[0] + eye_size, left_eye[1] + eye_size], 
                 fill=(26, 115, 232, 255))
    draw.ellipse([right_eye[0], right_eye[1], right_eye[0] + eye_size, right_eye[1] + eye_size], 
                 fill=(26, 115, 232, 255))
    
    # Mouth (smile arc)
    mouth_box = [size * 0.4, size * 0.5, size * 0.6, size * 0.65]
    draw.arc(mouth_box, 0, 180, fill=(26, 115, 232, 255), width=int(size * 0.03))
    
    # Body (rectangle)
    body_width = size * 0.4
    body_height = size * 0.25
    body_pos = (size * 0.3, size * 0.7)
    draw.rectangle([body_pos[0], body_pos[1], body_pos[0] + body_width, body_pos[1] + body_height], 
                   fill=(255, 255, 255, 255))
    
    img.save(filename, 'PNG')
    print(f"Created {filename} ({size}x{size})")

# Create icons
create_icon(16, 'chrome-extension/icons/icon16.png')
create_icon(48, 'chrome-extension/icons/icon48.png')  
create_icon(128, 'chrome-extension/icons/icon128.png')

print("Icons created successfully!")
