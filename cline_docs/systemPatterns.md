# System Patterns

## How the system is built
LogoCraftWeb is built as a React-based web application with a clear separation between the frontend and backend components:

1. **Frontend**: React application hosted on **Azure Static Web Apps**
   - Uses React hooks for state management
   - Implements a component-based architecture
   - Utilizes Bootstrap for responsive layout and styling
   - Vite is used as the build tool. Azure Static Web Apps handles serving.

2. **Backend**: **Single Azure Function (integrated with Static Web App)**
   - Handles SAS token generation for uploads and all image processing operations.
   - Provides a consolidated RESTful endpoint for the frontend.
   - Uses Azure Blob Storage for image storage.
   - Implements one main HTTP-triggered function (e.g., `ProcessImageAndSas`) responsible for:
     - Generating SAS tokens for client-side uploads to the `uploads` container.
     - Processing images from the `uploads` container and saving results to the `downloads` container.

## Key technical decisions
1. **Component Structure**: The UI is divided into modular components, each responsible for a specific part of the functionality:
   - ImagePreview: Handles image upload and display via drag-and-drop or file browser
   - OutputOptions: Manages format selection with grouped checkboxes and tooltips
   - ProcessingOptions: Controls processing settings and actions with progress indication
   - MainPreview: Displays the main preview and results with download options
   - StepIndicator: Shows the current step in the workflow with visual indicators
   - StatusBar: Displays current application state and messages
   - ResultsGallery: Shows processed images in a grid layout with download options
   - FormatInfo: Provides information about supported image formats

2. **State Management**: Uses React's useState hooks for managing application state
   - All state is centralized in the App component
   - State is passed down to child components via props
   - Key state elements include:
     - currentFile: The uploaded image file
     - preview: Data URL for image preview
     - selectedFormats: Object tracking which output formats are selected
     - isProcessing: Boolean indicating if processing is in progress
     - processedImages: Array of processed image results
     - activeStep: Current step in the workflow (1-3)

3. **Styling Approach**: Uses a combination of Bootstrap components and custom CSS
   - Bootstrap provides the responsive grid system and basic components
   - Custom CSS in App.css handles specific styling needs and overrides
   - CSS variables define a consistent color scheme and theme
   - Responsive design adapts to different screen sizes

4. **Serverless Architecture**: Uses a **single Azure Function, integrated with Azure Static Web Apps,** for backend processing.
   - Event-driven, scalable compute provided by SWA's managed functions environment.
   - Pay-per-execution model for cost efficiency.
   - Stateless function that can scale independently.
   - Single HTTP-triggered function serves all backend API needs.
   - Anonymous authentication for the API endpoint.

5. **Cloud Storage**: Uses Azure Blob Storage for image files.
   - Secure access for uploads via function-generated SAS tokens (using storage account connection string).
   - Two main containers:
     - `uploads`: Private container for client image uploads (SAS token access).
     - `downloads`: Publicly readable container (Blob-level access) for processed images, allowing direct URL access.
   - Scalable storage for varying workloads.
   - Direct upload from browser to the `uploads` container using SAS tokens.

6. **API Communication**: Frontend communicates with the single backend Azure Function via fetch API.
   - BlobService.js handles all API interactions
   - Error handling with detailed error messages
   - Asynchronous operations with Promises

7. **Image Processing**: Uses Sharp library for image manipulation
   - High-performance Node.js image processing
   - Support for various output formats including PNG and BMP
   - Custom processing for monochrome BMP files
   - Configurable dimensions for different output formats

## Architecture patterns
1. **SAS Token Authentication (Function-Generated)**:
   - The backend Azure Function generates SAS tokens for client-side uploads to the `uploads` Azure Blob Storage container.
   - The function uses the Azure Storage Account connection string (stored as an application setting in Azure Static Web Apps) to create these SAS tokens.
   - This simplifies the initial authentication setup, deferring Managed Identity.
   - Local development uses the same connection string (e.g., from `local.settings.json` when using Azure Functions Core Tools, or SWA CLI local emulation).

2. **Three-Step Workflow**: The application follows a clear three-step process:
   - Upload: Select and upload an image
   - Configure: Select output formats and settings
   - Results: View and download processed images

3. **Horizontal Layout**: The UI is structured with a balanced horizontal arrangement
   - Top row: Upload panel on the left, Export Options and Processing panels on the right
   - Bottom row: Preview/Results panel on the left, Format Info panel on the right
   - This layout makes more efficient use of screen space and reduces empty areas

4. **Panel-Based UI**: The interface is organized into distinct panels, each with a header and body
   - Panels are visually separated and can be active or inactive based on the current step
   - This creates a clear visual hierarchy and guides the user through the workflow

5. **Responsive Design**: The layout adapts to different screen sizes
   - On larger screens, the two-column layout is maintained
   - On smaller screens, the layout shifts to a more vertical orientation
   - CSS media queries handle different viewport sizes

6. **Simplified API Endpoint**: Backend functionality is consolidated into a single Azure Function.
   - This function handles distinct actions (e.g., SAS generation, image processing) based on request parameters.
   - While not a microservices pattern, it maintains a clear API contract for the frontend.

7. **API-First Design**: Clear separation between frontend (Azure Static Web App) and backend (integrated Azure Function).
   - RESTful API endpoints for all backend operations
   - Frontend communicates with backend exclusively through these APIs
   - Enables independent development and testing of frontend and backend components

8. **Batch Processing**: Supports processing multiple output formats in a single operation
   - User selects desired formats from a comprehensive list
   - Backend processes all selected formats in parallel
   - Results are bundled into a zip file for convenient download

9. **Progressive Enhancement**: The UI provides feedback at each step
   - Visual indicators show the current step in the process
   - Progress bars indicate processing status
   - Status messages provide context about current operations
   - Error handling with user-friendly messages

10. **Client-Side Routing**: The application maintains state without page reloads
    - Single-page application (SPA) architecture
    - State-based UI updates without navigation
    - Reset functionality to start the process over

11. **Proxy Configuration**: Development server proxies API requests
    - Vite development server configured to proxy /api requests
    - Enables local development with remote API endpoints
    - Simplifies CORS handling during development
