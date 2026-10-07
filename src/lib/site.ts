export const contact = {
  phone: '08085565004',
  phoneHref: 'tel:+2348085565004',
  whatsapp: '2348085565004',
  whatsappDisplay: '+234 808 556 5004',
  email: 'kelechiemmanuel999@gmail.com',
  instagram: 'https://www.instagram.com/a_kaycee_electricals/',
  directions: 'https://www.google.com/maps/search/?api=1&query=12%20Ajayi%20Road%2C%20Ogba%20Okeira%2C%20Lagos%2C%20Nigeria',
  address: '12 Ajayi Road, Ogba Okeira, Lagos State, Nigeria',
}

export const whatsappHref = (subject = 'your products') =>
  `https://wa.me/${contact.whatsapp}?text=${encodeURIComponent(`Hello A Kaycee Electricals, I'm interested in ${subject}. Please send me the current price and availability.`)}`

export const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/products', label: 'Products' },
  { to: '/about', label: 'About' },
  { to: '/services', label: 'Services' },
  { to: '/request', label: 'Request a quote' },
  { to: '/contact', label: 'Contact' },
]

export const setPageMeta = (title: string, description: string) => {
  document.title = `${title} | A Kaycee Electricals`
  document.querySelector('meta[name="description"]')?.setAttribute('content', description)
}

