# Product Context: LogoCraftWeb

## Why this project exists
LogoCraftWeb is a web application designed to help users convert and process logo images into multiple formats with ease. It provides a user-friendly interface for uploading images and converting them to various standard logo formats required for different applications.

## What problems it solves
- Simplifies the process of converting logos to multiple required formats
- Eliminates the need for users to manually resize and convert images using complex image editing software
- Ensures logos meet the specific dimension requirements for different platforms and applications
- Provides a streamlined workflow for logo processing with clear steps
- Offers batch processing capabilities to generate multiple formats at once
- Automates the creation of properly sized and formatted images for various platforms
- Provides a convenient way to download all processed images as a single ZIP file

## How it should work
1. **Upload**: Users upload an original logo image through a drag-and-drop interface or file browser
2. **Configure**: Users select which output formats they want to generate from a predefined list of common logo formats
3. **Process**: The application processes the image, converting it to the selected formats while maintaining proper dimensions and quality
4. **Results**: Users can preview all generated formats and download them individually or as a batch

The application follows a three-step workflow (Upload → Configure → Results) with a clear visual indicator of the current step. The interface is designed to be intuitive with a horizontal layout that makes efficient use of screen space:

- **Top Row**: Upload panel on the left, Export Options and Processing panels on the right
- **Bottom Row**: Preview/Results panel showing the current image or processed results

## Available Output Formats

The application supports a wide range of output formats organized into two main categories:

1. **Installer Images**:
   - Logo PNG (300×300): Standard square logo format with transparent background
   - Small Logo PNG (136×136): Compact size for thumbnails and smaller UI elements
   - KD Logo PNG (140×112): Slightly rectangular format for specific applications
   - RPT Logo BMP (155×110): Monochrome BMP format for legacy systems
   - Print Logo BMP (600×256): Optimized for thermal printer output at 203 DPI

2. **Online Images**:
   - Feature Graphic PNG (1024×500): For app stores and promotional materials
   - Push Notification Icon (96×96): For mobile notifications
   - Login Logo (600×600): For login screens with padding
   - Various app icons in different sizes (57×57 to 1024×1024): For iOS and Android applications
   - Splash screens in various dimensions: For different device sizes and resolutions
   - UI button images (300×300): For interface elements like Carryout, Delivery, etc.

Each format is automatically sized and optimized for its intended use, ensuring consistency across all platforms.
