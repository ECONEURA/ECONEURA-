/**
 * Custom Vitest Reporter - Atomic JSON Output
 * 
 * Generates a JSON report for CI/CD pipelines with test results.
 * This reporter is intentionally simple and atomic (single write).
 */

const fs = require('fs');
const path = require('path');

class AtomicJSONReporter {
  constructor(options = {}) {
    this.outputFile = options.outputFile || 'reports/vitest.json';
  }

  onInit(ctx) {
    this.ctx = ctx;
    this.startTime = Date.now();
  }

  async onFinished(files = [], errors = []) {
    const endTime = Date.now();
    const duration = endTime - this.startTime;

    const report = {
      timestamp: new Date().toISOString(),
      duration,
      numTotalTests: 0,
      numPassedTests: 0,
      numFailedTests: 0,
      numPendingTests: 0,
      testResults: [],
      success: errors.length === 0,
    };

    // Process test files
    for (const file of files || []) {
      const fileResult = {
        name: file.name || file.filepath,
        status: 'passed',
        duration: file.result?.duration || 0,
        tests: [],
      };

      if (file.result?.state === 'fail') {
        fileResult.status = 'failed';
      }

      // Process individual tests
      for (const task of file.tasks || []) {
        const test = {
          name: task.name,
          status: task.result?.state || 'pending',
          duration: task.result?.duration || 0,
        };

        if (task.result?.state === 'pass') {
          report.numPassedTests++;
        } else if (task.result?.state === 'fail') {
          report.numFailedTests++;
          test.error = task.result?.error?.message || 'Unknown error';
        } else {
          report.numPendingTests++;
        }

        report.numTotalTests++;
        fileResult.tests.push(test);
      }

      report.testResults.push(fileResult);
    }

    // Process errors
    if (errors.length > 0) {
      report.errors = errors.map(e => ({
        message: e.message,
        stack: e.stack,
      }));
    }

    // Ensure output directory exists
    const outputDir = path.dirname(this.outputFile);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write report atomically
    try {
      fs.writeFileSync(this.outputFile, JSON.stringify(report, null, 2), 'utf8');
    } catch (error) {
      console.error(`Failed to write test report to ${this.outputFile}:`, error);
    }
  }
}

module.exports = AtomicJSONReporter;
