const test = require('node:test')
const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
const { join, resolve } = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')

const source = readFileSync(join(__dirname, '../src/main/index.ts'), 'utf8')
const startup = source.slice(
  source.indexOf('const isDev ='),
  source.indexOf('const primaryInstance ='),
)
const javascript = ts.transpileModule(startup, {
  compilerOptions: { target: ts.ScriptTarget.ES2022 },
}).outputText

function identity(databases = [], isolatedData) {
  const paths = {
    appData: resolve('/application-data'),
    userData: resolve('/application-data/herein'),
  }
  let name = 'herein'
  const created = []
  const app = {
    isPackaged: false,
    getPath: (key) => paths[key],
    setPath: (key, value) => {
      paths[key] = value
    },
    setName: (value) => {
      name = value
      paths.userData = join(paths.appData, value)
    },
  }
  vm.runInNewContext(javascript, {
    app,
    join,
    resolve,
    existsSync: (path) => databases.includes(path),
    mkdirSync: (path) => created.push(path),
    process: { env: { MYDASHBOARD_USER_DATA: isolatedData } },
  })
  return { name, userData: paths.userData, created }
}

test('new installs use the Herein application name and profile', () => {
  assert.deepEqual(identity(), {
    name: 'Herein',
    userData: resolve('/application-data/Herein'),
    created: [],
  })
})

test('existing development and packaged profiles retain their database directory', () => {
  for (const legacyName of ['my-dashboard', 'MyDashboard']) {
    const directory = resolve('/application-data', legacyName)
    const actual = identity([join(directory, 'database/dashboard.db')])
    assert.equal(actual.name, 'Herein')
    assert.equal(actual.userData, directory)
    assert.deepEqual(actual.created, [])
  }
})

test('an explicit isolated profile takes precedence over existing legacy data', () => {
  const actual = identity(
    [resolve('/application-data/my-dashboard/database/dashboard.db')],
    './isolated-herein',
  )
  assert.equal(actual.name, 'Herein')
  assert.equal(actual.userData, resolve('./isolated-herein'))
  assert.deepEqual(actual.created, [resolve('./isolated-herein')])
})
