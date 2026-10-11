// Illustrative room/installation photography, separate from product stock images.
// Source URLs and downloaded originals are documented in public/assets/heroes/SOURCES.md.
export const categoryHeroes: Record<string, { image: string; alt: string; position: string; mirror?: boolean }> = {
  cooling: { image: '/assets/heroes/cooling.jpg', alt: 'Wall-mounted air conditioner above a sofa in a bright living room', position: 'center top' },
  entertainment: { image: '/assets/heroes/entertainment.jpg', alt: 'Television and media console in a bright modern living room', position: 'left center', mirror: true },
  refrigeration: { image: '/assets/heroes/refrigeration.jpg', alt: 'Refrigerator in a sunlit kitchen with white cabinets', position: 'center' },
  laundry: { image: '/assets/heroes/laundry.jpg', alt: 'Front-load washing machine in a bright laundry room', position: 'center', mirror: true },
  kitchen: { image: '/assets/heroes/kitchen.jpg', alt: 'Range cooker and countertop appliances in a light kitchen', position: 'center' },
  lighting: { image: '/assets/heroes/lighting.jpg', alt: 'Glowing pendant lights above a warm and inviting living space', position: 'center', mirror: true },
  'electrical-materials': { image: '/assets/heroes/electrical-materials.jpg', alt: 'Colour-coded electrical cables connected to terminal blocks', position: 'center' },
}
