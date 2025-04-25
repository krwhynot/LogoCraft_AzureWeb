# System Patterns

## How the system is built
LogoCraftWeb is built as a React-based web application with a clear separation between the frontend and backend components:

1. **Frontend**: React application with Bootstrap for UI components
   - Uses React hooks for state management
   - Implements a component-based architecture
   - Utilizes Bootstrap for responsive layout and styling
   - Vite is used as the build tool and development server

2. **Backend**: API service (currently simulated in the frontend)
   - Planned to handle image processing and storage
   - Will provide RESTful endpoints for the frontend to interact with

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
