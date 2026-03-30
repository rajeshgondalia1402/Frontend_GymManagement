import { motion } from 'framer-motion';
import { Users, Search, ArrowRight } from 'lucide-react';

export function HireTrainers() {
  return (
    <section id="hire-trainers" className="relative py-24 md:py-32 bg-gray-900">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-4">
            Hire Trainers
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            Find & Hire the{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              Best Trainers
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Whether you're a trainer looking for opportunities or a gym owner searching
            for qualified trainers — we've got you covered.
          </p>
        </motion.div>

        {/* Two cards */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-4xl mx-auto">
          {/* New Trainer Application */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <a
              href="/hire-trainer/apply"
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-8 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-800/50 border border-white/10 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-6">
                <Users className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                New Trainer Application
              </h3>
              <p className="text-gray-400 mb-6">
                Are you a certified fitness trainer? Register your profile and get
                discovered by gyms looking for talented trainers.
              </p>
              <div className="flex items-center text-emerald-400 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                Apply Now <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          </motion.div>

          {/* Search Trainer */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <a
              href="/hire-trainer/login"
              target="_blank"
              rel="noopener noreferrer"
              className="group block p-8 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-800/50 border border-white/10 hover:border-emerald-500/30 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mb-6">
                <Search className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-3">
                Search Trainer
              </h3>
              <p className="text-gray-400 mb-6">
                Looking for skilled trainers for your gym? Search by location,
                experience, specialization and more to find the perfect match.
              </p>
              <div className="flex items-center text-emerald-400 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                Search Now <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
