import { Navbar } from './Navbar';
import { Hero } from './Hero';
import { Features } from './Features';
import { HireTrainers } from './HireTrainers';
import { Subscription } from './Subscription';
import { About } from './About';
import { Testimonials } from './Testimonials';
import { FAQ } from './FAQ';
import { Contact } from './Contact';
import { Footer } from './Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen overflow-x-hidden scroll-smooth">
      <Navbar />
      <Hero />
      <Features />
      <HireTrainers />
      <Subscription />
      <About />
      <Testimonials />
      <FAQ />
      <Contact />
      <Footer />
    </div>
  );
}
