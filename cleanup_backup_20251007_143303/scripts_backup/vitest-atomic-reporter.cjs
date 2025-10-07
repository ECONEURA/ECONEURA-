const fs = require('fs')
const path = require('path')

module.exports = function atomicReporter(_globalConfig, options = {}) {
  const outputFile = options.outputFile || 'reports/vitest.json'

  return {
    name: 'atomic-json-reporter',
    async onFinished(results) {
      try {
        const abs = path.isAbsolute(outputFile) ? outputFile : path.resolve(process.cwd(), outputFile)
        const dir = path.dirname(abs)
        const tmp = abs + '.tmp'

        await fs.promises.mkdir(dir, { recursive: true })
        // safe stringify to avoid circular structure errors
        const seen = new Set()
        const data = JSON.stringify(results, function (key, value) {
          if (typeof value === 'object' && value !== null) {
            if (seen.has(value)) return '[Circular]'
            seen.add(value)
          }
          // functions and symbols are not serializable
          if (typeof value === 'function') return value.name || '[Function]'
          return value
        })
        // write to temp file first, then rename atomically
        await fs.promises.writeFile(tmp, data, { encoding: 'utf8' })
        await fs.promises.rename(tmp, abs)
      } catch (err) {
        // Log but don't throw — reporter must not break the test run
        // Use console.error so it appears in stdout/stderr streams
        try {
          console.error('vitest-atomic-reporter: failed to write report', err && err.stack ? err.stack : err)
        } catch (e) {
          // ignore
        }
      }
    }
  }
}
