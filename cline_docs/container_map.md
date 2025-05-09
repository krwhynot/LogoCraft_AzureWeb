# Container Map - LogoCraftWeb

This diagram shows the main logical containers within the LogoCraftWeb application boundary, their interactions, and connections to users and external systems. It provides a more detailed view than the System Context Map.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#f0f0f0', 'primaryTextColor': '#333', 'lineColor': '#666', 'textColor': '#333'}}}%%
graph TD
    subgraph External Systems
        Ext_Blob[Azure Blob Storage <br/>(Existing)]
        Ext_Browser[User's Browser/OS <br/>(Existing)]
    end

    subgraph Users
        User[End User <br/>(Existing)]
    end

    subgraph LogoCraftWeb Application Boundary
        Frontend[Frontend SPA <br/>(React in Azure Web App) <br/>(In Progress)]
        BackendAPI[Backend API <br/>(Azure Functions) <br/>(In Progress)]
    end

    User -- HTTPS --> Frontend
    Frontend -- Uploads/Downloads via Browser --> Ext_Browser
    Frontend -- API Calls (HTTPS) --> BackendAPI
    Frontend -- Upload via SAS (HTTPS) --> Ext_Blob
    BackendAPI -- Get SAS Token (Managed Identity) --> Ext_Blob
    BackendAPI -- Process/Store Images (Managed Identity) --> Ext_Blob

    style User fill:#90ee90,stroke:#333,stroke-width:2px %% Green: Existing
    style Ext_Blob fill:#90ee90,stroke:#333,stroke-width:2px %% Green: Existing
    style Ext_Browser fill:#90ee90,stroke:#333,stroke-width:2px %% Green: Existing
    style Frontend fill:#ffff99,stroke:#333,stroke-width:2px %% Yellow: In Progress
    style BackendAPI fill:#ffff99,stroke:#333,stroke-width:2px %% Yellow: In Progress

    linkStyle 0,1,3,4,5 stroke:#333,stroke-width:2px %% Solid lines: Existing/Implemented Interactions
    linkStyle 2 stroke:#ffcc00,stroke-width:2px,stroke-dasharray: 5 5 %% Dashed Yellow: Partially Implemented/Needs Integration (API calls use proxy, need update)

```

**Legend:**

*   **Colors:**
    *   🟩 Green (`#90ee90`): Existing / Fully Functional
    *   🟨 Yellow (`#ffff99`): In Progress / Partially Built
    *   🟦 Blue: Planned / Not Yet Started (None in this diagram)
*   **Lines:**
    *   ─── Solid (`#333`): Existing / Implemented Connection / Interaction
    *   ‑‑‑ Dashed Yellow (`#ffcc00`): Partially Implemented / Needs Integration / Not Fully Tested End-to-End
*   **Labels:** Status indicated in parentheses within the node text.

**Explanation:**

1.  **Frontend SPA (In Progress):** The React UI is largely built but relies on simulated logic and API proxying (`server.js`). It needs to be integrated with the deployed backend and hosted in the Azure Web App defined in Bicep.
2.  **Backend API (In Progress):** The Azure Functions (`GetSasToken`, `ProcessImage`) are implemented using Managed Identity but are not yet deployed or fully integrated with the frontend.
3.  **Azure Blob Storage (Existing):** The external storage service is assumed to be available.
4.  **User's Browser/OS (Existing):** Essential for the frontend interaction.
5.  **End User (Existing):** Interacts with the application.
6.  **Interactions:**
    *   User <-> Frontend: Existing (UI interaction).
    *   Frontend <-> Browser: Existing (File handling).
    *   Frontend -> Blob (SAS Upload): Existing (Logic implemented in `BlobService.js`).
    *   Backend -> Blob (Managed Identity): Existing (Code implemented in Functions).
    *   Frontend -> Backend API: Partially Implemented/Needs Integration (Currently uses proxy, needs update to deployed Function App URL).
