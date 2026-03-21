import { motion } from 'framer-motion';
import { Target, Lightbulb, Heart, ArrowRight } from 'lucide-react';

export function About() {
  return (
    <section id="about" className="relative py-24 md:py-32 bg-gray-950 overflow-hidden">
      {/* Decorative blob */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left — Illustration / Visual */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
            className="relative"
          >
            <div className="relative rounded-3xl bg-gradient-to-br from-emerald-600 to-green-800 p-10 md:p-14 shadow-2xl shadow-emerald-500/20">
              <div className="space-y-6">
                {/* Stat blocks */}
                {[
                  { label: 'Gyms Onboarded', value: '50+', bar: 'w-4/5 bg-emerald-300' },
                  { label: 'Members Managed', value: '10+', bar: 'w-3/4 bg-green-300' },
                  { label: 'Transactions Processed', value: '2L+', bar: 'w-5/6 bg-emerald-200' },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/10"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-emerald-100 text-sm font-medium">
                        {s.label}
                      </span>
                      <span className="text-white font-bold text-lg">
                        {s.value}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${s.bar}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: '100%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: 0.5 + i * 0.2 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Right — Content */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.7 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-4">
              About Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white leading-tight">
              About{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                Gym Desk Pro
              </span>
            </h2>

            <p className="mt-6 text-lg text-gray-300 leading-relaxed">
              Gym Desk Pro provides a powerful and scalable Gym Member Management
              solution designed to simplify gym operations. Our platform helps gym
              owners efficiently manage members, subscriptions, attendance, diet
              plans, exercise plans, trainer salaries, and financial records with
              ease.
            </p>

            <p className="mt-4 text-gray-400 leading-relaxed">
              Built by a team that understands the fitness industry, Gym Desk Pro is
              trusted by 50+ gyms across India to handle their day-to-day
              operations seamlessly.
            </p>

            {/* Mission cards */}
            <div className="mt-10 space-y-4">
              {[
                {
                  icon: Target,
                  title: 'Our Mission',
                  desc: 'To empower every gym — big or small — with affordable, easy-to-use technology that saves time and grows their business.',
                  color: 'bg-emerald-500/10 text-emerald-400',
                },
                {
                  icon: Lightbulb,
                  title: 'Our Vision',
                  desc: 'To become India\'s leading gym management platform, driving digital transformation in the fitness industry.',
                  color: 'bg-green-500/10 text-green-400',
                },
                {
                  icon: Heart,
                  title: 'Our Values',
                  desc: 'Simplicity, reliability, and customer success. We build features that gym owners actually need.',
                  color: 'bg-emerald-500/10 text-emerald-300',
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="flex items-start gap-4 p-4 rounded-2xl hover:bg-white/5 transition-colors"
                >
                  <div
                    className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center flex-shrink-0`}
                  >
                    <item.icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{item.title}</h3>
                    <p className="text-gray-400 text-sm mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() =>
                document.querySelector('#contact')?.scrollIntoView({ behavior: 'smooth' })
              }
              className="mt-8 group inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5"
            >
              Contact Us
              <ArrowRight
                size={18}
                className="group-hover:translate-x-1 transition-transform"
              />
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
