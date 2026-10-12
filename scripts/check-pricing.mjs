import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'

const source = await readFile(new URL('../src/lib/pricing.ts', import.meta.url), 'utf8')
const { parsePrice, formatPrice } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`)
assert.equal(parsePrice(''), null)
assert.equal(parsePrice('  '), null)
assert.equal(parsePrice('450000'), 450000)
assert.equal(parsePrice('1999.99'), 1999.99)
assert.equal(parsePrice('0'), 0)
for (const value of ['-1','1.999','NaN','Infinity','1e6','10,000','10000000000']) assert.throws(() => parsePrice(value))
for (const value of [undefined, null, NaN, Infinity, -1]) assert.equal(formatPrice(value), null)
assert.ok(formatPrice(450000).includes('450,000'))
const card = await readFile(new URL('../src/components/ProductCard.tsx', import.meta.url), 'utf8')
const home = await readFile(new URL('../src/pages/HomePage.tsx', import.meta.url), 'utf8')
const category = await readFile(new URL('../src/pages/CategoryPages.tsx', import.meta.url), 'utf8')
assert.ok(card.includes('showPrice = false'))
assert.ok(!home.includes('showPrice'))
assert.ok(category.includes('product={product} showPrice'))
console.log('Passed: optional NGN price validation, formatting and category-only card opt-in.')
