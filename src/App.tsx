import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { HeroSection } from './components/HeroSection';
import { ServicesSection } from './components/ServicesSection';
import { FeaturedDoctorSection } from './components/FeaturedDoctorSection';
import { ReviewsSection } from './components/ReviewsSection';
import { AppointmentAndContactSection } from './components/AppointmentAndContactSection';
import { EmergencySection } from './components/EmergencySection';
import { Footer } from './components/Footer';

// Modals
import { AuthModal } from './components/AuthModal';
import { UserAppointmentsModal } from './components/UserAppointmentsModal';
import { LeaveFeedbackModal } from './components/LeaveFeedbackModal';
import { ServiceDetailModal } from './components/ServiceDetailModal';
import { AdminLoginModal } from './components/admin/AdminLoginModal';
import { AdminDashboard } from './components/admin/AdminDashboard';

// Data & API
import { api } from './services/api';
import { User, AdminUser, ClinicService, FeedbackItem, Appointment } from './types';

export function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<AdminUser | null>(null);
  const [showAdminView, setShowAdminView] = useState<boolean>(false);

  // Reviews state
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);

  // Modals visibility
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userAppointmentsOpen, setUserAppointmentsOpen] = useState(false);
  const [leaveFeedbackOpen, setLeaveFeedbackOpen] = useState(false);
  const [adminLoginOpen, setAdminLoginOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ClinicService | null>(null);

  // Booking prefill state
  const [prefilledServiceId, setPrefilledServiceId] = useState<string | undefined>(undefined);

  // Check existing sessions on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const user = await api.getMe();
        if (user) setCurrentUser(user);
      } catch (e) {
        // no user session
      }

      try {
        const admin = await api.getAdminMe();
        if (admin) {
          setCurrentAdmin(admin);
        }
      } catch (e) {
        // no admin session
      }

      try {
        const reviews = await api.getFeedback();
        setFeedbackList(reviews);
      } catch (e) {
        console.error('Failed to load reviews:', e);
      }
    };

    initAuth();
  }, []);

  const scrollToAppointment = () => {
    const el = document.getElementById('appointment');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSelectServiceForBooking = (service: ClinicService) => {
    setPrefilledServiceId(service.id);
    scrollToAppointment();
  };

  const handleUserLogout = () => {
    api.logoutUser();
    setCurrentUser(null);
  };

  const handleAdminLogout = async () => {
    await api.logoutAdmin();
    setCurrentAdmin(null);
    setShowAdminView(false);
  };

  const handleAdminLoginSuccess = (admin: AdminUser) => {
    setCurrentAdmin(admin);
    setShowAdminView(true);
  };

  // If Admin view is active and authenticated, show full Admin Dashboard
  if (showAdminView && currentAdmin) {
    return (
      <AdminDashboard
        admin={currentAdmin}
        onLogout={handleAdminLogout}
        onReturnToSite={() => setShowAdminView(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#53616A] flex flex-col font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#008C78]/20 selection:text-[#0B1740]">
      
      {/* If admin is currently logged in, show small top bar offering switch to Admin Panel */}
      {currentAdmin && (
        <div className="bg-[#101F50] text-white py-1.5 px-4 text-xs font-semibold flex items-center justify-between z-50">
          <span>Logged in as Clinic Admin ({currentAdmin.email})</span>
          <button
            onClick={() => setShowAdminView(true)}
            className="px-3 py-0.5 rounded-full bg-[#008C78] text-white font-bold hover:bg-[#087C72] transition-colors cursor-pointer"
          >
            Open Admin Dashboard &rarr;
          </button>
        </div>
      )}

      {/* Main Public Header / Navbar */}
      <Navbar
        user={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenAppointments={() => setUserAppointmentsOpen(true)}
        onLogoutUser={handleUserLogout}
        onOpenBooking={scrollToAppointment}
      />

      <main className="flex-1">
        {/* Hero Section */}
        <HeroSection
          onBookClick={scrollToAppointment}
          onExploreClick={() => {
            const el = document.getElementById('services');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* Services Section (Glassmorphic cards, images added, 3D animation) */}
        <ServicesSection
          onSelectServiceForBooking={handleSelectServiceForBooking}
          onOpenServiceDetails={(service) => setSelectedService(service)}
        />

        {/* Lead Doctor Full-width Highlight (About Section) */}
        <FeaturedDoctorSection onBookClick={scrollToAppointment} />

        {/* Reviews Section */}
        <ReviewsSection
          feedbackList={feedbackList}
          onOpenLeaveFeedback={() => setLeaveFeedbackOpen(true)}
        />

        {/* Emergency & Urgent Support Bar */}
        <EmergencySection />

        {/* Fast & Easy Clinical Scheduling AND Get in Touch as ONE unified section */}
        <AppointmentAndContactSection
          initialServiceId={prefilledServiceId}
          onAppointmentCreated={(apt: Appointment) => {
            // Real appointment stored in SQLite database
          }}
        />
      </main>

      {/* Footer with Medical Staff Portal Link */}
      <Footer
        onOpenAdminLogin={() => {
          if (currentAdmin) {
            setShowAdminView(true);
          } else {
            setAdminLoginOpen(true);
          }
        }}
        onOpenBooking={scrollToAppointment}
      />

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={(user) => setCurrentUser(user)}
      />

      <UserAppointmentsModal
        isOpen={userAppointmentsOpen}
        onClose={() => setUserAppointmentsOpen(false)}
        userEmail={currentUser?.email || ''}
        onOpenBooking={scrollToAppointment}
      />

      <LeaveFeedbackModal
        isOpen={leaveFeedbackOpen}
        onClose={() => setLeaveFeedbackOpen(false)}
        onFeedbackAdded={(newFb) => {
          setFeedbackList((prev) => [newFb, ...prev]);
        }}
      />

      <ServiceDetailModal
        service={selectedService}
        onClose={() => setSelectedService(null)}
        onBookThisService={(srv) => handleSelectServiceForBooking(srv)}
      />

      <AdminLoginModal
        isOpen={adminLoginOpen}
        onClose={() => setAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
      />

    </div>
  );
}
export default App;
