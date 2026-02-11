import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// ----------------------------------------------------------------------
// COMPONENTS
// ----------------------------------------------------------------------

const Spotlight = ({ className, size = 400 }) => {
    return (
        <div className={cn("absolute pointer-events-none opacity-40", className)}>
            <div
                style={{ width: size, height: size }}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-full blur-[100px] animate-pulse-slow"
            />
        </div>
    );
};

const FeatureCard = ({ icon, title, desc, delay }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay }}
        viewport={{ once: true }}
        whileHover={{ y: -5, scale: 1.02 }}
        className="relative p-6 rounded-2xl border border-white/10 bg-slate-900/60 backdrop-blur-xl group overflow-hidden"
    >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/20 rounded-full blur-2xl group-hover:bg-indigo-500/30 transition-all font-bold" />

        <div className="relative z-10 flex flex-col items-center text-center">
            <div className="mb-4 text-4xl p-4 bg-slate-800/50 rounded-full border border-white/5 shadow-inner">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
        </div>
    </motion.div>
);

const Step = ({ number, title, desc }) => (
    <motion.div
        initial={{ opacity: 0, x: -20 }}
        whileInView={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="flex gap-6 relative"
    >
        {/* Connector Line */}
        <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full border-2 border-indigo-500 flex items-center justify-center text-indigo-400 font-bold bg-slate-900 z-10">
                {number}
            </div>
            <div className="h-full w-0.5 bg-gradient-to-b from-indigo-500 to-transparent my-2" />
        </div>
        <div className="pb-12 pt-2">
            <h3 className="text-2xl font-bold text-white mb-2">{title}</h3>
            <p className="text-slate-400 max-w-md">{desc}</p>
        </div>
    </motion.div>
);

// ----------------------------------------------------------------------
// MAIN LANDING PAGE
// ----------------------------------------------------------------------

export default function LandingPage() {
    const { scrollYProgress } = useScroll();
    const y = useTransform(scrollYProgress, [0, 1], [0, -50]);

    return (
        <div className="min-h-screen bg-[#050b14] text-white overflow-hidden font-sans selection:bg-indigo-500/30">

            {/* Background Ambience */}
            <Spotlight className="-top-20 -left-20" size={500} />
            <Spotlight className="top-1/3 right-0" size={400} />
            <Spotlight className="bottom-0 left-1/4" size={600} />

            <div className="bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 fixed inset-0 pointer-events-none" />

            {/* NAVBAR PLACEHOLDER (Since standard Navbar exists, we might want to hide it or integrate this page fully) 
          For now, we assume the main App Navbar is rendered above. 
      */}

            {/* HERO SECTION */}
            <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8 }}
                        className="inline-block mb-6 px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-sm font-medium tracking-wide uppercase"
                    >
                        🚀 The Future of Learning is Here
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                        className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
                    >
                        Education That <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 animate-gradient-x">
                            Evolves With You.
                        </span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                        className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12"
                    >
                        Unlock your full potential with an AI-driven platform that adapts to your unique mind, learning pace, and neuro-type.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center items-center"
                    >
                        <Link
                            to="/register"
                            className="px-8 py-4 rounded-full bg-white text-indigo-900 text-lg font-bold hover:bg-indigo-50 transition-all hover:scale-105 shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                        >
                            Start Learning Free
                        </Link>
                        <button className="px-8 py-4 rounded-full border border-slate-600 text-white hover:bg-slate-800 transition-all text-lg font-medium">
                            Watch Demo
                        </button>
                    </motion.div>

                    {/* 3D Brain/Neural Animation Placeholder */}
                    <motion.div
                        style={{ y }}
                        className="mt-20 relative mx-auto w-full max-w-4xl opacity-80"
                    >
                        {/* Abstract Neural Network Representation */}
                        <div className="aspect-[16/9] rounded-3xl bg-gradient-to-b from-slate-900 to-black border border-white/10 shadow-2xl overflow-hidden relative flex items-center justify-center">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500/20 via-transparent to-transparent animate-pulse-slow"></div>

                            {/* Simulated Nodes */}
                            <div className="relative w-64 h-64 md:w-96 md:h-96">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 border border-indigo-500/30 rounded-full border-dashed"
                                />
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-4 border border-purple-500/30 rounded-full border-dashed"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-6xl animate-bounce">🧠</div>
                                </div>

                                {/* Orbiting particles */}
                                {[...Array(6)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        className="absolute w-3 h-3 bg-white rounded-full shadow-[0_0_10px_white]"
                                        animate={{
                                            x: [0, Math.cos(i) * 150, 0],
                                            y: [0, Math.sin(i) * 150, 0],
                                            opacity: [0, 1, 0]
                                        }}
                                        transition={{
                                            duration: 3 + i,
                                            repeat: Infinity,
                                            ease: "easeInOut"
                                        }}
                                        style={{ top: '50%', left: '50%' }}
                                    />
                                ))}
                            </div>

                            <div className="absolute bottom-6 left-6 right-6 flex justify-between text-xs text-slate-500 font-mono">
                                <span>AI MODEL: ACTIVE</span>
                                <span>LATENCY: 12ms</span>
                                <span>NEURO-ADAPTATION: ON</span>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FEATURES GRID */}
            <section className="py-24 relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Designed for <span className="text-indigo-400">Every Mind</span></h2>
                        <p className="text-slate-400 max-w-2xl mx-auto">Traditional education forces you to conform. We adapt the content to fit your cognitive style.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon="🧬"
                            title="Neuro-Adaptive"
                            desc="Algorithms that adjust content format instantly for Dyslexia, ADHD, and Autism spectrums."
                            delay={0.2}
                        />
                        <FeatureCard
                            icon="📊"
                            title="Real-time Analytics"
                            desc="Track your cognitive load, focus peaks, and mastery levels with clinical-grade precision."
                            delay={0.4}
                        />
                        <FeatureCard
                            icon="🏆"
                            title="Gamified Progress"
                            desc="Stay motivated with a dynamic reward system that celebrates your unique learning milestones."
                            delay={0.6}
                        />
                    </div>
                </div>
            </section>

            {/* HOW IT WORKS */}
            <section className="py-24 bg-slate-900/50 relative overflow-hidden">
                <div className="max-w-5xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold mb-12">Your Path to <br /> Mastery</h2>
                        <div className="space-y-4">
                            <Step
                                number="01"
                                title="Take the Assessment"
                                desc="A quick 5-minute interactive quiz helps our AI map your cognitive profile and learning preferences."
                            />
                            <Step
                                number="02"
                                title="Get Your Custom Path"
                                desc="We generate a dynamic curriculum tailored specifically to your goals and neuro-type."
                            />
                            <Step
                                number="03"
                                title="Master at Your Pace"
                                desc="Learn with content that adapts in real-time. Struggling? We simplify. Bored? We accelerate."
                            />
                        </div>
                    </div>

                    <div className="relative h-[600px] bg-gradient-to-br from-indigo-900/20 to-purple-900/20 rounded-3xl border border-white/5 p-8 flex items-center justify-center">
                        {/* Visual representation of a path */}
                        <div className="relative w-full h-full">
                            <motion.svg
                                viewBox="0 0 400 600"
                                className="w-full h-full overflow-visible"
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                            >
                                <motion.path
                                    d="M200,50 C200,50 300,150 200,250 C100,350 300,450 200,550"
                                    fill="none"
                                    stroke="url(#gradient)"
                                    strokeWidth="4"
                                    initial={{ pathLength: 0 }}
                                    whileInView={{ pathLength: 1 }}
                                    transition={{ duration: 2, ease: "easeInOut" }}
                                />
                                <defs>
                                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#6366f1" />
                                        <stop offset="100%" stopColor="#ec4899" />
                                    </linearGradient>
                                </defs>

                                {/* Animated Nodes along path */}
                                <motion.circle cx="200" cy="50" r="8" fill="#fff"
                                    initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 0.2 }}
                                />
                                <motion.circle cx="200" cy="250" r="8" fill="#fff"
                                    initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 1 }}
                                />
                                <motion.circle cx="200" cy="550" r="8" fill="#fff"
                                    initial={{ scale: 0 }} whileInView={{ scale: 1 }} transition={{ delay: 1.8 }}
                                />
                            </motion.svg>

                            {/* Floating Labels */}
                            <motion.div
                                className="absolute top-[10%] left-[60%] bg-slate-800 p-3 rounded-xl border border-white/10 shadow-xl"
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <div className="text-xs text-slate-400">Current Status</div>
                                <div className="font-bold text-indigo-400">Analyzing...</div>
                            </motion.div>

                            <motion.div
                                className="absolute top-[45%] right-[60%] bg-slate-800 p-3 rounded-xl border border-white/10 shadow-xl"
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ delay: 1.2 }}
                            >
                                <div className="text-xs text-slate-400">Recommendation</div>
                                <div className="font-bold text-purple-400">Visual Learning Mode</div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </section>

            {/* TESTIMONIAL */}
            <section className="py-24 px-6 relative">
                <div className="max-w-4xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border border-white/10 p-12 rounded-3xl text-center relative overflow-hidden"
                    >
                        <div className="text-6xl text-indigo-500/30 absolute top-4 left-6 font-serif">"</div>
                        <h3 className="text-2xl md:text-4xl font-light leading-relaxed mb-8 relative z-10">
                            "This platform understood my ADHD better than any teacher I've ever had. It breaks things down exactly how my brain needs it."
                        </h3>
                        <div className="flex items-center justify-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center text-xl">👤</div>
                            <div className="text-left">
                                <div className="font-bold text-white">Alex M.</div>
                                <div className="text-indigo-400 text-sm">Computer Science Student</div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="py-12 border-t border-white/5 bg-black/40">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
                        AdaptiveLearn
                    </div>
                    <div className="flex gap-8 text-slate-400 text-sm">
                        <a href="#" className="hover:text-white transition-colors">Privacy</a>
                        <a href="#" className="hover:text-white transition-colors">Terms</a>
                        <a href="#" className="hover:text-white transition-colors">Contact</a>
                    </div>
                    <div className="text-slate-500 text-sm">
                        © 2024 AdaptiveLearn AI.
                    </div>
                </div>
            </footer>

        </div>
    );
}
