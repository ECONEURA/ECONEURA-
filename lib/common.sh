#!/bin/bash
# ECONEURA COMMON LIBRARY: Shared utilities and standards
# Version: 2.0.0

set -eu

# =============================================================================
# CONFIGURATION
# =============================================================================

# System paths
readonly LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly ROOT_DIR="$(cd "$LIB_DIR/.." && pwd)"
readonly CONFIG_DIR="$ROOT_DIR/.config"
readonly LOG_DIR="$ROOT_DIR/.logs"
readonly BACKUP_DIR="$ROOT_DIR/.backups"

# System files
readonly CONFIG_FILE="$CONFIG_DIR/econeura.conf"
readonly LOG_FILE="$LOG_DIR/econeura.log"
readonly ERROR_LOG="$LOG_DIR/errors.log"

# =============================================================================
# LOGGING SYSTEM
# =============================================================================

# Log levels
readonly LOG_LEVEL_DEBUG=0
readonly LOG_LEVEL_INFO=1
readonly LOG_LEVEL_WARN=2
readonly LOG_LEVEL_ERROR=3
readonly LOG_LEVEL_FATAL=4

# Current log level (can be overridden)
LOG_LEVEL=${LOG_LEVEL:-$LOG_LEVEL_INFO}

# Colors for output
readonly COLOR_RESET='\033[0m'
readonly COLOR_GREEN='\033[0;32m'
readonly COLOR_YELLOW='\033[1;33m'
readonly COLOR_RED='\033[0;31m'
readonly COLOR_CYAN='\033[0;36m'
readonly COLOR_MAGENTA='\033[0;35m'

# Logging functions
log_debug() {
    if [ "$LOG_LEVEL" -le "$LOG_LEVEL_DEBUG" ]; then
        echo -e "${COLOR_CYAN}[DEBUG $(date +%H:%M:%S)]${COLOR_RESET} $*" >&2
    fi
}

log_info() {
    if [ "$LOG_LEVEL" -le "$LOG_LEVEL_INFO" ]; then
        echo -e "${COLOR_GREEN}[INFO  $(date +%H:%M:%S)]${COLOR_RESET} $*" >&2
    fi
}

log_warn() {
    if [ "$LOG_LEVEL" -le "$LOG_LEVEL_WARN" ]; then
        echo -e "${COLOR_YELLOW}[WARN  $(date +%H:%M:%S)]${COLOR_RESET} $*" >&2
    fi
}

log_error() {
    if [ "$LOG_LEVEL" -le "$LOG_LEVEL_ERROR" ]; then
        echo -e "${COLOR_RED}[ERROR $(date +%H:%M:%S)]${COLOR_RESET} $*" >&2
        echo "[ERROR $(date +%Y%m%d_%H%M%S)] $*" >> "$ERROR_LOG"
    fi
}

log_fatal() {
    if [ "$LOG_LEVEL" -le "$LOG_LEVEL_FATAL" ]; then
        echo -e "${COLOR_MAGENTA}[FATAL $(date +%H:%M:%S)]${COLOR_RESET} $*" >&2
        echo "[FATAL $(date +%Y%m%d_%H%M%S)] $*" >> "$ERROR_LOG"
        exit 1
    fi
}

# =============================================================================
# UTILITY FUNCTIONS
# =============================================================================

# Ensure directory exists
ensure_directory() {
    local dir_path="$1"
    if [ ! -d "$dir_path" ]; then
        mkdir -p "$dir_path"
        log_debug "Created directory: $dir_path"
    fi
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Get system information
get_system_info() {
    echo "OS: $(uname -s)"
    echo "Architecture: $(uname -m)"
    echo "Bash version: $BASH_VERSION"
}

# =============================================================================
# ERROR HANDLING
# =============================================================================

# Error handling setup
setup_error_handling() {
    # Set up error handling
    set -E  # Inherit ERR trap
    trap 'error_handler $?' ERR
}

# Error handler
error_handler() {
    local exit_code="$1"
    log_error "Script exited with code $exit_code"
}

# Cleanup on exit
cleanup_on_exit() {
    local exit_code="$?"
    if [ "$exit_code" -ne 0 ]; then
        log_error "Script failed with exit code $exit_code"
    fi
}