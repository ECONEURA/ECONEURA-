# ECONEURA System Architecture

## Overview
ECONEURA is a comprehensive system for managing development workflows with clean architecture.

## Core Components

### 1. Library System (`lib/`)
- **`lib/common.sh`**: Shared utilities for all ECONEURA systems
  - Logging functions: `log_debug()`, `log_info()`, `log_error()`
  - Configuration management: `load_config()`, `verify_requirements()`
  - ANSI color support for terminal output
  - Structured logging with timestamps

- **`lib/base_system.sh`**: Abstract base class implementing template method pattern
  - `init_system()`: Template method for system initialization
  - `validate_system_state()`: State validation hook
  - `cleanup_system_specific()`: System-specific cleanup hook
  - Inheritance pattern for consistent system lifecycle

### 2. Core Scripts (`scripts/`)
- **`scripts/automatic-documentation.sh`**: Self-documenting system
  - Creates and maintains CHANGELOG.md, architecture.md, decisions.md
  - Tracks system changes and architectural decisions
  - Automated documentation generation

- **`scripts/comprehensive-test-suite.sh`**: Complete validation system
  - Unit tests for core functionality
  - Integration tests for system components
  - Performance validation
  - Automated test reporting

### 3. Application Structure
- **`apps/web/`**: React/Vite frontend application
- **`apps/api_py/`**: Python API server for agent routing
- **`packages/shared/`**: Shared TypeScript utilities and AI agents

## Architecture Patterns

### Template Method Pattern
```bash
# Base system lifecycle
init_system() {
    validate_system_state
    # System-specific initialization
    cleanup_system_specific
}
```

### Inheritance Hierarchy
```
BaseSystem (lib/base_system.sh)
├── AutomaticDocumentation (scripts/automatic-documentation.sh)
└── TestSuite (scripts/comprehensive-test-suite.sh)
```

## Data Flow
1. User requests → API routing (api_py)
2. Agent selection → Make.com integration
3. Response processing → Frontend display

## Quality Standards
- **Test Coverage**: Minimum 90% statements, 80% functions
- **Error Handling**: All scripts use `set -eu` for strict error checking
- **Documentation**: Automated changelog and decision tracking
- **Code Quality**: ESLint configuration with strict rules
