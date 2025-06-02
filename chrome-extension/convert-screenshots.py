#!/usr/bin/env python3
"""
Convert screenshots to Chrome Web Store format
Requirements: 1280x800 or 640x400, JPEG or 24-bit PNG (no alpha)
"""

from PIL import Image
import os
import glob
from pathlib import Path

def convert_screenshot(input_path, output_dir, target_size=(1280, 800)):
    """Convert a screenshot to Chrome Web Store format"""
    try:
        # Open the image
        with Image.open(input_path) as img:
            # Convert to RGB if it has alpha channel
            if img.mode in ('RGBA', 'LA'):
                # Create white background
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'RGBA':
                    background.paste(img, mask=img.split()[-1])  # Use alpha channel as mask
                else:
                    background.paste(img)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Calculate aspect ratio
            original_width, original_height = img.size
            target_width, target_height = target_size
            
            # Calculate scaling to fit within target size while maintaining aspect ratio
            scale_width = target_width / original_width
            scale_height = target_height / original_height
            scale = min(scale_width, scale_height)
            
            # Calculate new dimensions
            new_width = int(original_width * scale)
            new_height = int(original_height * scale)
            
            # Resize image
            img_resized = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            
            # Create canvas with target size and white background
            canvas = Image.new('RGB', target_size, (255, 255, 255))
            
            # Center the resized image on canvas
            x_offset = (target_width - new_width) // 2
            y_offset = (target_height - new_height) // 2
            canvas.paste(img_resized, (x_offset, y_offset))
            
            # Generate output filename
            input_filename = Path(input_path).stem
            output_filename = f"{input_filename}_chrome_store.png"
            output_path = os.path.join(output_dir, output_filename)
            
            # Save as PNG with no alpha
            canvas.save(output_path, 'PNG', optimize=True)
            
            print(f"✅ Converted: {input_filename}")
            print(f"   Original: {original_width}x{original_height}")
            print(f"   Output: {target_width}x{target_height}")
            print(f"   Saved: {output_path}")
            print()
            
            return output_path
            
    except Exception as e:
        print(f"❌ Error converting {input_path}: {e}")
        return None

def main():
    # Input directory (Desktop)
    desktop_path = "/Users/ddod/Desktop"
    
    # Output directory
    output_dir = "chrome_store_screenshots"
    os.makedirs(output_dir, exist_ok=True)
    
    # Find recent screenshots (May 29, 2025)
    recent_patterns = [
        "Screenshot 2025-05-29*.png",
        "Screenshot 2025-05-28*.png",  # Include May 28 as backup
    ]
    
    screenshots = []
    for pattern in recent_patterns:
        screenshots.extend(glob.glob(os.path.join(desktop_path, pattern)))
    
    # Sort by filename (which includes timestamp)
    screenshots.sort(reverse=True)  # Most recent first
    
    print(f"🔍 Found {len(screenshots)} recent screenshots")
    print(f"📁 Output directory: {output_dir}")
    print("=" * 50)
    
    # Convert up to 5 screenshots (Chrome Web Store limit)
    converted_count = 0
    target_sizes = [(1280, 800), (640, 400)]  # Two size options
    
    # Use the larger size by default
    target_size = target_sizes[0]
    
    for screenshot in screenshots[:5]:  # Max 5 screenshots
        if converted_count >= 5:
            break
            
        result = convert_screenshot(screenshot, output_dir, target_size)
        if result:
            converted_count += 1
    
    print("=" * 50)
    print(f"✅ Successfully converted {converted_count} screenshots")
    print(f"📁 Check the '{output_dir}' directory for your Chrome Web Store ready images")
    
    # Also create 640x400 versions if requested
    print("\n💡 Want smaller 640x400 versions too? Uncomment the code below and run again.")

if __name__ == "__main__":
    main()
