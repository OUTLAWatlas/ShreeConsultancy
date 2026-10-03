import Navbar from './Navbar';
import HeroScene from './HeroScene';
import ServicesBento from './ServicesBento';
import GlobalReach from './GlobalReach';
import PortfolioCarousel from './PortfolioCarousel';
import IntakeForm from './IntakeForm';

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-bg-deep text-fg antialiased">
      <Navbar />

      <section className="relative flex min-h-screen items-center overflow-hidden">
        <HeroScene />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-deep via-transparent to-bg-deep/40" />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
          <p className="font-mono text-xs text-accent">Electrical · Civil · Structural</p>
          <h1 className="mt-6 max-w-2xl font-display text-4xl leading-[1.1] text-fg sm:text-6xl">
            Engineering that gets built, not just drawn.
          </h1>
          <p className="mt-6 max-w-lg text-fg/60">
            Shree Consultancy designs switchyards, substations, and industrial power systems for
            clients across India, the Middle East, and Africa — from first estimate to
            good-for-construction drawings.
          </p>
          <a
            href="#contact"
            className="mt-10 inline-flex items-center gap-2 rounded-sm border border-accent px-6 py-3 text-sm text-accent transition-colors hover:bg-accent/10"
          >
            Initialize project
          </a>
        </div>
      </section>

      <ServicesBento />
      <GlobalReach />
      <PortfolioCarousel />
      <IntakeForm />

      <footer className="border-t border-fg/10 px-6 py-10 text-xs text-fg/30 lg:px-10">
        <p>© {new Date().getFullYear()} Shree Consultancy · Mulund, Mumbai</p>
      </footer>
    </div>
  );
}
