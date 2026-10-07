import {
  ArrowRight,
  CheckCircle2,
  Mail,
  MapPin,
  Phone,
  ArrowUpRight,
  Building2,
} from "lucide-react";
import { useEffect, type ElementType, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SectionIntro } from "../components/SectionIntro";
import { WhatsAppLink } from "../components/WhatsAppLink";
import { WhatsAppIcon, InstagramIcon } from "../components/SocialIcons";
import { contact, setPageMeta } from "../lib/site";

const principles = [
  "More than 10 years of experience in electricals, appliances and electronics.",
  "A broad mix of electrical materials, home appliances and consumer electronics.",
  "Recognized brands across multiple product categories.",
  "A physical business location in Ogba Okeira, Lagos.",
];

const services = [
  [
    "Electrical & electronics supply",
    "Supply of electrical products and consumer electronics for homes, businesses and projects.",
  ],
  [
    "Appliance supply",
    "Air conditioners, TVs, refrigerators, freezers, washing machines and more.",
  ],
  [
    "Electrical materials",
    "Wires, cables, sockets, switches, changeovers and installation materials.",
  ],
  [
    "AC supply",
    "Split and standing air-conditioner options in different capacities.",
  ],
  [
    "Installation / workmanship",
    "Installation and workmanship where applicable. Contact us to discuss your needs.",
  ],
  [
    "Product information",
    "Ask the team about product options and current availability before you buy.",
  ],
];

function PageHero({
  eyebrow,
  title,
  text,
}: {
  eyebrow: string;
  title: ReactNode;
  text: string;
}) {
  return (
    <section className="page-hero">
      <div className="container">
        <p className="eyebrow text-gold-light">{eyebrow}</p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-white/80">
          {text}
        </p>
      </div>
    </section>
  );
}

export function AboutPage() {
  useEffect(
    () =>
      setPageMeta(
        "About",
        "Learn about A Kaycee Electricals, a Lagos business for electrical materials, home appliances and consumer electronics.",
      ),
    [],
  );
  return (
    <>
      <PageHero
        eyebrow="Our story"
        title={
          <>
            Over a decade of keeping <br />
            <span className="text-gold-light">Lagos spaces equipped.</span>
          </>
        }
        text="A Kaycee Electricals brings together electrical materials, home appliances and consumer electronics for homes, businesses and projects."
      />
      <section className="section">
        <div className="container grid gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <SectionIntro
              eyebrow="Who we are"
              title="Straightforward service. Practical options."
            >
              <p>
                A Kaycee Electricals is a Lagos-based business with more than 10
                years of experience serving customers looking for electrical
                materials, appliances and electronics.
              </p>
              <p className="mt-4">
                Whether you are furnishing a home, upgrading an office or
                preparing for an electrical installation, the team can help you
                explore relevant product options.
              </p>
            </SectionIntro>
            <ul className="mt-8 space-y-3.5">
              {principles.map((item) => (
                <li
                  key={item}
                  className="flex gap-3 text-sm leading-relaxed text-ink/80"
                >
                  <CheckCircle2
                    size={19}
                    className="mt-0.5 shrink-0 text-whatsapp"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link className="button button-dark" to="/products">
                Explore product catalogue <ArrowRight size={17} />
              </Link>
              <WhatsAppLink>Chat on WhatsApp</WhatsAppLink>
            </div>
          </div>
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white shadow-xl shadow-ink/10">
          <img
            src="/assets/business/hero-showroom.png"
            alt="A premium appliance showroom with cooling and home-entertainment products"
            className="absolute inset-0 size-full object-cover opacity-30"
          />
              <div className="relative z-10">
                <p className="eyebrow text-gold-light">Visit the store</p>
                <h3 className="mt-3 font-display text-3xl font-bold">
                  12 Ajayi Road, Ogba Okeira, Lagos.
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-white/80">
                  Contact the store team before visiting if you need to confirm
                  a particular item or product option.
                </p>
                <a
                  href={contact.directions}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-light mt-6 !py-2.5 !text-xs"
                >
                  <MapPin size={15} /> Get directions
                </a>
              </div>
            </div>
            <a
              href={contact.instagram}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between rounded-2xl border border-ink/10 bg-white p-5 text-sm font-bold text-ink transition hover:border-gold"
            >
              <div className="flex items-center gap-3.5">
                <span className="grid size-11 place-items-center rounded-full bg-pink-100 text-pink-600">
                  <InstagramIcon className="size-5" />
                </span>
                <div>
                  <p>Follow @a_kaycee_electricals</p>
                  <p className="text-xs font-normal text-ink/60">
                    Product videos, unboxings and new arrivals
                  </p>
                </div>
              </div>
              <ArrowUpRight size={18} className="text-gold-dark" />
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export function ServicesPage() {
  useEffect(
    () =>
      setPageMeta(
        "Services",
        "Electrical materials, appliances and electronics supply from A Kaycee Electricals in Lagos.",
      ),
    [],
  );
  return (
    <>
      <PageHero
        eyebrow="Supply & services"
        title={
          <>
            Supply that keeps your <br />
            <span className="text-gold-light">projects moving.</span>
          </>
        }
        text="From single household purchases to material lists for building projects, ask the team about relevant options."
      />
      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="What we offer"
            title="For homes, contractors & businesses."
          >
            Our services focus on product supply and enquiry-led support.
            Availability and terms are confirmed directly with the store.
          </SectionIntro>
          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map(([title, text], index) => (
              <article
                key={title}
                className="flex flex-col justify-between rounded-2xl border border-ink/10 bg-white p-8 shadow-xs transition hover:border-gold hover:shadow-md"
              >
                <div>
                  <span className="eyebrow text-gold-dark">
                    0{index + 1} / service
                  </span>
                  <h2 className="mt-4 font-display text-2xl font-bold text-ink">
                    {title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-ink/70">
                    {text}
                  </p>
                </div>
                <div className="mt-6 border-t border-ink/10 pt-4">
                  <WhatsAppLink subject={`Service inquiry: ${title}`} compact>
                    Enquire on WhatsApp
                  </WhatsAppLink>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
      <section className="section border-y border-gold/20 bg-ink text-white">
        <div className="container flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div>
            <p className="eyebrow text-gold-light">Have a project in mind?</p>
            <h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">
              Send us your material list or sizing request.
            </h2>
            <p className="mt-2 max-w-xl text-sm text-white/75">
              We will help you understand the available options and provide a
              current quote.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:shrink-0">
            <WhatsAppLink subject="Project material list consultation">
              Send list via WhatsApp
            </WhatsAppLink>
            <a href={contact.phoneHref} className="button button-light">
              <Phone size={16} /> Call the store
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

export function ContactPage() {
  useEffect(
    () =>
      setPageMeta(
        "Contact",
        "Contact A Kaycee Electricals at 12 Ajayi Road, Ogba Okeira, Lagos by phone, WhatsApp, email or Instagram.",
      ),
    [],
  );
  return (
    <>
      <PageHero
        eyebrow="Get in touch"
        title={
          <>
            Talk to a local <br />
            <span className="text-gold-light">
              electrical supplier in Lagos.
            </span>
          </>
        }
        text="Visit our Ogba location, chat with us on WhatsApp, call directly or reach out via Instagram."
      />
      <section className="section">
        <div className="container grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col justify-between rounded-3xl bg-ink p-8 text-white shadow-xl shadow-ink/10 sm:p-10">
            <div>
              <p className="eyebrow text-gold-light">Visit us</p>
              <h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">
                12 Ajayi Road, Ogba Okeira.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-white/75">
                Lagos State, Nigeria. Contact us before visiting if you would
                like to confirm a particular product or product option.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={contact.directions}
                  target="_blank"
                  rel="noreferrer"
                  className="button button-light"
                >
                  <MapPin size={17} /> Open in Google Maps
                </a>
                <WhatsAppLink>WhatsApp store</WhatsAppLink>
              </div>
            </div>
            <div className="mt-10 aspect-[16/8] overflow-hidden rounded-2xl border border-white/10 bg-white/5">
              <img
                src="/assets/business/hero-showroom.png"
                alt="A premium appliance showroom with cooling and home-entertainment products"
                className="size-full object-cover opacity-90"
              />
            </div>
          </div>
          <div className="space-y-4">
            <ContactCard
              icon={WhatsAppIcon}
              label="WhatsApp enquiries"
              value={contact.whatsappDisplay}
              href={`https://wa.me/${contact.whatsapp}`}
              external
              tone="whatsapp"
            />
            <ContactCard
              icon={Phone}
              label="Direct phone call"
              value={contact.phone}
              href={contact.phoneHref}
              tone="gold"
            />
            <ContactCard
              icon={InstagramIcon}
              label="Instagram profile"
              value="@a_kaycee_electricals"
              href={contact.instagram}
              external
              tone="pink"
            />
            <ContactCard
              icon={Mail}
              label="Email"
              value={contact.email}
              href={`mailto:${contact.email}`}
              tone="blue"
            />
            <div className="flex items-start gap-3 rounded-2xl border border-gold/30 bg-gold/10 p-4 text-xs text-ink/80">
              <Building2 size={20} className="mt-0.5 shrink-0 text-gold-dark" />
              <p>
                Contact the store team for current availability, pricing and
                product information before purchase.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function ContactCard({
  icon: Icon,
  label,
  value,
  href,
  external = false,
  tone,
}: {
  icon: ElementType;
  label: string;
  value: string;
  href: string;
  external?: boolean;
  tone: string;
}) {
  const colors: Record<string, string> = {
    whatsapp: "bg-whatsapp/15 text-whatsapp",
    gold: "bg-gold/15 text-gold-dark",
    pink: "bg-pink-100 text-pink-600",
    blue: "bg-blue-50 text-blue-600",
  };
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="group flex items-center justify-between rounded-2xl border border-ink/10 bg-white p-6 shadow-xs transition hover:border-gold hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <span
          className={`grid size-12 place-items-center rounded-2xl ${colors[tone]}`}
        >
          <Icon className="size-6" />
        </span>
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-ink/50">
            {label}
          </span>
          <span className="mt-0.5 block font-display text-base font-bold text-ink">
            {value}
          </span>
        </div>
      </div>
      <ArrowUpRight size={18} className="text-ink/40" />
    </a>
  );
}

export function NotFoundPage() {
  return (
    <section className="section">
      <div className="container grid min-h-[50vh] place-items-center text-center">
        <div>
          <p className="eyebrow text-gold-dark">404 error</p>
          <h1 className="mt-3 font-display text-4xl font-bold sm:text-5xl">
            Page not found
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-base text-ink/70">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link to="/" className="button button-dark">
              Back to home
            </Link>
            <Link to="/products" className="button button-ghost">
              Browse catalogue
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
