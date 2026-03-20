import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar({ visible = true }) {
  return (
    <motion.nav
      initial={false}
      animate={{
        y: visible ? 0 : -80,
        opacity: visible ? 1 : 0,
      }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl"
      aria-label="Main navigation"
      aria-hidden={!visible}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group" aria-label="PropertyMax home">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 shadow-lg shadow-blue-500/20">
              <Building2 className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="font-heading text-xl font-bold tracking-tight">
              Property<span className="text-gradient">Max</span>
            </span>
          </Link>

          <div className="flex items-center gap-6">
            <span className="hidden sm:block text-sm text-white/40">
              Dallas / DFW
            </span>
            <div className="h-4 w-px bg-white/10 hidden sm:block" aria-hidden="true" />
            <span className="text-xs font-medium text-white/25 hidden sm:block">
              Built by BigPoppaCode · Ideated by Tadi Tedement
            </span>
          </div>
        </div>
      </div>
    </motion.nav>
  );
}
