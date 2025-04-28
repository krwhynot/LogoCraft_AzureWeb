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
   - ImagePreview: Handles image upload and display
   - OutputOptions: Manages format selection
   - ProcessingOptions: Controls processing settings and actions
   - MainPreview: Displays the main preview and results
   - StepIndicator: Shows the current step in the workflow

2. **State Management**: Uses React's useState hooks for managing application state
   - All state is centralized in the App component
   - State is passed down to child components via props

3. **Styling Approach**: Uses a combination of Bootstrap components and custom CSS
   - Bootstrap provides the responsive grid system and basic components
   - Custom CSS in App.css handles specific styling needs and overrides

4. **Serverless Architecture**: Uses Azure Functions for backend processing
   - Event-driven, scalable compute service
   - Pay-per-execution model for cost efficiency
   - Stateless functions that can scale independently
   - HTTP-triggered functions for RESTful API endpoints

5. **Cloud Storage**: Uses Azure Blob Storage for image files
   - Secure access via SAS tokens
   - Separate containers for input and output images
   - Scalable storage for varying workloads

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

5. **Microservices Pattern**: Backend functionality is divided into focused, single-purpose functions
   - GetSasToken: Handles authentication and authorization for blob storage
   - ProcessImage: Focuses on image transformation and processing
   - Each function can be deployed, scaled, and maintained independently

6. **API-First Design**: Clear separation between frontend and backend
   - RESTful API endpoints for all backend operations
   - Frontend communicates with backend exclusively through these APIs
   - Enables independent development and testing of frontend and backend components
