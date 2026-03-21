import { useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, AlertCircle, Loader2, Mail, Phone, MessageSquare } from 'lucide-react';
import axios from 'axios';

interface FormData {
  name: string;
  contactNumber: string;
  description: string;
}

export function Contact() {
  const [form, setForm] = useState<FormData>({
    name: '',
    contactNumber: '',
    description: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.contactNumber.trim() || !form.description.trim()) {
      setStatus('error');
      setErrorMsg('Please fill in all fields.');
      return;
    }

    setStatus('loading');
    try {
      await axios.post('/api/v1/contact', {
        name: form.name.trim(),
        contactNumber: form.contactNumber.trim(),
        description: form.description.trim(),
      });
      setStatus('success');
      setForm({ name: '', contactNumber: '', description: '' });
      setTimeout(() => setStatus('idle'), 5000);
    } catch {
      setStatus('error');
      setErrorMsg('Something went wrong. Please try again later.');
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <section id="contact" className="relative py-24 md:py-32 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — Info */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full bg-emerald-500/10 text-emerald-400 text-sm font-semibold mb-4">
              Contact Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white">
              Let's{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">
                Connect
              </span>
            </h2>
            <p className="mt-4 text-lg text-gray-400 max-w-md">
              Have questions or want to get started? Drop us a message, and our
              team will get back to you within 24 hours.
            </p>

            <div className="mt-10 space-y-6">
              {[
                {
                  icon: Mail,
                  label: 'Email',
                  value: 'logikshubsolution@gmail.com',
                  color: 'bg-emerald-500/10 text-emerald-400',
                },
                {
                  icon: Phone,
                  label: 'Phone',
                  value: '+91 9723657967',
                  color: 'bg-green-500/10 text-green-400',
                },
                {
                  icon: MessageSquare,
                  label: 'Response Time',
                  value: 'Within 24 hours',
                  color: 'bg-emerald-500/10 text-emerald-300',
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center`}
                  >
                    <item.icon size={22} />
                  </div>
                  <div>
                    <div className="text-sm text-gray-400 font-medium">
                      {item.label}
                    </div>
                    <div className="text-white font-semibold">
                      {item.value}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right — Form */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6 }}
          >
            <form
              onSubmit={handleSubmit}
              className="bg-gray-900 rounded-3xl p-8 md:p-10 shadow-xl border border-gray-800"
            >
              <h3 className="text-2xl font-bold text-white mb-6">
                Send us a message
              </h3>

              <div className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Contact Number
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
                    className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Message
                  </label>
                  <textarea
                    rows={4}
                    value={form.description}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, description: e.target.value }))
                    }
                    placeholder="Tell us about your gym and requirements..."
                    className="w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={status === 'loading'}
                className="mt-6 w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold text-base shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send size={18} />
                    Send Message
                  </>
                )}
              </button>

              {/* Feedback */}
              {status === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 text-emerald-400 bg-emerald-500/10 p-3 rounded-xl"
                >
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-medium">
                    Message sent successfully! We'll get back to you soon.
                  </span>
                </motion.div>
              )}
              {status === 'error' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-center gap-2 text-red-400 bg-red-500/10 p-3 rounded-xl"
                >
                  <AlertCircle size={20} />
                  <span className="text-sm font-medium">{errorMsg}</span>
                </motion.div>
              )}
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
