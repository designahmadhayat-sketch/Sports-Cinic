import React, { useState, useEffect } from 'react';
import { Phone, Calendar, User, Menu, X, LogOut, ArrowUpRight } from 'lucide-react';
import { CLINIC_INFO } from '../data/clinicData';
import { clinicImages } from '../assets';
import { User as UserType } from '../types';

interface NavbarProps {
  user: UserType | null;
  onOpenAuth: () => void;
  onOpenAppointments: () => void;
  onLogoutUser: () => void;
  onOpenBooking: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenAuth,
  onOpenAppointments,
  onLogoutUser,
  onOpenBooking,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState<string>('about');

  const navItems = [
    { id: 'services', label: 'Services', targetId: 'services' },
    { id: 'about', label: 'About', targetId: 'about' },
    { id: 'reviews', label: 'Reviews', targetId: 'reviews' },
    { id: 'appointment', label: 'Contact', targetId: 'appointment' },
  ];

  const scrollTo = (targetId: string, navId?: string) => {
    if (navId) setActiveNav(navId);
    setMobileMenuOpen(false);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Observe scroll position to dynamically update active pill
  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 220;
      for (const item of [...navItems].reverse()) {
        const el = document.getElementById(item.targetId);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveNav(item.id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-gray-100/90 transition-all duration-300 py-2.5 shadow-[0_4px_20px_rgba(0,0,0,0.03)] relative">
      {/* Top Secondary Color Accent Line (Medical Red to Surgical Teal) */}
      <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-red-600 via-rose-500 to-[#008C78]"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo - Left with Secondary Red & Medical Teal Highlights */}
        <a 
          href="#home" 
          onClick={(e) => { e.preventDefault(); scrollTo('home'); }}
          className="flex items-center gap-3 group"
          id="nav-logo"
        >
          {/* Official Clinic Logo */}
          <div className="relative flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
            <img
              src={clinicImages.clinicLogo}
              alt="SPORC Clinic Logo"
              width={44}
              height={44}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl object-contain bg-white border border-gray-200 shadow-sm p-0.5"
            />
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-['Manrope',sans-serif] font-extrabold text-xl sm:text-2xl tracking-tight text-[#101F50] leading-none">
                SPORC Clinic
              </span>
              <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Sports &amp; Ortho Rehab
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[9px] sm:text-[10px] tracking-[0.14em] uppercase font-bold text-[#008C78]">
                Dr. Iftikhar Ali
              </span>
              <span className="hidden sm:inline-block w-1 h-1 rounded-full bg-emerald-400"></span>
              <span className="hidden sm:inline-block text-[9px] font-semibold text-gray-500">
                Murree Road, Rawalpindi
              </span>
            </div>
          </div>
        </a>

        {/* Center Frosted Navigation Capsule Pill with Red Active Indicator */}
        <nav className="hidden lg:flex items-center bg-gray-50/90 backdrop-blur-xl border border-gray-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.03)] rounded-full p-1">
          {navItems.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollTo(item.targetId, item.id)}
                className={`relative px-4 py-1.5 text-xs font-bold rounded-full transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-white text-[#101F50] shadow-sm border border-gray-200/60'
                    : 'text-gray-600 hover:text-[#101F50] hover:bg-white/60'
                }`}
                id={`nav-link-${item.id}`}
              >
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Actions: Red Badge Call Button & Red Gradient Book Visit Button */}
        <div className="flex items-center gap-2">
          {/* User appointments / sign in helper */}
          {user ? (
            <div className="hidden sm:flex items-center gap-1.5 mr-1">
              <button
                onClick={onOpenAppointments}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-full bg-white hover:bg-gray-50 text-[#101F50] transition-all cursor-pointer border border-gray-200 shadow-2xs"
                id="btn-my-appointments"
              >
                <Calendar className="w-3.5 h-3.5 text-[#008C78]" />
                <span>Appointments</span>
              </button>
              <button
                onClick={onLogoutUser}
                title="Sign out"
                className="p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                id="btn-logout-user"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
              id="btn-patient-signin"
            >
              <User className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Quick Call Pill with Secondary Red Circle Icon */}
          <a
            href={`tel:${CLINIC_INFO.phone}`}
            className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white hover:bg-gray-50 text-[#101F50] font-bold text-xs border border-gray-200 shadow-2xs transition-all cursor-pointer group"
            id="btn-nav-call-now"
          >
            <div className="w-6 h-6 rounded-full bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
              <Phone className="w-3 h-3 fill-current" />
            </div>
            <span>Call Now</span>
          </a>

          {/* Secondary Color Red Gradient "Book Visit" Button */}
          <button
            onClick={onOpenBooking}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-red-600 via-rose-600 to-red-600 hover:from-red-700 hover:to-rose-700 text-white font-extrabold text-xs shadow-md shadow-red-600/25 hover:shadow-lg hover:shadow-red-600/35 transition-all cursor-pointer transform hover:-translate-y-0.5"
          >
            <Calendar className="w-3.5 h-3.5 text-white/90" />
            <span>Book Visit</span>
            <ArrowUpRight className="w-3.5 h-3.5 text-white/80" />
          </button>

          {/* Mobile Direct Call & Hamburger Menu Button */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full bg-white border border-gray-200 text-[#101F50] hover:bg-gray-50 shadow-2xs transition-colors cursor-pointer"
              id="btn-mobile-menu-toggle"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-red-600" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

      </div>

      {/* Mobile Menu Dropdown with Secondary Red Styling */}
      {mobileMenuOpen && (
        <div className="lg:hidden border border-gray-200 bg-white/95 backdrop-blur-2xl px-5 py-4 space-y-3 animate-in slide-in-from-top duration-200 shadow-xl mt-2 mx-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-[#008C78]"></div>

          <div className="flex flex-col space-y-1 text-sm font-bold text-[#101F50]">
            {navItems.map((item) => (
              <button 
                key={item.id}
                onClick={() => scrollTo(item.targetId, item.id)} 
                className={`text-left py-2 px-3 rounded-xl transition-colors flex items-center justify-between ${
                  activeNav === item.id ? 'bg-red-50 text-red-600' : 'hover:bg-gray-50'
                }`}
              >
                <span>{item.label}</span>
                {activeNav === item.id && <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            <a
              href={`tel:${CLINIC_INFO.phone}`}
              className="w-full py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-[#101F50] border border-gray-200 text-xs font-bold flex items-center justify-center gap-2"
            >
              <Phone className="w-3.5 h-3.5 text-red-600 fill-current" />
              <span>Direct Reception ({CLINIC_INFO.phone})</span>
            </a>

            <button
              onClick={() => { setMobileMenuOpen(false); onOpenBooking(); }}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 text-white text-xs font-extrabold shadow-md shadow-red-600/25 text-center flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Book Doctor Consultation</span>
            </button>

            {user ? (
              <div className="pt-1 flex items-center justify-between text-xs">
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenAppointments(); }}
                  className="font-bold text-[#008C78]"
                >
                  My Appointments
                </button>
                <button
                  onClick={() => { setMobileMenuOpen(false); onLogoutUser(); }}
                  className="text-red-600 font-semibold"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
                className="py-1.5 text-center text-xs text-gray-500 font-semibold hover:text-red-600"
              >
                Patient Sign In
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
