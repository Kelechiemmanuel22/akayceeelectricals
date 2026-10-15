import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

const source = readFileSync(new URL('../src/lib/brandStore.ts', import.meta.url), 'utf8').replace(/^import type .*\n/gm, '')
const { brandPath, filterBrandProducts, relatedBrands } = await import(`data:text/javascript;base64,${Buffer.from(stripTypeScriptTypes(source)).toString('base64')}`)
const products = [
  { name:'LG TV', brand:'LG', category:'entertainment', description:'Smart screen', specs:['4K'] },
  { name:'LG Washer', brand:'lg', category:'laundry', description:'Front loading', specs:['9kg'] },
  { name:'Other TV', brand:'Samsung', category:'entertainment', description:'LG compatible remote', specs:[] },
]
assert.equal(brandPath('LG'), '/brand/lg')
assert.equal(brandPath('New Brand & Co'), '/brand/new%20brand%20%26%20co')
assert.equal(filterBrandProducts(products, ' LG ').length, 2)
assert.equal(filterBrandProducts(products, 'LG', 'laundry')[0].name, 'LG Washer')
assert.equal(filterBrandProducts(products, 'LG', 'all', '4k')[0].name, 'LG TV')
assert.equal(filterBrandProducts(products, 'LG', 'all', 'missing').length, 0)
assert.equal(filterBrandProducts(products, 'New Brand').length, 0)
assert.equal(filterBrandProducts(products, 'LG', 'entertainment').length, 1)
const stock = [...products,
  {name:'Philips Dry Iron',brand:'Philips',category:'electrical-appliances',specs:[]},
  {name:'Pinnacle Steam Iron',brand:'Pinnacle',category:'electrical-appliances',specs:[]},
  {name:'Kettle',brand:'Kettle brand',category:'electrical-appliances',specs:[]},
  {name:'Refrigerator',brand:'Fridge brand',category:'refrigeration',specs:[]},
]
const brands = ['LG','Samsung','Philips','Pinnacle','Kettle brand','Fridge brand','Empty brand'].map(name=>({name}))
assert.deepEqual(relatedBrands(brands,stock,'Philips').map(b=>b.name), ['Pinnacle'])
assert.deepEqual(relatedBrands(brands,stock,'LG','entertainment').map(b=>b.name), ['Samsung'])
assert.deepEqual(relatedBrands(brands,stock,'LG','laundry'), [])
assert.deepEqual(relatedBrands(brands,stock,'Empty brand'), [])
assert.equal(relatedBrands(brands,stock,'LG','all',0).length, 0)
const manyBrands = Array.from({length:40},(_,i)=>({name:`TV Brand ${i}`}))
const manyProducts = manyBrands.map(b=>({name:'TV',brand:b.name,category:'entertainment',specs:[]}))
assert.equal(relatedBrands([...brands,...manyBrands],[...stock,...manyProducts],'LG').length, 4)
console.log('Passed: dynamic brand links, case-insensitive brand isolation, category/spec search and empty states.')
console.log('Passed: relevant-stock-only recommendations, iron/kettle isolation, selected category, no-match hiding and four-brand cap.')
