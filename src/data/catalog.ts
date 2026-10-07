export type CategoryId = string

export type Category = {
  id: CategoryId
  name: string
  shortName: string
  description: string
  image: string
}

export type Product = {
  slug: string
  name: string
  category: CategoryId
  brand: string
  description: string
  specs: string[]
  image: string
  featured?: boolean
}

export const categories: Category[] = [
  {
    id: 'air-conditioners',
    name: 'Air Conditioners',
    shortName: 'Cooling',
    description: 'Split, standing, inverter and low-voltage cooling solutions.',
    image: '/assets/products/hisense-1-5hp-ac.jpg',
  },
  {
    id: 'televisions',
    name: 'Televisions & Home Theater',
    shortName: 'Viewing',
    description: 'Smart 4K UHD, QLED TVs and immersive home entertainment.',
    image: '/assets/products/samsung-65-qled-clean.jpg',
  },
  {
    id: 'refrigeration',
    name: 'Refrigerators & Freezers',
    shortName: 'Freshness',
    description: 'Energy-efficient cooling for homes, offices, and shops.',
    image: '/assets/products/hisense-fridge-1.jpg',
  },
  {
    id: 'laundry',
    name: 'Washing Machines',
    shortName: 'Laundry',
    description: 'Front-load, top-load and twin-tub automatic washers.',
    image: '/assets/products/midea-washing-machine.jpg',
  },
  {
    id: 'fans',
    name: 'Rechargeable & Standing Fans',
    shortName: 'Airflow',
    description: 'Heavy-duty standing, ceiling, and rechargeable mist fans.',
    image: '/assets/products/royal-standing-fan.jpg',
  },
  {
    id: 'lighting',
    name: 'Lighting & Fixtures',
    shortName: 'Lighting',
    description: 'Energy-saving LED panel lights, spotlights and ceiling fixtures.',
    image: '/assets/products/led-ceiling-light.jpg',
  },
  {
    id: 'electrical-materials',
    name: 'Electrical Materials & Wiring',
    shortName: 'Wiring',
    description: 'Cables, switches, sockets, changeovers and installation essentials.',
    image: '/assets/products/copper-cable-coil.jpg',
  },
  {
    id: 'kitchen',
    name: 'Kitchen Appliances',
    shortName: 'Kitchen',
    description: 'Gas cookers, microwave ovens, blenders and dispensers.',
    image: '/assets/products/bruhm-microwave.jpg',
  },
  {
    id: 'audio',
    name: 'Audio Systems & Electronics',
    shortName: 'Audio',
    description: 'Bluetooth soundbars, home theater sets and stabilizers.',
    image: '/assets/products/dolby-soundbar.jpg',
  },
]

export type BrandItem = {
  name: string
  logo: string
  logoDark?: string
  tagline: string
  categories?: string[]
}

export const brandList: BrandItem[] = [
  {
    name: 'Hisense',
    logo: '/assets/brands/hisense logo.png',
    tagline: 'Cooling, television and refrigeration options',
    categories: ['Inverter Split ACs', 'Smart TVs', 'Refrigerators', 'Chest Freezers'],
  },
  {
    name: 'LG',
    logo: '/assets/brands/LG logo.png',
    tagline: 'Television, laundry and home-entertainment options',
    categories: ['Smart UHD TVs', 'InstaView Fridges', 'Direct Drive Washers', 'Soundbars'],
  },
  {
    name: 'Samsung',
    logo: '/assets/brands/Samsung logo.png',
    tagline: 'Televisions, refrigeration and audio options',
    categories: ['QLED 4K TVs', 'Double Door Fridges', 'Dolby Soundbars', 'WindFree ACs'],
  },
  {
    name: 'Midea',
    logo: '/assets/brands/Midea logo.png',
    tagline: 'Cooling, laundry and water-dispenser options',
    categories: ['Inverter Split ACs', 'Front Load Washers', 'Bottom Loading Dispensers'],
  },
  {
    name: 'Royal',
    logo: '/assets/brands/royal logo.png',
    logoDark: '/assets/brands/royal-dark.png',
    tagline: 'Fans, freezers and cooking-appliance options',
    categories: ['Rechargeable Fans', 'Standing Fans', 'Deep Freezers', 'Gas Cookers'],
  },
  {
    name: 'Bruhm',
    logo: '/assets/brands/bruhm logo.png',
    logoDark: '/assets/brands/bruhm-dark.png',
    tagline: 'Kitchen and household appliance options',
    categories: ['Microwaves', 'Standing Cookers', 'Single Door Fridges'],
  },
  {
    name: 'Polystar',
    logo: '/assets/brands/polystar logo.png',
    tagline: 'Audio, television and appliance options',
    categories: ['Bluetooth Audio', 'Smart TVs', 'Table Top Fridges'],
  },
]

export const brands = brandList.map((item) => item.name)

export const products: Product[] = [
  {
    slug: 'hisense-1-5hp-inverter-split-ac',
    name: 'Hisense 1.5HP Inverter Split AC',
    category: 'air-conditioners',
    brand: 'Hisense',
    description: 'A 1.5HP inverter split air-conditioner example for bedrooms and medium-sized rooms. Confirm the exact model and package with the store.',
    specs: ['1.5HP capacity', 'Inverter model', 'Split-unit format', 'Confirm exact features on enquiry'],
    image: '/assets/products/hisense-1-5hp-ac.jpg',
    featured: true,
  },
  {
    slug: 'midea-2hp-split-ac',
    name: 'Midea 2HP Split AC',
    category: 'air-conditioners',
    brand: 'Midea',
    description: 'A 2HP split air-conditioner example for larger rooms and shared spaces. Confirm the exact model and specifications with the store.',
    specs: ['2.0HP capacity', 'Split-unit format', 'For larger rooms', 'Confirm exact features on enquiry'],
    image: '/assets/products/midea-2hp-ac-set.png',
    featured: true,
  },
  {
    slug: 'lg-55-smart-4k-uhd-tv',
    name: 'LG 55-inch Smart 4K UHD TV',
    category: 'televisions',
    brand: 'LG',
    description: 'A 55-inch smart television example for living rooms and entertainment spaces. Confirm the exact model, software and accessories with the store.',
    specs: ['55-inch screen', '4K UHD class', 'Smart TV format', 'Confirm exact features on enquiry'],
    image: '/assets/products/lg-55-4k-tv.jpg',
    featured: true,
  },
  {
    slug: 'samsung-65-qled-smart-tv',
    name: 'Samsung 65-inch QLED 4K Smart TV',
    category: 'televisions',
    brand: 'Samsung',
    description: 'A 65-inch smart television example for larger home-entertainment spaces. Confirm the exact model and specifications with the store.',
    specs: ['65-inch screen', '4K QLED class', 'Smart TV format', 'Confirm exact features on enquiry'],
    image: '/assets/products/samsung-65-qled-clean.jpg',
    featured: true,
  },
  {
    slug: 'hisense-double-door-refrigerator',
    name: 'Hisense Double Door Refrigerator',
    category: 'refrigeration',
    brand: 'Hisense',
    description: 'A double-door refrigerator example for family homes and shared spaces. Confirm capacity, finish and features with the store.',
    specs: ['Double-door format', 'For home use', 'Multiple capacity options', 'Confirm exact features on enquiry'],
    image: '/assets/products/hisense-fridge-1.jpg',
    featured: true,
  },
  {
    slug: 'midea-front-load-washing-machine',
    name: 'Midea Front Load Automatic Washing Machine',
    category: 'laundry',
    brand: 'Midea',
    description: 'A front-load washing-machine example for home laundry. Confirm capacity, programs and model features with the store.',
    specs: ['Front-load format', 'Automatic washing machine', 'Multiple capacities may be available', 'Confirm exact features on enquiry'],
    image: '/assets/products/midea-washing-machine.jpg',
    featured: true,
  },
  {
    slug: 'royal-standing-fan',
    name: 'Royal Standing Fan',
    category: 'fans',
    brand: 'Royal',
    description: 'A standing-fan example for household and office use. Confirm fan size, controls and model features with the store.',
    specs: ['Standing-fan format', 'For household or office use', 'Multiple sizes may be available', 'Confirm exact features on enquiry'],
    image: '/assets/products/royal-standing-fan.jpg',
  },
  {
    slug: 'led-ceiling-light',
    name: 'LED Ceiling Panel Light',
    category: 'lighting',
    brand: 'Generic',
    description: 'An LED lighting example for indoor spaces. Ask the store about sizes, colour temperatures and suitable fittings.',
    specs: ['LED lighting', 'Indoor-use example', 'Different sizes may be available', 'Confirm exact features on enquiry'],
    image: '/assets/products/led-ceiling-light.jpg',
  },
  {
    slug: 'electrical-cable',
    name: 'Single Core Electrical Cable (1.5mm / 2.5mm / 4mm)',
    category: 'electrical-materials',
    brand: 'Generic',
    description: 'An electrical cable example for installation projects. Ask a qualified electrician and the store team to help identify a suitable size and type.',
    specs: ['1.5mm, 2.5mm and 4mm options', 'For electrical installations', 'Confirm roll length and material on enquiry', 'Use qualified installation support'],
    image: '/assets/products/copper-cable-coil.jpg',
    featured: true,
  },
  {
    slug: 'wall-socket',
    name: 'Double Gang Switched Wall Socket',
    category: 'electrical-materials',
    brand: 'Generic',
    description: 'A switched wall-socket example for electrical installation work. Confirm ratings, finish and configuration with the store.',
    specs: ['Double-gang format', 'For electrical installations', 'Different configurations may be available', 'Confirm exact features on enquiry'],
    image: '/assets/products/switched-wall-socket.jpg',
  },
  {
    slug: 'bruhm-microwave',
    name: 'Bruhm Microwave Oven',
    category: 'kitchen',
    brand: 'Bruhm',
    description: 'A microwave-oven example for everyday kitchen use. Confirm capacity, functions and exact model with the store.',
    specs: ['Kitchen appliance', 'Multiple capacities may be available', 'For reheating and food preparation', 'Confirm exact features on enquiry'],
    image: '/assets/products/bruhm-microwave.jpg',
  },
  {
    slug: 'soundbar',
    name: 'Bluetooth Soundbar',
    category: 'audio',
    brand: 'Generic',
    description: 'A soundbar example for home-entertainment setups. Confirm audio inputs, included accessories and exact model with the store.',
    specs: ['Home-entertainment audio', 'Bluetooth option', 'For TV setups', 'Confirm exact features on enquiry'],
    image: '/assets/products/dolby-soundbar.jpg',
  },
]

export const categoryById = (id: string, customCategories?: Category[]): Category => {
  const list = customCategories && customCategories.length > 0 ? customCategories : categories
  const found = list.find((category) => category.id.toLowerCase() === id.toLowerCase())
  if (found) return found
  return {
    id,
    name: id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    shortName: id.replace(/-/g, ' '),
    description: 'Quality appliances and equipment at A Kaycee Electricals.',
    image: '/assets/products/hisense-1-5hp-ac.jpg',
  }
}
