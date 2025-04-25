# Technical Context

## Technologies used
1. **Frontend**:
   - React 18+ (JavaScript library for building user interfaces)
   - Bootstrap 5 (CSS framework for responsive design)
   - React Bootstrap (React components implementing Bootstrap)
   - React Bootstrap Icons (Icon library)
   - Vite (Build tool and development server)

2. **State Management**:
   - React Hooks (useState for local state management)

3. **Styling**:
   - CSS3 with custom properties (variables)
   - Bootstrap grid system and components
   - Media queries for responsive design

4. **Future Backend** (currently simulated):
   - RESTful API (planned)
   - Blob storage for image processing and storage (referenced in BlobService.js)

## Development setup
1. **Project Structure**:
   - `/frontend`: Contains the React application
     - `/src`: Source code
       - `/components`: React components
       - `/services`: Service modules for API interactions
       - `/assets`: Static assets like images
     - `/public`: Public static files
   - `/api`: Placeholder for future backend implementation
   - `/infrastructure`: Placeholder for deployment and infrastructure code

2. **Build System**:
   - Vite for fast development and optimized production builds
   - NPM for package management

3. **Development Workflow**:
   - Local development server with hot module replacement
   - Component-based development approach

## Technical constraints
1. **Browser Compatibility**:
   - Modern browsers (Chrome, Firefox, Safari, Edge)
   - Responsive design for desktop and mobile devices

2. **Performance Considerations**:
   - Image processing is resource-intensive
   - Currently simulated in the frontend, will be moved to backend
   - UI should remain responsive during processing operations

3. **Limitations**:
   - Maximum image size: 20MB (as indicated in the UI)
   - Supported image formats: PNG, JPEG, GIF, BMP, TIFF, WebP
   - Currently no user authentication or persistent storage
