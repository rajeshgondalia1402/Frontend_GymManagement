import { motion } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { TESTIMONIALS } from './constants';

export function Testimonials() {
  return (
    <section className="relative py-24 md:py-32 bg-gray-950 overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-emerald-500/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute top-1/2 right-0 w-80 h-80 bg-green-500/5 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            Loved by{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              Gym Owners
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            See what gym owners across India have to say about their experience
            with Gym Desk Pro.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              className="relative bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-lg hover:shadow-xl hover:border-emerald-500/30 transition-all"
            >
              <Quote size={32} className="text-emerald-500/20 mb-4" />
              <p className="text-gray-300 leading-relaxed">{t.text}</p>

              {/* Stars */}
              <div className="flex gap-1 mt-4">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    size={16}
                    className="fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-800">
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">
                  {t.avatar}
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{t.name}</div>
                  <div className="text-gray-400 text-xs">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
