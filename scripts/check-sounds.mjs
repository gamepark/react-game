/**
 * Refuse to publish the library while a default sound names a file that is not in `sounds/`.
 *
 * The default sounds are declared by filename in `defaultSounds.ts` and shipped by `yarn sync-sounds`, which
 * mirrors `sounds/` onto the bucket. Nothing links the two: a name can be added to the table, or a file
 * renamed, and everything still compiles, still builds, still publishes. What breaks is silent and remote —
 * every game, on every start, fetching a URL that 404s, for a sound nobody hears.
 *
 * A published version cannot be taken back from the games that already installed it, so this runs from
 * `prepack`, before `yarn npm publish` and before the sync. `yarn build` stays free of it: filling the table
 * before the files are downloaded is a normal state to work in, just not one to publish.
 */

import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const tablePath = join(root, 'src/components/material/sound/defaultSounds.ts')
const soundsDir = join(root, 'sounds')

const table = readFileSync(tablePath, 'utf8')

// Matches the one call that builds a default sound, so a URL written any other way is deliberately not
// covered — there is exactly one way to add a default sound, and this is it.
const declared = [...table.matchAll(/defaultSound\(\s*'([^']+)'/g)].map(match => match[1])

const present = new Set(readdirSync(soundsDir))
const missing = [...new Set(declared)].filter(file => !present.has(file)).sort()

if (missing.length > 0) {
  console.error(`\n${missing.length} default sound${missing.length > 1 ? 's are' : ' is'} declared in defaultSounds.ts but absent from sounds/:\n`)
  for (const file of missing) console.error(`  ${file}`)
  console.error(`\nAdd the file${missing.length > 1 ? 's' : ''} to sounds/, or remove the entr${missing.length > 1 ? 'ies' : 'y'} from the table.`)
  console.error('Publishing now would make every game fetch a URL that does not exist, on every start.\n')
  process.exit(1)
}

console.log(`check-sounds: ${declared.length} default sound${declared.length > 1 ? 's' : ''} declared, all present in sounds/.`)
