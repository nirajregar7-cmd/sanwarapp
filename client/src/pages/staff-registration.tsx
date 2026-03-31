import { useState, useRef } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
  Scissors,
  ChevronRight,
  Menu,
  X,
  CheckCircle,
  User,
  Briefcase,
  Sparkles,
  IndianRupee,
  ImageIcon,
  Camera,
  Upload,
  Trash2,
  Loader2,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const ROLES = [
  "Barber",
  "Hair Stylist",
  "Beautician",
  "Nail Technician",
  "Makeup Artist",
  "Helper",
  "Other",
];

const SKILLS_LIST = [
  "Haircut",
  "Fade Specialist",
  "Beard Styling",
  "Hair Color",
  "Facial",
  "Waxing",
  "Manicure/Pedicure",
  "Bridal Makeup",
  "Keratin/Straightening",
  "Other",
];

const STEPS = [
  { label: "Basic Info", icon: User },
  { label: "Professional", icon: Briefcase },
  { label: "Skills", icon: Sparkles },
  { label: "Portfolio", icon: ImageIcon },
];

type FormData = {
  fullName: string;
  mobile: string;
  city: string;
  area: string;
  headline: string;
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
};

async function uploadPhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await fetch("/api/staff-registrations/upload-photo", {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Upload failed");
  }
  const data = await res.json();
  return data.url as string;
}

function PhotoPreview({
  src,
  onRemove,
  label,
}: {
  src: string;
  onRemove: () => void;
  label?: string;
}) {
  return (
    <div className="relative group">
      <img
        src={src}
        alt={label || "Preview"}
        className="w-full h-36 object-cover rounded-xl border-2 border-blue-200"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </button>
      {label && (
        <p className="text-xs text-center text-gray-500 mt-1 truncate">{label}</p>
      )}
    </div>
  );
}

export default function StaffRegistration() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const profilePhotoInputRef = useRef<HTMLInputElement>(null);
  const workingPhotosInputRef = useRef<HTMLInputElement>(null);

  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string>("");
  const [workingPhotoPreviews, setWorkingPhotoPreviews] = useState<string[]>([]);
  const [uploadingProfile, setUploadingProfile] = useState(false);
  const [uploadingWorking, setUploadingWorking] = useState(false);

  const [form, setForm] = useState<FormData>({
    fullName: "",
    mobile: "",
    city: "",
    area: "",
    headline: "",
    role: "",
    experience: "",
    gender: "",
    comfortableWith: "",
    currentlyWorking: "",
    skills: [],
    expectedSalary: "",
    employmentType: "",
    willingToRelocate: false,
    bio: "",
    profileImageUrl: "",
    portfolioImages: [],
  });

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/staff-registrations", data);
    },
    onSuccess: () => {
      setSubmitted(true);
    },
    onError: () => {
      toast({
        title: "Submission failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  const update = (field: keyof FormData, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSkill = (skill: string) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleProfilePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const localPreview = URL.createObjectURL(file);
    setProfilePhotoPreview(localPreview);
    setUploadingProfile(true);

    try {
      const url = await uploadPhoto(file);
      update("profileImageUrl", url);
      toast({ title: "Profile photo uploaded!" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      setProfilePhotoPreview("");
    } finally {
      setUploadingProfile(false);
    }
  };

  const handleWorkingPhotosSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remaining = 3 - form.portfolioImages.length;
    const toUpload = files.slice(0, remaining);

    if (toUpload.length === 0) {
      toast({ title: "Max 3 work photos allowed", variant: "destructive" });
      return;
    }

    setUploadingWorking(true);

    for (const file of toUpload) {
      const localPreview = URL.createObjectURL(file);
      setWorkingPhotoPreviews((prev) => [...prev, localPreview]);
      try {
        const url = await uploadPhoto(file);
        setForm((prev) => ({ ...prev, portfolioImages: [...prev.portfolioImages, url] }));
      } catch (err: any) {
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
        setWorkingPhotoPreviews((prev) => prev.slice(0, -1));
      }
    }

    setUploadingWorking(false);
    if (toUpload.length > 0) {
      toast({ title: `${toUpload.length} work photo(s) uploaded!` });
    }
  };

  const removeWorkingPhoto = (index: number) => {
    setWorkingPhotoPreviews((prev) => prev.filter((_, i) => i !== index));
    setForm((prev) => ({
      ...prev,
      portfolioImages: prev.portfolioImages.filter((_, i) => i !== index),
    }));
  };

  const canProceedStep0 =
    form.fullName.trim() && form.mobile.trim() && form.city.trim() && form.area.trim();
  const canProceedStep1 = form.role.trim();
  const canProceedStep2 = form.skills.length > 0;

  const handleNext = () => {
    if (step === 0 && !canProceedStep0) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    if (step === 1 && !canProceedStep1) {
      toast({ title: "Please select your role", variant: "destructive" });
      return;
    }
    if (step === 2 && !canProceedStep2) {
      toast({ title: "Please select at least one skill", variant: "destructive" });
      return;
    }
    setStep((s) => s + 1);
  };

  const handleSubmit = () => {
    submitMutation.mutate({
      fullName: form.fullName,
      mobile: form.mobile,
      city: form.city,
      area: form.area,
      headline: form.headline,
      role: form.role,
      experience: form.experience ? parseInt(form.experience) : 0,
      gender: form.gender || null,
      comfortableWith: form.comfortableWith || null,
      currentlyWorking: form.currentlyWorking || null,
      skills: form.skills,
      expectedSalary: form.expectedSalary ? parseInt(form.expectedSalary) : null,
      employmentType: form.employmentType || null,
      willingToRelocate: form.willingToRelocate,
      bio: form.bio || null,
      profileImageUrl: form.profileImageUrl || null,
      portfolioImages: form.portfolioImages.length > 0 ? form.portfolioImages : null,
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
          <p className="text-gray-600 mb-2">
            Your professional profile has been submitted to Sanwar.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Salon owners will be able to find and contact you for opportunities.
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/services">
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                Back to Services
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
      <PublicNav />

      {/* Main Content */}
      <div className="flex justify-center py-10 px-4">
        <div className="w-full max-w-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              🔥 Sanwar Staff Registration
            </h1>
            <p className="text-gray-600 text-sm">Create your professional salon profile and get hired faster</p>
          </div>

          {/* Step Indicators */}
          <div className="flex justify-between items-center mb-6 px-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    i < step
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow"
                      : i === step
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg ring-4 ring-blue-200"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {i < step ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                  </div>
                  <span className={`text-xs font-medium hidden sm:block ${i === step ? "text-blue-600" : "text-gray-500"}`}>
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Progress Bar */}
          <div className="h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-2xl p-6 sm:p-10 relative overflow-hidden">
            <div className="absolute top-0 left-0 h-1.5 w-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-t-2xl" />

            {/* Step 1: Basic Info */}
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800">Basic Information</h2>

                {/* Profile Photo Upload */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">Profile Photo</Label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      {profilePhotoPreview ? (
                        <div className="relative">
                          <img
                            src={profilePhotoPreview}
                            alt="Profile"
                            className="w-20 h-20 rounded-full object-cover border-4 border-blue-200 shadow"
                          />
                          {uploadingProfile && (
                            <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                              <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setProfilePhotoPreview("");
                              update("profileImageUrl", "");
                            }}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-purple-100 border-4 border-dashed border-blue-300 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                          onClick={() => profilePhotoInputRef.current?.click()}>
                          {uploadingProfile
                            ? <Loader2 className="h-6 w-6 text-blue-500 animate-spin" />
                            : <Camera className="h-6 w-6 text-blue-400" />
                          }
                        </div>
                      )}
                    </div>
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => profilePhotoInputRef.current?.click()}
                        disabled={uploadingProfile}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Upload className="h-3.5 w-3.5 mr-1.5" />
                        {profilePhotoPreview ? "Change Photo" : "Upload Photo"}
                      </Button>
                      <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP · Max 5MB</p>
                    </div>
                    <input
                      ref={profilePhotoInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleProfilePhotoSelect}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Full Name *</Label>
                    <Input
                      placeholder="e.g. Rahul Verma"
                      value={form.fullName}
                      onChange={(e) => update("fullName", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Mobile Number *</Label>
                    <Input
                      placeholder="e.g. 9876543210"
                      value={form.mobile}
                      onChange={(e) => update("mobile", e.target.value)}
                      className="mt-1"
                      type="tel"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">City *</Label>
                      <Input
                        placeholder="e.g. Chennai"
                        value={form.city}
                        onChange={(e) => update("city", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Area / Locality *</Label>
                      <Input
                        placeholder="e.g. Anna Nagar"
                        value={form.area}
                        onChange={(e) => update("area", e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Professional Identity */}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800">Professional Identity</h2>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Professional Headline</Label>
                    <Input
                      placeholder="e.g. Senior Hair Stylist | 6 Years Experience"
                      value={form.headline}
                      onChange={(e) => update("headline", e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Role *</Label>
                    <Select value={form.role} onValueChange={(v) => update("role", v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select your role" />
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.map((r) => (
                          <SelectItem key={r} value={r}>{r}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Experience (Years)</Label>
                      <Input
                        type="number"
                        placeholder="e.g. 5"
                        value={form.experience}
                        onChange={(e) => update("experience", e.target.value)}
                        className="mt-1"
                        min="0"
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Gender</Label>
                      <Select value={form.gender} onValueChange={(v) => update("gender", v)}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Male">Male</SelectItem>
                          <SelectItem value="Female">Female</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                          <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Comfortable With</Label>
                    <Select value={form.comfortableWith} onValueChange={(v) => update("comfortableWith", v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select client type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male Clients">Male Clients</SelectItem>
                        <SelectItem value="Female Clients">Female Clients</SelectItem>
                        <SelectItem value="Unisex">Unisex (Both)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Current Status</Label>
                    <Select value={form.currentlyWorking} onValueChange={(v) => update("currentlyWorking", v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Available Immediately">Available Immediately</SelectItem>
                        <SelectItem value="Currently Working – Open to Better Offer">Currently Working – Open to Better Offer</SelectItem>
                        <SelectItem value="Serving Notice Period">Serving Notice Period</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Skills & Salary */}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800">Skills & Preferences</h2>
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-3 block">Select your skills *</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {SKILLS_LIST.map((skill) => (
                      <label
                        key={skill}
                        className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          form.skills.includes(skill)
                            ? "border-blue-500 bg-blue-50 text-blue-700"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <Checkbox
                          checked={form.skills.includes(skill)}
                          onCheckedChange={() => toggleSkill(skill)}
                        />
                        <span className="text-sm font-medium">{skill}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Expected Monthly Salary (₹)</Label>
                    <div className="relative mt-1">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        type="number"
                        placeholder="e.g. 25000"
                        value={form.expectedSalary}
                        onChange={(e) => update("expectedSalary", e.target.value)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Employment Type</Label>
                    <Select value={form.employmentType} onValueChange={(v) => update("employmentType", v)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Full-time">Full-time</SelectItem>
                        <SelectItem value="Part-time">Part-time</SelectItem>
                        <SelectItem value="Freelance">Freelance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Checkbox
                    checked={form.willingToRelocate}
                    onCheckedChange={(checked) => update("willingToRelocate", checked === true)}
                  />
                  <span className="text-sm font-medium text-gray-700">Willing to relocate for the right opportunity</span>
                </label>
              </div>
            )}

            {/* Step 4: Portfolio */}
            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-800">Portfolio & Bio</h2>

                {/* Work Photos */}
                <div>
                  <Label className="text-sm font-medium text-gray-700 mb-2 block">
                    Work Photos <span className="text-gray-400 font-normal">(up to 3)</span>
                  </Label>

                  {workingPhotoPreviews.length > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-3">
                      {workingPhotoPreviews.map((src, i) => (
                        <PhotoPreview
                          key={i}
                          src={src}
                          onRemove={() => removeWorkingPhoto(i)}
                          label={`Work ${i + 1}`}
                        />
                      ))}
                    </div>
                  )}

                  {workingPhotoPreviews.length < 3 && (
                    <button
                      type="button"
                      onClick={() => workingPhotosInputRef.current?.click()}
                      disabled={uploadingWorking}
                      className="w-full border-2 border-dashed border-blue-300 rounded-xl p-6 text-center hover:border-blue-500 hover:bg-blue-50 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {uploadingWorking ? (
                        <div className="flex flex-col items-center gap-2 text-blue-500">
                          <Loader2 className="h-7 w-7 animate-spin" />
                          <span className="text-sm font-medium">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-blue-400">
                          <Upload className="h-7 w-7" />
                          <span className="text-sm font-medium text-blue-600">
                            Click to add work photos
                          </span>
                          <span className="text-xs text-gray-400">
                            Show your best work · JPG, PNG · Max 5MB each
                          </span>
                        </div>
                      )}
                    </button>
                  )}

                  <input
                    ref={workingPhotosInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleWorkingPhotosSelect}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {workingPhotoPreviews.length}/3 photos uploaded
                  </p>
                </div>

                {/* Bio */}
                <div>
                  <Label className="text-sm font-medium text-gray-700">Short Professional Bio <span className="text-gray-400 font-normal">(max 150 words)</span></Label>
                  <Textarea
                    placeholder="Tell salon owners about your experience, specialties, and what makes you stand out..."
                    value={form.bio}
                    onChange={(e) => update("bio", e.target.value)}
                    className="mt-1 min-h-[120px]"
                    maxLength={900}
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {form.bio.split(/\s+/).filter(Boolean).length} / 150 words
                  </p>
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-xl border">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Profile Summary</h3>
                  <div className="flex items-center gap-3 mb-3">
                    {profilePhotoPreview ? (
                      <img src={profilePhotoPreview} className="w-12 h-12 rounded-full object-cover border-2 border-blue-200" alt="Profile" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
                        {form.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{form.fullName}</p>
                      <p className="text-sm text-gray-500">{form.role} · {form.area}, {form.city}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Experience:</span> {form.experience || 0} years</p>
                    <p><span className="font-medium">Skills:</span> {form.skills.join(", ") || "None selected"}</p>
                    {form.expectedSalary && (
                      <p><span className="font-medium">Expected Salary:</span> ₹{parseInt(form.expectedSalary).toLocaleString("en-IN")}/month</p>
                    )}
                    <p><span className="font-medium">Work photos:</span> {workingPhotoPreviews.length} uploaded</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 0 ? (
                <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                  Back
                </Button>
              ) : (
                <div />
              )}
              {step < STEPS.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 rounded-full hover:shadow-lg transition-all"
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={submitMutation.isPending || uploadingProfile || uploadingWorking}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 rounded-full hover:shadow-lg transition-all"
                >
                  {submitMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                  ) : (
                    "Submit Profile 🚀"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
