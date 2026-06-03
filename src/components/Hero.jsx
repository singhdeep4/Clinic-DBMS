import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Leaf, ShieldAlert } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative min-h-[90vh] bg-gradient-to-br from-brand-beige via-brand-cream to-brand-light/30 flex items-center overflow-hidden py-16">
      
      {/* Decorative background shapes */}
      <div className="absolute top-20 -left-16 w-72 h-72 rounded-full bg-brand-light/20 blur-3xl" />
      <div className="absolute bottom-10 -right-24 w-96 h-96 rounded-full bg-brand-secondary/5 blur-3xl" />

      {/* Grid Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column: Text & CTA */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6 text-center lg:text-left"
          >
            {/* Tagline Badge */}
            <div className="inline-flex items-center space-x-2 bg-brand-light text-brand-primary px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
              <Leaf size={14} className="fill-brand-primary text-brand-primary animate-pulse" />
              <span>Rooted in Ayurveda, Focused on Healing</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-extrabold text-brand-primary leading-tight">
              Holistic Healing <br />
              <span className="text-brand-secondary italic">For Your Mind, Body</span> <br />
              & Soul
            </h1>

            {/* Intro paragraph */}
            <p className="text-base md:text-lg text-brand-dark/75 leading-relaxed max-w-xl mx-auto lg:mx-0 font-sans">
              Welcome to Ayurkaya, where ancient Ayurvedic traditions meet modern wellness diagnostics. We design customized therapeutic regimens, diets, and botanical formulations to eliminate illness at its roots.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
              <Link
                to="/login"
                className="flex items-center justify-center bg-brand-primary text-brand-beige hover:bg-brand-secondary px-8 py-4 rounded-full text-sm font-bold uppercase tracking-wider transition-colors shadow-md hover:shadow-lg gap-2"
              >
                Doctor Portal <ArrowRight size={16} />
              </Link>
              <a
                href="tel:+918023456789"
                className="flex items-center justify-center bg-brand-cream border border-brand-secondary/20 hover:border-brand-primary text-brand-primary hover:bg-brand-light px-8 py-4 rounded-full text-sm font-bold uppercase tracking-wider transition-all shadow-sm"
              >
                Call Clinic
              </a>
            </div>

            {/* Clinical Trust Info */}
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-brand-light/70 max-w-md mx-auto lg:mx-0">
              <div className="text-center lg:text-left">
                <span className="block font-serif text-2xl md:text-3xl font-extrabold text-brand-primary">15+</span>
                <span className="text-[10px] uppercase font-bold text-brand-secondary/75 tracking-wider">Years Experience</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block font-serif text-2xl md:text-3xl font-extrabold text-brand-primary">10k+</span>
                <span className="text-[10px] uppercase font-bold text-brand-secondary/75 tracking-wider">Healed Patients</span>
              </div>
              <div className="text-center lg:text-left">
                <span className="block font-serif text-2xl md:text-3xl font-extrabold text-brand-primary">99%</span>
                <span className="text-[10px] uppercase font-bold text-brand-secondary/75 tracking-wider">Satisfaction</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Hero Image with Ayurvedic Aesthetics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative mx-auto max-w-md lg:max-w-none w-full"
          >
            {/* Soft backdrop circle */}
            <div className="absolute inset-0 bg-brand-light/35 rounded-full filter blur-md transform scale-95" />
            
            {/* Premium herbal/wellness visual */}
            <div className="relative border-4 border-brand-cream rounded-3xl overflow-hidden shadow-2xl aspect-[4/3] md:aspect-square">
              <img
                src="https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=1000"
                alt="Ayurvedic oil pouring therapy"
                className="w-full h-full object-cover transform hover:scale-[1.03] transition-transform duration-1000"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-primary/40 to-transparent" />
              
              {/* Overlapping Floating Element */}
              <div className="absolute bottom-6 left-6 right-6 bg-brand-beige/90 backdrop-blur-md border border-brand-light/60 p-4 rounded-2xl shadow-lg flex items-center space-x-3">
                <div className="h-10 w-10 rounded-full bg-brand-primary flex items-center justify-center text-brand-light shrink-0">
                  <Leaf size={18} className="fill-brand-light" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-brand-primary text-sm leading-snug">Authentic Ayurvedic Therapies</h4>
                  <p className="text-[11px] text-brand-dark/75 leading-relaxed font-sans">Using 100% natural herbs & organic oils.</p>
                </div>
              </div>
            </div>
          </motion.div>
          
        </div>
      </div>
    </div>
  );
}
