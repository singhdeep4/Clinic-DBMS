"use client";

import React from "react";
import { motion, useReducedMotion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, ChevronDown, Star } from "lucide-react";
import { cn } from "../../lib/utils";

// Generate dynamic week schedule starting from today
const getDynamicWeekSchedule = () => {
  const days = [];
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const now = new Date();
  
  for (let i = 0; i < 6; i++) {
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + i);
    const dayName = i === 0 ? "Today" : weekdays[targetDate.getDay()];
    const dateString = targetDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const isSunday = targetDate.getDay() === 0;
    
    days.push({
      date: dateString,
      dayName: dayName,
      dayNumber: targetDate.getDate(),
      hasAvailability: !isSunday,
      slots: isSunday ? [] : [
        { time: "09:00 AM", available: true },
        { time: "10:00 AM", available: true },
        { time: "11:00 AM", available: true },
        { time: "12:00 PM", available: true },
        { time: "02:00 PM", available: true },
        { time: "03:00 PM", available: true },
        { time: "04:00 PM", available: true },
        { time: "05:00 PM", available: false }, // Simulated booked slot
        { time: "06:00 PM", available: true }
      ]
    });
  }
  return days;
};

const defaultCoach = {
  name: "Dr. Neha",
  title: "Chief Ayurvedic Physician",
  location: "Ayurkaya Center",
  rating: 5.0,
  reviewCount: 48,
  imageUrl: "https://images.unsplash.com/photo-1594824813573-246434de83fb?auto=format&fit=crop&q=80&w=400"
};

const defaultLocations = [
  "Ayurkaya Therapy Room A",
  "Ayurkaya Therapy Room B",
  "Online Tele-Consultation Slot"
];

export function CoachSchedulingCard({
  coach = defaultCoach,
  locations = defaultLocations,
  onLocationChange,
  onTimeSlotSelect,
  onWeekChange,
  enableAnimations = true,
  className
}) {
  const weekSchedule = getDynamicWeekSchedule();
  const [selectedLocation, setSelectedLocation] = useState(locations[0]);
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [showConfirmationView, setShowConfirmationView] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const shouldReduceMotion = useReducedMotion();
  const shouldAnimate = enableAnimations && !shouldReduceMotion;
  const dropdownRef = useRef(null);

  // Dynamic range text
  const weekRange = `${weekSchedule[0].date} - ${weekSchedule[weekSchedule.length - 1].date}`;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === "Escape") {
        setIsLocationDropdownOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    setIsLocationDropdownOpen(false);
    onLocationChange?.(location);
  };

  const handleTimeSlotClick = (day, time) => {
    const dayInfo = weekSchedule.find((d) => d.date === day);
    setSelectedTimeSlot({
      day,
      time,
      dayName: dayInfo?.dayName || day,
    });
    setShowConfirmationView(true);
  };

  const handleBackToMain = () => {
    setShowConfirmationView(false);
    setSelectedTimeSlot(null);
  };

  const handleConfirmBooking = () => {
    if (selectedTimeSlot) {
      onTimeSlotSelect?.(selectedTimeSlot.day, selectedTimeSlot.time);
    }
    setShowConfirmationView(false);
  };

  const handleWeekNavigation = (direction) => {
    onWeekChange?.(direction);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: -25,
      scale: 0.95,
      filter: "blur(4px)"
    },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      filter: "blur(0px)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 28,
        mass: 0.6,
      },
    },
  };

  const timeSlotVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
  };

  return (
    <motion.div
      variants={shouldAnimate ? containerVariants : {}}
      initial={shouldAnimate ? "hidden" : "visible"}
      animate="visible"
      className={cn(
        "bg-brand-cream border border-brand-light/60 rounded-3xl shadow-md overflow-hidden max-w-2xl relative w-full",
        className
      )}
    >
      <div className="relative h-auto">
        {/* Main Content */}
        <motion.div
          initial={false}
          animate={{ 
            y: showConfirmationView ? "-20px" : "0px",
            opacity: showConfirmationView ? 0.3 : 1,
            scale: showConfirmationView ? 0.95 : 1
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            mass: 0.8
          }}
          className="w-full"
        >
          {/* Coach Profile Header */}
          <motion.div 
            variants={shouldAnimate ? itemVariants : {}}
            className="p-6 pb-6"
          >
            <div className="flex items-start justify-between gap-4 flex-wrap sm:flex-nowrap">
              {/* Left Side - Profile Image */}
              <motion.div
                whileHover={shouldAnimate ? { 
                  scale: 1.05,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                } : {}}
                className="flex-shrink-0"
              >
                <img
                  src={coach.imageUrl}
                  alt={coach.name}
                  className="w-16 h-16 rounded-xl object-cover border border-brand-light"
                />
              </motion.div>

              {/* Center - Coach Info */}
              <div className="flex-1 min-w-0 space-y-2">
                <h2 className="text-xl font-serif font-bold text-brand-primary">
                  {coach.name}
                </h2>
                
                {/* Rating and Details Row */}
                <div className="flex items-center gap-2 text-xs text-brand-secondary flex-wrap">
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-brand-accent text-brand-accent" />
                    <span className="font-bold">{coach.rating}</span>
                    <span className="text-brand-secondary/80 ml-1">({coach.reviewCount} reviews)</span>
                  </div>
                  <span>•</span>
                  <span className="font-medium">{coach.title}</span>
                  <span>•</span>
                  <span>{coach.location}</span>
                </div>
              </div>

              {/* Right Side - Fee */}
              <motion.div
                className="text-right flex-shrink-0 bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl"
              >
                <p className="text-[9px] text-brand-secondary uppercase tracking-wider font-bold mb-0.5">Consult Fee</p>
                <p className="text-xl font-bold text-brand-primary">
                  Rs. 1,000
                </p>
              </motion.div>
            </div>
          </motion.div>

          {/* Location Selector */}
          <motion.div 
            variants={shouldAnimate ? itemVariants : {}}
            className="px-6 pb-4 relative z-50"
          >
            <label className="block text-xs font-bold text-brand-primary uppercase tracking-wider mb-2">
              Choose Consultation Location
            </label>
            <div className="relative z-50" ref={dropdownRef}>
              <motion.button
                whileHover={shouldAnimate ? {
                  scale: 1.01,
                  transition: { type: "spring", stiffness: 400, damping: 25 }
                } : {}}
                whileTap={shouldAnimate ? { scale: 0.99 } : {}}
                type="button"
                onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                aria-expanded={isLocationDropdownOpen}
                className="w-full flex items-center justify-between p-3 bg-brand-beige border border-brand-light/50 rounded-xl hover:border-brand-primary transition-all text-xs"
              >
                <span className="text-brand-primary font-medium">{selectedLocation}</span>
                <ChevronDown className={cn(
                  "w-4 h-4 text-brand-secondary transition-transform",
                  isLocationDropdownOpen && "rotate-180"
                )} />
              </motion.button>

              {/* Dropdown Menu */}
              <AnimatePresence>
                {isLocationDropdownOpen && (
                  <motion.div
                    initial={shouldAnimate ? { opacity: 0, y: -10, scale: 0.95 } : {}}
                    animate={shouldAnimate ? { opacity: 1, y: 0, scale: 1 } : {}}
                    exit={shouldAnimate ? { opacity: 0, y: -10, scale: 0.95 } : {}}
                    transition={shouldAnimate ? { type: "spring", stiffness: 400, damping: 25 } : {}}
                    className="absolute top-full left-0 right-0 mt-2 bg-brand-cream border border-brand-light/60 rounded-xl shadow-xl z-[9999] overflow-hidden"
                  >
                    {locations.map((loc, idx) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => handleLocationChange(loc)}
                        className="w-full text-left p-3 hover:bg-brand-light transition-colors text-brand-primary text-xs font-medium border-b border-brand-light/20 last:border-none"
                      >
                        {loc}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Separator */}
          <motion.div 
            variants={shouldAnimate ? itemVariants : {}}
            className="mx-6 border-t border-brand-light/35"
          />

          {/* Week Navigation */}
          <motion.div 
            variants={shouldAnimate ? itemVariants : {}}
            className="p-6 pb-4"
          >
            <div className="flex items-center justify-between">
              <motion.button
                whileHover={shouldAnimate ? { scale: 1.05 } : {}}
                whileTap={shouldAnimate ? { scale: 0.95 } : {}}
                type="button"
                onClick={() => handleWeekNavigation("prev")}
                className="p-2 hover:bg-brand-light rounded-lg transition-colors border border-brand-light/40 text-brand-secondary"
              >
                <ChevronLeft className="w-4 h-4" />
              </motion.button>

              <h3 className="font-serif text-sm font-bold text-brand-primary">
                Available Slots: {weekRange}
              </h3>

              <motion.button
                whileHover={shouldAnimate ? { scale: 1.05 } : {}}
                whileTap={shouldAnimate ? { scale: 0.95 } : {}}
                type="button"
                onClick={() => handleWeekNavigation("next")}
                className="p-2 hover:bg-brand-light rounded-lg transition-colors border border-brand-light/40 text-brand-secondary"
              >
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </motion.div>

          {/* Daily Schedule */}
          <motion.div 
            variants={shouldAnimate ? itemVariants : {}}
            className="px-6 pb-6 space-y-4"
          >
            {weekSchedule.map((day) => (
              <motion.div
                key={day.date}
                variants={shouldAnimate ? itemVariants : {}}
                className="space-y-2 border-b border-brand-light/20 pb-3 last:border-none last:pb-0"
              >
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-brand-primary">
                    {day.dayName}, {day.date}
                  </h4>
                  {!day.hasAvailability && (
                    <span className="text-[10px] text-brand-secondary/60 uppercase font-bold tracking-wider italic">
                      Sunday Off
                    </span>
                  )}
                </div>

                {/* Time Slots */}
                {day.hasAvailability && (
                  <motion.div 
                    variants={shouldAnimate ? containerVariants : {}}
                    className="flex flex-wrap gap-1.5"
                  >
                    {day.slots.map((slot) => (
                      <motion.button
                        key={`${day.date}-${slot.time}`}
                        variants={shouldAnimate ? timeSlotVariants : {}}
                        whileHover={shouldAnimate && slot.available ? { scale: 1.04, y: -1 } : {}}
                        whileTap={shouldAnimate && slot.available ? { scale: 0.98 } : {}}
                        type="button"
                        onClick={() => slot.available && handleTimeSlotClick(day.date, slot.time)}
                        disabled={!slot.available}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg border text-[11px] font-semibold transition-all focus:outline-none",
                          slot.available
                            ? "bg-brand-beige border-brand-light/50 hover:border-brand-primary text-brand-primary cursor-pointer shadow-sm"
                            : "bg-brand-light/30 border-brand-light/20 text-brand-secondary/40 cursor-not-allowed opacity-50"
                        )}
                      >
                        {slot.time}
                      </motion.button>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Confirmation View overlay */}
        <motion.div
          initial={false}
          animate={{ 
            y: showConfirmationView ? "0%" : "100%",
            opacity: showConfirmationView ? 1 : 0 
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            mass: 0.8
          }}
          className="absolute top-0 left-0 w-full h-full bg-brand-cream z-50 overflow-y-auto"
        >
          <div className="p-6 space-y-6">
            {/* Header with back button */}
            <div className="flex items-center justify-between border-b border-brand-light/35 pb-3">
              <button
                type="button"
                onClick={handleBackToMain}
                className="flex items-center gap-1 text-xs font-bold text-brand-secondary hover:text-brand-primary uppercase tracking-wider"
              >
                ← Back
              </button>
              <h3 className="font-serif text-lg font-bold text-brand-primary">Select Appointment Slot</h3>
              <div className="w-12"></div> {/* spacer */}
            </div>

            {/* Coach info summary */}
            <div className="flex items-center gap-3 p-4 bg-brand-beige/50 border border-brand-light/40 rounded-2xl">
              <img
                src={coach.imageUrl}
                alt={coach.name}
                className="w-12 h-12 rounded-xl object-cover border border-brand-light"
              />
              <div>
                <h4 className="font-serif text-sm font-bold text-brand-primary">{coach.name}</h4>
                <p className="text-xs text-brand-secondary font-medium">{coach.title}</p>
              </div>
            </div>

            {/* Booking details */}
            {selectedTimeSlot && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-[10px] text-brand-secondary uppercase tracking-widest font-bold mb-2">Selected Time Slot</p>
                  <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-2xl p-4">
                    <p className="text-sm font-serif font-bold text-brand-primary">
                      {selectedTimeSlot.dayName}, {selectedTimeSlot.day}
                    </p>
                    <p className="text-xl font-bold text-brand-primary mt-1">
                      {selectedTimeSlot.time}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1.5 border-b border-brand-light/20">
                    <span className="text-brand-secondary font-medium">Location Room:</span>
                    <span className="text-brand-primary font-bold">{selectedLocation}</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-brand-light/20">
                    <span className="text-brand-secondary font-medium">Session Duration:</span>
                    <span className="text-brand-primary font-bold">45 mins Consultation</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-brand-light/20">
                    <span className="text-brand-secondary font-medium">Consulting Fee:</span>
                    <span className="text-brand-primary font-bold">Rs. 1,000</span>
                  </div>
                </div>
              </div>
            )}

            {/* Confirm button */}
            <button
              type="button"
              onClick={handleConfirmBooking}
              className="w-full relative overflow-hidden py-3.5 rounded-xl font-bold transition-all duration-300 bg-brand-primary hover:bg-brand-secondary text-brand-beige text-xs uppercase tracking-wider shadow-md cursor-pointer"
            >
              Confirm Appointment Time
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
