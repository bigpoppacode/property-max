import { useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './SearchBar';

export default function SearchModal({ open, onOpenChange, onSearch }) {
  const handleSearch = useCallback((address, suggestion) => {
    onOpenChange(false);
    onSearch(address, suggestion);
  }, [onOpenChange, onSearch]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-md"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ opacity: 0, y: 40, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 40, scale: 0.96 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="fixed left-1/2 top-[40%] z-[101] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2"
              >
                <div className="rounded-3xl border border-white/10 bg-card/95 backdrop-blur-xl p-8 shadow-2xl shadow-black/40">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <Dialog.Title className="font-heading text-2xl font-bold">
                        Analyze a Property
                      </Dialog.Title>
                      <Dialog.Description className="text-sm text-muted-foreground mt-1">
                        Enter a Dallas address to unlock its hidden value
                      </Dialog.Description>
                    </div>
                    <Dialog.Close className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 hover:bg-white/5 transition-colors" aria-label="Close search dialog">
                      <X className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                    </Dialog.Close>
                  </div>

                  <SearchBar onSearch={handleSearch} size="large" />

                  <div className="mt-5 flex items-center gap-3 text-xs text-muted-foreground/60">
                    <span className="h-px flex-1 bg-border" />
                    <span>or try an example</span>
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {[
                      '4511 Swiss Ave, Dallas, TX',
                      '6910 Lakewood Blvd, Dallas, TX',
                      '1500 Main St, Dallas, TX',
                    ].map((addr) => (
                      <button
                        key={addr}
                        onClick={() => handleSearch(addr)}
                        className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-muted-foreground hover:bg-white/10 hover:text-foreground transition-all"
                      >
                        {addr}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
