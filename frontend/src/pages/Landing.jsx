import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView } from 'framer-motion';
import {
  Building2, Brain, MapPin,
  TrendingUp, Zap, ChevronDown, ExternalLink,
  Home, Scissors, Hammer, Search, ArrowRight,
} from 'lucide-react';
import SearchBar from '../components/SearchBar';
import SearchModal from '../components/SearchModal';
import { checkRateLimit, MAX_SEARCHES_PER_HOUR } from '../services/rateLimit';

const REVEAL_EASE = [0.22, 1, 0.36, 1];
const COVER_EASE = [0.77, 0, 0.175, 1];

/* ─── Reusable animation components ─── */

function RevealText({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <Tag ref={ref} className={`overflow-hidden py-[0.15em] ${className}`}>
      <motion.div
        initial={{ y: '140%', rotate: 5 }}
        animate={isInView ? { y: '0%', rotate: 0 } : {}}
        transition={{ duration: 1.1, ease: REVEAL_EASE, delay }}
        style={{ willChange: 'transform' }}
      >
        {children}
      </motion.div>
    </Tag>
  );
}

function RevealBlock({ children, delay = 0, className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className={className}>
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={isInView ? { y: 0, opacity: 1 } : {}}
        transition={{ duration: 1.2, ease: REVEAL_EASE, delay }}
        style={{ willChange: 'transform, opacity' }}
      >
        {children}
      </motion.div>
    </div>
  );
}

function CoverReveal({ children, delay = 0, color = 'bg-blue-600', className = '' }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={isInView ? { opacity: 1 } : {}}
        transition={{ duration: 0.01, delay: delay + 0.3 }}
      >
        {children}
      </motion.div>
      <motion.div
        initial={{ x: '-101%' }}
        animate={isInView ? { x: ['-101%', '0%', '101%'] } : {}}
        transition={{ duration: 1.2, ease: COVER_EASE, delay, times: [0, 0.5, 1] }}
        className={`absolute inset-0 ${color} z-10`}
        style={{ willChange: 'transform' }}
      />
    </div>
  );
}

function FloatingCard({ children, delay = 0, className = '', depth = 1 }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 80 * depth, scale: 0.92, rotateX: 8 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1, rotateX: 0 } : {}}
      transition={{ duration: 1.4, ease: REVEAL_EASE, delay }}
      style={{ willChange: 'transform, opacity', perspective: 1200 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ─── Main Landing ─── */

export default function Landing({ onNavVisibilityChange }) {
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(0);
  const [fabVisible, setFabVisible] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const containerRef = useRef(null);
  const heroRef = useRef(null);

  const sectionRefs = useMemo(() => Array.from({ length: 5 }, () => ({ current: null })), []);

  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const past = !entry.isIntersecting;
        setPastHero(past);
        onNavVisibilityChange?.(past);
        if (past && !fabVisible) setFabVisible(true);
      },
      { threshold: 0.15 }
    );
    observer.observe(hero);
    return () => observer.disconnect();
  }, [onNavVisibilityChange, fabVisible]);

  useEffect(() => {
    const timer = setTimeout(() => setFabVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const observers = sectionRefs.map((ref, index) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(index);
        },
        { threshold: 0.4 }
      );
      if (ref.current) observer.observe(ref.current);
      return observer;
    });
    return () => observers.forEach(o => o.disconnect());
  }, [sectionRefs]);

  const handleSearch = useCallback((address, suggestion) => {
    const rateCheck = checkRateLimit();
    if (!rateCheck.allowed) {
      alert(`Search limit reached (${MAX_SEARCHES_PER_HOUR}/hour). Try again in ~${rateCheck.resetInMinutes} minutes.`);
      return;
    }
    const params = new URLSearchParams({ address });
    if (suggestion?.lat && suggestion?.lng) {
      params.set('lat', suggestion.lat);
      params.set('lng', suggestion.lng);
    }
    navigate(`/results?${params.toString()}`);
  }, [navigate]);

  const isDesktop = useCallback(() => window.matchMedia('(min-width: 1024px)').matches, []);

  const handleAnalyzeClick = useCallback(() => {
    if (isDesktop()) {
      setModalOpen(true);
      return;
    }
    if (activeSection >= 4) {
      sectionRefs[0].current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      sectionRefs[4].current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isDesktop, activeSection, sectionRefs]);

  return (
    <div ref={containerRef} className="landing-scroll-container" role="main" id="main-content">
      {/* Floating Analyze Button */}
      <motion.button
        initial={{ opacity: 0, y: 40, scale: 0.6 }}
        animate={fabVisible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.6 }}
        transition={{ duration: 0.6, ease: REVEAL_EASE }}
        onClick={handleAnalyzeClick}
        aria-label={activeSection >= 4 ? 'Go back to step 1' : 'Analyze a property'}
        className="fixed bottom-8 right-8 z-50 flex items-center gap-3 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-4 text-white font-semibold shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-shadow duration-500 group fab-btn"
      >
        <Search className="h-5 w-5 transition-transform duration-300 group-hover:rotate-[-15deg]" aria-hidden="true" />
        <span className="hidden sm:inline">Analyze Property</span>
        <span className="sr-only sm:hidden">Analyze Property</span>
        <span className="fab-ping" aria-hidden="true" />
      </motion.button>

      {/* Section Progress Dots (only after hero) */}
      <motion.nav
        initial={false}
        animate={{ opacity: pastHero ? 1 : 0, x: pastHero ? 0 : 20 }}
        transition={{ duration: 0.5 }}
        className="fixed right-8 top-1/2 -translate-y-1/2 z-40 hidden lg:flex flex-col gap-1"
        aria-label="Page sections"
      >
        {['Intro', 'Step 1', 'Step 2', 'Step 3', 'Analyze'].map((label, i) => (
          <button
            key={i}
            onClick={() => sectionRefs[i].current?.scrollIntoView({ behavior: 'smooth' })}
            className="group relative flex items-center justify-end p-2 -m-2"
            aria-label={`Go to ${label} section`}
            aria-current={activeSection === i ? 'true' : undefined}
          >
            <span className="absolute right-10 whitespace-nowrap rounded-lg bg-card/90 border border-white/10 px-3 py-1.5 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" aria-hidden="true">
              {label}
            </span>
            <motion.div
              animate={{ scale: activeSection === i ? 1 : 0.75, opacity: activeSection === i ? 1 : 0.35 }}
              transition={{ duration: 0.5, ease: REVEAL_EASE }}
              className={`h-4 w-4 rounded-full transition-colors duration-500 ${
                activeSection === i ? 'bg-blue-500 shadow-lg shadow-blue-500/50' : 'bg-white/30 hover:bg-white/50'
              }`}
              aria-hidden="true"
            />
          </button>
        ))}
      </motion.nav>

      <SearchModal open={modalOpen} onOpenChange={(open) => { if (!open || isDesktop()) setModalOpen(open); }} onSearch={handleSearch} />

      {/* ══════════════════════════════════════════
          HERO — White splash, kirifuda-style
         ══════════════════════════════════════════ */}
      <section ref={heroRef} className="hero-splash snap-section" aria-label="PropertyMax hero">
        <div className="relative z-10 flex flex-col items-center justify-center h-full px-6">
          {/* Small top label */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8, ease: REVEAL_EASE }}
            className="mb-6 sm:mb-8"
          >
            <span className="font-mono text-[11px] sm:text-xs tracking-[0.3em] uppercase text-black/40">
              AI-Powered Property Analysis — Dallas / DFW
            </span>
          </motion.div>

          {/* Main title block */}
          <h1 className="text-center select-none">
            <div className="overflow-hidden py-[0.05em]">
              <motion.div
                initial={{ y: '120%' }}
                animate={{ y: '0%' }}
                transition={{ duration: 1.2, ease: REVEAL_EASE, delay: 0.4 }}
                style={{ willChange: 'transform' }}
              >
                <span className="font-heading text-[2.5rem] sm:text-5xl md:text-6xl font-extrabold tracking-tight text-black/80 leading-none">
                  Unlock Your
                </span>
              </motion.div>
            </div>

            <div className="overflow-hidden py-[0.05em] -mt-1 sm:-mt-2">
              <motion.div
                initial={{ y: '120%', scale: 1.1 }}
                animate={{ y: '0%', scale: 1 }}
                transition={{ duration: 1.3, ease: REVEAL_EASE, delay: 0.55 }}
                style={{ willChange: 'transform' }}
              >
                <span className="hero-display-text font-display text-[4.5rem] sm:text-[7rem] md:text-[9rem] lg:text-[11rem] leading-[0.85] tracking-[0.02em] text-black">
                  Property's
                </span>
              </motion.div>
            </div>

            <div className="overflow-hidden py-[0.05em] -mt-2 sm:-mt-4">
              <motion.div
                initial={{ y: '120%', scale: 1.1 }}
                animate={{ y: '0%', scale: 1 }}
                transition={{ duration: 1.3, ease: REVEAL_EASE, delay: 0.65 }}
                style={{ willChange: 'transform' }}
              >
                <span className="hero-display-text font-display text-[4.5rem] sm:text-[7rem] md:text-[9rem] lg:text-[11rem] leading-[0.85] tracking-[0.02em] text-black">
                  Value
                </span>
              </motion.div>
            </div>
          </h1>

          {/* Subheading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 1, ease: REVEAL_EASE }}
            className="mt-6 sm:mt-8 max-w-md text-center"
          >
            <p className="font-sans text-sm sm:text-base tracking-wide text-black/40 leading-relaxed" style={{ fontWeight: 300, letterSpacing: '0.04em' }}>
              Discover if your Dallas property qualifies for an ADU, lot split, or teardown-rebuild.
              <br className="hidden sm:block" />
              <span className="text-black/60 font-medium">Powered by real zoning data & AI.</span>
            </p>
          </motion.div>

          {/* CTA hint */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6, duration: 1 }}
            className="mt-8"
          >
            <button
              onClick={handleAnalyzeClick}
              className="group flex items-center gap-2 text-sm font-medium text-black/50 hover:text-black transition-colors duration-300"
            >
              <span className="h-px w-8 bg-black/20 group-hover:w-12 group-hover:bg-black/50 transition-all duration-500" aria-hidden="true" />
              Analyze a property
              <span className="h-px w-8 bg-black/20 group-hover:w-12 group-hover:bg-black/50 transition-all duration-500" aria-hidden="true" />
            </button>
          </motion.div>

          {/* Bottom branding */}
          <div className="absolute bottom-8 left-0 right-0 flex items-end justify-between px-4 sm:px-8">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="flex flex-col gap-0.5"
            >
              <span className="text-[10px] tracking-[0.2em] uppercase text-black/25 font-mono">
                Built by BigPoppaCode
              </span>
              <span className="text-[10px] tracking-[0.2em] uppercase text-black/20 font-mono">
                Ideated by Tadi Tedement
              </span>
            </motion.div>

            {/* Scroll indicator — left-aligned, hidden on mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
              className="hidden sm:flex flex-col items-start gap-2 absolute left-8 bottom-24"
              aria-hidden="true"
            >
              <span className="text-[10px] tracking-[0.2em] uppercase text-black/25 font-mono">Scroll</span>
              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <ChevronDown className="h-4 w-4 text-black/20" />
              </motion.div>
            </motion.div>

            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.8 }}
              className="text-[10px] tracking-[0.2em] uppercase text-black/25 font-mono"
            >
              PropertyMax
            </motion.span>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════
          DARK SECTIONS (the "app" behind the door)
         ══════════════════════════════════════════ */}
      <div className="bg-background relative">
        {/* Intro / value prop */}
        <section ref={el => { sectionRefs[0].current = el; }} className="relative min-h-screen flex items-center overflow-hidden pt-20" aria-label="Three ways to maximize property value">
          <div className="mx-auto max-w-5xl px-6 text-center">
            <RevealText delay={0.1} className="landing-section-heading font-heading text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight leading-[1.1]">
              Three Ways to Maximize Value
            </RevealText>
            <RevealBlock delay={0.3}>
              <p className="landing-section-body mt-5 text-lg text-white/40 max-w-xl mx-auto leading-relaxed">
                We analyze your property against Dallas zoning rules and identify the best path to increase its value.
              </p>
            </RevealBlock>

            <div className="mt-16 grid gap-6 sm:grid-cols-3" role="list">
              {[
                { icon: Home, title: 'ADU Analysis', desc: 'Check setbacks, size limits, and estimate rental income potential.', value: '$800-1,500/mo', color: 'emerald' },
                { icon: Scissors, title: 'Lot Split', desc: 'Check minimum lot sizes, width requirements, and value increase.', value: '$100K-300K', color: 'blue' },
                { icon: Hammer, title: 'Teardown & Rebuild', desc: 'Calculate max building size, FAR ratios, and estimated ROI.', value: '2-3x value', color: 'purple' },
              ].map((card, i) => (
                <FloatingCard key={i} delay={0.4 + i * 0.15} depth={1}>
                  <div className="visual-card text-left h-full" role="listitem">
                    <card.icon className={`h-8 w-8 text-${card.color}-400 mb-4`} aria-hidden="true" />
                    <h3 className="landing-section-small font-heading text-xl font-bold text-white/90">{card.title}</h3>
                    <p className="mt-2 text-sm text-white/35 leading-relaxed">{card.desc}</p>
                    <div className={`mt-4 flex items-center gap-1.5 text-sm font-semibold text-${card.color}-400`}>
                      <TrendingUp className="h-3.5 w-3.5" aria-hidden="true" />
                      {card.value}
                    </div>
                  </div>
                </FloatingCard>
              ))}
            </div>
          </div>
        </section>

        {/* Step 1 */}
        <section ref={el => { sectionRefs[1].current = el; }} className="relative min-h-screen flex items-center overflow-hidden" aria-label="Step 1: Enter your address">
          <div className="section-divider" />
          <StepSection
            step="01"
            title="Enter Your Address"
            description="Type any Dallas property address. We instantly locate it on the map and pull the official zoning classification from the City of Dallas GIS database."
            icon={MapPin}
            color="blue"
            visual={
              <FloatingCard delay={0.3} depth={1.2}>
                <div className="visual-card">
                  <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-card/80 px-5 py-4">
                    <MapPin className="h-5 w-5 text-blue-400" />
                    <div className="flex-1 relative overflow-hidden">
                      <span className="text-white/60">4511 Swiss Ave, Dallas, TX</span>
                      <motion.div
                        initial={{ x: '-100%' }}
                        whileInView={{ x: '200%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, delay: 0.8, ease: 'easeInOut' }}
                        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                      />
                    </div>
                    <div className="ml-auto h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center">
                      <ArrowRight className="h-4 w-4 text-white" />
                    </div>
                  </div>
                  <div className="mt-3 space-y-1">
                    {['4511 Swiss Avenue, Dallas, TX 75204', '4520 Swiss Ave, Dallas, TX 75205', '4500 Swiss Ave, Dallas, TX 75204'].map((addr, i) => (
                      <SuggestionRow key={i} address={addr} delay={0.6 + i * 0.12} />
                    ))}
                  </div>
                  <div className="absolute -bottom-6 -right-6 h-40 w-40 rounded-full bg-blue-500/8 blur-[60px]" />
                </div>
              </FloatingCard>
            }
          />
        </section>

        {/* Step 2 */}
        <section ref={el => { sectionRefs[2].current = el; }} className="relative min-h-screen flex items-center overflow-hidden" aria-label="Step 2: AI analyzes your property">
          <div className="section-divider" />
          <StepSection
            step="02"
            title="AI Analyzes Your Property"
            description="Claude AI cross-references your property's zoning code against Dallas regulations, evaluating ADU eligibility, lot split feasibility, and teardown-rebuild potential with real cost estimates."
            icon={Brain}
            color="purple"
            reverse
            visual={
              <FloatingCard delay={0.3} depth={1.2}>
                <div className="visual-card space-y-4">
                  <AnalysisRow icon={Home} label="ADU Analysis" status="Recommended" colorClass="emerald" delay={0.4} />
                  <AnalysisRow icon={Scissors} label="Lot Split" status="Possible" colorClass="amber" delay={0.55} />
                  <AnalysisRow icon={Hammer} label="Teardown & Rebuild" status="Analyzing..." colorClass="blue" delay={0.7} loading />
                  <div className="absolute -top-6 -left-6 h-40 w-40 rounded-full bg-purple-500/8 blur-[60px]" />
                </div>
              </FloatingCard>
            }
          />
        </section>

        {/* Step 3 */}
        <section ref={el => { sectionRefs[3].current = el; }} className="relative min-h-screen flex items-center overflow-hidden" aria-label="Step 3: Get actionable results">
          <div className="section-divider" />
          <StepSection
            step="03"
            title="Get Actionable Results"
            description="Receive detailed recommendations with value estimates, permit requirements, timelines, and concrete next steps — everything you need to maximize your property's potential."
            icon={TrendingUp}
            color="emerald"
            visual={
              <FloatingCard delay={0.3} depth={1.2}>
                <div className="visual-card">
                  <div className="flex items-center gap-2 text-sm text-white/40 mb-4">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Total Potential Value Increase
                  </div>
                  <CoverReveal delay={0.5} color="bg-emerald-500">
                    <p className="landing-value-text font-heading text-4xl sm:text-5xl font-extrabold text-gradient mb-6">
                      +$285,000
                    </p>
                  </CoverReveal>
                  <div className="space-y-3 mt-2">
                    {[
                      { label: 'ADU Rental Income', value: '+$145,000', pct: 60 },
                      { label: 'Lot Split Value', value: '+$95,000', pct: 38 },
                      { label: 'Rebuild Potential', value: '+$45,000', pct: 20 },
                    ].map((item, i) => (
                      <ValueBar key={i} {...item} delay={0.8 + i * 0.15} />
                    ))}
                  </div>
                  <div className="absolute -bottom-6 -right-6 h-40 w-40 rounded-full bg-emerald-500/8 blur-[60px]" />
                </div>
              </FloatingCard>
            }
          />
        </section>

        {/* Final CTA */}
        <section ref={el => { sectionRefs[4].current = el; }} className="relative min-h-screen flex items-center justify-center overflow-hidden" aria-label="Search for your property">
          <div className="section-divider" />
          <div className="absolute inset-0" aria-hidden="true">
            <motion.div
              animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.08, 0.04] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute top-1/3 left-1/4 h-[500px] w-[500px] rounded-full bg-blue-600 blur-[150px]"
            />
            <motion.div
              animate={{ scale: [1.15, 1, 1.15], opacity: [0.04, 0.08, 0.04] }}
              transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute bottom-1/3 right-1/4 h-[500px] w-[500px] rounded-full bg-purple-600 blur-[150px]"
            />
          </div>

          <div className="relative z-10 w-full mx-auto max-w-3xl px-4 sm:px-6 text-center overflow-visible">
            <RevealText delay={0} className="landing-cta-heading font-heading text-xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Ready to Discover Your
            </RevealText>
            <RevealText delay={0.12} className="landing-cta-heading font-heading text-xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              <span className="text-gradient">Property's Potential?</span>
            </RevealText>

            <RevealBlock delay={0.35}>
              <p className="landing-section-body mt-4 sm:mt-6 text-[13px] sm:text-lg text-white/35 max-w-xl mx-auto leading-relaxed px-2 sm:px-0">
                Enter your Dallas property address
                <br className="sm:hidden" />
                {' '}and get AI-powered
                <br className="sm:hidden" />
                {' '}recommendations in seconds.
              </p>
            </RevealBlock>

            <RevealBlock delay={0.5} className="mt-5 sm:mt-12 mx-auto">
              <SearchBar onSearch={handleSearch} size="large" />
              <div className="mt-3 sm:mt-4 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-white/25">
                <span>Try:</span>
                <button onClick={() => handleSearch('4511 Swiss Ave, Dallas, TX 75204')} className="underline hover:text-white/50 transition-colors duration-300">4511 Swiss Ave</button>
                <span>·</span>
                <button onClick={() => handleSearch('6910 Lakewood Blvd, Dallas, TX 75214')} className="underline hover:text-white/50 transition-colors duration-300">6910 Lakewood Blvd</button>
                <span>·</span>
                <button onClick={() => handleSearch('1500 Main St, Dallas, TX 75201')} className="underline hover:text-white/50 transition-colors duration-300">1500 Main St</button>
              </div>
            </RevealBlock>

            <RevealBlock delay={0.7}>
              <div className="mt-6 sm:mt-16 flex items-center justify-center gap-3 sm:gap-8 flex-wrap">
                {[
                  { icon: Zap, text: 'Results in <10s' },
                  { icon: MapPin, text: 'Real zoning data' },
                  { icon: Brain, text: 'Claude AI' },
                ].map((badge, i) => (
                  <div key={i} className="flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-sm text-white/25">
                    <badge.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400/40 shrink-0" aria-hidden="true" />
                    <span>{badge.text}</span>
                  </div>
                ))}
              </div>
            </RevealBlock>
          </div>
        </section>

        {/* About Tadi */}
        <section className="relative py-24 sm:py-32 overflow-hidden" aria-label="About Tadi Tedement">
          <div className="section-divider" />
          <div className="mx-auto max-w-6xl px-6">
            <div className="grid gap-12 lg:gap-20 items-center lg:grid-cols-[1fr_1.2fr]">
              <FloatingCard delay={0.2} depth={1}>
                <figure className="relative overflow-hidden rounded-2xl aspect-[3/4] max-w-sm mx-auto lg:mx-0">
                  <img
                    src="/images/tadi.jpg"
                    alt="Tadi Tedement standing in front of a property"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" aria-hidden="true" />
                  <figcaption className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-heading text-lg font-bold">Tadi Tedement</p>
                    <p className="text-white/60 text-sm">Virtual Real Estate Investor</p>
                  </figcaption>
                </figure>
              </FloatingCard>

              <div>
                <RevealText delay={0.1} as="h2" className="landing-section-heading font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
                  Ideated by Tadi Tedement
                </RevealText>
                <RevealBlock delay={0.3}>
                  <p className="landing-section-body mt-6 text-base sm:text-lg text-white/40 leading-relaxed">
                    From waiting tables to closing over 200 real estate deals — all from home. Tadi Tedement is a remote real estate investing pioneer who built a thriving virtual wholesaling business, finding deals over 2,000 miles away.
                  </p>
                  <p className="landing-section-body mt-4 text-base sm:text-lg text-white/40 leading-relaxed">
                    PropertyMax was born from Tadi's vision to give every property owner instant access to the same zoning intelligence and value analysis that professional investors use — powered by AI and real city data.
                  </p>
                </RevealBlock>
                <RevealBlock delay={0.5}>
                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <a
                      href="https://tadi-ted.thelinkfor.me/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                      Learn From Tadi
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                    <a
                      href="https://tadi-ted.thelinkfor.me/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-medium text-white/60 hover:bg-white/[0.06] hover:text-white/80 transition-all"
                    >
                      Visit Tadi's Site
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    </a>
                  </div>
                  <blockquote className="mt-4 text-sm text-white/25 italic">
                    "Your location is not your limitation."
                  </blockquote>
                </RevealBlock>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-white/5 py-8" role="contentinfo">
          <div className="mx-auto max-w-7xl px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-white/25" aria-hidden="true" />
              <span className="text-sm text-white/25">
                PropertyMax — Built by BigPoppaCode · Ideated by Tadi Tedement
              </span>
            </div>
            <span className="text-xs text-white/15">Powered by Dallas Open Data & Claude AI</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

/* ─── Sub-components ─── */

function StepSection({ step, title, description, icon: Icon, color, visual, reverse }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  const colorMap = {
    blue: { icon: 'text-blue-400', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20', number: 'text-blue-500/15', line: 'bg-blue-500' },
    purple: { icon: 'text-purple-400', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/20', number: 'text-purple-500/15', line: 'bg-purple-500' },
    emerald: { icon: 'text-emerald-400', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/20', number: 'text-emerald-500/15', line: 'bg-emerald-500' },
  };
  const c = colorMap[color];

  return (
    <div ref={ref} className="mx-auto max-w-6xl px-6 w-full">
      <div className={`grid gap-12 lg:gap-20 items-center ${reverse ? 'lg:grid-cols-[1fr_1.1fr]' : 'lg:grid-cols-[1.1fr_1fr]'}`}>
        <div className={reverse ? 'lg:order-2' : ''}>
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.8, ease: COVER_EASE, delay: 0.1 }}
            className={`h-[2px] w-12 ${c.line} origin-left mb-8`}
            style={{ willChange: 'transform' }}
            aria-hidden="true"
          />
          <div className="flex items-center gap-4 mb-6">
            <motion.div
              initial={{ scale: 0, rotate: -90 }}
              animate={isInView ? { scale: 1, rotate: 0 } : {}}
              transition={{ duration: 0.8, ease: REVEAL_EASE, delay: 0.2 }}
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${c.bg} shadow-lg ${c.glow}`}
              style={{ willChange: 'transform' }}
            >
              <Icon className={`h-7 w-7 ${c.icon}`} aria-hidden="true" />
            </motion.div>
            <RevealText delay={0.25} className={`landing-step-number font-heading text-7xl font-extrabold ${c.number}`} aria-hidden="true">
              {step}
            </RevealText>
          </div>
          <RevealText delay={0.35} as="h2" className="landing-step-title font-heading text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1]">
            {title}
          </RevealText>
          <RevealBlock delay={0.5}>
            <p className="landing-section-body mt-5 text-base sm:text-lg text-white/35 leading-relaxed max-w-lg">{description}</p>
          </RevealBlock>
        </div>
        <div className={reverse ? 'lg:order-1' : ''} aria-hidden="true">{visual}</div>
      </div>
    </div>
  );
}

function SuggestionRow({ address, delay }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: -20, y: 10 }}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.7, ease: REVEAL_EASE, delay }}
      className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-white/35 hover:bg-white/[0.03] transition-colors duration-300"
    >
      <MapPin className="h-3.5 w-3.5 text-white/15" />
      {address}
    </motion.div>
  );
}

function AnalysisRow({ icon: Icon, label, status, colorClass, delay, loading }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  const bgMap = { emerald: 'bg-emerald-500/15', amber: 'bg-amber-500/15', blue: 'bg-blue-500/15' };
  const textMap = { emerald: 'text-emerald-400', amber: 'text-amber-400', blue: 'text-blue-400' };
  const dotMap = { emerald: 'bg-emerald-400', amber: 'bg-amber-400', blue: 'bg-blue-400' };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.9, ease: REVEAL_EASE, delay }}
      className="flex items-center gap-4 rounded-xl border border-white/[0.06] bg-card/60 px-5 py-4"
      style={{ willChange: 'transform, opacity' }}
    >
      <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgMap[colorClass]}`}>
        <Icon className={`h-5 w-5 ${textMap[colorClass]}`} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-white/80">{label}</p>
        <p className={`text-xs ${textMap[colorClass]}`}>{status}</p>
      </div>
      {loading ? (
        <div className="h-5 w-5 rounded-full border-2 border-blue-400/20 border-t-blue-400 animate-spin" />
      ) : (
        <motion.div
          animate={{ scale: [1, 1.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
          className={`h-2 w-2 rounded-full ${dotMap[colorClass]}`}
        />
      )}
    </motion.div>
  );
}

function ValueBar({ label, value, pct, delay }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  return (
    <div ref={ref}>
      <div className="flex items-center justify-between text-sm mb-1.5">
        <motion.span
          initial={{ opacity: 0, x: -15 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: REVEAL_EASE, delay }}
          className="text-white/40"
        >{label}</motion.span>
        <motion.span
          initial={{ opacity: 0, x: 15 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, ease: REVEAL_EASE, delay }}
          className="font-semibold text-emerald-400"
        >{value}</motion.span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={isInView ? { width: `${pct}%`, opacity: 1 } : {}}
          transition={{ duration: 1.4, delay: delay + 0.15, ease: COVER_EASE }}
          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
          style={{ willChange: 'width, opacity' }}
        />
      </div>
    </div>
  );
}
