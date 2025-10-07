# PowerShell Scripts

This directory contains PowerShell scripts for Windows-based development and CI/CD operations.

## 📋 Scripts Overview

### Coverage and Testing Scripts

#### `COVERAGE_SNAPSHOT_NANO.ps1`
**Purpose:** Creates a snapshot of test coverage metrics  
**Usage:** `.\COVERAGE_SNAPSHOT_NANO.ps1`  
**Description:** Captures current coverage state for comparison and tracking

#### `ONE_SHOT_COVERAGE.ps1`
**Purpose:** Quick one-shot coverage check  
**Usage:** `.\ONE_SHOT_COVERAGE.ps1`  
**Description:** Runs tests and generates coverage report in a single command

### ONE_SHOT Scripts (Version History)

Multiple versions of the ONE_SHOT script exist for different coverage thresholds and configurations:

#### `ONE_SHOT_100_v8.ps1`
**Version:** 8  
**Purpose:** Coverage check with v8 threshold configuration  
**Lines:** 142

#### `ONE_SHOT_100_v10.ps1`
**Version:** 10  
**Purpose:** Coverage check with v10 threshold configuration  
**Lines:** 94

#### `ONE_SHOT_100_v12.ps1`
**Version:** 12  
**Purpose:** Coverage check with v12 threshold configuration  
**Lines:** 99

#### `ONE_SHOT_100_v13.ps1` ⭐ (Latest)
**Version:** 13  
**Purpose:** Most recent coverage check with updated thresholds  
**Lines:** 257  
**Recommended:** Use this version for new work

### Status Scripts

#### `STATUS_90D_MINI.ps1`
**Purpose:** 90-day status report (mini version)  
**Usage:** `.\STATUS_90D_MINI.ps1`  
**Description:** Generates a compact 90-day project status report including coverage metrics

#### `STATUS_COV_DIFF_FAST.ps1`
**Purpose:** Fast coverage difference calculation  
**Usage:** `.\STATUS_COV_DIFF_FAST.ps1`  
**Description:** Quickly compares current coverage against baseline to detect regressions

## 🚀 Usage Guidelines

### Prerequisites
- PowerShell 5.1+ or PowerShell Core 7+
- Node.js and pnpm installed
- Repository dependencies installed (`pnpm install`)

### Common Workflows

**Check Current Coverage:**
```powershell
.\ONE_SHOT_100_v13.ps1
```

**Generate Status Report:**
```powershell
.\STATUS_90D_MINI.ps1
```

**Quick Coverage Diff:**
```powershell
.\STATUS_COV_DIFF_FAST.ps1
```

## 📊 Coverage Thresholds

The repository enforces the following coverage thresholds:
- **Statements:** ≥ 90%
- **Functions:** ≥ 80%
- **Branches:** ≥ 80%
- **Lines:** ≥ 90%

These thresholds are enforced in CI/CD pipelines.

## 🔧 Maintenance

### Version Management
- Latest version: `ONE_SHOT_100_v13.ps1`
- Older versions retained for compatibility
- When creating new versions, increment version number

### Script Updates
When updating scripts:
1. Test locally first
2. Update this README with changes
3. Increment version number if breaking changes
4. Document new thresholds or parameters

## 📝 Notes

- These scripts are Windows-specific
- For cross-platform alternatives, see `scripts/` root directory
- Bash equivalents available for Linux/macOS environments
- Scripts use PowerShell-safe syntax (no `??` operator, etc.)

## 🐛 Troubleshooting

**Issue:** Script execution blocked  
**Solution:** Enable script execution: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

**Issue:** Cannot find coverage files  
**Solution:** Run tests first: `pnpm test:coverage`

**Issue:** Threshold errors  
**Solution:** Check if tests are failing or coverage has regressed

## 📚 Related Documentation

- [Main Scripts README](../README.md)
- [CI/CD Documentation](../../.github/workflows/README.md)
- [Testing Guide](../../tests/README.md)
- [Cleanup Report](../../docs/CLEANUP_REPORT.md)

---

**Last Updated:** October 7, 2024  
**Maintained By:** ECONEURA DevOps Team
