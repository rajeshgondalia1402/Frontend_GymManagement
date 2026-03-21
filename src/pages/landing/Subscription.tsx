import { useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, X, Send, Loader2, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';
import axios from 'axios';
import { PLANS } from './constants';

interface ModalForm {
  name: string;
  contactNumber: string;
  description: string;
}

export function Subscription() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [form, setForm] = useState<ModalForm>({ name: '', contactNumber: '', description: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const openModal = (planName: string) => {
    setSelectedPlan(planName);
    setForm({ name: '', contactNumber: '', description: '' });
    setStatus('idle');
    setErrorMsg('');
  };

  const closeModal = () => {
    setSelectedPlan(null);
    setStatus('idle');
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contactNumber.trim()) {
      setStatus('error');
      setErrorMsg('Please fill in your name and contact number.');
      return;
    }

    setStatus('loading');
    try {
      await axios.post('/api/v1/contact', {
        name: form.name.trim(),
        contactNumber: form.contactNumber.trim(),
        description: `[Plan: ${selectedPlan}] ${form.description.trim() || 'Interested in this plan.'}`,
      });
      setStatus('success');
      setTimeout(() => closeModal(), 2000);
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again.');
      setTimeout(() => setStatus('idle'), 4000);
    }
  };
  return (
    <section
      id="subscription"
      className="relative py-24 md:py-32 bg-black overflow-hidden"
    >
      {/* Decorative blobs */}
      <div className="absolute top-1/4 left-0 w-80 h-80 bg-emerald-500/10 rounded-full -translate-x-1/2 blur-3xl" />
      <div className="absolute bottom-1/4 right-0 w-80 h-80 bg-green-500/10 rounded-full translate-x-1/2 blur-3xl" />

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
            Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
            Simple, Transparent{' '}
            <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
              Pricing
            </span>
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Choose the plan that fits your gym. All plans include core features.
            Upgrade anytime as you grow.
          </p>
        </motion.div>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-8 lg:gap-6 max-w-6xl mx-auto items-start">
          {PLANS.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: i * 0.15 }}
              whileHover={{ scale: 1.03, transition: { duration: 0.25 } }}
              className={`relative rounded-3xl p-8 ${
                plan.popular
                  ? 'bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800 text-white shadow-2xl shadow-emerald-500/30 ring-4 ring-emerald-400/20 md:scale-105 md:-my-4'
                  : 'bg-gray-900 border border-gray-800 shadow-lg'
              }`}
            >
              {plan.popular && (
                <>
                  {/* Shimmer effect */}
                  <div className="absolute inset-0 rounded-3xl overflow-hidden">
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                      animate={{ x: ['-100%', '200%'] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    />
                  </div>
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <motion.span
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-yellow-400 to-amber-400 text-gray-900 text-sm font-bold shadow-lg"
                    >
                      <Crown size={14} />
                      Most Popular
                    </motion.span>
                  </div>
                </>
              )}

              <div className="relative mb-6">
                <h3
                  className={`text-xl font-bold ${
                    plan.popular ? 'text-white' : 'text-white'
                  }`}
                >
                  {plan.name}
                </h3>
                <p
                  className={`mt-1 text-sm ${
                    plan.popular ? 'text-emerald-100' : 'text-gray-400'
                  }`}
                >
                  {plan.description}
                </p>
              </div>

              <div className="relative mb-8">
                <span
                  className={`text-4xl sm:text-5xl font-extrabold ${
                    plan.popular ? 'text-white' : 'text-white'
                  }`}
                >
                  ₹{plan.price}
                </span>
                <span
                  className={`text-base ${
                    plan.popular ? 'text-emerald-200' : 'text-gray-500'
                  }`}
                >
                  {plan.period}
                </span>
              </div>

              <ul
                className={`mb-8 ${
                  plan.popular
                    ? 'grid grid-cols-2 gap-x-4 gap-y-2'
                    : 'space-y-2.5'
                }`}
              >
                {plan.features.map((feat, fi) => (
                  <motion.li
                    key={feat}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + fi * 0.03 }}
                    className="flex items-start gap-2"
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        plan.popular ? 'bg-white/20' : 'bg-emerald-500/10'
                      }`}
                    >
                      <Check
                        size={10}
                        className={plan.popular ? 'text-white' : 'text-emerald-400'}
                      />
                    </div>
                    <span
                      className={`text-sm leading-tight ${
                        plan.popular ? 'text-emerald-50' : 'text-gray-400'
                      }`}
                    >
                      {feat}
                    </span>
                  </motion.li>
                ))}
              </ul>

              <button
                onClick={() => openModal(plan.name)}
                className={`relative w-full py-3.5 rounded-xl font-semibold text-base transition-all hover:-translate-y-0.5 ${
                  plan.popular
                    ? 'bg-white text-emerald-600 shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40'
                }`}
              >
                Get Started
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Get Started Modal ── */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeModal();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 30 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              {/* Gradient header */}
              <div className="relative bg-gradient-to-r from-emerald-600 to-green-700 px-6 py-5 sm:px-8 sm:py-6">
                <div className="absolute inset-0 overflow-hidden">
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      repeatDelay: 3,
                    }}
                  />
                </div>
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                >
                  <X size={16} className="text-white" />
                </button>
                <div className="relative flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                    <Sparkles size={20} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-white">
                      Get Started
                    </h3>
                    <p className="text-emerald-100 text-sm">{selectedPlan} Plan</p>
                  </div>
                </div>
              </div>

              {/* Form body */}
              <form
                onSubmit={handleSubmit}
                className="px-6 py-6 sm:px-8 sm:py-7 space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Your Name <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Contact Number <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="tel"
                    value={form.contactNumber}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setForm((f) => ({ ...f, contactNumber: val }));
                    }}
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="Enter your phone number"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Message{' '}
                    <span className="text-gray-400 font-normal">
                      (optional)
                    </span>
                  </label>
                  <textarea
                    rows={3}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Tell us about your gym..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {status === 'loading' ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      Submit
                    </>
                  )}
                </button>

                {/* Feedback */}
                <AnimatePresence>
                  {status === 'success' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-emerald-600 bg-emerald-50 p-3 rounded-xl"
                    >
                      <CheckCircle2 size={18} />
                      <span className="text-sm font-medium">
                        Submitted! We'll contact you soon.
                      </span>
                    </motion.div>
                  )}
                  {status === 'error' && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl"
                    >
                      <AlertCircle size={18} />
                      <span className="text-sm font-medium">{errorMsg}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
