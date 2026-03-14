'use client';

import { useEffect, useRef, useState, MouseEvent } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import Link from 'next/link';

// ─── Types ───────────────────────────────────────────────────────────────────
interface StatCard {
  value: string;
  label: string;
  sub: string;
  color: string;
  glow: string;
  icon: string;
}

interface Feature {
  icon: string;
  title: string;
  desc: string;
  tag: string;
  color: string;
  border: string;
  span?: string;
}

interface TickerItem {
  village: string;
  tds: number;
  ph: number;
  status: 'SAFE' | 'ALERT' | 'CRITICAL';
  time: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const STATS: StatCard[] = [
  { value: '2,847', label: 'Villages Monitored', sub: '+12 this week', color: 'text-cyan-400', glow: 'shadow-[0_0_24px_rgba(0,212,255,0.3)]', icon: '🛰️' },
  { value: '1.4M', label: 'Lives Protected', sub: 'Real-time coverage', color: 'text-teal-400', glow: 'shadow-[0_0_24px_rgba(29,158,117,0.3)]', icon: '🛡️' },
  { value: '98.7%', label: 'Alerts Resolved', sub: 'Avg. 4.2h response', color: 'text-purple-400', glow: 'shadow-[0_0_24px_rgba(127,119,221,0.3)]', icon: '⚡' },
  { value: '14,203', label: 'Sensor Readings', sub: 'In last 24 hours', color: 'text-amber-400', glow: 'shadow-[0_0_24px_rgba(239,159,39,0.3)]', icon: '📡' },
];

const TICKER_ITEMS: TickerItem[] = [
  { village: 'Nashik-04', tds: 312, ph: 7.2, status: 'SAFE', time: '14:52' },
  { village: 'Pune-Rural-11', tds: 847, ph: 6.1, status: 'ALERT', time: '14:51' },
  { village: 'Aurangabad-07', tds: 1240, ph: 5.8, status: 'CRITICAL', time: '14:50' },
  { village: 'Nagpur-03', tds: 289, ph: 7.4, status: 'SAFE', time: '14:49' },
  { village: 'Solapur-12', tds: 654, ph: 6.8, status: 'ALERT', time: '14:48' },
  { village: 'Kolhapur-06', tds: 198, ph: 7.6, status: 'SAFE', time: '14:47' },
  { village: 'Amravati-09', tds: 1580, ph: 5.4, status: 'CRITICAL', time: '14:46' },
  { village: 'Latur-02', tds: 445, ph: 7.1, status: 'SAFE', time: '14:45' },
];

const FEATURES: Feature[] = [
  {
    icon: '🧠',
    title: 'AI Outbreak Prediction',
    desc: 'Gemini-powered models detect contamination patterns 72 hours before visible symptoms appear in communities.',
    tag: 'Predictive Intelligence',
    color: 'text-cyan-400',
    border: 'border-cyan-500/20',
    span: 'md:col-span-2',
  },
  {
    icon: '⚖️',
    title: 'Legal Compliance Engine',
    desc: 'Auto-generate BIS 10500 compliance reports and RTI-ready documentation.',
    tag: 'Justice Layer',
    color: 'text-purple-400',
    border: 'border-purple-500/20',
  },
  {
    icon: '📡',
    title: 'IoT Sensor Network',
    desc: 'Real-time TDS, pH, turbidity, and heavy metal readings from 2,800+ field sensors.',
    tag: 'Hardware Integration',
    color: 'text-teal-400',
    border: 'border-teal-500/20',
  },
  {
    icon: '🚨',
    title: 'Instant Alert Dispatch',
    desc: 'SMS + WhatsApp alerts to health officers within 90 seconds of threshold breach.',
    tag: 'Response System',
    color: 'text-coral-400',
    border: 'border-coral-500/20',
  },
  {
    icon: '🗺️',
    title: 'Geospatial Risk Mapping',
    desc: 'District-level heatmaps with contamination spread modeling and aquifer risk zones.',
    tag: 'Spatial Analytics',
    color: 'text-amber-400',
    border: 'border-amber-500/20',
    span: 'md:col-span-2',
  },
];

// ─── 3D Water Globe Component ─────────────────────────────────────────────────
function WaterGlobe() {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  useEffect(() => {
    const animate = (t: number) => {
      timeRef.current = t;
      setRotation({
        x: Math.sin(t * 0.0003) * 15,
        y: t * 0.02,
      });
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, []);

  return (
    <div className="relative w-[320px] h-[320px] md:w-[420px] md:h-[420px] flex items-center justify-center">
      {/* Outer glow rings */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={i}
          className="absolute rounded-full border border-cyan-400/10"
          style={{ width: `${100 + i * 60}px`, height: `${100 + i * 60}px` }}
          animate={{ scale: [1, 1.05, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}

      {/* Orbit rings */}
      <motion.div
        className="absolute w-[280px] h-[280px] md:w-[380px] md:h-[380px] rounded-full border border-cyan-400/20"
        style={{ transform: 'rotateX(75deg)' }}
        animate={{ rotateZ: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(0,212,255,0.8)]" />
      </motion.div>

      <motion.div
        className="absolute w-[240px] h-[240px] md:w-[320px] md:h-[320px] rounded-full border border-teal-400/15"
        style={{ transform: 'rotateX(60deg) rotateY(30deg)' }}
        animate={{ rotateZ: -360 }}
        transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
      >
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-teal-400 shadow-[0_0_6px_rgba(29,158,117,0.8)]" />
      </motion.div>

      {/* Globe sphere */}
      <motion.div
        className="relative w-[160px] h-[160px] md:w-[200px] md:h-[200px] rounded-full"
        style={{
          background: 'radial-gradient(circle at 35% 35%, #1e4a7a 0%, #0f1729 50%, #0a0f1e 100%)',
          boxShadow: '0 0 60px rgba(0,212,255,0.2), inset 0 0 40px rgba(0,212,255,0.05), 0 0 120px rgba(0,212,255,0.1)',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y % 360}deg)`,
        }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Water surface lines */}
        <svg className="absolute inset-0 w-full h-full rounded-full opacity-30" viewBox="0 0 200 200">
          <defs>
            <radialGradient id="globeGrad" cx="35%" cy="35%">
              <stop offset="0%" stopColor="#00d4ff" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0f1729" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="100" cy="100" r="98" fill="url(#globeGrad)" />
          {[30, 50, 70, 90, 110, 130, 150, 170].map((y) => (
            <path
              key={y}
              d={`M 2 ${y} Q 50 ${y - 8} 100 ${y} Q 150 ${y + 8} 198 ${y}`}
              stroke="#00d4ff"
              strokeWidth="0.5"
              fill="none"
              opacity="0.4"
            />
          ))}
          {[40, 80, 120, 160].map((x) => (
            <path
              key={x}
              d={`M ${x} 2 Q ${x - 8} 50 ${x} 100 Q ${x + 8} 150 ${x} 198`}
              stroke="#00d4ff"
              strokeWidth="0.5"
              fill="none"
              opacity="0.3"
            />
          ))}
          {/* India outline simplified */}
          <path
            d="M 95 60 L 110 65 L 120 80 L 115 100 L 105 120 L 100 130 L 95 120 L 85 100 L 80 80 L 88 65 Z"
            fill="rgba(0,212,255,0.15)"
            stroke="#00d4ff"
            strokeWidth="0.8"
          />
          {/* Sensor dots */}
          {[[95, 75], [105, 85], [90, 95], [108, 100], [98, 110]].map(([cx, cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="2" fill="#00d4ff" opacity="0.8">
              <animate attributeName="opacity" values="0.8;0.2;0.8" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}
        </svg>

        {/* Highlight */}
        <div className="absolute top-[15%] left-[20%] w-[30%] h-[20%] rounded-full bg-white/5 blur-sm" />
      </motion.div>

      {/* Floating data points */}
      {[
        { label: 'TDS 312', x: '-80%', y: '-30%', color: 'text-teal-400', delay: 0 },
        { label: 'pH 7.2', x: '80%', y: '-20%', color: 'text-cyan-400', delay: 0.5 },
        { label: 'SAFE ✓', x: '-70%', y: '40%', color: 'text-teal-400', delay: 1 },
        { label: '⚠ ALERT', x: '75%', y: '35%', color: 'text-amber-400', delay: 1.5 },
      ].map((point, i) => (
        <motion.div
          key={i}
          className={`absolute font-mono text-xs ${point.color} bg-navy-800/80 border border-current/20 px-2 py-1 rounded backdrop-blur-sm`}
          style={{ left: point.x, top: point.y }}
          animate={{ y: [0, -6, 0], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: point.delay }}
        >
          {point.label}
        </motion.div>
      ))}
    </div>
  );
}

// ─── 3D Tilt Card ─────────────────────────────────────────────────────────────
function TiltCard({ feature, index }: { feature: Feature; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -12, y: x * 12 });
  };

  return (
    <motion.div
      ref={cardRef}
      className={`relative group cursor-default ${feature.span || ''}`}
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setIsHovered(false); }}
      style={{
        transform: `perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
    >
      <div
        className={`relative h-full rounded-2xl border ${feature.border} bg-navy-800/60 backdrop-blur-sm p-6 overflow-hidden`}
        style={{
          background: 'linear-gradient(135deg, rgba(26,26,46,0.8) 0%, rgba(15,23,41,0.9) 100%)',
          boxShadow: isHovered ? '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)' : '0 4px 20px rgba(0,0,0,0.2)',
        }}
      >
        {/* Shimmer on hover */}
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${50 + tilt.y * 3}% ${50 + tilt.x * 3}%, rgba(0,212,255,0.06) 0%, transparent 60%)`,
          }}
        />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <span className="text-3xl">{feature.icon}</span>
            <span className={`text-xs font-mono ${feature.color} bg-current/10 px-2 py-0.5 rounded-full border border-current/20`}>
              {feature.tag}
            </span>
          </div>
          <h3 className={`text-lg font-bold mb-2 ${feature.color}`}>{feature.title}</h3>
          <p className="text-slate-400 text-sm leading-relaxed">{feature.desc}</p>
        </div>

        {/* Corner accent */}
        <div className={`absolute bottom-0 right-0 w-16 h-16 rounded-tl-3xl opacity-10 group-hover:opacity-20 transition-opacity`}
          style={{ background: `var(--tw-gradient-from, currentColor)` }} />
      </div>
    </motion.div>
  );
}

// ─── Ticker ───────────────────────────────────────────────────────────────────
function LiveTicker() {
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS];
  const statusColor: Record<string, string> = {
    SAFE: 'text-teal-400',
    ALERT: 'text-amber-400',
    CRITICAL: 'text-coral-400',
  };

  return (
    <div className="relative overflow-hidden border-y border-navy-600/40 bg-navy-950/60 backdrop-blur-sm py-3">
      <div className="absolute left-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-r from-navy-950/80 to-transparent" />
      <div className="absolute right-0 top-0 bottom-0 w-16 z-10 bg-gradient-to-l from-navy-950/80 to-transparent" />

      <div className="flex items-center gap-2 px-4 mb-1">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
        </span>
        <span className="text-xs font-mono text-teal-400 font-semibold tracking-widest uppercase">Live Sensor Feed</span>
      </div>

      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
      >
        {items.map((item, i) => (
          <div key={i} className="flex items-center gap-3 font-mono text-xs">
            <span className="text-slate-500">{item.time}</span>
            <span className="text-slate-300 font-semibold">{item.village}</span>
            <span className="text-slate-400">TDS <span className="text-cyan-400">{item.tds}</span></span>
            <span className="text-slate-400">pH <span className="text-cyan-300">{item.ph}</span></span>
            <span className={`font-bold ${statusColor[item.status]}`}>{item.status}</span>
            <span className="text-navy-600">|</span>
          </div>
        ))}
      </motion.div>
    </div>
  );
}

// ─── Animated Background ──────────────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(0,212,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,212,255,0.5) 1px, transparent 1px)`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Radial glow blobs */}
      <motion.div
        className="absolute top-[-20%] left-[10%] w-[600px] h-[600px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-[-10%] right-[5%] w-[500px] h-[500px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(29,158,117,0.06) 0%, transparent 70%)' }}
        animate={{ scale: [1.2, 1, 1.2], opacity: [0.4, 0.7, 0.4] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(127,119,221,0.05) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
      />

      {/* Floating particles */}
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-cyan-400/30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function HeroPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: containerRef });
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.6]);
  const springY = useSpring(heroY, { stiffness: 100, damping: 30 });

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  return (
    <div ref={containerRef} className="min-h-screen bg-navy-900 text-slate-200 overflow-x-hidden">
      {/* ── Nav ── */}
      <motion.nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 py-4 border-b border-navy-600/30 backdrop-blur-md"
        style={{ background: 'rgba(15,23,41,0.85)' }}
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
            <span className="text-cyan-400 text-sm">💧</span>
          </div>
          <span className="font-bold text-slate-100 tracking-tight">AquaPulse <span className="text-cyan-400">AI</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm text-slate-400">
          {['Platform', 'Coverage', 'Compliance', 'Research'].map((item) => (
            <a key={item} href="#" className="hover:text-cyan-400 transition-colors duration-200">{item}</a>
          ))}
        </div>

        <Link
          href="/login"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-400/10 border border-cyan-400/30 text-cyan-400 text-sm font-semibold hover:bg-cyan-400/20 hover:border-cyan-400/50 transition-all duration-200"
        >
          Sign In →
        </Link>
      </motion.nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-20 pb-0 px-6 md:px-12">
        <AnimatedBackground />

        <motion.div
          className="relative z-10 w-full max-w-7xl mx-auto"
          style={{ y: springY, opacity: heroOpacity }}
        >
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
            {/* Left: Text */}
            <div className="flex-1 text-center lg:text-left">
              {/* Badge */}
              <motion.div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-cyan-400/20 bg-cyan-400/5 mb-6"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-400" />
                </span>
                <span className="text-xs font-mono text-cyan-400 tracking-widest uppercase">Live · 2,847 sensors active</span>
              </motion.div>

              {/* Headline */}
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              >
                <span className="text-slate-100">India&apos;s Water</span>
                <br />
                <span
                  className="relative"
                  style={{
                    background: 'linear-gradient(135deg, #00d4ff 0%, #1d9e75 50%, #7f77dd 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  Safety Intelligence
                </span>
                <br />
                <span className="text-slate-100">Platform</span>
              </motion.h1>

              {/* Tagline */}
              <motion.div
                className="flex flex-wrap items-center gap-3 justify-center lg:justify-start mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                {[
                  { label: 'Water Safety', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' },
                  { label: 'Disease Prevention', color: 'text-teal-400', bg: 'bg-teal-400/10 border-teal-400/20' },
                  { label: 'Justice', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
                ].map((tag, i) => (
                  <span key={i} className={`px-3 py-1 rounded-full border text-sm font-semibold ${tag.color} ${tag.bg}`}>
                    {tag.label}
                  </span>
                ))}
              </motion.div>

              {/* Description */}
              <motion.p
                className="text-slate-400 text-lg leading-relaxed max-w-xl mx-auto lg:mx-0 mb-10"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                AI-powered contamination detection, outbreak prediction, and legal compliance for 1.4 million rural lives across Maharashtra.
              </motion.p>

              {/* CTA */}
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                <Link href="/login">
                  <motion.button
                    className="relative group px-8 py-4 rounded-xl font-bold text-navy-900 text-base overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #00d4ff 0%, #1d9e75 100%)',
                      boxShadow: '0 0 30px rgba(0,212,255,0.4), 0 0 60px rgba(0,212,255,0.15)',
                    }}
                    whileHover={{ scale: 1.03, boxShadow: '0 0 40px rgba(0,212,255,0.6), 0 0 80px rgba(0,212,255,0.2)' }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span className="relative z-10 flex items-center gap-2">
                      Access Dashboard
                      <motion.span
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >→</motion.span>
                    </span>
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.button>
                </Link>

                <motion.button
                  className="px-8 py-4 rounded-xl font-semibold text-slate-300 border border-navy-600/60 bg-navy-800/40 backdrop-blur-sm hover:border-cyan-400/30 hover:text-cyan-400 transition-all duration-300 text-base"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  View Live Map
                </motion.button>
              </motion.div>
            </div>

            {/* Right: 3D Globe */}
            <motion.div
              className="flex-shrink-0 flex items-center justify-center"
              initial={{ opacity: 0, scale: 0.8, rotateY: -20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <WaterGlobe />
            </motion.div>
          </div>

          {/* ── Stat Cards ── */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
          >
            {STATS.map((stat, i) => (
              <motion.div
                key={i}
                className={`relative rounded-2xl border border-navy-600/40 bg-navy-800/50 backdrop-blur-sm p-5 overflow-hidden group hover:border-current/30 transition-all duration-300 ${stat.glow}`}
                whileHover={{ y: -4, scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="text-2xl">{stat.icon}</span>
                  <div className="w-2 h-2 rounded-full bg-current opacity-60 animate-pulse" style={{ color: 'inherit' }} />
                </div>
                <div className={`font-mono text-2xl md:text-3xl font-bold ${stat.color} mb-1`}>{stat.value}</div>
                <div className="text-slate-300 text-sm font-semibold mb-1">{stat.label}</div>
                <div className="text-slate-500 text-xs font-mono">{stat.sub}</div>

                {/* Hover shimmer */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, transparent 100%)' }} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ── Live Ticker ── */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <LiveTicker />
      </motion.div>

      {/* ── Features Section ── */}
      <section className="relative py-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          {/* Section header */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-teal-400/20 bg-teal-400/5 mb-4">
              <span className="text-xs font-mono text-teal-400 tracking-widest uppercase">Platform Capabilities</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-slate-100 mb-4">
              Built for the{' '}
              <span style={{
                background: 'linear-gradient(135deg, #1d9e75 0%, #00d4ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>
                field, not the boardroom
              </span>
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Every feature designed around the reality of rural water monitoring — intermittent connectivity, multilingual officers, and lives on the line.
            </p>
          </motion.div>

          {/* Bento grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {FEATURES.map((feature, i) => (
              <TiltCard key={i} feature={feature} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Banner ── */}
      <section className="relative py-20 px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(0,212,255,0.04) 0%, rgba(29,158,117,0.04) 50%, rgba(127,119,221,0.04) 100%)' }} />
        <div className="absolute inset-0 border-y border-navy-600/30" />

        <motion.div
          className="relative max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="text-5xl mb-6">💧</div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-100 mb-4">
            Every reading matters.
            <br />
            <span style={{
              background: 'linear-gradient(135deg, #00d4ff 0%, #1d9e75 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Every life counts.
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-xl mx-auto">
            Join health officers across Maharashtra using AquaPulse AI to protect communities from waterborne disease.
          </p>

          <Link href="/login">
            <motion.button
              className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl font-bold text-navy-900 text-lg"
              style={{
                background: 'linear-gradient(135deg, #00d4ff 0%, #1d9e75 100%)',
                boxShadow: '0 0 40px rgba(0,212,255,0.35), 0 0 80px rgba(0,212,255,0.1)',
              }}
              whileHover={{
                scale: 1.04,
                boxShadow: '0 0 60px rgba(0,212,255,0.5), 0 0 100px rgba(0,212,255,0.15)',
              }}
              whileTap={{ scale: 0.97 }}
            >
              <span>Get Started &mdash; It&apos;s Free</span>
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.button>
          </Link>

          <p className="text-slate-500 text-sm mt-4 font-mono">
            No credit card · Government-grade security · BIS 10500 compliant
          </p>
        </motion.div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-navy-600/30 py-8 px-6 md:px-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-cyan-400/10 border border-cyan-400/30 flex items-center justify-center">
              <span className="text-cyan-400 text-xs">💧</span>
            </div>
            <span className="text-slate-400 text-sm">AquaPulse AI · Water Safety Intelligence</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-slate-500 font-mono">
            <span>Maharashtra · India</span>
            <span className="text-navy-600">|</span>
            <span>BIS 10500 Compliant</span>
            <span className="text-navy-600">|</span>
            <span>© 2025 AquaPulse</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
