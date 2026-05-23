import { useState } from "react";
import { Link } from "wouter";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, LogOut, User, Phone, Mail, Star, Calendar,
  Clock, Scissors, Edit2, CheckCircle, Loader2, ImageIcon,
  Briefcase, Building, Sparkles, FileText
} from "lucide-react";

export default function StaffDashboard() {
  const { staff, isLoading, isAuthenticated, logout, apiHeaders } = useStaffAuth();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({
    name: "",
    role: "",
    email: "",
    experience: "",
    specialties: "",
    bio: "",
  });

  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ["/api/staff/bookings"],
    queryFn: async () => {
      const res = await fetch("/api/staff/bookings", { headers: apiHeaders() });
      if (!res.ok) throw new Error("Failed to fetch bookings");
      return await res.json();
    },
    enabled: isAuthenticated,
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/staff/profile", {
        method: "PUT",
        headers: { ...apiHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return await res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile updated!", description: "Your changes have been saved." });
      setEditMode(false);
    },
    onError: (error: Error) => {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAuthenticated || !staff) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Please Login</h2>
          <p className="text-gray-500 mb-6">You need to login as staff to access the dashboard.</p>
          <Link href="/staff-login">
            <Button className="bg-gradient-to-r from-indigo-600 to-pink-500 text-white">
              Go to Staff Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const startEdit = () => {
    setForm({
      name: staff.name || "",
      role: staff.role || "",
      email: staff.email || "",
      experience: staff.experience || "",
      specialties: staff.specialties?.join(", ") || "",
      bio: staff.bio || "",
    });
    setEditMode(true);
  };

  const saveProfile = () => {
    const updates: any = {
      name: form.name,
      role: form.role,
      email: form.email || null,
      experience: form.experience || null,
      specialties: form.specialties ? form.specialties.split(",").map((s) => s.trim()).filter(Boolean) : null,
      bio: form.bio || null,
    };
    updateProfileMutation.mutate(updates);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-pink-500 text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          <Link href="/"><ArrowLeft className="w-5 h-5" /></Link>
          <span className="font-semibold">Staff Dashboard</span>
          <button onClick={logout} className="p-2 hover:bg-white/20 rounded-full transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-500/10 to-pink-500/10 p-6 flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shrink-0">
              {staff.photoUrl ? (
                <img src={staff.photoUrl} alt={staff.name} className="w-full h-full rounded-full object-cover" />
              ) : (
                staff.name?.charAt(0).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold text-gray-900 truncate">{staff.name}</h2>
              <p className="text-sm text-indigo-600 font-medium">{staff.role}</p>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                <span className="text-sm text-gray-600">{staff.rating || "0"} ({staff.totalReviews || 0} reviews)</span>
              </div>
            </div>
            {!editMode && (
              <button onClick={startEdit} className="p-2 hover:bg-gray-100 rounded-full transition">
                <Edit2 className="w-4 h-4 text-gray-500" />
              </button>
            )}
          </div>

          {editMode ? (
            <div className="p-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500">Name</label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Role</label>
                <Input value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Email</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Optional" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Experience</label>
                <Input value={form.experience} onChange={(e) => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 5+ years" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Specialties (comma separated)</label>
                <Input value={form.specialties} onChange={(e) => setForm({ ...form, specialties: e.target.value })} placeholder="Haircut, Coloring, Styling" />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Bio</label>
                <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Tell customers about yourself..." />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={saveProfile}
                  disabled={updateProfileMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-indigo-600 to-pink-500 text-white"
                >
                  {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-1" />}
                  Save
                </Button>
                <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-700">{staff.phone}</span>
              </div>
              {staff.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700">{staff.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Building className="w-4 h-4 text-gray-400 shrink-0" />
                <span className="text-gray-700">{staff.salonName || "Sanwar Salon"}</span>
              </div>
              {staff.experience && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="text-gray-700">{staff.experience}</span>
                </div>
              )}
              {staff.specialties && staff.specialties.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {staff.specialties.map((s) => (
                    <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                      {s}
                    </span>
                  ))}
                </div>
              )}
              {staff.bio && (
                <div className="pt-2 border-t">
                  <p className="text-sm text-gray-600 leading-relaxed">{staff.bio}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-gray-900">Upcoming Bookings</h3>
            <span className="ml-auto text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
              {bookings?.length || 0}
            </span>
          </div>

          {bookingsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
          ) : bookings && bookings.length > 0 ? (
            <div className="space-y-3">
              {bookings.map((booking: any) => (
                <div key={booking.id} className="border rounded-xl p-3 hover:bg-gray-50 transition">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm text-gray-900">{booking.customerName}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <Clock className="w-3 h-3" />
                        {booking.date} at {booking.time}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      booking.status === "confirmed"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  {booking.notes && (
                    <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      {booking.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Scissors className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No upcoming bookings</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
