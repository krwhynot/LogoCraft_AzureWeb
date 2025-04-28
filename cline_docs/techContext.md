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

4. **Backend**:
   - Azure Functions (serverless compute service)
   - Azure Blob Storage (for image storage)
   - Node.js with JavaScript
   - Sharp library for image processing
   - Azure Storage SDK (@azure/storage-blob)

## Development setup
1. **Project Structure**:
   - `/frontend`: Contains the React application
     - `/src`: Source code
       - `/components`: React components
       - `/services`: Service modules for API interactions
       - `/assets`: Static assets like images
     - `/public`: Public static files
   - `/api`: Azure Functions implementation
     - `/GetSasToken`: Function for generating SAS tokens for blob storage
       - `function.json`: Function bindings configuration
       - `index.js`: Function implementation
     - `/ProcessImage`: Function for image processing
       - `function.json`: Function bindings configuration
       - `index.js`: Function implementation
     - `host.json`: Azure Functions host configuration
     - `package.json`: Node.js dependencies
   - `/infrastructure`: Placeholder for deployment and infrastructure code

2. **Build System**:
   - Vite for frontend development and optimized production builds
   - Azure Functions Core Tools for local function development
   - NPM for package management

3. **Development Workflow**:
   - Local development server with hot module replacement for frontend
   - Azure Functions local runtime for backend testing
   - VS Code Azure Functions extension for deployment

## Technical constraints
1. **Browser Compatibility**:
   - Modern browsers (Chrome, Firefox, Safari, Edge)
   - Responsive design for desktop and mobile devices

2. **Performance Considerations**:
   - Image processing is resource-intensive
   - Azure Functions consumption plan has execution time limits
   - Blob storage operations may have latency
   - UI should remain responsive during processing operations

3. **Azure Functions Requirements**:
   - Function folders must be directly under the project root
   - Each function folder must contain function.json and index.js
   - host.json must be in the project root with version 2.0
   - Proper HTTP trigger bindings required for web API endpoints

4. **Limitations**:
   - Maximum image size: 20MB (as indicated in the UI)
   - Supported image formats: PNG, JPEG, GIF, BMP, TIFF, WebP
   - Currently no user authentication or persistent storage
