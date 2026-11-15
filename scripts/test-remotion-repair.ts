import test from 'node:test'
import assert from 'node:assert/strict'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const repair = () => require('../src/main/services/video-workflow/remotion-repair')
const source = (content = 'export default () => null') => ({
  summary: '保持原镜头设计',
  files: [{ name: 'visuals.tsx', content }],
})
const controller = () => new AbortController()

test('native source failures feed current source and diagnostic back before rendering a repaired candidate', async () => {
  const { runNativeRepair, NativeCreationFailure } = repair()
  const prompts: string[] = []
  const phases: string[] = []
  let renders = 0
  const result = await runNativeRepair({
    prompt: '保留镜头与 SVG 轨迹',
    signal: controller().signal,
    phase: (message: string) => phases.push(message),
    create: async (prompt: string) => {
      prompts.push(prompt)
      return source(prompts.length === 1 ? 'broken' : 'fixed')
    },
    validate: (value: ReturnType<typeof source>) => {
      if (value.files[0].content === 'broken')
        throw new NativeCreationFailure('语法错误 visuals.tsx', 'source')
      return value
    },
    render: async () => {
      renders++
    },
  })
  assert.equal(result.sources.files[0].content, 'fixed')
  assert.equal(result.report.repairs, 1)
  assert.equal(result.report.attempts, 2)
  assert.equal(renders, 1)
  assert.match(prompts[1], /broken/)
  assert.match(prompts[1], /语法错误/)
  assert.match(prompts[1], /保留镜头与 SVG 轨迹/)
  assert.ok(phases.some((message) => /1\/2/.test(message)))
})

test('native render failures can repair twice and stop after the third candidate', async () => {
  const { runNativeRepair, NativeCreationFailure } = repair()
  let calls = 0
  await assert.rejects(
    runNativeRepair({
      prompt: 'Original',
      signal: controller().signal,
      phase: () => {},
      create: async () => {
        calls++
        return source()
      },
      validate: (value: unknown) => value,
      render: async () => {
        throw new NativeCreationFailure('ReferenceError: Missing is not defined', 'render')
      },
    }),
    /2 次.*仍失败/,
  )
  assert.equal(calls, 3)
})

test('environment failures and explicit dependency blockers never trigger another Agent call', async () => {
  const { runNativeRepair } = repair()
  for (const failure of [new Error('Remotion 依赖检查失败'), new Error('浏览器启动失败')]) {
    let calls = 0
    await assert.rejects(
      runNativeRepair({
        prompt: 'Original',
        signal: controller().signal,
        phase: () => {},
        create: async () => {
          calls++
          return source()
        },
        validate: (value: unknown) => value,
        render: async () => {
          throw failure
        },
      }),
      (error) => error === failure,
    )
    assert.equal(calls, 1)
  }
})

test('every repair candidate is validated and single-scene scope violations terminate immediately', async () => {
  const { runNativeRepair, NativeCreationFailure } = repair()
  let calls = 0
  await assert.rejects(
    runNativeRepair({
      prompt: 'Only one scene',
      signal: controller().signal,
      phase: () => {},
      create: async () => {
        calls++
        return source()
      },
      validate: (value: unknown) => {
        if (calls === 2) throw new Error('当前分镜修改只能改变对应 scene 模块')
        return value
      },
      render: async () => {
        throw new NativeCreationFailure('TypeError: invalid element', 'render')
      },
    }),
    /当前分镜/,
  )
  assert.equal(calls, 2)
})

test('cancellation and the overall deadline stop pending work without creating a repair', async () => {
  const { runNativeRepair } = repair()
  for (const cancel of [true, false]) {
    const abort = controller()
    let calls = 0
    const promise = runNativeRepair({
      prompt: 'Original',
      signal: abort.signal,
      timeoutMs: 20,
      phase: () => {},
      create: async (_prompt: string, options: { signal: AbortSignal }) => {
        calls++
        assert.ok(options.signal)
        if (cancel) abort.abort()
        return new Promise(() => {})
      },
      validate: (value: unknown) => value,
      render: async () => {},
    })
    await assert.rejects(promise, cancel ? /取消|abort/i : /总时限/)
    assert.equal(calls, 1)
  }
})

test('render diagnostics classify code failures but keep environment, material and dependency failures terminal', () => {
  const { nativeRenderFailure } = repair()
  for (const message of [
    "Module not found: Can't resolve './component-task'",
    "Attempted import error: 'Thing' is not exported from 'remotion'",
    'ReferenceError: Missing is not defined\n at renderer/browser/Browser.js:14:2',
    'CLI 退出码 1\nYour macOS version is older than macOS 15 (Sequoia). Some features such as rendering may not work.\n ReferenceError  ACCEPTANCE_INJECTED_SOURCE_FAILURE',
    ' TypeError  Cannot read properties of undefined',
    ' SyntaxError  Unexpected token',
    'Error: Element type is invalid',
  ]) {
    assert.equal(nativeRenderFailure(new Error(message)).repairable, true, message)
  }
  for (const message of [
    'Could not find browser',
    'TypeError: spawn EACCES',
    "Module not found: Can't resolve 'three'",
    'Error: ENOENT narration.wav',
    'Error: Failed to load resource asset.png',
    'Error: timeout',
    'Error: SIGKILL',
  ]) {
    assert.equal(nativeRenderFailure(new Error(message)).repairable, false, message)
  }
  const error = nativeRenderFailure(
    new Error(
      'ReferenceError: Missing is not defined; API_KEY=sk-secretvalue Authorization: Bearer secret-token DEEPSEEK_API_KEY=dsk-private-value "access_token":"private-access-value" https://user:private-password@example.com',
    ),
  )
  assert.doesNotMatch(
    error.message,
    /sk-secretvalue|secret-token|dsk-private-value|private-access-value|private-password/,
  )
  const longFailure = nativeRenderFailure(
    new Error(`ReferenceError: Missing is not defined\n${'frame context '.repeat(500)}`),
  )
  assert.equal(longFailure.repairable, true)
  assert.ok(longFailure.message.length <= 4000)
})

test('real source validation repairs syntax but stops for unavailable creative dependencies', async () => {
  const { runNativeRepair } = repair()
  const { validateNativeSources } = require('../src/main/services/video-workflow/remotion-native')
  for (const missingDependency of [false, true]) {
    let calls = 0
    const run = runNativeRepair({
      prompt: 'Keep the custom visual',
      signal: controller().signal,
      phase: () => {},
      create: async () => {
        calls++
        return source(
          missingDependency
            ? "import Three from 'three'; export default () => null"
            : calls === 1
              ? 'export default function Broken( {'
              : 'export default () => null',
        )
      },
      validate: (value: unknown) => validateNativeSources(value, [], {}),
      render: async () => {},
    })
    if (missingDependency) {
      await assert.rejects(run, /依赖未安装/)
      assert.equal(calls, 1)
    } else {
      assert.equal((await run).report.repairs, 1)
      assert.equal(calls, 2)
    }
  }
})

test('cancelling an in-flight render propagates its signal without requesting another source', async () => {
  const { runNativeRepair } = repair()
  const abort = controller()
  let calls = 0
  let renderSignal: AbortSignal | undefined
  const run = runNativeRepair({
    prompt: 'Original',
    signal: abort.signal,
    phase: () => {},
    create: async () => {
      calls++
      return source()
    },
    validate: (value: ReturnType<typeof source>) => value,
    render: async (_sources: unknown, options: { signal: AbortSignal }) => {
      renderSignal = options.signal
      abort.abort()
      return new Promise(() => {})
    },
  })
  await assert.rejects(run, /取消/)
  assert.equal(renderSignal?.aborted, true)
  assert.equal(calls, 1)
})

test('Agent execution failure is terminal and repair reports only record actual completed attempts', async () => {
  const { runNativeRepair, NativeCreationFailure } = repair()
  let calls = 0
  await assert.rejects(
    runNativeRepair({
      prompt: 'Original',
      signal: controller().signal,
      phase: () => {},
      create: async () => {
        calls++
        throw new Error('CLI authentication failed')
      },
      validate: (value: ReturnType<typeof source>) => value,
      render: async () => {},
    }),
    /authentication/,
  )
  assert.equal(calls, 1)
  let renders = 0
  const result = await runNativeRepair({
    prompt: 'Original',
    signal: controller().signal,
    phase: () => {},
    create: async () => source(),
    validate: (value: ReturnType<typeof source>) => value,
    render: async () => {
      renders++
      if (renders < 3)
        throw new NativeCreationFailure('ReferenceError: Missing is not defined', 'render')
    },
  })
  assert.equal(result.report.attempts, 3)
  assert.equal(result.report.repairs, 2)
  assert.equal(result.report.diagnostics.length, 2)
})
