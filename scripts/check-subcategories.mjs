import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

const encode = code => `data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(code)).toString('base64')}`
const url = encode(await readFile(new URL('../src/data/subcategories.ts', import.meta.url), 'utf8'))
const { getSubcategories, suggestSubcategory, validSubcategory, canonicalCategory } = await import(url)
const typeSource = (await readFile(new URL('../src/data/productTypes.ts', import.meta.url), 'utf8')).replace("'./subcategories'", JSON.stringify(url))
const { matchesProductType } = await import(encode(typeSource))
assert.deepEqual(getSubcategories('kitchen').map(item => item.name), ['Cookers & burners', 'Kitchen essentials'])
assert.equal(validSubcategory('kitchen','fans'), false)
assert.equal(validSubcategory('air-conditioners','fans'), true)
assert.equal(canonicalCategory('audio'), 'entertainment')
assert.equal(suggestSubcategory('kitchen','Bruhm Microwave Oven'), 'small-appliances')
assert.equal(suggestSubcategory('laundry','Twin tub semi-automatic washer'), 'semi-automatic')
assert.equal(suggestSubcategory('phones','Phone'), 'general')
assert.equal(suggestSubcategory('kitchen','Unrecognised item'), '')
const arbitrary = { slug:'test', name:'ABC 123', specs:[], subcategory:'cooking' }
assert.equal(matchesProductType(arbitrary, 'kitchen','cooking'), true)
assert.equal(matchesProductType(arbitrary, 'kitchen','small-appliances'), false)
assert.equal(matchesProductType({...arbitrary,subcategory:'fans'}, 'cooling','fans'), true)
assert.equal(matchesProductType({...arbitrary,subcategory:'fans'}, 'cooling','air-conditioners'), false)
assert.equal(matchesProductType({...arbitrary,subcategory:'mini'}, 'refrigeration','single-door'), true)
const managed = [{ category: 'kitchen', id: 'coffee-makers', name: 'Coffee makers', filters: ['coffee-makers'] }]
assert.deepEqual(getSubcategories('kitchen', managed).map(item => item.id), ['coffee-makers'])
assert.equal(validSubcategory('kitchen', 'coffee-makers', managed), true)
assert.equal(validSubcategory('cooling', 'coffee-makers', managed), false)
assert.equal(validSubcategory('kitchen', 'cooking', managed), false)
assert.deepEqual(getSubcategories('kitchen', []), [])
assert.equal(matchesProductType({...arbitrary, subcategory: 'coffee-makers'}, 'kitchen', 'coffee-makers', managed), true)
assert.equal(matchesProductType({...arbitrary, subcategory: 'cooking'}, 'kitchen', 'cooking', managed), false)
assert.equal(matchesProductType(arbitrary, 'kitchen', 'unrecognised'), false)
const assignments=JSON.parse(await readFile(new URL('../supabase/seeds/subcategory_assignments.json', import.meta.url), 'utf8'))
for (const row of assignments) assert.ok(validSubcategory(row.category_id,row.subcategory_id), row.slug)
console.log(`Passed: dependent category options, invalid-pair rejection, keyword-independent filtering and ${assignments.length} backfill assignments.`)
