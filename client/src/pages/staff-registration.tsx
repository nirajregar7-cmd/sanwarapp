import { useState, useRef, useEffect } from "react";
import PublicNav from "@/components/PublicNav";
import { Link, useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Scissors,
  CheckCircle,
  User,
  Sparkles,
  ImageIcon,
  Camera,
  Upload,
  Trash2,
  Loader2,
  X,
  FileText,
  ChevronRight,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

const PROFESSIONAL_TOKEN_KEY = "sanwar_professional_token";
function getProfessionalToken() { return localStorage.getItem(PROFESSIONAL_TOKEN_KEY); }
function getProfessionalMobile(): string | null {
  const token = getProfessionalToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.mobile || null;
  } catch { return null; }
}

const ROLES = [
  "Barber", "Hair Stylist", "Beautician", "Nail Technician",
  "Makeup Artist", "Skin Care Specialist", "Massage Therapist",
  "Mehendi Artist", "Eyebrow Specialist", "Helper / Trainee", "Other",
];

type SkillCategory = { label: string; emoji: string; color: string; bg: string; skills: string[] };

const SKILL_CATEGORIES: SkillCategory[] = [
  {
    label: "Haircut & Styling",
    emoji: "✂️",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-300 hover:bg-blue-100",
    skills: ["Haircut (Men)", "Haircut (Women)", "Hair Styling", "Blow Dry", "Updo / Bridal Hair", "Braiding"],
  },
  {
    label: "Hair Treatments",
    emoji: "💆",
    color: "text-purple-700",
    bg: "bg-purple-50 border-purple-300 hover:bg-purple-100",
    skills: ["Hair Color", "Highlights / Balayage", "Keratin Treatment", "Straightening / Rebonding", "Hair Spa", "Hair Extensions", "Dandruff Treatment"],
  },
  {
    label: "Beard & Grooming",
    emoji: "🪒",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-300 hover:bg-amber-100",
    skills: ["Beard Styling", "Clean Shave", "Beard Color", "Head Massage", "Ear/Nose Trimming"],
  },
  {
    label: "Skin & Face",
    emoji: "✨",
    color: "text-pink-700",
    bg: "bg-pink-50 border-pink-300 hover:bg-pink-100",
    skills: ["Facial", "Clean-Up", "Bleach & D-Tan", "Whitening Treatment", "Acne Treatment", "Under Eye Treatment", "Gold/Diamond Facial"],
  },
  {
    label: "Makeup",
    emoji: "💄",
    color: "text-rose-700",
    bg: "bg-rose-50 border-rose-300 hover:bg-rose-100",
    skills: ["Bridal Makeup", "Party Makeup", "HD Makeup", "Airbrush Makeup", "Engagement Makeup", "Smokey Eye"],
  },
  {
    label: "Waxing & Threading",
    emoji: "🧵",
    color: "text-yellow-700",
    bg: "bg-yellow-50 border-yellow-300 hover:bg-yellow-100",
    skills: ["Full Body Wax", "Arms & Legs Wax", "Threading", "Rica Wax", "Eyebrow Threading"],
  },
  {
    label: "Nails",
    emoji: "💅",
    color: "text-violet-700",
    bg: "bg-violet-50 border-violet-300 hover:bg-violet-100",
    skills: ["Manicure", "Pedicure", "Nail Art", "Gel Nails", "Acrylic Nails", "Nail Extensions", "Spa Manicure/Pedicure"],
  },
  {
    label: "Bridal & Special",
    emoji: "👰",
    color: "text-red-700",
    bg: "bg-red-50 border-red-300 hover:bg-red-100",
    skills: ["Bridal Package", "Mehendi (Hands)", "Mehendi (Hands & Feet)", "Saree Draping", "Pre-Bridal Package"],
  },
  {
    label: "Spa & Massage",
    emoji: "🌿",
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-300 hover:bg-teal-100",
    skills: ["Full Body Massage", "Aromatherapy", "Hot Stone Massage", "Body Scrub", "Foot Reflexology", "Body Wrap"],
  },
  {
    label: "Eye & Lash",
    emoji: "👁️",
    color: "text-indigo-700",
    bg: "bg-indigo-50 border-indigo-300 hover:bg-indigo-100",
    skills: ["Eyebrow Shaping", "Eyebrow Tinting", "Lash Extensions", "Lash Lift & Tint", "Eyebrow Lamination"],
  },
];

const STEPS = [
  { label: "Basic Info", icon: User },
  { label: "My Skills", icon: Sparkles },
  { label: "Portfolio", icon: ImageIcon },
];

type FormData = {
  fullName: string;
  mobile: string;
  city: string;
  area: string;
  role: string;
  experience: string;
  gender: string;
  comfortableWith: string;
  currentlyWorking: string;
  skills: string[];
  expectedSalary: string;
  employmentType: string;
  willingToRelocate: boolean;
  bio: string;
  profileImageUrl: string;
  portfolioImages: string[];
  resumeUrl: string;
  resumeOriginalName: string;
  headline: string;
};

async function uploadFile(file: File, endpoint: string): Promise<any> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch(endpoint, { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  return await res.json();
}

export default function StaffRegistration() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!getProfessionalToken()) navigate("/professional-login");
  }, []);

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("");
  const [portfolioPreviews, setPortfolioPreviews] = useState<string[]>([]);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingPortfolio, setUploadingPortfolio] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const prefillMobile = getProfessionalMobile() || "";

  const [form, setForm] = useState<FormData>({
    fullName: "", mobile: prefillMobile, city: "", area: "",
    role: "", experience: "", gender: "", comfortableWith: "",
    currentlyWorking: "", skills: [], expectedSalary: "",
    employmentType: "", willingToRelocate: false, bio: "",
    profileImageUrl: "", portfolioImages: [], resumeUrl: "",
    resumeOriginalName: "", headline: "",
  });

  const update = (field: keyof FormData, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  const toggleSkill = (skill: string) => {
    setForm(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const submitMutation = useMutation({
    mutationFn: async (data: any) => apiRequest("POST", "/api/staff-registrations", data),
    onSuccess: () => { setSubmitted(true); setTimeout(() => navigate("/professional-dashboard"), 2500); },
    onError: () => toast({ title: "Submission failed", description: "Please try again.", variant: "destructive" }),
  });

  const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePhotoPreview(URL.createObjectURL(file));
    setUploadingProfile(true);
    try {
      const data = await uploadFile(file, "/api/staff-registrations/upload-photo");
      update("profileImageUrl", data.url);
      toast({ title: "Photo uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setProfilePhotoPreview("");
    } finally { setUploadingProfile(false); }
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
      setPortfolioPreviews(prev => [...prev, preview]);
      try {
        const data = await uploadFile(file, "/api/staff-registrations/upload-photo");
        setForm(prev => ({ ...prev, portfolioImages: [...prev.portfolioImages, data.url] }));
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        setPortfolioPreviews(prev => prev.slice(0, -1));
      }
    }
    setUploadingPortfolio(false);
    toast({ title: `${toUpload.length} photo(s) added!` });
  };

  const removePortfolioPhoto = (i: number) => {
    setPortfolioPreviews(prev => prev.filter((_, idx) => idx !== i));
    setForm(prev => ({ ...prev, portfolioImages: prev.portfolioImages.filter((_, idx) => idx !== i) }));
  };

  const handleResumeSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingResume(true);
    try {
      const data = await uploadFile(file, "/api/staff-registrations/upload-resume");
      update("resumeUrl", data.url);
      update("resumeOriginalName", data.originalName || file.name);
      toast({ title: "Resume uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally { setUploadingResume(false); }
  };

  const handleNext = () => {
    if (step === 0) {
      if (!form.fullName.trim() || !form.mobile.trim() || !form.city.trim() || !form.role) {
        toast({ title: "Please fill all required fields", variant: "destructive" }); return;
      }
    }
    if (step === 1 && form.skills.length === 0) {
      toast({ title: "Select at least one skill", variant: "destructive" }); return;
    }
    setStep(s => s + 1);
  };

  const handleSubmit = () => {
    submitMutation.mutate({
      fullName: form.fullName, mobile: form.mobile, city: form.city,
      area: form.area || form.city, role: form.role,
      experience: form.experience ? parseInt(form.experience) : 0,
      gender: form.gender || null, comfortableWith: form.comfortableWith || null,
      currentlyWorking: form.currentlyWorking || null,
      skills: form.skills, expectedSalary: form.expectedSalary ? parseInt(form.expectedSalary) : null,
      employmentType: form.employmentType || null, willingToRelocate: form.willingToRelocate,
      bio: form.bio || null, profileImageUrl: form.profileImageUrl || null,
      portfolioImages: form.portfolioImages.length > 0 ? form.portfolioImages : null,
      resumeUrl: form.resumeUrl || null,
      headline: form.headline || null,
    });
  };

  const progressPercent = ((step + 1) / STEPS.length) * 100;

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-3">Profile Submitted!</h2>
          <p className="text-gray-600 mb-2">Your professional profile is live on Sanwar.</p>
          <p className="text-gray-500 text-sm mb-8">Salon owners can now find and contact you.</p>
          <Link href="/professional-dashboard">
            <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
              Go to My Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <PublicNav />
      <div className="flex justify-center py-8 px-4">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-3">
              🔥 Get Hired Faster
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-1">
              Sanwar Staff Registration
            </h1>
            <p className="text-gray-500 text-sm">Create your profile in under 1 minute</p>
          </div>

          {/* Step Indicators */}
          <div className="flex items-center justify-between mb-4 px-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    i < step ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
                    : i === step ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg ring-4 ring-blue-200"
                    : "bg-gray-200 text-gray-500"
                  }`}>
                    {i < step ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-blue-600" : "text-gray-400"}`}>{s.label}</span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="h-1.5 bg-gray-200 rounded-full mb-6 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }} />
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl" />

            {/* ── STEP 0: Basic Info ── */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>

                {/* Profile Photo */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">Profile Photo <span className="text-gray-400 font-normal">(recommended)</span></Label>
                  <div className="flex items-center gap-4">
                    <div
                      className="relative w-20 h-20 rounded-full border-4 border-dashed border-blue-300 flex items-center justify-center cursor-pointer hover:border-blue-500 overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 transition-colors shrink-0"
                      onClick={() => profilePhotoInputRef.current?.click()}
                    >
                      {profilePhotoPreview ? (
                        <>
                          <img src={profilePhotoPreview} alt="Profile" className="w-full h-full object-cover" />
                          {uploadingProfile && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setProfilePhotoPreview(""); update("profileImageUrl", ""); }}
                            className="absolute top-0.5 right-0.5 bg-red-500 text-white rounded-full p-0.5 shadow"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </>
                      ) : uploadingProfile ? (
                        <Loader2 className="h-7 w-7 text-blue-400 animate-spin" />
                      ) : (
                        <Camera className="h-7 w-7 text-blue-300" />
                      )}
                    </div>
                    <div>
                      <Button type="button" variant="outline" size="sm" onClick={() => profilePhotoInputRef.current?.click()} disabled={uploadingProfile} className="border-blue-300 text-blue-600">
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        {profilePhotoPreview ? "Change Photo" : "Upload Photo"}
                      </Button>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG · Max 5MB</p>
                    </div>
                    <input ref={profilePhotoInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleProfilePhotoSelect} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Full Name *</Label>
                    <Input placeholder="e.g. Rahul Verma" value={form.fullName} onChange={e => update("fullName", e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Mobile Number *</Label>
                    <Input placeholder="e.g. 9876543210" value={form.mobile} onChange={e => update("mobile", e.target.value)} className="mt-1" type="tel" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">City *</Label>
                      <Input placeholder="e.g. Mumbai" value={form.city} onChange={e => update("city", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Area / Locality</Label>
                      <Input placeholder="e.g. Bandra" value={form.area} onChange={e => update("area", e.target.value)} className="mt-1" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Your Role *</Label>
                    <Select value={form.role} onValueChange={v => update("role", v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="What do you do?" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Experience (Years)</Label>
                      <Input type="number" placeholder="e.g. 4" value={form.experience} onChange={e => update("experience", e.target.value)} className="mt-1" min="0" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Gender</Label>
                      <Select value={form.gender} onValueChange={v => update("gender", v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Work With</Label>
                      <Select value={form.comfortableWith} onValueChange={v => update("comfortableWith", v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Client type" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male Clients">Male Clients</SelectItem>
                          <SelectItem value="Female Clients">Female Clients</SelectItem>
                          <SelectItem value="Unisex">Both (Unisex)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Availability</Label>
                      <Select value={form.currentlyWorking} onValueChange={v => update("currentlyWorking", v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Status" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Available Immediately">Available Now</SelectItem>
                          <SelectItem value="Currently Working – Open to Better Offer">Open to Offers</SelectItem>
                          <SelectItem value="Serving Notice Period">In Notice Period</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Expected Salary (₹/month)</Label>
                      <Input type="number" placeholder="e.g. 20000" value={form.expectedSalary} onChange={e => update("expectedSalary", e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold text-gray-700">Job Type</Label>
                      <Select value={form.employmentType} onValueChange={v => update("employmentType", v)}>
                        <SelectTrigger className="mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Full-time">Full-time</SelectItem>
                          <SelectItem value="Part-time">Part-time</SelectItem>
                          <SelectItem value="Freelance">Freelance</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 1: Skills ── */}
            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Your Skills</h2>
                  <p className="text-sm text-gray-500 mt-0.5">Tap to select all skills you can do · {form.skills.length} selected</p>
                </div>

                {SKILL_CATEGORIES.map(cat => (
                  <div key={cat.label}>
                    <div className="flex items-center gap-1.5 mb-2">
                      <span>{cat.emoji}</span>
                      <h3 className={`text-sm font-semibold ${cat.color}`}>{cat.label}</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {cat.skills.map(skill => {
                        const selected = form.skills.includes(skill);
                        return (
                          <button
                            key={skill}
                            type="button"
                            onClick={() => toggleSkill(skill)}
                            className={`px-3 py-1.5 rounded-full border text-sm font-medium transition-all ${
                              selected
                                ? `bg-gradient-to-r from-blue-600 to-purple-600 text-white border-transparent shadow`
                                : `${cat.bg} ${cat.color} border`
                            }`}
                          >
                            {selected && <span className="mr-1">✓</span>}{skill}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {form.skills.length > 0 && (
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                    <p className="text-xs font-semibold text-blue-700 mb-1.5">Selected skills ({form.skills.length}):</p>
                    <div className="flex flex-wrap gap-1.5">
                      {form.skills.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-white border border-blue-300 rounded-full text-xs text-blue-700 flex items-center gap-1">
                          {s}
                          <button onClick={() => toggleSkill(s)} className="text-blue-400 hover:text-red-500">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 2: Portfolio & Resume ── */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Portfolio & Resume</h2>

                {/* Work Photos */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1 block">
                    Work Photos <span className="text-gray-400 font-normal">({portfolioPreviews.length}/10 uploaded)</span>
                  </Label>

                  {portfolioPreviews.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                      {portfolioPreviews.map((src, i) => (
                        <div key={i} className="relative group aspect-square">
                          <img src={src} alt={`Work ${i+1}`} className="w-full h-full object-cover rounded-xl border-2 border-blue-200" />
                          <button
                            type="button"
                            onClick={() => removePortfolioPhoto(i)}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity shadow"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                      {uploadingPortfolio && (
                        <div className="aspect-square rounded-xl border-2 border-dashed border-blue-300 flex items-center justify-center bg-blue-50">
                          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                        </div>
                      )}
                    </div>
                  )}

                  {portfolioPreviews.length < 10 && (
                    <button
                      type="button"
                      onClick={() => portfolioInputRef.current?.click()}
                      disabled={uploadingPortfolio}
                      className="w-full border-2 border-dashed border-blue-300 rounded-xl p-5 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploadingPortfolio ? (
                        <div className="flex flex-col items-center gap-1.5 text-blue-500">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="text-sm font-medium">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-blue-400">
                          <ImageIcon className="h-7 w-7" />
                          <span className="text-sm font-semibold text-blue-600">Add Work Photos</span>
                          <span className="text-xs text-gray-400">Show your best work · Up to 10 photos · JPG, PNG</span>
                        </div>
                      )}
                    </button>
                  )}
                  <input ref={portfolioInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={handlePortfolioSelect} />
                </div>

                {/* Resume */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-1 block">
                    Resume / CV <span className="text-gray-400 font-normal">(optional)</span>
                  </Label>
                  {form.resumeUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-700 truncate">{form.resumeOriginalName || "Resume uploaded"}</p>
                        <p className="text-xs text-green-500">Successfully uploaded</p>
                      </div>
                      <button type="button" onClick={() => { update("resumeUrl", ""); update("resumeOriginalName", ""); }} className="text-gray-400 hover:text-red-500">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => resumeInputRef.current?.click()}
                      disabled={uploadingResume}
                      className="w-full border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploadingResume ? (
                        <div className="flex flex-col items-center gap-1.5 text-blue-500">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="text-sm font-medium">Uploading resume...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-gray-400">
                          <FileText className="h-7 w-7" />
                          <span className="text-sm font-semibold text-gray-600">Upload Resume</span>
                          <span className="text-xs">PDF or Word Document · Max 10MB</span>
                        </div>
                      )}
                    </button>
                  )}
                  <input ref={resumeInputRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" className="hidden" onChange={handleResumeSelect} />
                </div>

                {/* Bio */}
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Short Bio <span className="text-gray-400 font-normal">(optional)</span></Label>
                  <Textarea
                    placeholder="Tell salon owners about your experience, style, and what makes you stand out..."
                    value={form.bio}
                    onChange={e => update("bio", e.target.value)}
                    className="mt-1 min-h-[100px]"
                    maxLength={500}
                  />
                  <p className="text-xs text-gray-400 mt-1">{form.bio.length}/500 characters</p>
                </div>

                {/* Profile Summary */}
                <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Your Profile Summary</h3>
                  <div className="flex items-center gap-3 mb-3">
                    {profilePhotoPreview ? (
                      <img src={profilePhotoPreview} className="w-12 h-12 rounded-full object-cover border-2 border-blue-200" alt="Profile" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {form.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?"}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{form.fullName || "Your Name"}</p>
                      <p className="text-sm text-gray-500">{form.role || "Role"} · {form.city || "City"}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Experience:</span> {form.experience || "0"} years</p>
                    <p><span className="font-medium">Skills:</span> {form.skills.length > 0 ? form.skills.slice(0, 5).join(", ") + (form.skills.length > 5 ? ` +${form.skills.length - 5} more` : "") : "None selected"}</p>
                    <p><span className="font-medium">Photos:</span> {portfolioPreviews.length} work photos</p>
                    {form.resumeUrl && <p className="text-green-600 font-medium">✓ Resume uploaded</p>}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6 pt-5 border-t border-gray-100">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep(s => s - 1)}>← Back</Button>
              ) : (
                <div />
              )}
              {step < STEPS.length - 1 ? (
                <Button onClick={handleNext} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 rounded-full hover:shadow-lg transition-all">
                  Continue <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || uploadingProfile || uploadingPortfolio || uploadingResume}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 rounded-full hover:shadow-lg transition-all"
                >
                  {submitMutation.isPending
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Submitting...</>
                    : "Submit Profile 🚀"}
                </Button>
              )}
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-4">
            Already have an account?{" "}
            <Link href="/professional-login" className="text-blue-600 hover:underline font-medium">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
