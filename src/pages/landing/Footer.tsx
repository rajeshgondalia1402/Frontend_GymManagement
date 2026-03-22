import { motion } from 'framer-motion';
import { ArrowRight, Dumbbell } from 'lucide-react';

export function Footer() {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-gray-900 text-white overflow-hidden">
      {/* CTA Banner */}
      <div className="relative border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Ready to Transform Your{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                Gym Management?
              </span>
            </h2>
            <p className="mt-4 text-gray-400 text-lg max-w-xl mx-auto">
              Join 50+ gym owners who trust Gym Desk Pro. Get started in minutes.
            </p>
            <button
              onClick={() => scrollTo('#subscription')}
              className="mt-8 group inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-lg shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
            >
              Get Started Now
              <ArrowRight
                size={20}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold">
                Gym Desk<span className="text-emerald-400"> Pro</span>
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Smart Gym Member Management solution designed to simplify gym
              operations for owners across India.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              {[
                { label: 'Home', href: '#home' },
                { label: 'Features', href: '#features' },
                { label: 'Pricing', href: '#subscription' },
                { label: 'About Us', href: '#about' },
                { label: 'Contact', href: '#contact' },
              ].map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    onClick={(e) => {
                      e.preventDefault();
                      scrollTo(link.href);
                    }}
                    className="text-gray-400 hover:text-white transition-colors text-sm"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Features */}
          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-3">
              {[
                'Member Management',
                'Trainer Management',
                'Diet & Exercise Plans',
                'Member & Trainer Panel',
                'Reports & Analytics',
              ].map((item) => (
                <li key={item}>
                  <span className="text-gray-400 text-sm">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li className="text-gray-400 text-sm">
                logikshubsolution@gmail.com
              </li>
              <li className="text-gray-400 text-sm">+91 9723657967</li>
              <li className="text-gray-400 text-sm">India</li>
            </ul>

            {/* Social Icons */}
            <div className="flex gap-3 mt-6">
              {['Ig', 'In', 'Fb'].map((icon) => (
                <div
                  key={icon}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-gray-300">
                    {icon}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {currentYear} Gym Desk Pro. All rights reserved.
          </p>
          <div className="flex gap-6">
            <span className="text-gray-500 text-sm hover:text-gray-300 cursor-pointer transition-colors">
              Privacy Policy
            </span>
            <span className="text-gray-500 text-sm hover:text-gray-300 cursor-pointer transition-colors">
              Terms of Service
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
