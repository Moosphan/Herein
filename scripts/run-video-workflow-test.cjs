const { spawnSync } = require('node:child_process')
const { join } = require('node:path')
const result = spawnSync(
  process.execPath,
  [
    '--import',
    'tsx',
    '--test',
    join(__dirname, 'test-video-workflow.ts'),
    join(__dirname, 'test-video-navigation.ts'),
    join(__dirname, 'test-subtitle-cues.ts'),
    join(__dirname, 'test-video-frame-inspection.ts'),
    join(__dirname, 'test-frame-inspection-service.ts'),
    join(__dirname, 'test-frame-cover.ts'),
    join(__dirname, 'test-frame-cover-service.ts'),
  ],
  {
    env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    stdio: 'inherit',
  },
)
process.exit(result.status ?? 1)
