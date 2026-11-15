import { useEffect, useState, useMemo } from 'react';
import { Search, Stethoscope, Clock, Activity, Filter, CheckCircle2, XCircle } from 'lucide-react';
import { supabase, type Doctor } from '@/lib/supabase';

export default function DoctorDirectory() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [specialisation, setSpecialisation] = useState('All');

  useEffect(() => {
    const fetchDoctors = async () => {
      const { data, error } = await supabase
        .from('Doctors')
        .select('*')
        .order('name');
      if (error) {
        console.error('Error fetching doctors:', error.message);
      } else if (data) {
        setDoctors(data as Doctor[]);
      }
      setLoading(false);
    };
    fetchDoctors();
  }, []);

  const specialisations = useMemo(() => {
    const set = new Set(doctors.map((d) => d.specialisation));
    return ['All', ...Array.from(set).sort()];
  }, [doctors]);

  const filtered = useMemo(() => {
    return doctors.filter((d) => {
      const matchesSearch =
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialisation.toLowerCase().includes(search.toLowerCase());
      const matchesSpec = specialisation === 'All' || d.specialisation === specialisation;
      return matchesSearch && matchesSpec;
    });
  }, [doctors, search, specialisation]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Activity className="w-8 h-8 text-teal-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Doctor Directory</h2>
        <p className="text-slate-500 mt-1">Find and connect with our medical specialists</p>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or specialisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all"
          />
        </div>
        <div className="relative sm:w-56">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          <select
            value={specialisation}
            onChange={(e) => setSpecialisation(e.target.value)}
            className="w-full pl-11 pr-8 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-500 transition-all appearance-none cursor-pointer"
          >
            {specialisations.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-slate-500">
        {filtered.length} doctor{filtered.length !== 1 ? 's' : ''} found
      </p>

      {/* Doctor cards */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
          <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No doctors match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doctor) => {
            const isAvailable = doctor.availability === 'Available';
            return (
              <div
                key={doctor.id}
                className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-lg hover:border-teal-200 transition-all group"
              >
                {/* Avatar + status */}
                <div className="flex items-start gap-4 mb-4">
                  <div className={`flex items-center justify-center w-14 h-14 rounded-2xl text-white font-bold text-lg shadow-md transition-transform group-hover:scale-105 ${
                    isAvailable ? 'bg-gradient-to-br from-teal-400 to-cyan-600' : 'bg-gradient-to-br from-slate-400 to-slate-500'
                  }`}>
                    {doctor.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{doctor.name}</h3>
                    <p className="text-sm text-teal-600 font-medium">{doctor.specialisation}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${
                    isAvailable ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isAvailable ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                    {doctor.availability}
                  </span>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-2 text-sm text-slate-500 pt-4 border-t border-slate-100">
                  <Clock className="w-4 h-4" />
                  <span>{doctor.experience} year{doctor.experience !== 1 ? 's' : ''} of experience</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
