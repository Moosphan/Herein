// Build first; Electron additionally verifies the real worker inside an ASAR.
require('tsx/cjs')
if (!process.versions.electron) {
  require('./test-codex-session-scanner.ts')
} else {
  const { mkdtempSync, mkdirSync, copyFileSync } = require('node:fs')
  const { rmSync } = require('original-fs')
  const { tmpdir } = require('node:os')
  const { join } = require('node:path')
  const root = mkdtempSync(join(tmpdir(), 'usage-worker-asar-'))
  const source = join(root, 'source')
  mkdirSync(source)
  copyFileSync(
    join(__dirname, '../out/main/codex-session-usage-worker.js'),
    join(source, 'worker.js'),
  )
  const asar = require(
    require.resolve('@electron/asar', { paths: [require.resolve('electron-builder')] }),
  )
  asar
    .createPackage(source, join(root, 'worker.asar'))
    .then(() => {
      process.env.CODEX_USAGE_TEST_WORKER = join(root, 'worker.asar/worker.js')
      require('./test-codex-session-scanner.ts')
      require('node:test').after(() => {
        rmSync(root, { recursive: true, force: true })
        require('electron').app.quit()
      })
    })
    .catch((error) => {
      console.error(error)
      rmSync(root, { recursive: true, force: true })
      require('electron').app.exit(1)
    })
}
