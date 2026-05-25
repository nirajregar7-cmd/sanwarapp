import { useState, useRef } from "react";
import { Link } from "wouter";
import { useStaffAuth } from "@/hooks/useStaffAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, LogOut, User, Phone, Star, Calendar,
  Clock, Scissors, Edit2, CheckCircle, Loader2, ImageIcon,
  Briefcase, Sparkles, FileText, Camera, Upload, X, Trash2,
  MapPin, Users, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ROLES = [
  "Barber", "Hair Stylist", "Beautician", "Nail Technician",
  "Makeup Artist", "Skin Care Specialist", "Massage Therapist",
  "Mehendi Artist", "Eyebrow Specialist", "Helper / Trainee", "Other",
];

type SkillCat = { label: string; emoji: string; color: string; bg: string; skills: string[] };
const SKILL_CATEGORIES: SkillCat[] = [
  { label: "Haircut & Styling", emoji: "✂️", color: "text-blue-700", bg: "bg-blue-50 border-blue-300", skills: ["Haircut (Men)", "Haircut (Women)", "Hair Styling", "Blow Dry", "Updo / Bridal Hair", "Braiding"] },
  { label: "Hair Treatments", emoji: "💆", color: "text-purple-700", bg: "bg-purple-50 border-purple-300", skills: ["Hair Color", "Highlights / Balayage", "Keratin Treatment", "Straightening / Rebonding", "Hair Spa", "Hair Extensions", "Dandruff Treatment"] },
  { label: "Beard & Grooming", emoji: "🪒", color: "text-amber-700", bg: "bg-amber-50 border-amber-300", skills: ["Beard Styling", "Clean Shave", "Beard Color", "Head Massage", "Ear/Nose Trimming"] },
  { label: "Skin & Face", emoji: "✨", color: "text-pink-700", bg: "bg-pink-50 border-pink-300", skills: ["Facial", "Clean-Up", "Bleach & D-Tan", "Whitening Treatment", "Acne Treatment", "Under Eye Treatment", "Gold/Diamond Facial"] },
  { label: "Makeup", emoji: "💄", color: "text-rose-700", bg: "bg-rose-50 border-rose-300", skills: ["Bridal Makeup", "Party Makeup", "HD Makeup", "Airbrush Makeup", "Engagement Makeup", "Smokey Eye"] },
  { label: "Waxing & Threading", emoji: "🧵", color: "text-yellow-700", bg: "bg-yellow-50 border-yellow-300", skills: ["Full Body Wax", "Arms & Legs Wax", "Threading", "Rica Wax", "Eyebrow Threading"] },
  { label: "Nails", emoji: "💅", color: "text-violet-700", bg: "bg-violet-50 border-violet-300", skills: ["Manicure", "Pedicure", "Nail Art", "Gel Nails", "Acrylic Nails", "Nail Extensions", "Spa Manicure/Pedicure"] },
  { label: "Bridal & Special", emoji: "👰", color: "text-red-700", bg: "bg-red-50 border-red-300", skills: ["Bridal Package", "Mehendi (Hands)", "Mehendi (Hands & Feet)", "Saree Draping", "Pre-Bridal Package"] },
  { label: "Spa & Massage", emoji: "🌿", color: "text-teal-700", bg: "bg-teal-50 border-teal-300", skills: ["Full Body Massage", "Aromatherapy", "Hot Stone Massage", "Body Scrub", "Foot Reflexology", "Body Wrap"] },
  { label: "Eye & Lash", emoji: "👁️", color: "text-indigo-700", bg: "bg-indigo-50 border-indigo-300", skills: ["Eyebrow Shaping", "Eyebrow Tinting", "Lash Extensions", "Lash Lift & Tint", "Eyebrow Lamination"] },
];

async function uploadFile(file: File, endpoint: string): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(endpoint, { method: "POST", body: formData });
  if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || "Upload failed"); }
  return await res.json();
}

export default function StaffDashboard() {
  const { staff, isLoading, isAuthenticated, logout, apiHeaders } = useStaffAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<"profile" | "bookings" | "portfolio">("profile");
  const [editMode, setEditMode] = useState(false);
  const [showAllSkillCats, setShowAllSkillCats] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [localPhotoPreview, setLocalPhotoPreview] = useState<string>("");
  const [localPortfolioPreviews, setLocalPortfolioPreviews] = useState<string[]>([]);

  const [form, setForm] = useState({
    name: "", role: "", city: "", area: "", experience: "",
    comfortableWith: "", currentlyWorking: "", expectedSalary: "",
    employmentType: "", willingToRelocate: false, bio: "",
    skills: [] as string[], profileImageUrl: "",
    portfolioImages: [] as string[], resumeUrl: "", resumeOriginalName: "",
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
    onError: (error: Error) => toast({ title: "Update failed", description: error.message, variant: "destructive" }),
  });

  const startEdit = () => {
    setForm({
      name: staff.name || "",
      role: staff.role || "",
      city: staff.city || "",
      area: staff.area || "",
      experience: staff.experience || "",
      comfortableWith: staff.comfortableWith || "",
      currentlyWorking: staff.currentlyWorking || "",
      expectedSalary: staff.expectedSalary?.toString() || "",
      employmentType: staff.employmentType || "",
      willingToRelocate: staff.willingToRelocate || false,
      bio: staff.bio || "",
      skills: staff.specialties || staff.skills || [],
      profileImageUrl: staff.photoUrl || "",
      portfolioImages: staff.portfolioImages || [],
      resumeUrl: staff.resumeUrl || "",
      resumeOriginalName: staff.resumeOriginalName || "",
    });
    setLocalPhotoPreview(staff.photoUrl || "");
    setLocalPortfolioPreviews(staff.portfolioImages || []);
    setEditMode(true);
  };

  const saveProfile = () => {
    updateProfileMutation.mutate({
      name: form.name, role: form.role, city: form.city, area: form.area,
      experience: form.experience || null,
      comfortableWith: form.comfortableWith || null,
      currentlyWorking: form.currentlyWorking || null,
      expectedSalary: form.expectedSalary ? parseInt(form.expectedSalary) : null,
      employmentType: form.employmentType || null,
      willingToRelocate: form.willingToRelocate,
      bio: form.bio || null,
      specialties: form.skills,
      photoUrl: form.profileImageUrl || null,
      portfolioImages: form.portfolioImages.length > 0 ? form.portfolioImages : null,
      resumeUrl: form.resumeUrl || null,
      resumeOriginalName: form.resumeOriginalName || null,
    });
  };

  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill) ? prev.skills.filter(s => s !== skill) : [...prev.skills, skill],
    }));
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalPhotoPreview(URL.createObjectURL(file));
    setUploadingPhoto(true);
    try {
      const data = await uploadFile(file, "/api/staff-registrations/upload-photo");
      setForm(prev => ({ ...prev, profileImageUrl: data.url }));
      toast({ title: "Photo updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setLocalPhotoPreview(staff.photoUrl || "");
    } finally { setUploadingPhoto(false); }
  };

  const handlePortfolioSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 10 - form.portfolioImages.length;
    const toUpload = files.slice(0, remaining);
    if (!toUpload.length) { toast({ title: "Max 10 photos reached", variant: "destructive" }); return; }
    setUploadingPortfolio(true);
    for (const file of toUpload) {
      const preview = URL.createObjectURL(file);
      setLocalPortfolioPreviews(prev => [...prev, preview]);
      try {
        const data = await uploadFile(file, "/api/staff-registrations/upload-photo");
        setForm(prev => ({ ...prev, portfolioImages: [...prev.portfolioImages, data.url] }));
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        setLocalPortfolioPreviews(prev => prev.slice(0, -1));
      }
    }
    setUploadingPortfolio(false);
  };

  const removePortfolioPhoto = (i: number) => {
    setLocalPortfolioPreviews(prev => prev.filter((_, idx) => idx !== i));
    setForm(prev => ({ ...prev, portfolioImages: prev.portfolioImages.filter((_, idx) => idx !== i) }));
  };

  const handleResumeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const data = await uploadFile(file, "/api/staff-registrations/upload-resume");
      setForm(prev => ({ ...prev, resumeUrl: data.url, resumeOriginalName: data.originalName || file.name }));
      toast({ title: "Resume updated!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploadingResume(false); }
  };

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
            <Button className="bg-gradient-to-r from-indigo-600 to-pink-500 text-white">Go to Staff Login</Button>
          </Link>
        </div>
      </div>
    );
  }

  const displaySkills = staff.specialties || staff.skills || [];
  const displayPortfolio = staff.portfolioImages || [];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-pink-500 text-white px-4 py-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <Link href="/"><ArrowLeft className="w-5 h-5" /></Link>
          <span className="font-bold text-lg">My Dashboard</span>
          <button onClick={logout} className="p-2 hover:bg-white/20 rounded-full transition">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Profile Hero */}
      <div className="bg-gradient-to-r from-indigo-600 to-pink-500 px-4 pb-6 pt-2">
        <div className="max-w-2xl mx-auto flex items-end gap-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-white overflow-hidden bg-white/20 shrink-0">
              {staff.photoUrl ? (
                <img src={staff.photoUrl} alt={staff.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                  {staff.name?.charAt(0).toUpperCase() || "?"}
                </div>
              )}
            </div>
          </div>
          <div className="flex-1 text-white pb-1">
            <h2 className="text-xl font-bold">{staff.name}</h2>
            <p className="text-sm text-white/80">{staff.role}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-white/70">
              <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-white/80 text-white/80" />{staff.rating || "New"}</span>
              {staff.city && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{staff.city}</span>}
            </div>
          </div>
          {!editMode && (
            <button onClick={startEdit} className="mb-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-full text-white text-xs font-medium flex items-center gap-1.5 transition">
              <Edit2 className="w-3.5 h-3.5" /> Edit Profile
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto flex">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "portfolio", label: "Portfolio", icon: ImageIcon },
            { id: "bookings", label: "Bookings", icon: Calendar },
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700"
                }`}
              >
                <Icon className="w-4 h-4" />{tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── PROFILE TAB ── */}
        {activeTab === "profile" && (
          <>
            {editMode ? (
              <div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-gray-800">Edit Profile</h3>
                  <button onClick={() => setEditMode(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Profile Photo</label>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-16 h-16 rounded-full border-2 border-dashed border-indigo-300 overflow-hidden bg-indigo-50 flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors shrink-0"
                      onClick={() => photoInputRef.current?.click()}
                    >
                      {localPhotoPreview ? (
                        <img src={localPhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                      ) : uploadingPhoto ? (
                        <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                      ) : (
                        <Camera className="h-6 w-6 text-indigo-300" />
                      )}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} className="border-indigo-300 text-indigo-600 text-xs">
                      <Upload className="h-3 w-3 mr-1" />
                      {uploadingPhoto ? "Uploading..." : localPhotoPreview ? "Change" : "Upload Photo"}
                    </Button>
                    <input ref={photoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoSelect} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name</label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Role</label>
                    <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select role" /></SelectTrigger>
                      <SelectContent>{ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Experience (yrs)</label>
                    <Input value={form.experience} onChange={e => setForm({ ...form, experience: e.target.value })} placeholder="e.g. 5" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">City</label>
                    <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Area</label>
                    <Input value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Works With</label>
                    <Select value={form.comfortableWith} onValueChange={v => setForm({ ...form, comfortableWith: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Client type" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male Clients">Male Clients</SelectItem>
                        <SelectItem value="Female Clients">Female Clients</SelectItem>
                        <SelectItem value="Unisex">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Availability</label>
                    <Select value={form.currentlyWorking} onValueChange={v => setForm({ ...form, currentlyWorking: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Status" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available Immediately">Available Now</SelectItem>
                        <SelectItem value="Currently Working – Open to Better Offer">Open to Offers</SelectItem>
                        <SelectItem value="Serving Notice Period">In Notice Period</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Expected Salary (₹)</label>
                    <Input type="number" value={form.expectedSalary} onChange={e => setForm({ ...form, expectedSalary: e.target.value })} placeholder="e.g. 20000" className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Job Type</label>
                    <Select value={form.employmentType} onValueChange={v => setForm({ ...form, employmentType: v })}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Bio</label>
                  <Textarea value={form.bio} onChange={e => setForm({ ...form, bio: e.target.value })} rows={3} placeholder="Tell salons about yourself..." />
                </div>

                {/* Skills Editor */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Skills ({form.skills.length} selected)</label>
                    <button onClick={() => setShowAllSkillCats(!showAllSkillCats)} className="text-xs text-indigo-600 flex items-center gap-1">
                      {showAllSkillCats ? <><ChevronUp className="h-3 w-3" />Less</> : <><ChevronDown className="h-3 w-3" />More Skills</>}
                    </button>
                  </div>
                  {form.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {form.skills.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1">
                          {s}<button onClick={() => toggleSkill(s)} className="hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="space-y-2">
                    {(showAllSkillCats ? SKILL_CATEGORIES : SKILL_CATEGORIES.slice(0, 3)).map(cat => (
                      <div key={cat.label}>
                        <p className={`text-xs font-semibold mb-1 ${cat.color}`}>{cat.emoji} {cat.label}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {cat.skills.map(skill => (
                            <button key={skill} type="button" onClick={() => toggleSkill(skill)} className={`px-2.5 py-1 rounded-full border text-xs font-medium transition-all ${
                              form.skills.includes(skill) ? "bg-gradient-to-r from-indigo-600 to-pink-500 text-white border-transparent" : `${cat.bg} ${cat.color} border`
                            }`}>
                              {form.skills.includes(skill) && "✓ "}{skill}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Portfolio Photos */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">
                    Work Photos ({localPortfolioPreviews.length}/10)
                  </label>
                  {localPortfolioPreviews.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {localPortfolioPreviews.map((src, i) => (
                        <div key={i} className="relative group aspect-square">
                          <img src={src} alt={`Work ${i+1}`} className="w-full h-full object-cover rounded-lg border" />
                          <button type="button" onClick={() => removePortfolioPhoto(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Trash2 className="h-2.5 w-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  {localPortfolioPreviews.length < 10 && (
                    <button type="button" onClick={() => portfolioInputRef.current?.click()} disabled={uploadingPortfolio} className="w-full border-2 border-dashed border-gray-300 rounded-xl p-3 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all text-xs text-gray-500 disabled:opacity-50">
                      {uploadingPortfolio ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-indigo-500" /> : <><ImageIcon className="h-4 w-4 mx-auto mb-0.5" />Add Photos</>}
                    </button>
                  )}
                  <input ref={portfolioInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePortfolioSelect} />
                </div>

                {/* Resume */}
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-2">Resume / CV</label>
                  {form.resumeUrl ? (
                    <div className="flex items-center gap-2 p-2.5 bg-green-50 border border-green-200 rounded-xl">
                      <FileText className="h-4 w-4 text-green-600 shrink-0" />
                      <span className="text-xs text-green-700 flex-1 truncate">{form.resumeOriginalName || "Resume uploaded"}</span>
                      <button onClick={() => setForm(prev => ({ ...prev, resumeUrl: "", resumeOriginalName: "" }))} className="text-gray-400 hover:text-red-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume} className="w-full border-2 border-dashed border-gray-300 rounded-xl p-3 text-center hover:border-indigo-400 hover:bg-indigo-50 transition-all text-xs text-gray-500 disabled:opacity-50">
                      {uploadingResume ? <Loader2 className="h-4 w-4 animate-spin mx-auto text-indigo-500" /> : <><FileText className="h-4 w-4 mx-auto mb-0.5" />Upload Resume (PDF/Word)</>}
                    </button>
                  )}
                  <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={handleResumeSelect} />
                </div>

                <div className="flex gap-2 pt-2">
                  <Button onClick={saveProfile} disabled={updateProfileMutation.isPending} className="flex-1 bg-gradient-to-r from-indigo-600 to-pink-500 text-white">
                    {updateProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle className="w-4 h-4 mr-1" />Save Changes</>}
                  </Button>
                  <Button variant="outline" onClick={() => setEditMode(false)} className="flex-1">Cancel</Button>
                </div>
              </div>
            ) : (
              /* View Mode */
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-gray-600 col-span-2">
                      <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                      <span>{staff.phone}</span>
                    </div>
                    {staff.city && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{staff.area ? `${staff.area}, ` : ""}{staff.city}</span>
                      </div>
                    )}
                    {staff.experience && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Briefcase className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{staff.experience} yrs experience</span>
                      </div>
                    )}
                    {staff.comfortableWith && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users className="w-4 h-4 text-gray-400 shrink-0" />
                        <span>{staff.comfortableWith}</span>
                      </div>
                    )}
                    {staff.expectedSalary && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <span className="text-gray-400 font-medium shrink-0">₹</span>
                        <span>₹{parseInt(staff.expectedSalary).toLocaleString("en-IN")}/month</span>
                      </div>
                    )}
                    {staff.currentlyWorking && (
                      <div className="col-span-2">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          staff.currentlyWorking === "Available Immediately" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>{staff.currentlyWorking}</span>
                      </div>
                    )}
                  </div>

                  {staff.bio && (
                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600 leading-relaxed">{staff.bio}</p>
                    </div>
                  )}

                  {displaySkills.length > 0 && (
                    <div className="pt-2 border-t">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Skills</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {displaySkills.map((s: string) => (
                          <span key={s} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {staff.resumeUrl && (
                    <div className="pt-2 border-t">
                      <a href={staff.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-indigo-600 hover:underline">
                        <FileText className="w-4 h-4" />View Resume
                      </a>
                    </div>
                  )}

                  <div className="pt-3 border-t">
                    <Button onClick={startEdit} variant="outline" className="w-full border-indigo-300 text-indigo-600 hover:bg-indigo-50">
                      <Edit2 className="w-4 h-4 mr-2" />Edit My Profile
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── PORTFOLIO TAB ── */}
        {activeTab === "portfolio" && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-indigo-500" />
                My Work Photos
              </h3>
              <span className="text-xs text-gray-400">{displayPortfolio.length}/10 photos</span>
            </div>
            {displayPortfolio.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {displayPortfolio.map((src: string, i: number) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden border shadow-sm">
                    <img src={src} alt={`Work ${i+1}`} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <ImageIcon className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-sm text-gray-400">No portfolio photos yet</p>
                <Button onClick={startEdit} variant="outline" size="sm" className="mt-3 text-indigo-600 border-indigo-300">
                  Add Work Photos
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ── BOOKINGS TAB ── */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-2xl shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <h3 className="font-bold text-gray-800">Upcoming Bookings</h3>
              <span className="ml-auto text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{bookings?.length || 0}</span>
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
                          <Clock className="w-3 h-3" />{booking.date} at {booking.time}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${booking.status === "confirmed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10">
                <Scissors className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-400">No upcoming bookings</p>
              </div>
            )}
          </div>
        )}

        {/* Quick Links */}
        {activeTab === "profile" && !editMode && (
          <div className="grid grid-cols-2 gap-3">
            <Link href="/hire-staff">
              <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition cursor-pointer">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Scissors className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Browse Jobs</p>
                  <p className="text-xs text-gray-400">Find opportunities</p>
                </div>
              </div>
            </Link>
            <Link href="/staff-registration">
              <div className="bg-white rounded-2xl shadow-sm p-4 flex items-center gap-3 hover:shadow-md transition cursor-pointer">
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Full Profile</p>
                  <p className="text-xs text-gray-400">Update registration</p>
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
