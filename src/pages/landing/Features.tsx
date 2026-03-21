import { motion } from 'framer-motion';
import {
  Users,
  CreditCard,
  CalendarCheck,
  Wallet,
  Dumbbell,
  BarChart3,
} from 'lucide-react';
import { FEATURES } from './constants';

const iconMap: Record<string, React.ElementType> = {
  users: Users,
  creditCard: CreditCard,
  calendarCheck: CalendarCheck,
  wallet: Wallet,
  dumbbell: Dumbbell,
  barChart: BarChart3,
};

const gradients = [
  'from-emerald-500 to-green-600',
  'from-emerald-400 to-emerald-600',
  'from-green-500 to-emerald-600',
  'from-emerald-600 to-green-700',
  'from-green-400 to-emerald-500',
  'from-emerald-500 to-green-500',
];

export function Features() {
  return (
    <section id="features" className="relative py-24 md:py-32 bg-gray-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16 md:mb-20"
        >
          <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-4">
            Features
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            Everything You Need to{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              Run Your Gym
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            From member registration to salary settlement — manage your entire
            gym operation from a single dashboard.
          </p>
        </motion.div>

        {/* Feature Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {FEATURES.map((feature, i) => {
            const Icon = iconMap[feature.icon] || Users;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="group relative bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-sm hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300"
              >
                {/* Icon */}
                <div
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradients[i]} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <Icon size={26} className="text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
                  {feature.description}
                </p>

                {/* Hover gradient line */}
                <div
                  className={`absolute bottom-0 left-6 right-6 h-1 rounded-full bg-gradient-to-r ${gradients[i]} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
