import { useEffect, useState, useCallback } from 'react';
import {
  CalendarDays, Plus, Activity, Trash2, Stethoscope, Clock, User, X,
  CheckCircle2, AlertCircle, Hourglass, FileText, Filter
} from 'lucide-react';
import { supabase, type Appointment, type Doctor } from '@/lib/supabase';

const STATUS_OPTIONS = ['Pending', 'Confirmed', 'Completed', 'Cancelled'] as const;
type StatusOption = (typeof STATUS_OPTIONS)[number];

const statusStyles: Record<string, { bg: string; text: string; icon: typeof Hourglass }> = {
  Pending:    { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: Hourglass },
  Confirmed:  { bg: 'bg-blue-50 border-blue-200', text: 'text-blue-700', icon: CheckCircle2 },
  Completed:  { bg: 'bg-teal-50 border-teal-200', text: 'text-teal-700', icon: CheckCircle2 },
  Cancelled:  { bg: 'bg-red-50 border-red-200', text: 'text-red-600', icon: X },
};

export default function Appointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [prescriptionDraft, setPrescriptionDraft] = useState('');

  // Form state
  const [form, setForm] = useState({
    patient_name: '',
    patient_age: '',
    doctor_name: '',
    appointment_date: '',
    symptoms: '',
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const availableDoctors = doctors.filter((d) => d.availability === 'Available');

  const fetchAppointments = useCallback(async () => {
    const { data, error } = await supabase
      .from('Appointments')
      .select('*')
      .order('appointment_date', { ascending: false });
    if (error) {
      console.error('Error fetching appointments:', error.message);
    } else if (data) {
      setAppointments(data as Appointment[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data } = await supabase.from('Doctors').select('*').order('name');
      if (data) setDoctors(data as Doctor[]);
    };
    fetchDoctors();
    fetchAppointments();

    const channel = supabase
      .channel('appointments_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Appointments' }, () => fetchAppointments())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAppointments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.patient_name.trim() || !form.patient_age || !form.doctor_name || !form.appointment_date) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const age = parseInt(form.patient_age, 10);
    if (isNaN(age) || age < 0 || age > 150) {
      setFormError('Please enter a valid patient age.');
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from('Appointments').insert({
      patient_name: form.patient_name.trim(),
      patient_age: age,
      doctor_name: form.doctor_name,
      appointment_date: form.appointment_date,
      symptoms: form.symptoms.trim() || null,
      status: 'Pending',
      prescription: null,
    });

    if (error) {
      setFormError(error.message);
      setSubmitting(false);
      return;
    }

    // Reset form
    setForm({ patient_name: '', patient_age: '', doctor_name: '', appointment_date: '', symptoms: '' });
    setSubmitting(false);
    setShowForm(false);
    fetchAppointments();
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('Appointments').update({ status }).eq('id', id);
    if (error) {
      console.error('Error updating status:', error.message);
    } else {
      fetchAppointments();
    }
  };

  const savePrescription = async (id: string) => {
    const { error } = await supabase
      .from('Appointments')
      .update({ prescription: prescriptionDraft.trim() || null })
      .eq('id', id);
    if (error) {
      console.error('Error saving prescription:', error.message);
    } else {
      setEditingId(null);
      setPrescriptionDraft('');
      fetchAppointments();
    }
  };

  const deleteAppointment = async (id: string) => {
    const { error } = await supabase.from('Appointments').delete().eq('id', id);
    if (error) {
      console.error('Error deleting appointment:', error.message);
    } else {
      fetchAppointments();
    }
  };

  const filteredAppointments = filterStatus === 'All'
    ? appointments
    : appointments.filter((a) => a.status === filterStatus);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Activity className="w-8 h-8 text-teal-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Appointments</h2>
          <p className="text-slate-500 mt-1">Book and manage patient appointments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Book Appointment
        </button>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-3">
        <div className="relative w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full pl-10 pr-8 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all appearance-none cursor-pointer"
          >
            <option value="All">All Status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <span className="text-sm text-slate-500">
          {filteredAppointments.length} appointment{filteredAppointments.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Appointment list */}
      {filteredAppointments.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <CalendarDays className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No appointments found. Book one to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((appt) => {
            const statusInfo = statusStyles[appt.status] ?? statusStyles['Pending'];
            const StatusIcon = statusInfo.icon;
            const isEditing = editingId === appt.id;

            return (
              <div
                key={appt.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  {/* Patient info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-900">{appt.patient_name}</h3>
                      <span className="text-sm text-slate-400">Age {appt.patient_age}</span>
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${statusInfo.bg} ${statusInfo.text}`}>
                        <StatusIcon className="w-3 h-3" />
                        {appt.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-slate-500 flex-wrap">
                      <span className="flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4" />
                        {appt.doctor_name}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <CalendarDays className="w-4 h-4" />
                        {new Date(appt.appointment_date).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })}
                      </span>
                    </div>
                    {appt.symptoms && (
                      <p className="mt-2 text-sm text-slate-600">
                        <span className="font-medium text-slate-500">Symptoms: </span>
                        {appt.symptoms}
                      </p>
                    )}

                    {/* Prescription display / edit */}
                    {isEditing ? (
                      <div className="mt-3 space-y-2">
                        <textarea
                          value={prescriptionDraft}
                          onChange={(e) => setPrescriptionDraft(e.target.value)}
                          rows={3}
                          placeholder="Write prescription details..."
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => savePrescription(appt.id)}
                            className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setPrescriptionDraft(''); }}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-sm font-medium rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : appt.prescription ? (
                      <div className="mt-3 p-3 bg-teal-50/50 border border-teal-100 rounded-lg">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-teal-700 mb-1">
                          <FileText className="w-3.5 h-3.5" />
                          PRESCRIPTION
                        </div>
                        <p className="text-sm text-slate-700">{appt.prescription}</p>
                      </div>
                    ) : null}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={appt.status}
                      onChange={(e) => updateStatus(appt.id, e.target.value)}
                      className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all cursor-pointer"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setEditingId(appt.id);
                        setPrescriptionDraft(appt.prescription ?? '');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-sm font-medium rounded-lg transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      {appt.prescription ? 'Edit Rx' : 'Add Rx'}
                    </button>
                    <button
                      onClick={() => deleteAppointment(appt.id)}
                      className="flex items-center justify-center w-9 h-9 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                      aria-label="Delete appointment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Booking modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowForm(false)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600">
                  <CalendarDays className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Book Appointment</h3>
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Patient Name" required>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={form.patient_name}
                      onChange={(e) => setForm({ ...form, patient_name: e.target.value })}
                      placeholder="John Doe"
                      className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                    />
                  </div>
                </FormField>

                <FormField label="Patient Age" required>
                  <input
                    type="number"
                    min="0"
                    max="150"
                    value={form.patient_age}
                    onChange={(e) => setForm({ ...form, patient_age: e.target.value })}
                    placeholder="35"
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                  />
                </FormField>
              </div>

              <FormField label="Select Doctor" required>
                <div className="relative">
                  <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <select
                    value={form.doctor_name}
                    onChange={(e) => setForm({ ...form, doctor_name: e.target.value })}
                    className="w-full pl-10 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all appearance-none cursor-pointer"
                  >
                    <option value="">Choose a doctor...</option>
                    {availableDoctors.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} — {d.specialisation}
                      </option>
                    ))}
                  </select>
                </div>
                {availableDoctors.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">No doctors currently available.</p>
                )}
              </FormField>

              <FormField label="Appointment Date" required>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type="date"
                    value={form.appointment_date}
                    onChange={(e) => setForm({ ...form, appointment_date: e.target.value })}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
                  />
                </div>
              </FormField>

              <FormField label="Symptoms">
                <textarea
                  value={form.symptoms}
                  onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
                  rows={3}
                  placeholder="Describe the patient's symptoms..."
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all resize-none"
                />
              </FormField>

              {formError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 disabled:opacity-50 text-white font-semibold rounded-xl shadow-lg shadow-teal-500/20 transition-all"
                >
                  {submitting ? <Activity className="w-5 h-5 animate-pulse" /> : <>
                    <Plus className="w-5 h-5" />
                    Book Now
                  </>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}
