import assert from 'node:assert/strict'
import { readFile, access } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

async function loadData(path) {
  const source = await readFile(new URL(path, import.meta.url), 'utf8')
  let outputText = stripTypeScriptTypes(source)
  if (outputText.includes("from './subcategories'")) {
    const dependency = stripTypeScriptTypes(await readFile(new URL('../src/data/subcategories.ts', import.meta.url), 'utf8'))
    outputText = outputText.replace("'./subcategories'", JSON.stringify(`data:text/javascript;base64,${Buffer.from(dependency).toString('base64')}`))
  }
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
assert.deepEqual(categoryProductTypes.laundry.map(filter => filter.id), ['front-load', 'top-load', 'semi-automatic', 'dryers', 'washer-dryers'])
const laundry = models.filter(p => p.category === 'laundry')
assert.equal(laundry.filter(p => matchesProductType(p, 'laundry', 'front-load')).length, 3)
assert.equal(laundry.filter(p => matchesProductType(p, 'laundry', 'top-load')).length, 2)
for (const product of laundry) {
  assert.equal(categoryProductTypes.laundry.slice(0, 2).filter(filter => filter.matches(product)).length, 1, `${product.slug} must belong to exactly one loading group`)
}
for (const type of ['semi-automatic', 'dryers', 'washer-dryers']) assert.equal(laundry.filter(p => matchesProductType(p, 'laundry', type)).length, 1)
assert.equal(matchesProductType({ name: 'Non-inverter split AC', specs: [] }, 'cooling', 'inverter-split'), false)
assert.equal(matchesProductType({ name: 'Floor-standing fan', specs: [] }, 'cooling', 'floor-standing'), false)
console.log('Passed: 14 models, two loading groups, restored laundry subtype filters and AC exclusions.')
