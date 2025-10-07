#!/bin/bash
# ECONEURA BASE SYSTEM: Abstract base class for all improvement systems
# Version: 2.0.0
# Dependencies: lib/common.sh

# Source common library
# shellcheck disable=SC1091
source "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)/lib/common.sh"

# =============================================================================
# BASE SYSTEM CLASS
# =============================================================================

# System metadata (to be overridden by subclasses)
SYSTEM_NAME="BaseSystem"
SYSTEM_VERSION="2.0.0"
SYSTEM_DESCRIPTION="Base system class"

# System state
SYSTEM_INITIALIZED=false
SYSTEM_CONFIG_LOADED=false

# =============================================================================
# BASE SYSTEM METHODS
# =============================================================================

# Initialize system (template method pattern)
init_system() {
    log_info "Initializing $SYSTEM_NAME v$SYSTEM_VERSION"

    # Initialize library if not already done
    if [ "$SYSTEM_INITIALIZED" = false ]; then
        init_library
        SYSTEM_INITIALIZED=true
    fi

    # Load system-specific configuration
    load_system_config

    # Perform system-specific initialization
    init_system_specific

    # Validate system state
    validate_system_state

    log_info "$SYSTEM_NAME initialization completed"
}

# Load system configuration (hook method - override in subclasses)
load_system_config() {
    SYSTEM_CONFIG_LOADED=true
    log_debug "Base system configuration loaded"
}

# Initialize system-specific components (abstract method - must override)
init_system_specific() {
    log_debug "Base system-specific initialization"
}

# Validate system state
validate_system_state() {
    log_debug "Validating $SYSTEM_NAME state"

    # Perform system-specific validation
    validate_system_specific

    log_debug "$SYSTEM_NAME validation passed"
}

# Validate system-specific state (abstract method - must override)
validate_system_specific() {
    log_debug "Base system-specific validation"
}

# Clean up system
cleanup_system() {
    log_info "Cleaning up $SYSTEM_NAME"

    # Perform system-specific cleanup
    cleanup_system_specific

    log_info "$SYSTEM_NAME cleanup completed"
}

# Clean up system-specific resources (abstract method - must override)
cleanup_system_specific() {
    log_debug "Base system-specific cleanup"
}

# Handle system errors
handle_system_error() {
    local error_message="$1"
    log_fatal "$error_message"
    exit 1
}

# =============================================================================
# LIBRARY INITIALIZATION
# =============================================================================

# Initialize common library
init_library() {
    # This function is called once to initialize shared resources
    log_debug "ECONEURA Common Library initialized"
}