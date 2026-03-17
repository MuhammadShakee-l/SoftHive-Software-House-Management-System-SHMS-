import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  ShieldCheck,
  KanbanSquare,
  BarChart3,
  FileUp,
  CreditCard,
  Mail,
  Phone,
  Linkedin,
  X,
  Info,
  Sparkles,
  Code2,
} from 'lucide-react';
import Logo from '../../components/common/Logo';

const Landing = () => {
  const [contactOpen, setContactOpen] = useState(false);
  const [aboutOpen, setAboutOpen] = useState(false);

  const stats = useMemo(
    () => [
      { label: 'Delivery', value: 'Agile + Weekly Updates' },
      { label: 'Security', value: 'JWT + RBAC' },
      { label: 'Transparency', value: 'Client Portal' },
      { label: 'Stack', value: 'MERN + Vite' },
    ],
    []
  );

  const features = useMemo(
    () => [
      { icon: KanbanSquare, title: 'Project Tracking', desc: 'Clear milestones, timelines, and progress visibility.' },
      { icon: BarChart3, title: 'Dashboards', desc: 'Real-time insights across projects, teams, and finance.' },
      { icon: FileUp, title: 'Requirements & Files', desc: 'Upload documents and receive deliverables securely.' },
      { icon: CreditCard, title: 'Invoices', desc: 'Invoice creation, payment tracking, and history.' },
      { icon: ShieldCheck, title: 'Role Security', desc: 'Strict access control for admin, manager, developer, client.' },
      { icon: Code2, title: 'Engineering Quality', desc: 'Clean structure, scalable approach, maintainable system.' },
    ],
    []
  );

  const services = useMemo(
    () => [
      { title: 'Web Development', tag: 'React / Node', accent: 'from-primary-500 to-indigo-600' },
      { title: 'Mobile Apps', tag: 'Android / iOS', accent: 'from-emerald-500 to-teal-600' },
      { title: 'UI/UX Design', tag: 'Figma / Prototypes', accent: 'from-orange-500 to-rose-600' },
      { title: 'SaaS Platforms', tag: 'Scalable Systems', accent: 'from-violet-500 to-fuchsia-600' },
    ],
    []
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <Logo size={38} showText />
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAboutOpen(true)}
              className="btn-secondary px-3 py-2"
              type="button"
            >
              <Info className="h-4 w-4" /> About
            </button>
            <button
              onClick={() => setContactOpen(true)}
              className="btn-secondary px-3 py-2"
              type="button"
            >
              <Mail className="h-4 w-4" /> Contact
            </button>
            <Link to="/login" className="btn-secondary px-3 py-2">
              Sign In
            </Link>
            <Link to="/register" className="btn-primary px-3 py-2">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-32 -right-20 w-[520px] h-[520px] bg-primary-500/15 blur-3xl rounded-full" />
            <div className="absolute -bottom-40 -left-24 w-[520px] h-[520px] bg-indigo-500/15 blur-3xl rounded-full" />
          </div>

          <div className="max-w-6xl mx-auto px-4 py-14 md:py-20 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800"
              >
                <Sparkles className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
                  Software House + Client Portal
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.02 }}
                className="text-4xl md:text-5xl font-black tracking-tight text-gray-900 dark:text-white leading-tight"
              >
                Build Better Software
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">
                  With Clear Progress & Delivery
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.06 }}
                className="text-gray-600 dark:text-gray-300 text-base md:text-lg max-w-xl"
              >
                Request a project, upload requirements, track progress, and receive deliverables—everything organized and transparent.
              </motion.p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {stats.map((s) => (
                  <motion.div
                    key={s.label}
                    whileHover={{ y: -3 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-md"
                  >
                    <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider">{s.label}</p>
                    <p className="mt-1 text-sm font-bold text-gray-900 dark:text-white">{s.value}</p>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.06 }}
              className="relative"
            >
              <div className="absolute -inset-2 bg-gradient-to-r from-primary-500/20 to-indigo-500/20 blur-2xl rounded-3xl" />

              <div className="relative card p-6 md:p-7">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">Platform Highlights</p>
                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-semibold">
                    Live System
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {features.slice(0, 4).map(({ icon: Icon, title, desc }) => (
                    <motion.div
                      key={title}
                      whileHover={{ y: -3 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                      className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-md"
                    >
                      <div className="w-10 h-10 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <p className="mt-3 text-sm font-bold text-gray-900 dark:text-white">{title}</p>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-300">{desc}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 flex items-center gap-3 justify-center">
                  <Link to="/register" className="btn-primary px-5 py-3">
                    <Rocket className="h-4 w-4" /> Get Started
                  </Link>
                  <Link to="/login" className="btn-secondary px-5 py-3">
                    Sign In
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-14">
          <div className="flex items-end justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white">What We Offer</h2>
              <p className="text-sm text-gray-500 mt-1">Short, clear services with a modern workflow.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {services.map((s, i) => (
              <motion.div
                key={s.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -4, scale: 1.01 }}
                className="card p-5 hover:shadow-lg transition-shadow cursor-default"
              >
                <div className={`h-10 w-10 rounded-2xl bg-gradient-to-br ${s.accent}`} />
                <p className="mt-4 font-extrabold text-gray-900 dark:text-white">{s.title}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-300 font-semibold">{s.tag}</p>
                <div className="mt-4 h-1.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                  <div className={`h-full w-2/3 bg-gradient-to-r ${s.accent}`} />
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <section className="max-w-6xl mx-auto px-4 pb-16">
          <div className="card p-6 md:p-8 bg-gradient-to-br from-primary-600 to-indigo-700 border-0 text-white overflow-hidden relative">
            <div className="absolute -top-14 -right-20 w-72 h-72 bg-white/10 blur-2xl rounded-full" />
            <div className="absolute -bottom-16 -left-20 w-72 h-72 bg-white/10 blur-2xl rounded-full" />
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="md:col-span-2">
                <h3 className="text-2xl font-black tracking-tight">Ready to start?</h3>
                <p className="text-white/80 mt-2 text-sm">
                  Create your client account and submit project requirements in minutes.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row md:flex-col gap-3 md:items-end justify-end">
                <Link to="/register" className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-bold bg-white text-primary-700 hover:bg-white/90 transition-colors">
                  Get Started
                </Link>
                <Link to="/login" className="inline-flex items-center justify-center px-5 py-3 rounded-xl font-bold bg-white/15 hover:bg-white/20 transition-colors border border-white/25">
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-10">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size={34} showText />
            <p className="text-sm text-gray-500">© {new Date().getFullYear()} SoftHive</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setAboutOpen(true)} className="text-sm text-primary-600 hover:underline" type="button">
              About
            </button>
            <button onClick={() => setContactOpen(true)} className="text-sm text-primary-600 hover:underline" type="button">
              Contact
            </button>
            <Link to="/login" className="text-sm text-primary-600 hover:underline">
              Sign In
            </Link>
            <Link to="/register" className="text-sm text-primary-600 hover:underline">
              Get Started
            </Link>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {contactOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setContactOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="relative w-full max-w-lg card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">Contact Us</h3>
                <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setContactOpen(false)} type="button">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-primary-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-semibold uppercase">Email</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white break-all">MuhammadShakeel22f3404@gmail.com</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-primary-600" />
                    <div>
                      <p className="text-xs text-gray-400 font-semibold uppercase">Phone</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white">+923164639533</p>
                    </div>
                  </div>
                </div>

                <a
                  href="https://linkedin.com/in/muhammadshakee-l"
                  target="_blank"
                  rel="noreferrer"
                  className="block p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3">
                    <Linkedin className="h-5 w-5 text-primary-600" />
                    <div className="min-w-0">
                      <p className="text-xs text-gray-400 font-semibold uppercase">LinkedIn</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-white break-all">linkedin.com/in/muhammadshakee-l</p>
                    </div>
                  </div>
                </a>
              </div>

              <div className="mt-5 flex justify-end">
                <button className="btn-primary" onClick={() => setContactOpen(false)} type="button">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aboutOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/50" onClick={() => setAboutOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="relative w-full max-w-lg card"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">About Us</h3>
                <button className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800" onClick={() => setAboutOpen(false)} type="button">
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <p className="font-semibold text-gray-900 dark:text-white">SoftHive</p>
                  <p className="mt-1">
                    We deliver modern web and software solutions with a transparent client portal.
                    Clients can submit requirements, track progress, and receive deliverables securely.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800">
                  <p className="font-semibold text-gray-900 dark:text-white">How it works</p>
                  <ul className="mt-2 list-disc pl-5 space-y-1">
                    <li>Client submits a project request with requirements and files</li>
                    <li>Admin reviews and assigns a manager</li>
                    <li>Manager coordinates tasks and approvals</li>
                    <li>Client reviews final delivery</li>
                  </ul>
                </div>
              </div>

              <div className="mt-5 flex justify-end">
                <button className="btn-primary" onClick={() => setAboutOpen(false)} type="button">
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Landing;