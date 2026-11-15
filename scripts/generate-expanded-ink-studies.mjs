import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { generateStudies } from '../resources/skills/chinese-ink-elements/scripts/generate-expanded-studies.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
generateStudies(join(root, 'resources/visuals/traditional-culture/expanded-studies'), {
  overwrite: true,
})
