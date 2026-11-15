/*
# MediCare Connect — Create core hospital tables

1. New Tables
- `Doctors` (id, name, specialisation, experience, availability) — stores doctor profiles for the directory.
- `Appointments` (id, patient_name, patient_age, doctor_name, appointment_date, symptoms, status, prescription) — stores patient appointment bookings.
- `Hospital_beds` (id, ward_type, total_beds, available_beds) — stores per-ward bed availability for the emergency tracker.

2. Security
- Enable RLS on all three tables.
- Grant CRUD to `authenticated` only (the app requires sign-in via Supabase Auth).
- All authenticated staff share the hospital data (not per-user isolation), so policies use `USING (true)` with `TO authenticated` — this is intentional shared data, not an ownership shortcut.

3. Seed Data
- Inserts sample doctors across several specialisations.
- Inserts sample hospital beds across several ward types.
- Appointments table starts empty; users create bookings through the app.

4. Important Notes
- Table and column names are case-sensitive as specified by the user (PascalCase for Doctors/Appointments, snake_case for Hospital_beds).
- `status` defaults to 'Pending' for new appointments.
- `prescription` is nullable until a doctor writes one.
*/

-- ===== Doctors table =====
CREATE TABLE IF NOT EXISTS "Doctors" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  specialisation text NOT NULL,
  experience integer NOT NULL DEFAULT 0,
  availability text NOT NULL DEFAULT 'Available'
);

ALTER TABLE "Doctors" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON "Doctors" TO authenticated;

DROP POLICY IF EXISTS "doctors_select" ON "Doctors";
CREATE POLICY "doctors_select" ON "Doctors" FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "doctors_insert" ON "Doctors";
CREATE POLICY "doctors_insert" ON "Doctors" FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "doctors_update" ON "Doctors";
CREATE POLICY "doctors_update" ON "Doctors" FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "doctors_delete" ON "Doctors";
CREATE POLICY "doctors_delete" ON "Doctors" FOR DELETE
TO authenticated USING (true);

-- ===== Appointments table =====
CREATE TABLE IF NOT EXISTS "Appointments" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name text NOT NULL,
  patient_age integer NOT NULL,
  doctor_name text NOT NULL,
  appointment_date date NOT NULL,
  symptoms text,
  status text NOT NULL DEFAULT 'Pending',
  prescription text
);

ALTER TABLE "Appointments" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON "Appointments" TO authenticated;

DROP POLICY IF EXISTS "appointments_select" ON "Appointments";
CREATE POLICY "appointments_select" ON "Appointments" FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "appointments_insert" ON "Appointments";
CREATE POLICY "appointments_insert" ON "Appointments" FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "appointments_update" ON "Appointments";
CREATE POLICY "appointments_update" ON "Appointments" FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "appointments_delete" ON "Appointments";
CREATE POLICY "appointments_delete" ON "Appointments" FOR DELETE
TO authenticated USING (true);

-- ===== Hospital_beds table =====
CREATE TABLE IF NOT EXISTS "Hospital_beds" (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_type text NOT NULL,
  total_beds integer NOT NULL DEFAULT 0,
  available_beds integer NOT NULL DEFAULT 0
);

ALTER TABLE "Hospital_beds" ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON "Hospital_beds" TO authenticated;

DROP POLICY IF EXISTS "beds_select" ON "Hospital_beds";
CREATE POLICY "beds_select" ON "Hospital_beds" FOR SELECT
TO authenticated USING (true);

DROP POLICY IF EXISTS "beds_insert" ON "Hospital_beds";
CREATE POLICY "beds_insert" ON "Hospital_beds" FOR INSERT
TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "beds_update" ON "Hospital_beds";
CREATE POLICY "beds_update" ON "Hospital_beds" FOR UPDATE
TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "beds_delete" ON "Hospital_beds";
CREATE POLICY "beds_delete" ON "Hospital_beds" FOR DELETE
TO authenticated USING (true);

-- ===== Seed Data =====
-- Doctors
INSERT INTO "Doctors" (name, specialisation, experience, availability) VALUES
('Dr. Sarah Mitchell', 'Cardiology', 12, 'Available'),
('Dr. James Carter', 'Neurology', 8, 'Available'),
('Dr. Emily Rodriguez', 'Pediatrics', 15, 'On Leave'),
('Dr. Michael Chen', 'Orthopedics', 10, 'Available'),
('Dr. Jessica Thompson', 'Dermatology', 6, 'Available'),
('Dr. Robert Singh', 'Emergency Medicine', 18, 'Available'),
('Dr. Amanda Lewis', 'Oncology', 14, 'Available'),
('Dr. David Kim', 'General Surgery', 20, 'On Leave'),
('Dr. Rachel Green', 'Psychiatry', 9, 'Available'),
('Dr. Thomas Baker', 'Cardiology', 7, 'Available')
ON CONFLICT DO NOTHING;

-- Hospital beds
INSERT INTO "Hospital_beds" (ward_type, total_beds, available_beds) VALUES
('ICU', 20, 5),
('General Ward', 50, 22),
('Emergency', 15, 2),
('Pediatric Ward', 12, 7),
('Maternity', 18, 10),
('Cardiac Care', 10, 4)
ON CONFLICT DO NOTHING;
