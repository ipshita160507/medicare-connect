import { useEffect, useState, useCallback } from 'react';
import { BedDouble, AlertTriangle, TrendingUp, Users, CalendarDays, Activity, Plus, Minus, HeartPulse } from 'lucide-react';
import { supabase, type HospitalBed } from '@/lib/supabase';

export default function Dashboard() {
  const [beds, setBeds] = useState<HospitalBed[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [stats, setStats] = useState({ totalDoctors: 0, totalAppointments: 0, pendingAppointments: 0 });

  const fetchBeds = useCallback(async () => {
    const { data, error } = await supabase.from('Hospital_beds').select('*').order('ward_type');
    if (error) {
      console.error('Error fetching beds:', error.message);
    } else if (data) {
      setBeds(data as HospitalBed[]);
    }
    setLoading(false);
  }, []);

  const fetchStats = useCallback(async () => {
    const [{ count: doctorCount }, { count: apptCount }] = await Promise.all([
      supabase.from('Doctors').select('*', { count: 'exact', head: true }),
      supabase.from('Appointments').select('*', { count: 'exact', head: true }),
    ]);
    const { count: pendingCount } = await supabase
      .from('Appointments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending');
    setStats({
      totalDoctors: doctorCount ?? 0,
      totalAppointments: apptCount ?? 0,
      pendingAppointments: pendingCount ?? 0,
    });
  }, []);

  useEffect(() => {
    fetchBeds();
    fetchStats();

    const channel = supabase
      .channel('hospital_beds_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Hospital_beds' }, () => fetchBeds())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchBeds, fetchStats]);

  const updateBeds = async (id: string, delta: number) => {
    const bed = beds.find((b) => b.id === id);
    if (!bed) return;
    const newAvailable = Math.max(0, Math.min(bed.total_beds, bed.available_beds + delta));
    if (newAvailable === bed.available_beds) return;

    setUpdatingId(id);
    const { error } = await supabase
      .from('Hospital_beds')
      .update({ available_beds: newAvailable })
      .eq('id', id);

    if (error) {
      console.error('Error updating beds:', error.message);
    } else {
      setBeds((prev) =>
        prev.map((b) => (b.id === id ? { ...b, available_beds: newAvailable } : b))
      );
    }
    setUpdatingId(null);
  };

  const totalBeds = beds.reduce((sum, b) => sum + b.total_beds, 0);
  const totalAvailable = beds.reduce((sum, b) => sum + b.available_beds, 0);
  const criticalWards = beds.filter((b) => b.available_beds < 3).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Activity className="w-8 h-8 text-teal-500 animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
        <p className="text-slate-500 mt-1">Real-time overview of hospital operations</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BedDouble className="w-6 h-6" />}
          label="Total Beds"
          value={totalBeds}
          accent="from-blue-500 to-blue-600"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6" />}
          label="Available Beds"
          value={totalAvailable}
          accent="from-teal-500 to-emerald-600"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Total Doctors"
          value={stats.totalDoctors}
          accent="from-cyan-500 to-sky-600"
        />
        <StatCard
          icon={<CalendarDays className="w-6 h-6" />}
          label="Pending Appointments"
          value={stats.pendingAppointments}
          accent="from-amber-500 to-orange-600"
        />
      </div>

      {/* Emergency Bed Tracker */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-red-50">
              <HeartPulse className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Emergency Bed Tracker</h3>
              <p className="text-sm text-slate-500">Live bed availability across all wards</p>
            </div>
          </div>
          {criticalWards > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 border border-red-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-semibold text-red-600">{criticalWards} ward{criticalWards > 1 ? 's' : ''} critical</span>
            </div>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {beds.map((bed) => {
            const isCritical = bed.available_beds < 3;
            const occupancy = bed.total_beds > 0 ? Math.round(((bed.total_beds - bed.available_beds) / bed.total_beds) * 100) : 0;

            return (
              <div key={bed.id} className="px-6 py-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-semibold text-slate-900">{bed.ward_type}</span>
                      {isCritical && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          CRITICAL LOW
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      <span>{bed.available_beds} of {bed.total_beds} available</span>
                      <span>{occupancy}% occupied</span>
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCritical ? 'bg-red-500' : occupancy > 80 ? 'bg-amber-500' : 'bg-teal-500'
                        }`}
                        style={{ width: `${occupancy}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateBeds(bed.id, -1)}
                      disabled={updatingId === bed.id || bed.available_beds === 0}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Decrease available beds"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-12 text-center text-lg font-bold text-slate-900 tabular-nums">
                      {bed.available_beds}
                    </span>
                    <button
                      onClick={() => updateBeds(bed.id, 1)}
                      disabled={updatingId === bed.id || bed.available_beds === bed.total_beds}
                      className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-teal-50 text-slate-600 hover:text-teal-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      aria-label="Increase available beds"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg mb-3`}>
        {icon}
      </div>
      <div className="text-3xl font-bold text-slate-900 tabular-nums">{value}</div>
      <div className="text-sm text-slate-500 mt-1">{label}</div>
    </div>
  );
}
