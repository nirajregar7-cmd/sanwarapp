import { useState } from "react";
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
};

export default function StaffRegistration() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);

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
      {/* Navbar */}
      <nav className="bg-white shadow-lg sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="flex items-center space-x-3 group cursor-pointer">
              <div className="bg-gradient-to-br from-purple-600 via-pink-500 to-blue-600 text-white rounded-xl w-12 h-12 flex items-center justify-center font-bold shadow-lg transform group-hover:scale-110 transition-all">
                <Scissors className="h-6 w-6" />
              </div>
              <div>
                <span className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-blue-600 bg-clip-text text-transparent">
                  Sanwar
                </span>
                <p className="text-xs text-gray-500 -mt-1">Smart Salon Booking</p>
              </div>
            </Link>

            <div className="hidden md:flex items-center space-x-1">
              <Link href="/" className="px-4 py-2 text-gray-700 hover:text-purple-600 font-semibold transition-colors">Home</Link>
              <Link href="/services" className="px-4 py-2 text-purple-600 font-semibold">Services</Link>
              <Link href="/about" className="px-4 py-2 text-gray-700 hover:text-purple-600 font-semibold transition-colors">About Us</Link>
              <Link href="/contact" className="px-4 py-2 text-gray-700 hover:text-purple-600 font-semibold transition-colors">Contact</Link>
              {isAuthenticated ? (
                <Link href="/" className="ml-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all">
                  Dashboard
                </Link>
              ) : (
                <Link href="/auth" className="ml-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2.5 rounded-full font-semibold hover:shadow-lg transition-all flex items-center gap-2">
                  <span>Login / Register</span>
                  <ChevronRight className="h-4 w-4" />
                </Link>
              )}
            </div>

            <div className="md:hidden">
              <Button variant="ghost" size="sm" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden pb-4 space-y-2">
              <Link href="/" className="block px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl" onClick={() => setMobileMenuOpen(false)}>Home</Link>
              <Link href="/services" className="block px-4 py-3 text-purple-600 font-semibold rounded-xl" onClick={() => setMobileMenuOpen(false)}>Services</Link>
              <Link href="/about" className="block px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
              <Link href="/contact" className="block px-4 py-3 text-gray-700 hover:text-purple-600 font-semibold rounded-xl" onClick={() => setMobileMenuOpen(false)}>Contact</Link>
            </div>
          )}
        </div>
      </nav>

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
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-gray-800">Portfolio & Bio</h2>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Short Professional Bio (max 150 words)</Label>
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

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-sm text-blue-700 font-medium">📸 Portfolio Photos</p>
                  <p className="text-xs text-blue-600 mt-1">
                    After submitting, you can share your work photos with interested salon owners directly.
                    Portfolio image upload coming soon!
                  </p>
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-50 rounded-xl border">
                  <h3 className="text-sm font-bold text-gray-700 mb-3">Profile Summary</h3>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Name:</span> {form.fullName}</p>
                    <p><span className="font-medium">Role:</span> {form.role}</p>
                    <p><span className="font-medium">Location:</span> {form.area}, {form.city}</p>
                    <p><span className="font-medium">Experience:</span> {form.experience || 0} years</p>
                    <p><span className="font-medium">Skills:</span> {form.skills.join(", ") || "None selected"}</p>
                    {form.expectedSalary && (
                      <p><span className="font-medium">Expected Salary:</span> ₹{parseInt(form.expectedSalary).toLocaleString("en-IN")}/month</p>
                    )}
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
                  disabled={submitMutation.isPending}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 rounded-full hover:shadow-lg transition-all"
                >
                  {submitMutation.isPending ? "Submitting..." : "Submit Profile 🚀"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
