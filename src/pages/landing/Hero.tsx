import { motion } from 'framer-motion';
import { ArrowRight, Play, Users, CreditCard, BarChart3, Shield } from 'lucide-react';

const floatingCards = [
  { icon: Users, label: '2,450 Members', color: 'from-emerald-500 to-emerald-600', x: -20, y: 30, delay: 0 },
  { icon: CreditCard, label: '₹3.2L Revenue', color: 'from-emerald-400 to-green-500', x: 20, y: -20, delay: 0.2 },
  { icon: BarChart3, label: '98% Retention', color: 'from-green-500 to-emerald-600', x: 10, y: 40, delay: 0.4 },
  { icon: Shield, label: '24/7 Uptime', color: 'from-emerald-600 to-green-700', x: -15, y: -10, delay: 0.6 },
];

export function Hero() {
  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center overflow-hidden"
    >
      {/* Background */}
      <div className="absolute inset-0 bg-black" />
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full blur-[128px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-600 rounded-full blur-[128px]" />
      </div>
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 md:py-40">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-white/80 text-sm font-medium">
                Trusted by 50+ Gyms across India
              </span>
            </motion.div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight">
              Smart Gym Member{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                Management
              </span>{' '}
              Made Easy
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-gray-300 leading-relaxed max-w-xl">
              Manage members, subscriptions, attendance, diet plans, trainer
              salaries, and payments — all in one powerful platform.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <button
                onClick={() => scrollTo('#subscription')}
                className="group px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-lg shadow-2xl shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 flex items-center justify-center gap-2"
              >
                Get Started
                <ArrowRight
                  size={20}
                  className="group-hover:translate-x-1 transition-transform"
                />
              </button>
              <button
                onClick={() => scrollTo('#features')}
                className="px-8 py-4 rounded-2xl border-2 border-white/20 text-white font-semibold text-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Play size={20} />
                View Demo
              </button>
            </div>

            {/* Stats row */}
            <div className="mt-14 grid grid-cols-3 gap-6 max-w-md">
              {[
                { value: '50+', label: 'Gyms' },
                { value: '10+', label: 'Members' },
                { value: '99.9%', label: 'Uptime' },
              ].map((stat, i) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.15 }}
                >
                  <div className="text-2xl sm:text-3xl font-bold text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right: Floating Dashboard Mockup */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="relative hidden lg:block"
          >
            {/* Main dashboard card */}
            <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 p-6 shadow-2xl">
              {/* Dashboard header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 h-6 rounded-lg bg-white/10" />
              </div>

              {/* Dashboard content rows */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {['Active Members', 'Revenue', 'Attendance'].map((t, i) => (
                    <div
                      key={t}
                      className="bg-white/10 rounded-xl p-4 border border-white/10"
                    >
                      <div className="text-xs text-gray-400 mb-2">{t}</div>
                      <div className="text-xl font-bold text-white">
                        {['245', '₹1.8L', '89%'][i]}
                      </div>
                      <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${
                            ['bg-emerald-400', 'bg-green-400', 'bg-emerald-300'][i]
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: ['70%', '85%', '60%'][i] }}
                          transition={{ duration: 1.5, delay: 0.8 + i * 0.2 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Placeholder rows */}
                {[1, 2, 3].map((r) => (
                  <div
                    key={r}
                    className="flex items-center gap-3 bg-white/5 rounded-xl p-3 border border-white/5"
                  >
                    <div className="w-8 h-8 rounded-lg bg-white/10" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 bg-white/10 rounded w-2/3" />
                      <div className="h-2 bg-white/5 rounded w-1/3" />
                    </div>
                    <div className="h-6 w-16 bg-white/10 rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* Floating cards */}
            {floatingCards.map((card, i) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  y: [0, -8, 0],
                }}
                transition={{
                  opacity: { delay: 1 + card.delay },
                  scale: { delay: 1 + card.delay },
                  y: {
                    delay: 1.5 + card.delay,
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                }}
                className={`absolute ${
                  [
                    '-top-6 -left-8',
                    '-top-6 -right-8',
                    '-bottom-6 -left-8',
                    '-bottom-6 -right-8',
                  ][i]
                } bg-gray-900 rounded-2xl shadow-xl p-3 flex items-center gap-3 border border-gray-800`}
              >
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}
                >
                  <card.icon size={20} className="text-white" />
                </div>
                <span className="text-sm font-semibold text-gray-200 pr-2">
                  {card.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent" />
    </section>
  );
}
