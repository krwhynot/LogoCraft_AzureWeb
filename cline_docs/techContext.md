# Technical Context

## Technologies used
1. **Frontend**:
   - React 18+ (JavaScript library for building user interfaces)
   - Bootstrap 5 (CSS framework for responsive design)
   - React Bootstrap (React components implementing Bootstrap)
   - React Bootstrap Icons (Icon library)
   - Vite (Build tool and development server)
   - JSZip (Library for creating ZIP files in the browser)
   - File-Saver (Library for saving files from the browser)
   - Axios (HTTP client for API requests, though currently using fetch API)

2. **State Management**:
   - React Hooks (useState for local state management)
   - Prop drilling for component communication
   - Centralized state in App.jsx

3. **Styling**:
   - CSS3 with custom properties (variables)
   - Bootstrap grid system and components
   - Media queries for responsive design
   - Custom panel-based UI system

4. **Backend**:
   - Azure Functions (serverless compute service)
   - Azure Blob Storage (for image storage)
   - Node.js with JavaScript
   - Sharp library for image processing
   - Azure Storage SDK (@azure/storage-blob)
   - SAS token authentication for blob storage

## Development setup
1. **Project Structure**:
   - `/frontend`: Contains the React application
     - `/src`: Source code
       - `/components`: React components
       - `/services`: Service modules for API interactions
       - `/assets`: Static assets like images
     - `/public`: Public static files
     - `vite.config.js`: Vite configuration including API proxy settings
     - `package.json`: Frontend dependencies
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
   - `/cline_docs`: Documentation for the project

2. **Build System**:
   - Vite for frontend development and optimized production builds
   - Azure Functions Core Tools for local function development
   - NPM for package management
   - ESLint for code linting

3. **Development Workflow**:
   - Local development server with hot module replacement for frontend
   - Azure Functions local runtime for backend testing
   - VS Code Azure Functions extension for deployment
   - Proxy configuration in Vite to route API requests during development

4. **Deployment**:
   - Frontend: Static site hosting (not yet configured)
   - Backend: Azure Functions deployment
   - Storage: Azure Blob Storage with containers for input and output images

## Technical constraints
1. **Browser Compatibility**:
   - Modern browsers (Chrome, Firefox, Safari, Edge)
   - Responsive design for desktop and mobile devices

2. **Performance Considerations**:
   - Image processing is resource-intensive
   - Azure Functions consumption plan has execution time limits
   - Blob storage operations may have latency
   - UI should remain responsive during processing operations
   - Large images may require additional processing time

3. **Azure Functions Requirements**:
   - Function folders must be directly under the project root
   - Each function folder must contain function.json and index.js
   - host.json must be in the project root with version 2.0
   - Proper HTTP trigger bindings required for web API endpoints
   - Anonymous authentication used for simplicity

4. **Limitations**:
   - Maximum image size: 20MB (as indicated in the UI)
   - Supported image formats: PNG, JPEG, GIF, BMP, TIFF, WebP
   - Currently no user authentication or persistent storage
   - SAS tokens have a 1-hour validity period
   - Predefined output formats with fixed dimensions

5. **API Endpoints**:
   - `/api/GetSasToken`: GET endpoint for generating SAS tokens
     - Optional query parameter: `container` (defaults to 'input-images')
     - Returns: SAS token and container URL
   - `/api/ProcessImage`: POST endpoint for processing images
     - Request body: JSON with `sourceUrl` and `formats` properties
     - Returns: Array of processed image URLs and metadata

6. **Error Handling**:
   - Frontend: Try/catch blocks with error messages displayed to user
   - Backend: Try/catch with structured error responses
   - HTTP status codes for different error types
   - Detailed error messages for debugging

7. **Data Flow**:
   - User uploads image to browser
   - Frontend gets SAS token from Azure Function
   - Frontend uploads image directly to Azure Blob Storage
   - Frontend sends processing request to Azure Function
   - Backend processes image and stores results in output container
   - Frontend downloads processed images and creates ZIP file
   - ZIP file is offered for download to user
