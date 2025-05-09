# System Context Map - LogoCraftWeb

This diagram shows the high-level context of the LogoCraftWeb application, its users, and its interactions with external systems.

```mermaid
%%{init: {'theme': 'base', 'themeVariables': { 'primaryColor': '#f0f0f0', 'primaryTextColor': '#333', 'lineColor': '#666', 'textColor': '#333'}}}%%
graph LR
    subgraph External Systems
        B[Azure Blob Storage <br/>(Existing)]
        D[User's Browser/OS <br/>(Existing)]
    end

    subgraph Users
        A[End User <br/>(Existing)]
    end

    subgraph Core Application
        C{LogoCraftWeb <br/>(In Progress)}
    end

    A -- Uploads/Downloads --> D
    D -- File Data --> C
    A -- Interacts via UI --> C
    C -- Stores/Retrieves Images --> B

    style A fill:#90ee90,stroke:#333,stroke-width:2px %% Green for Existing User Role
    style B fill:#90ee90,stroke:#333,stroke-width:2px %% Green for Existing External System
    style D fill:#90ee90,stroke:#333,stroke-width:2px %% Green for Existing External System (Implicit)
    style C fill:#ffff99,stroke:#333,stroke-width:2px %% Yellow for In Progress Application

    linkStyle 0,1,2,3 stroke:#333,stroke-width:2px %% Solid lines for existing interactions
```

**Legend:**

*   **Colors:**
    *   🟩 Green (`#90ee90`): Existing / Fully Functional
    *   🟨 Yellow (`#ffff99`): In Progress / Partially Built
    *   🟦 Blue: Planned / Not Yet Started (None in this diagram)
*   **Lines:**
    *   ─── Solid: Existing Connection / Interaction
    *   ‑‑‑ Dashed: Planned Connection / Interaction (None in this diagram)
*   **Labels:** Status indicated in parentheses within the node text.

**Explanation:**

1.  **LogoCraftWeb (In Progress):** The core application exists and has significant functionality (UI, API structure, Managed Identity), but integration and deployment are still pending (`progress.md`).
2.  **End User (Existing):** The primary user interacts with the existing frontend UI.
3.  **Azure Blob Storage (Existing):** This is a core external dependency, and the integration via Azure Functions (`GetSasToken`, `ProcessImage`) is implemented.
4.  **User's Browser/OS (Existing):** This is an implicit external system required for file uploads and downloads, which is fundamental to the existing workflow.
5.  **Connections (Solid):** All depicted interactions (UI interaction, file handling, blob storage access) are part of the current, implemented functionality, even if the end-to-end flow isn't fully deployed.
