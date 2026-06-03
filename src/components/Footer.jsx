import React from "react";
import { Link } from "react-router-dom";
import { Leaf, Phone, Mail, MapPin, Clock, MessageCircle } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-brand-dark text-brand-beige border-t border-brand-secondary/20 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center space-x-2">
              <div className="h-10 w-10 rounded-full bg-brand-light flex items-center justify-center text-brand-primary">
                <Leaf size={22} className="fill-brand-primary text-brand-primary" />
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-tight text-brand-beige block leading-none">
                  Ayurkaya
                </span>
                <span className="text-[10px] tracking-widest text-brand-light/75 uppercase font-semibold">
                  Ayurveda Clinic
                </span>
              </div>
            </Link>
            <p className="text-sm text-brand-beige/70 leading-relaxed font-sans">
              Bridging the timeless wisdom of traditional Ayurveda with modern clinical diagnostics.
              We are dedicated to your long-term holistic wellness.
            </p>
            <div className="flex space-x-4 pt-2">
              <a href="#" className="hover:text-brand-accent transition-colors text-brand-beige/80" aria-label="Facebook">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z"/>
                </svg>
              </a>
              <a href="#" className="hover:text-brand-accent transition-colors text-brand-beige/80" aria-label="Instagram">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" aria-hidden="true">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a 
                href="https://wa.me/919999999999" 
                target="_blank" 
                rel="noreferrer" 
                className="hover:text-green-400 transition-colors text-brand-beige/80"
                aria-label="WhatsApp Chat"
              >
                <MessageCircle size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg font-bold mb-6 text-brand-light tracking-wide border-b border-brand-secondary/35 pb-2">
              Navigation
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/" className="hover:text-brand-accent transition-colors text-brand-beige/85">Home</Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-brand-accent transition-colors text-brand-beige/85">Doctor Portal</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-serif text-lg font-bold mb-6 text-brand-light tracking-wide border-b border-brand-secondary/35 pb-2">
              Contact Info
            </h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start space-x-3">
                <MapPin size={18} className="text-brand-accent shrink-0 mt-0.5" />
                <span className="text-brand-beige/85 leading-relaxed">
                  108 Lotus Pavilion Rd,<br />
                  Wellness District, Suite 500,<br />
                  Bangalore, KA 560001
                </span>
              </li>
              <li className="flex items-center space-x-3">
                <Phone size={18} className="text-brand-accent shrink-0" />
                <a href="tel:+918023456789" className="hover:text-brand-accent transition-colors text-brand-beige/85">
                  +91 80 2345 6789
                </a>
              </li>
              <li className="flex items-center space-x-3">
                <Mail size={18} className="text-brand-accent shrink-0" />
                <a href="mailto:info@ayurkaya.com" className="hover:text-brand-accent transition-colors text-brand-beige/85">
                  info@ayurkaya.com
                </a>
              </li>
            </ul>
          </div>

          {/* Clinic Hours */}
          <div>
            <h3 className="font-serif text-lg font-bold mb-6 text-brand-light tracking-wide border-b border-brand-secondary/35 pb-2">
              Clinic Hours
            </h3>
            <ul className="space-y-4 text-sm text-brand-beige/85">
              <li className="flex items-start space-x-3">
                <Clock size={18} className="text-brand-accent shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-brand-beige">Monday - Saturday</div>
                  <div className="text-xs text-brand-beige/70">08:00 AM - 07:00 PM</div>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <Clock size={18} className="text-brand-accent shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-brand-beige">Sunday</div>
                  <div className="text-xs text-brand-beige/70">09:00 AM - 01:00 PM</div>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-brand-secondary/15 flex flex-col md:flex-row justify-between items-center text-xs text-brand-beige/60">
          <p>© {new Date().getFullYear()} Ayurkaya Clinic. All Rights Reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="hover:text-brand-accent transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-brand-accent transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
