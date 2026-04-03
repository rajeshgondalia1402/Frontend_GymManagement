import { motion } from 'framer-motion';
import { Users, Search, ArrowRight, Building2 } from 'lucide-react';

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

        {/* Role labels */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium">
            <Users className="w-3.5 h-3.5" /> For Trainers
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium">
            <Building2 className="w-3.5 h-3.5" /> For Gym Owners
          </span>
        </div>

        {/* Three cards */}
        <div className="grid md:grid-cols-3 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* 1. New Trainer Application */}
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
              className="group block h-full p-7 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-800/50 border border-blue-500/20 hover:border-blue-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-semibold uppercase tracking-wider">
                  Trainer
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                I'm a Trainer
              </h3>
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                Register your profile, showcase your skills and get discovered by
                gyms looking for talented trainers.
              </p>
              <div className="flex items-center text-blue-400 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                Apply Now <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          </motion.div>

          {/* 2. Gym Owner Registration */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <a
              href="/hire-trainer/login?from=trainer"
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full p-7 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-800/50 border border-amber-500/20 hover:border-amber-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-amber-500/10"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shrink-0">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold uppercase tracking-wider">
                  Gym Owner
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                I'm a Gym Owner
              </h3>
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                Register your gym, post trainer vacancies and find the perfect
                trainers to grow your fitness business.
              </p>
              <div className="flex items-center text-amber-400 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                Register & Post Vacancy <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          </motion.div>

          {/* 3. Search Trainers & Vacancies */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <a
              href="/hire-trainer/search"
              target="_blank"
              rel="noopener noreferrer"
              className="group block h-full p-7 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-800/50 border border-emerald-500/20 hover:border-emerald-400/40 transition-all duration-300 hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shrink-0">
                  <Search className="w-6 h-6 text-white" />
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold uppercase tracking-wider">
                  Everyone
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mb-2">
                Browse & Search
              </h3>
              <p className="text-gray-400 text-sm mb-5 leading-relaxed">
                Explore trainer profiles and open vacancies. Filter by location,
                experience, specialization and more.
              </p>
              <div className="flex items-center text-emerald-400 font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                Search Now <ArrowRight className="w-4 h-4" />
              </div>
            </a>
          </motion.div>
        </div>

        {/* How it works — bottom strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-14 max-w-4xl mx-auto"
        >
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-0">
            <Step num="1" text="Register as Trainer or Gym Owner" />
            <Arrow />
            <Step num="2" text="Fill your profile or post a vacancy" />
            <Arrow />
            <Step num="3" text="Get matched & start working together" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Step({ num, text }: { num: string; text: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold flex items-center justify-center shrink-0">
        {num}
      </span>
      <span className="text-sm text-gray-300 whitespace-nowrap">{text}</span>
    </div>
  );
}

function Arrow() {
  return (
    <div className="hidden sm:block mx-3 text-gray-600">
      <ArrowRight className="w-4 h-4" />
    </div>
  );
}
