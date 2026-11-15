import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Doctor = {
  id: string;
  name: string;
  specialisation: string;
  experience: number;
  availability: string;
};

export type Appointment = {
  id: string;
  patient_name: string;
  patient_age: number;
  doctor_name: string;
  appointment_date: string;
  symptoms: string | null;
  status: string;
  prescription: string | null;
};

export type HospitalBed = {
  id: string;
  ward_type: string;
  total_beds: number;
  available_beds: number;
};
