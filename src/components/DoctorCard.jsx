import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, Briefcase, ChevronRight } from "lucide-react";

export default function DoctorCard({ doctor }) {
  return (
    <motion.div
      whileHover={{ y: -8 }}
      className="bg-brand-cream border border-brand-light/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col md:flex-row max-w-3xl mx-auto"
    >
      {/* Doctor Image */}
      <div className="w-full md:w-2/5 h-64 md:h-auto min-h-[250px] relative overflow-hidden">
        <img
          src={doctor.image}
          alt={doctor.name}
          className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/40 to-transparent md:hidden" />
      </div>

      {/* Doctor Info */}
      <div className="p-6 md:p-8 flex-grow flex flex-col justify-between w-full md:w-3/5">
        <div>
          <span className="text-[10px] tracking-widest text-brand-accent uppercase font-bold block mb-1">
            {doctor.role}
          </span>
          <h3 className="font-serif text-2xl font-bold text-brand-primary mb-2">
            {doctor.name}
          </h3>
          <p className="text-xs text-brand-secondary font-semibold mb-4">
            {doctor.qualifications}
          </p>

          <div className="space-y-2 mb-6">
            <div className="flex items-center text-xs text-brand-dark/80">
              <Briefcase size={14} className="text-brand-secondary mr-2 shrink-0" />
              <span>{doctor.experience}</span>
            </div>
            <div className="flex items-start text-xs text-brand-dark/80">
              <Award size={14} className="text-brand-secondary mr-2 mt-0.5 shrink-0" />
              <div>
                <span className="font-medium text-brand-primary block mb-0.5">Specializations:</span>
                <span className="text-brand-dark/70">{doctor.specializations.join(", ")}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mt-auto">
          <Link
            to={`/doctors?id=${doctor.id}`}
            className="flex items-center justify-center bg-brand-light text-brand-primary hover:bg-brand-primary hover:text-brand-beige px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 border border-brand-secondary/15 shrink-0"
          >
            Learn More <ChevronRight size={14} className="ml-1" />
          </Link>
          <Link
            to="/booking"
            className="text-center bg-brand-primary text-brand-beige hover:bg-brand-secondary px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 shadow-sm hover:shadow"
          >
            Book Session
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
