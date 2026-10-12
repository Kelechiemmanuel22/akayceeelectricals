import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

async function loadData(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  const outputText = stripTypeScriptTypes(source)
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}
const { researchedProducts: models } = await loadData('../src/data/researchedProducts.ts')
const { categoryProductTypes, matchesProductType } = await loadData('../src/data/productTypes.ts')
assert.equal(models.length, 14)
assert.equal(new Set(models.map(p => p.slug)).size, models.length)
for (const model of models) {
  await access(new URL(`../public${model.image}`, import.meta.url))
  assert.ok(model.sourceUrl.startsWith('https://'))
  assert.ok(model.specs.length >= 4)
}
for (const [category, filters] of Object.entries(categoryProductTypes)) {
  for (const filter of filters) {
    if (['fans', 'freezers'].includes(filter.id)) continue // Existing catalogue, not this model batch.
    assert.ok(models.some(p => p.category === category && matchesProductType(p, category, filter.id)), `${category}/${filter.id} has no example`)
  }
}
const standalone = models.filter(p => p.category === 'laundry' && matchesProductType(p, 'laundry', 'dryers'))
const combined = models.filter(p => p.category === 'laundry' && matchesProductType(p, 'laundry', 'washer-dryers'))
assert.equal(standalone.length, 1)
assert.equal(combined.length, 1)
assert.notEqual(standalone[0].slug, combined[0].slug)
assert.equal(matchesProductType({ name: 'Non-inverter split AC', specs: [] }, 'cooling', 'inverter-split'), false)
assert.equal(matchesProductType({ name: 'Floor-standing fan', specs: [] }, 'cooling', 'floor-standing'), false)
console.log('Passed: 14 models, image files, manufacturer sources, every new subtype, and dryer/AC exclusions.')
