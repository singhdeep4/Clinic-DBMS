import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Heart, Shield, Sparkles, Smile, BookOpen, Clock, 
  Leaf, Users, MessageSquare, Phone, MapPin 
} from "lucide-react";

import Hero from "../components/Hero";
import SEO from "../components/SEO";

const features = [
  {
    icon: <Heart className="text-brand-accent shrink-0" size={24} />,
    title: "Personalized Treatment",
    desc: "Every healing program is designed based on your unique metabolic constitution (Prakriti)."
  },
  {
    icon: <Leaf className="text-brand-accent shrink-0" size={24} />,
    title: "Panchakarma Therapy",
    desc: "Purification procedures that cleanse cells, flush toxins, and rejuvenate body systems."
  },
  {
    icon: <Sparkles className="text-brand-accent shrink-0" size={24} />,
    title: "Herbal Medicine",
    desc: "100% natural, botanically sourced formulations to balance internal systems without side effects."
  },
  {
    icon: <Users className="text-brand-accent shrink-0" size={24} />,
    title: "Lifestyle Consultation",
    desc: "Guidance on sleep schedules, exercise, and daily habits (Dinacharya) for mental harmony."
  },
  {
    icon: <BookOpen className="text-brand-accent shrink-0" size={24} />,
    title: "Diet Guidance",
    desc: "Custom eating guidelines aligning with your Agni (digestive fire) and seasonal dosha trends."
  },
  {
    icon: <Smile className="text-brand-accent shrink-0" size={24} />,
    title: "Long-Term Wellness",
    desc: "Preventative therapies and immune support to protect against future illness and age well."
  }
];

const whyChooseUs = [
  {
    icon: <Users size={28} className="text-brand-primary" />,
    title: "Experienced Doctors",
    desc: "Our chief physician Dr. Neha holds postgraduate M.D. degrees in Ayurveda with over 15 years of clinical practice."
  },
  {
    icon: <Leaf size={28} className="text-brand-primary" />,
    title: "Authentic Ayurveda",
    desc: "We strictly adhere to classical Ashtanga Hridaya protocols and use premium, certified organic oils."
  },
  {
    icon: <Heart size={28} className="text-brand-primary" />,
    title: "Personalized Care",
    desc: "No general prescriptions. Your diet plan, herbal remedies, and therapies are customized for you."
  },
  {
    icon: <Shield size={28} className="text-brand-primary" />,
    title: "Modern Record System",
    desc: "Secure digital health records track your symptoms, therapies, and dietary progress transparently."
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 25 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

export default function Home() {
  return (
    <div className="space-y-24 pb-20">
      <SEO 
        title="Home"
        description="Ayurkaya Clinic provides authentic Ayurvedic treatments, personalized diet plans, and Panchakarma detox therapies in Bangalore."
      />
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold text-brand-accent uppercase tracking-widest block">
            Holistic Healing Framework
          </span>
          <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-primary">
            Our Core Wellness Offerings
          </h2>
          <p className="text-sm text-brand-dark/75 leading-relaxed font-sans">
            Ayurveda is a comprehensive healthcare system. We customize these six dimensions to help you heal.
          </p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {features.map((feat, idx) => (
            <motion.div
              key={idx}
              variants={itemVariants}
              whileHover={{ y: -5 }}
              className="bg-brand-cream border border-brand-light/50 p-6 md:p-8 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 flex items-start space-x-4"
            >
              <div className="h-12 w-12 rounded-xl bg-brand-light flex items-center justify-center shrink-0">
                {feat.icon}
              </div>
              <div className="space-y-2">
                <h3 className="font-serif text-lg font-bold text-brand-primary">
                  {feat.title}
                </h3>
                <p className="text-xs md:text-sm text-brand-dark/75 leading-relaxed font-sans">
                  {feat.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 3. Why Choose Us Section */}
      <section className="bg-brand-dark text-brand-beige py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold text-brand-accent uppercase tracking-widest block">
                The Ayurkaya Edge
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold text-brand-light leading-tight">
                Why Thousands Trust Our Medical Approach
              </h2>
              <p className="text-sm text-brand-beige/70 leading-relaxed font-sans">
                Our clinic is not just an oil massage center. We treat the core systems of the body by combining authentic Vedic literature guidelines with contemporary safety protocols.
              </p>
              
              <div className="pt-6">
                <Link
                  to="/login"
                  className="bg-brand-primary text-brand-beige hover:bg-brand-secondary border border-brand-secondary px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors inline-block"
                >
                  Doctor Portal
                </Link>
              </div>
            </div>

            <div className="space-y-8">
              {whyChooseUs.map((item, idx) => (
                <div key={idx} className="flex items-start space-x-4">
                  <div className="h-12 w-12 rounded-xl bg-brand-light/10 border border-brand-light/15 flex items-center justify-center shrink-0 text-brand-light">
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-serif text-lg font-bold text-brand-light mb-1.5">
                      {item.title}
                    </h3>
                    <p className="text-xs md:text-sm text-brand-beige/70 leading-relaxed font-sans">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Contact & Info Card */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative bg-gradient-to-r from-brand-primary to-brand-secondary rounded-3xl overflow-hidden py-16 px-8 md:px-16 text-brand-beige shadow-xl">
          <div className="absolute top-0 left-0 w-32 h-32 rounded-full bg-brand-light/10 blur-xl -translate-x-10 -translate-y-10" />
          <div className="absolute bottom-0 right-0 w-44 h-44 rounded-full bg-brand-light/5 blur-xl translate-x-10 translate-y-10" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <span className="text-xs font-bold text-brand-accent uppercase tracking-widest block">
                Connect With Us
              </span>
              <h2 className="font-serif text-3xl md:text-4xl font-bold leading-tight">
                Visit Our Integrative Center
              </h2>
              <p className="text-sm text-brand-beige/80 leading-relaxed font-sans max-w-lg mx-auto">
                Walk in during our clinic hours or reach out directly to coordinate your consultation.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 text-left">
              <div className="bg-brand-cream/10 backdrop-blur-sm border border-brand-light/10 p-6 rounded-2xl space-y-3">
                <MapPin className="text-brand-accent" size={24} />
                <h4 className="font-serif font-bold text-base">Address</h4>
                <p className="text-xs text-brand-beige/80 leading-relaxed">
                  108 Lotus Pavilion Rd,<br />
                  Wellness District, Suite 500,<br />
                  Bangalore, KA 560001
                </p>
              </div>

              <div className="bg-brand-cream/10 backdrop-blur-sm border border-brand-light/10 p-6 rounded-2xl space-y-3">
                <Clock className="text-brand-accent" size={24} />
                <h4 className="font-serif font-bold text-base">Clinic Hours</h4>
                <p className="text-xs text-brand-beige/80 leading-relaxed">
                  <strong>Mon - Sat:</strong> 8 AM - 7 PM<br />
                  <strong>Sunday:</strong> 9 AM - 1 PM
                </p>
              </div>

              <div className="bg-brand-cream/10 backdrop-blur-sm border border-brand-light/10 p-6 rounded-2xl space-y-3">
                <Phone className="text-brand-accent" size={24} />
                <h4 className="font-serif font-bold text-base">Contact Info</h4>
                <p className="text-xs text-brand-beige/80 leading-relaxed">
                  <strong>Phone:</strong> +91 80 2345 6789<br />
                  <strong>Email:</strong> info@ayurkaya.com
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="tel:+918023456789"
                className="bg-brand-cream text-brand-primary hover:bg-brand-light hover:text-brand-primary px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors inline-block shadow-sm"
              >
                Call Clinic Now
              </a>
              <a
                href="https://wa.me/919999999999"
                target="_blank"
                rel="noreferrer"
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors inline-flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare size={16} /> Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
