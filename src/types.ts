export type AppointmentStatus = 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled';

export interface AppointmentAttachment {
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

export interface Appointment {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  appointmentType: string;
  doctor: string;
  preferredDate: string;
  preferredTime: string;
  message?: string;
  attachments?: AppointmentAttachment[];
  status: AppointmentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: 'patient';
  createdAt: string;
}

export interface AdminUser {
  email: string;
  name: string;
  role: 'superadmin' | 'admin';
  clinic?: string;
  isOneTimeSession?: boolean;
}

export interface ActivityLog {
  id: string;
  type: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface FeedbackItem {
  id: string;
  patientName: string;
  rating: number;
  category: string;
  comment: string;
  createdAt: string;
}

export interface ContactInquiry {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  status: 'New' | 'Replied' | 'Archived';
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  specialty: string;
  experience: string;
  degrees: string;
  bio: string;
  photoUrl: string;
  badge?: string;
  treatmentsCount?: string;
}

export interface ClinicService {
  id: string;
  title: string;
  category: string;
  tagline: string;
  shortDesc: string;
  fullDesc: string;
  benefits: string[];
  icon: string;
  doctorName: string;
  estimatedDuration: string;
  imageUrl?: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  category: string;
  treatmentType: string;
  duration: string;
  summary: string;
  tags: string[];
}

export interface BlogPost {
  id: string;
  title: string;
  category: string;
  date: string;
  readTime: string;
  excerpt: string;
  author: string;
  content: string;
}
