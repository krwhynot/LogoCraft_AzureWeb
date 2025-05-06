# Changelog

## [Unreleased]

### Added
- N/A

### Changed
- **api/GetSasToken/index.js**:
    - Modified `isLocal` variable to be determined by `process.env.AZURE_FUNCTIONS_ENVIRONMENT === 'Development'`. This allows the function to use Storage Account Key for local development and Managed Identity for production.
- **api/ProcessImage/index.js**:
    - Modified `isLocal` variable to be determined by `process.env.AZURE_FUNCTIONS_ENVIRONMENT === 'Development'`. This allows the function to use Storage Account Key for local development and Managed Identity for production.

### Removed
- N/A

### Fixed
- N/A
