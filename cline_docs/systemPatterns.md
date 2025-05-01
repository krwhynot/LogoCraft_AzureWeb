# System Patterns

## How the system is built
LogoCraftWeb is built as a React-based web application with a clear separation between the frontend and backend components:

1. **Frontend**: React application with Bootstrap for UI components
   - Uses React hooks for state management
   - Implements a component-based architecture
   - Utilizes Bootstrap for responsive layout and styling
   - Vite is used as the build tool and development server

2. **Backend**: Azure Functions serverless API
   - Handles image processing and storage operations
   - Provides RESTful endpoints for the frontend to interact with
   - Uses Azure Blob Storage for image storage
   - Implements two main functions:
     - GetSasToken: Generates SAS tokens for secure blob storage access
     - ProcessImage: Handles image processing with the Sharp library

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

4. **Serverless Architecture**: Uses Azure Functions for backend processing
   - Event-driven, scalable compute service
   - Pay-per-execution model for cost efficiency
   - Stateless functions that can scale independently
   - HTTP-triggered functions for RESTful API endpoints
   - Anonymous authentication for simplicity

5. **Cloud Storage**: Uses Azure Blob Storage for image files
   - Secure access via SAS tokens with time-limited validity
   - Separate containers for input and output images
   - Scalable storage for varying workloads
   - Direct upload from browser to blob storage

6. **API Communication**: Frontend communicates with backend via fetch API
   - BlobService.js handles all API interactions
   - Error handling with detailed error messages
   - Asynchronous operations with Promises

7. **Image Processing**: Uses Sharp library for image manipulation
   - High-performance Node.js image processing
   - Support for various output formats including PNG and BMP
   - Custom processing for monochrome BMP files
   - Configurable dimensions for different output formats

## Architecture patterns
1. **Three-Step Workflow**: The application follows a clear three-step process:
   - Upload: Select and upload an image
   - Configure: Select output formats and settings
   - Results: View and download processed images

2. **Horizontal Layout**: The UI is structured with a balanced horizontal arrangement
   - Top row: Upload panel on the left, Export Options and Processing panels on the right
   - Bottom row: Preview/Results panel on the left, Format Info panel on the right
   - This layout makes more efficient use of screen space and reduces empty areas

3. **Panel-Based UI**: The interface is organized into distinct panels, each with a header and body
   - Panels are visually separated and can be active or inactive based on the current step
   - This creates a clear visual hierarchy and guides the user through the workflow

4. **Responsive Design**: The layout adapts to different screen sizes
   - On larger screens, the two-column layout is maintained
   - On smaller screens, the layout shifts to a more vertical orientation
   - CSS media queries handle different viewport sizes

5. **Microservices Pattern**: Backend functionality is divided into focused, single-purpose functions
   - GetSasToken: Handles authentication and authorization for blob storage
   - ProcessImage: Focuses on image transformation and processing
   - Each function can be deployed, scaled, and maintained independently

6. **API-First Design**: Clear separation between frontend and backend
   - RESTful API endpoints for all backend operations
   - Frontend communicates with backend exclusively through these APIs
   - Enables independent development and testing of frontend and backend components

7. **Batch Processing**: Supports processing multiple output formats in a single operation
   - User selects desired formats from a comprehensive list
   - Backend processes all selected formats in parallel
   - Results are bundled into a zip file for convenient download

8. **Progressive Enhancement**: The UI provides feedback at each step
   - Visual indicators show the current step in the process
   - Progress bars indicate processing status
   - Status messages provide context about current operations
   - Error handling with user-friendly messages

9. **Client-Side Routing**: The application maintains state without page reloads
   - Single-page application (SPA) architecture
   - State-based UI updates without navigation
   - Reset functionality to start the process over

10. **Proxy Configuration**: Development server proxies API requests
    - Vite development server configured to proxy /api requests
    - Enables local development with remote API endpoints
    - Simplifies CORS handling during development
