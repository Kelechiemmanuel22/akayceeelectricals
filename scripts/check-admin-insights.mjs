import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { stripTypeScriptTypes } from 'node:module'
const source = stripTypeScriptTypes(await readFile(new URL('../src/lib/adminInsights.ts', import.meta.url), 'utf8'))
const { activitySeries, rankProductActivity, percentageChange } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const event = (event_name, date, details = {}) => ({ event_name, created_at: `${date}T12:00:00Z`, page_path: '/', product_slug: null, ...details })
const products = [{ slug: 'ac', name: 'Cooling AC' }, { slug: 'tv', name: 'Smart TV' }]
const events = [event('page_view', '2026-10-01'), event('page_view', '2026-10-02'), event('page_view', '2026-10-02', { page_path: '/ak-owner-portal' }), event('whatsapp_click', '2026-10-02', { metadata: { subject: 'Cooling AC' } }), event('product_view', '2026-10-02', { product_slug: 'ac' }), event('search', '2026-10-02', { product_slug: 'tv' }), event('whatsapp_click', '2026-10-02', { product_slug: 'tv' })]
const series = activitySeries(events, 3, new Date('2026-10-02T23:00:00Z'))
assert.deepEqual(series.map(point => point.date), ['2026-09-30', '2026-10-01', '2026-10-02'])
assert.deepEqual(series.map(point => point.views), [0, 1, 1])
assert.deepEqual(series.map(point => point.whatsapp), [0, 0, 2])
assert.deepEqual(rankProductActivity(events, products), [{ slug: 'ac', views: 1, whatsapp: 1 }, { slug: 'tv', views: 0, whatsapp: 1 }])
assert.deepEqual(rankProductActivity([event('product_view', '2026-10-02', { product_slug: 'deleted' })], products), [])
assert.deepEqual(rankProductActivity([event('whatsapp_click', '2026-10-02', { metadata: { subject: 123 } })], products), [])
assert.equal(percentageChange(20, 10), 100)
assert.equal(percentageChange(5, 10), -50)
assert.equal(percentageChange(20, 0), null)
assert.equal(percentageChange(null, 10), null)
console.log('Passed: UTC daily aggregation, admin-visit exclusion, product-view-only ranking, WhatsApp attribution and honest percentage changes.')
