import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
const cache = new Map()
async function moduleUrl(name) {
  if (cache.has(name)) return cache.get(name)
  let source = stripTypeScriptTypes(await readFile(new URL(`../src/data/${name}.ts`, import.meta.url), 'utf8'))
  for (const match of [...source.matchAll(/from '\.\/(\w+)'/g)]) source = source.replace(match[0], `from ${JSON.stringify(await moduleUrl(match[1]))}`)
  const url = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`
  cache.set(name, url); return url
}
const { categoryGroups, firstGroupProduct } = await import(await moduleUrl('categoryGroups'))
const { defaultSubcategoryDefinitions } = await import(await moduleUrl('subcategories'))
const definitions = defaultSubcategoryDefinitions()
for (const category of ['cooling', 'entertainment', 'laundry', 'kitchen', 'refrigeration', 'lighting', 'electrical-materials']) assert.equal(categoryGroups(category, definitions).length, 2)
assert.deepEqual(categoryGroups('cooling', definitions).map(group => group.id), ['air-conditioners', 'fans'])
assert.deepEqual(categoryGroups('laundry', definitions).map(group => group.id), ['front-load', 'top-load'])
const product = (slug, category, subcategory, createdAt, image = `/${slug}.jpg`) => ({ slug, name: slug, category, subcategory, createdAt, image, specs: [], brand: 'Generic', description: '' })
const newer = product('new', 'cooling', 'air-conditioners', '2026-10-13T12:00:00Z')
const older = product('old', 'air-conditioners', 'inverter-split', '2026-09-01T12:00:00Z')
const fan = product('fan', 'fans', 'fans', '2026-08-01T12:00:00Z')
assert.equal(firstGroupProduct([newer, fan, older], 'cooling', 'air-conditioners', definitions).slug, 'old')
assert.equal(firstGroupProduct([older, fan, newer], 'cooling', 'fans', definitions).slug, 'fan')
assert.equal(firstGroupProduct([fan], 'cooling', 'air-conditioners', definitions), undefined)
assert.equal(firstGroupProduct([{ ...older, image: '/updated.webp' }, newer], 'cooling', 'air-conditioners', definitions).image, '/updated.webp')
assert.equal(firstGroupProduct([{ ...older, image: '' }, newer], 'cooling', 'air-conditioners', definitions).image, '')
assert.equal(firstGroupProduct([product('oven', 'kitchen', 'small-appliances', '2026-09-01T12:00:00Z')], 'kitchen', 'cooking', definitions), undefined)
const custom = [{ category: 'phones', id: 'phones', name: 'Phones', filters: ['phones'], sortOrder: 2 }, { category: 'phones', id: 'tablets', name: 'Tablets', filters: ['tablets'], sortOrder: 1 }, { category: 'phones', id: 'accessories', name: 'Accessories', filters: ['accessories'], sortOrder: 3 }]
assert.deepEqual(categoryGroups('phones', custom).map(group => group.id), ['tablets', 'phones'])
assert.equal(firstGroupProduct([product('device', 'phones', 'phones', '2026-10-01T00:00:00Z')], 'phones', 'phones', custom).slug, 'device')
assert.deepEqual(categoryGroups('empty-category', []), [])
assert.equal(categoryGroups('phones', custom.slice(0, 1)).length, 1)
const tied = [product('b', 'cooling', 'fans', '2026-10-01T00:00:00Z'), product('a', 'cooling', 'fans', '2026-10-01T00:00:00Z')]
assert.equal(firstGroupProduct(tied, 'cooling', 'fans', definitions).slug, 'a')
assert.equal(firstGroupProduct(tied.toReversed(), 'cooling', 'fans', definitions).slug, 'a')
console.log('Passed: two main cards, oldest-product images, legacy category aliases, image updates, empty/missing-image groups, stable timestamp ties and custom department groups.')
