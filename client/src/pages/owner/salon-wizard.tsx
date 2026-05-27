import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  Store, MapPin, Sparkles, Users, Clock, MessageSquare, CheckCircle, ChevronRight,
  ChevronLeft, Plus, X, Loader2, Camera, Instagram, Facebook, Globe, Star,
  Scissors, IndianRupee, Calendar, Coffee, Info, Check, ArrowLeft, Eye,
} from "lucide-react";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const PRESET_SERVICES = [
  { name: "Haircut (Men)", price: "200", duration: 30 },
  { name: "Haircut (Women)", price: "350", duration: 45 },
  { name: "Beard Trim", price: "100", duration: 20 },
  { name: "Hair Color", price: "800", duration: 90 },
  { name: "Facial", price: "500", duration: 60 },
  { name: "Waxing (Full Arms)", price: "300", duration: 30 },
  { name: "Manicure", price: "400", duration: 45 },
  { name: "Pedicure", price: "450", duration: 50 },
  { name: "Hair Spa", price: "600", duration: 60 },
  { name: "Shave", price: "80", duration: 15 },
  { name: "Bridal Makeup", price: "3000", duration: 120 },
  { name: "Threading (Eyebrows)", price: "60", duration: 10 },
];

const PRESET_FAQS = [
  { q: "Do I need to book in advance?", a: "We recommend booking at least a few hours in advance to secure your preferred time slot. Walk-ins are welcome based on availability." },
  { q: "What payment methods do you accept?", a: "We accept cash, UPI (PhonePe, Google Pay, Paytm), and card payments for your convenience." },
  { q: "Is parking available?", a: "Yes, parking space is available nearby. Please contact us for exact directions and parking details." },
  { q: "How long does a typical haircut take?", a: "A standard haircut takes about 20–30 minutes. More complex styles may take longer." },
  { q: "Do you offer home service?", a: "Currently we only provide services at our salon. We are looking into home service options for the future." },
  { q: "Can I reschedule my appointment?", a: "Yes! You can reschedule or cancel your booking up to 2 hours before your appointment through the app." },
  { q: "Do you use hygienic and sterilized tools?", a: "Absolutely. We maintain strict hygiene standards and sterilize all tools after every use." },
  { q: "Are your products safe for sensitive skin?", a: "We use branded, dermatologically tested products. Please inform your stylist of any allergies or sensitivities." },
];

const STAFF_ROLES = ["Barber", "Hair Stylist", "Beautician", "Nail Technician", "Makeup Artist", "Helper", "Manager"];

const STEPS = [
  { label: "Basics", icon: Store, desc: "Name, type & photo", color: "from-violet-500 to-purple-600" },
  { label: "Location", icon: MapPin, desc: "Address & social links", color: "from-blue-500 to-cyan-500" },
  { label: "Services", icon: Scissors, desc: "What you offer", color: "from-emerald-500 to-teal-500" },
  { label: "Staff", icon: Users, desc: "Your team", color: "from-orange-500 to-amber-500" },
  { label: "Schedule", icon: Clock, desc: "Opening hours", color: "from-pink-500 to-rose-500" },
  { label: "FAQs", icon: MessageSquare, desc: "Common questions", color: "from-indigo-500 to-violet-500" },
];

type Service = { name: string; price: string; duration: string };
type StaffMember = { name: string; role: string };
type DaySchedule = { isOpen: boolean; openTime: string; closeTime: string; breakStart: string; breakEnd: string };

async function uploadFile(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/staff-registrations/upload-photo", { method: "POST", body: fd });
  if (!res.ok) throw new Error("Upload failed");
  return (await res.json()).url as string;
}

// Mini salon card preview component
function SalonCardPreview({ name, salonType, imgPreview }: { name: string; salonType: string; imgPreview: string }) {
  const FALLBACK = "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=240";
  const typeLabel = salonType === "male" ? "Men's" : salonType === "female" ? "Women's" : "Unisex";
  const typeBadgeColor = salonType === "male" ? "bg-blue-600" : salonType === "female" ? "bg-pink-500" : "bg-violet-600";

  return (
    <div className="relative w-full max-w-xs mx-auto rounded-2xl overflow-hidden shadow-xl border border-gray-100 bg-white">
      {/* Image area */}
      <div className="relative h-36 bg-gradient-to-br from-violet-100 to-indigo-100">
        <img
          src={imgPreview || FALLBACK}
          alt={name || "Salon"}
          className="w-full h-full object-cover"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = FALLBACK; }}
        />
        {/* Type badge */}
        <span className={`absolute top-2 right-2 ${typeBadgeColor} text-white text-[10px] font-bold px-2 py-0.5 rounded-full`}>
          {typeLabel}
        </span>
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      {/* Card body */}
      <div className="p-3">
        <p className="font-bold text-gray-900 text-sm truncate">{name || "Your Salon Name"}</p>
        <div className="flex items-center gap-1 mt-1">
          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
          <span className="text-xs text-gray-500">New · 0 reviews</span>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-xs text-gray-400">📍 Location TBD</span>
          <span className="text-xs bg-violet-100 text-violet-700 font-semibold px-2 py-0.5 rounded-full">Book Now</span>
        </div>
      </div>
    </div>
  );
}

export default function SalonWizard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [imgPreview, setImgPreview] = useState("");
  const [imgUploading, setImgUploading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { data: existingSalon } = useQuery<any>({
    queryKey: ["/api/owner/salon"],
    retry: false,
  });

  const [basics, setBasics] = useState({ name: "", phone: "", description: "", salonType: "unisex" as "unisex" | "male" | "female", imageUrl: "" });
  const [location, setLocation] = useState({ address: "", googleMapsLink: "", instagramId: "", facebookId: "" });
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Service>({ name: "", price: "", duration: "30" });
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [newStaff, setNewStaff] = useState<StaffMember>({ name: "", role: "Barber" });
  const [schedules, setSchedules] = useState<Record<number, DaySchedule>>(() => {
    const init: Record<number, DaySchedule> = {};
    for (let i = 0; i < 7; i++) {
      init[i] = { isOpen: i !== 0, openTime: "09:00", closeTime: "20:00", breakStart: "13:00", breakEnd: "14:00" };
    }
    return init;
  });
  const [applyAll, setApplyAll] = useState(false);
  const [oneOffDays, setOneOffDays] = useState<string[]>([]);
  const [oneOffInput, setOneOffInput] = useState("");
  const [selectedFaqs, setSelectedFaqs] = useState<Set<number>>(new Set([0, 1, 6]));
  const [customFaqs, setCustomFaqs] = useState<{ q: string; a: string }[]>([]);
  const [newFaq, setNewFaq] = useState({ q: "", a: "" });

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImgPreview(URL.createObjectURL(file));
    setImgUploading(true);
    try {
      const url = await uploadFile(file);
      setBasics(b => ({ ...b, imageUrl: url }));
      setShowPreview(true);
      toast({ title: "Cover photo uploaded!" });
    } catch {
      toast({ title: "Upload failed", variant: "destructive" });
      setImgPreview("");
    } finally {
      setImgUploading(false);
    }
  };

  const addService = (preset?: typeof PRESET_SERVICES[0]) => {
    const s = preset ? { name: preset.name, price: String(preset.price), duration: String(preset.duration) } : newService;
    if (!s.name || !s.price) return;
    if (services.find(x => x.name === s.name)) return;
    setServices(prev => [...prev, { ...s }]);
    if (!preset) setNewService({ name: "", price: "", duration: "30" });
  };

  const removeService = (i: number) => setServices(prev => prev.filter((_, idx) => idx !== i));

  const addStaff = () => {
    if (!newStaff.name) return;
    setStaffList(prev => [...prev, { ...newStaff }]);
    setNewStaff({ name: "", role: "Barber" });
  };

  const removeStaff = (i: number) => setStaffList(prev => prev.filter((_, idx) => idx !== i));

  const updateSchedule = (day: number, field: keyof DaySchedule, value: any) => {
    if (applyAll && field !== "isOpen") {
      const updated: Record<number, DaySchedule> = {};
      for (let i = 0; i < 7; i++) {
        updated[i] = { ...schedules[i], [field]: value };
      }
      setSchedules(updated);
    } else {
      setSchedules(prev => ({ ...prev, [day]: { ...prev[day], [field]: value } }));
    }
  };

  const toggleFaq = (i: number) => {
    setSelectedFaqs(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const addCustomFaq = () => {
    if (!newFaq.q || !newFaq.a) return;
    setCustomFaqs(prev => [...prev, { ...newFaq }]);
    setNewFaq({ q: "", a: "" });
  };

  const handleExit = () => {
    if (existingSalon?.id) {
      navigate("/owner/dashboard");
    } else {
      navigate("/");
    }
  };

  const handleNext = async () => {
    if (step === 0) {
      if (!basics.name.trim()) { toast({ title: "Salon name is required", variant: "destructive" }); return; }
      if (!basics.phone.trim()) { toast({ title: "Phone number is required", variant: "destructive" }); return; }
      return setStep(1);
    }
    if (step === 1) {
      if (!location.address.trim()) { toast({ title: "Address is required", variant: "destructive" }); return; }
      return setStep(2);
    }
    if (step === 2) {
      if (services.length === 0) { toast({ title: "Add at least one service", variant: "destructive" }); return; }
      return setStep(3);
    }
    if (step === 3) return setStep(4);
    if (step === 4) return setStep(5);
    if (step === 5) await handleFinish();
  };

  const handleFinish = async () => {
    setSaving(true);
    try {
      let sid = salonId || existingSalon?.id;

      if (!sid) {
        const salonRes = await fetch("/api/salons", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: basics.name, phone: basics.phone, address: location.address, description: basics.description, salonType: basics.salonType, imageUrl: basics.imageUrl, instagramId: location.instagramId, facebookId: location.facebookId, googleMapsLink: location.googleMapsLink }),
        });
        if (!salonRes.ok) throw new Error("Failed to create salon");
        const salon = await salonRes.json();
        sid = salon.id;
        setSalonId(sid);
      } else {
        await fetch(`/api/salons/${sid}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ name: basics.name, phone: basics.phone, address: location.address, description: basics.description, salonType: basics.salonType, imageUrl: basics.imageUrl, instagramId: location.instagramId, facebookId: location.facebookId, googleMapsLink: location.googleMapsLink }),
        });
      }

      await Promise.allSettled(services.map(s => fetch(`/api/salons/${sid}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: s.name, price: s.price, duration: parseInt(s.duration) }),
      })));

      await Promise.allSettled(staffList.map(st => fetch(`/api/salons/${sid}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: st.name, role: st.role }),
      })));

      await Promise.allSettled(Object.entries(schedules).map(([day, sched]) =>
        fetch(`/api/salons/${sid}/working-hours`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            dayOfWeek: parseInt(day),
            isOpen: sched.isOpen,
            openTime: sched.openTime,
            closeTime: sched.closeTime,
            breakStartTime: sched.breakStart,
            breakEndTime: sched.breakEnd,
          }),
        })
      ));

      const allFaqs = [
        ...[...selectedFaqs].map(i => PRESET_FAQS[i]),
        ...customFaqs,
      ];
      await Promise.allSettled(allFaqs.map(faq => fetch("/api/owner/salon/faqs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: faq.q, answer: faq.a }),
      })));

      toast({ title: "Salon setup complete! 🎉", description: "Your salon is now live on Sanwar." });
      navigate("/owner/dashboard");
    } catch (err: any) {
      toast({ title: "Setup failed", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const CurrentIcon = STEPS[step].icon;
  const stepColor = STEPS[step].color;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          {/* Left: back or exit */}
          <button
            onClick={step > 0 ? () => setStep(s => s - 1) : handleExit}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-800 transition-colors text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            {step > 0 ? "Back" : "Exit"}
          </button>

          {/* Center: step indicator */}
          <div className="flex-1 text-center">
            <p className="text-xs text-gray-400 font-medium">Step {step + 1} of {STEPS.length}</p>
            <p className="text-sm font-bold text-gray-900">{STEPS[step].label}</p>
          </div>

          {/* Right: exit X button */}
          <button
            onClick={handleExit}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
            title="Exit setup"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-gray-100">
          <div
            className={`h-full bg-gradient-to-r ${stepColor} transition-all duration-500 ease-out`}
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Step tabs */}
      <div className="bg-white border-b overflow-x-auto scrollbar-none">
        <div className="max-w-2xl mx-auto px-4 flex min-w-max">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center">
                <button
                  onClick={() => i < step && setStep(i)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                    active
                      ? "border-violet-500 text-violet-700"
                      : done
                      ? "border-transparent text-green-600 cursor-pointer hover:text-green-700"
                      : "border-transparent text-gray-400 cursor-default"
                  }`}
                >
                  {done ? (
                    <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                  ) : (
                    <Icon className="w-3.5 h-3.5" />
                  )}
                  {s.label}
                </button>
                {i < STEPS.length - 1 && <ChevronRight className="w-3.5 h-3.5 text-gray-200 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-36">

        {/* STEP 0: BASICS */}
        {step === 0 && (
          <div className="space-y-6">
            {/* Section header */}
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stepColor} flex items-center justify-center`}>
                <Store className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Tell us about your salon</h2>
                <p className="text-sm text-gray-500">Basic info — takes about 30 seconds</p>
              </div>
            </div>

            {/* Cover photo + live preview */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-gray-800">Cover Photo</label>
                {imgPreview && (
                  <button
                    onClick={() => setShowPreview(v => !v)}
                    className="flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    {showPreview ? "Hide" : "See"} card preview
                  </button>
                )}
              </div>

              {/* Upload area */}
              <div
                onClick={() => imgInputRef.current?.click()}
                className="relative h-44 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-violet-300 hover:bg-violet-50/40 flex items-center justify-center cursor-pointer transition-all overflow-hidden group"
              >
                {imgPreview ? (
                  <>
                    <img src={imgPreview} alt="Cover" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="text-white text-center">
                        <Camera className="w-7 h-7 mx-auto mb-1" />
                        <p className="text-sm font-semibold">Change Photo</p>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center px-4">
                    <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mx-auto mb-3">
                      <Camera className="w-7 h-7 text-violet-500" />
                    </div>
                    <p className="text-sm font-semibold text-gray-700">Upload your salon photo</p>
                    <p className="text-xs text-gray-400 mt-1">This appears on your salon card · JPG or PNG · Max 5MB</p>
                  </div>
                )}
                {imgUploading && (
                  <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center gap-2">
                    <Loader2 className="w-7 h-7 animate-spin text-violet-600" />
                    <p className="text-sm font-medium text-violet-700">Uploading…</p>
                  </div>
                )}
              </div>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />

              {/* Live card preview */}
              {showPreview && imgPreview && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5" /> How your salon card will look
                  </p>
                  <SalonCardPreview name={basics.name} salonType={basics.salonType} imgPreview={imgPreview} />
                </div>
              )}
            </div>

            {/* Form fields */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-800 block mb-1.5">Salon Name <span className="text-red-500">*</span></label>
                <Input
                  placeholder="e.g. Style Hub, Sharma Cuts & Co."
                  value={basics.name}
                  onChange={e => setBasics(b => ({ ...b, name: e.target.value }))}
                  className="h-11 rounded-xl border-gray-200 focus:border-violet-400"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800 block mb-1.5">Phone Number <span className="text-red-500">*</span></label>
                <Input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={basics.phone}
                  onChange={e => setBasics(b => ({ ...b, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))}
                  className="h-11 rounded-xl border-gray-200 focus:border-violet-400"
                  maxLength={10}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800 block mb-1.5">Short Description</label>
                <Textarea
                  placeholder="Tell customers what makes your salon special…"
                  value={basics.description}
                  onChange={e => setBasics(b => ({ ...b, description: e.target.value }))}
                  className="rounded-xl resize-none border-gray-200 focus:border-violet-400"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800 block mb-2">Salon Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {([
                    { value: "unisex", label: "Unisex", emoji: "✂️" },
                    { value: "male", label: "Men's", emoji: "💈" },
                    { value: "female", label: "Women's", emoji: "💅" },
                  ] as const).map(({ value, label, emoji }) => (
                    <button
                      key={value}
                      onClick={() => setBasics(b => ({ ...b, salonType: value }))}
                      className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all flex flex-col items-center gap-1 ${
                        basics.salonType === value
                          ? "border-violet-500 bg-violet-50 text-violet-700 shadow-sm"
                          : "border-gray-200 text-gray-500 hover:border-violet-200 hover:bg-gray-50"
                      }`}
                    >
                      <span className="text-xl">{emoji}</span>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: LOCATION & SOCIAL */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stepColor} flex items-center justify-center`}>
                <MapPin className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Where are you located?</h2>
                <p className="text-sm text-gray-500">Help customers find you easily</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-800 block mb-1.5">Full Address <span className="text-red-500">*</span></label>
                <Textarea
                  placeholder="Shop No. 5, Main Bazaar, MG Road, Mumbai, Maharashtra"
                  value={location.address}
                  onChange={e => setLocation(l => ({ ...l, address: e.target.value }))}
                  className="rounded-xl resize-none border-gray-200 focus:border-blue-400"
                  rows={3}
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800 block mb-1.5 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-gray-400" /> Google Maps Link
                </label>
                <Input
                  placeholder="https://maps.google.com/…"
                  value={location.googleMapsLink}
                  onChange={e => setLocation(l => ({ ...l, googleMapsLink: e.target.value }))}
                  className="h-11 rounded-xl border-gray-200 focus:border-blue-400"
                />
                <p className="text-xs text-gray-400 mt-1">Maps app → Share → Copy link</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-semibold text-gray-800 block mb-1.5 flex items-center gap-1.5">
                    <Instagram className="w-4 h-4 text-pink-400" /> Instagram
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
                    <Input
                      placeholder="yoursalon"
                      value={location.instagramId}
                      onChange={e => setLocation(l => ({ ...l, instagramId: e.target.value.replace("@", "") }))}
                      className="h-11 rounded-xl border-gray-200 pl-7"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-800 block mb-1.5 flex items-center gap-1.5">
                    <Facebook className="w-4 h-4 text-blue-500" /> Facebook
                  </label>
                  <Input
                    placeholder="page name or ID"
                    value={location.facebookId}
                    onChange={e => setLocation(l => ({ ...l, facebookId: e.target.value }))}
                    className="h-11 rounded-xl border-gray-200"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SERVICES */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stepColor} flex items-center justify-center`}>
                <Scissors className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add your services</h2>
                <p className="text-sm text-gray-500">Tap to add from presets, or add a custom one</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Quick Add — Tap to select</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_SERVICES.map((ps, i) => {
                  const added = services.find(s => s.name === ps.name);
                  return (
                    <button
                      key={i}
                      onClick={() => added ? removeService(services.findIndex(s => s.name === ps.name)) : addService(ps)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${
                        added
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "border-gray-200 text-gray-600 hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      {added ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {ps.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">Add Custom Service</p>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-5 sm:col-span-2">
                  <Input placeholder="Service name" value={newService.name} onChange={e => setNewService(s => ({ ...s, name: e.target.value }))} className="rounded-xl h-10 text-sm border-gray-200" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="relative">
                    <IndianRupee className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input type="number" placeholder="Price" value={newService.price} onChange={e => setNewService(s => ({ ...s, price: e.target.value }))} className="rounded-xl h-10 text-sm pl-7 border-gray-200" />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="relative">
                    <Clock className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <Input type="number" placeholder="Min" value={newService.duration} onChange={e => setNewService(s => ({ ...s, duration: e.target.value }))} className="rounded-xl h-10 text-sm pl-7 border-gray-200" />
                  </div>
                </div>
                <div className="col-span-1">
                  <Button onClick={() => addService()} className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 rounded-xl px-2">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {services.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{services.length} service{services.length > 1 ? "s" : ""} added</p>
                {services.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <Scissors className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">₹{s.price} · {s.duration} min</p>
                      </div>
                    </div>
                    <button onClick={() => removeService(i)} className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors">
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: STAFF */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stepColor} flex items-center justify-center`}>
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Add your team</h2>
                <p className="text-sm text-gray-500">Optional — you can add more staff from your dashboard later</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">Add Staff Member</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Staff name"
                  value={newStaff.name}
                  onChange={e => setNewStaff(s => ({ ...s, name: e.target.value }))}
                  className="rounded-xl h-10 text-sm flex-1 border-gray-200"
                  onKeyDown={e => e.key === "Enter" && addStaff()}
                />
                <select
                  value={newStaff.role}
                  onChange={e => setNewStaff(s => ({ ...s, role: e.target.value }))}
                  className="h-10 text-sm rounded-xl border border-gray-200 bg-white px-2 text-gray-700"
                >
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <Button onClick={addStaff} className="h-10 bg-orange-500 hover:bg-orange-600 rounded-xl px-3">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {staffList.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{staffList.length} staff added</p>
                {staffList.map((st, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold text-sm">
                        {st.name[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{st.name}</p>
                        <p className="text-xs text-gray-500">{st.role}</p>
                      </div>
                    </div>
                    <button onClick={() => removeStaff(i)} className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center transition-colors">
                      <X className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center mx-auto mb-3">
                  <Users className="w-7 h-7 text-orange-300" />
                </div>
                <p className="text-sm font-medium text-gray-500">No staff added yet</p>
                <p className="text-xs text-gray-400 mt-1">You can skip this and add from dashboard</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: SCHEDULE */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stepColor} flex items-center justify-center`}>
                <Clock className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Set your schedule</h2>
                <p className="text-sm text-gray-500">When is your salon open?</p>
              </div>
            </div>

            {/* Apply to all toggle */}
            <div className="flex items-center justify-between bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">Same hours for all open days</p>
                <p className="text-xs text-gray-500">Change one day and it updates all</p>
              </div>
              <button
                onClick={() => setApplyAll(!applyAll)}
                className={`w-12 h-6.5 h-[26px] rounded-full transition-all relative flex-shrink-0 ${applyAll ? "bg-pink-500" : "bg-gray-200"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${applyAll ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </div>

            <div className="space-y-2">
              {DAYS.map((day, i) => {
                const sched = schedules[i];
                return (
                  <div key={i} className={`rounded-2xl border transition-all ${sched.isOpen ? "bg-white border-gray-100 shadow-sm" : "bg-gray-50 border-gray-100"}`}>
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateSchedule(i, "isOpen", !sched.isOpen)}
                          className={`w-11 h-6 rounded-full transition-all relative flex-shrink-0 ${sched.isOpen ? "bg-pink-500" : "bg-gray-300"}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${sched.isOpen ? "left-[22px]" : "left-0.5"}`} />
                        </button>
                        <span className={`text-sm font-semibold ${sched.isOpen ? "text-gray-900" : "text-gray-400"}`}>{DAY_FULL[i]}</span>
                      </div>
                      {!sched.isOpen && <span className="text-xs text-gray-400 bg-gray-200 px-2.5 py-0.5 rounded-full font-medium">Closed</span>}
                    </div>

                    {sched.isOpen && (
                      <div className="px-4 pb-4 space-y-2 border-t border-gray-50 pt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 font-medium block mb-1">Opens</label>
                            <Input type="time" value={sched.openTime} onChange={e => updateSchedule(i, "openTime", e.target.value)} className="h-9 rounded-xl text-sm border-gray-200" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-medium block mb-1">Closes</label>
                            <Input type="time" value={sched.closeTime} onChange={e => updateSchedule(i, "closeTime", e.target.value)} className="h-9 rounded-xl text-sm border-gray-200" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-1"><Coffee className="w-3 h-3" /> Break start</label>
                            <Input type="time" value={sched.breakStart} onChange={e => updateSchedule(i, "breakStart", e.target.value)} className="h-9 rounded-xl text-sm border-gray-200" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-medium flex items-center gap-1 mb-1"><Coffee className="w-3 h-3" /> Break end</label>
                            <Input type="time" value={sched.breakEnd} onChange={e => updateSchedule(i, "breakEnd", e.target.value)} className="h-9 rounded-xl text-sm border-gray-200" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* One-off holidays */}
            <div className="bg-amber-50 rounded-2xl border border-amber-100 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-900">Closed Days / Holidays</p>
              </div>
              <p className="text-xs text-amber-700">Mark dates when your salon will be closed</p>
              <div className="flex gap-2">
                <Input type="date" value={oneOffInput} onChange={e => setOneOffInput(e.target.value)} className="rounded-xl h-9 text-sm flex-1 border-amber-200 bg-white" min={new Date().toISOString().split("T")[0]} />
                <Button
                  onClick={() => { if (oneOffInput && !oneOffDays.includes(oneOffInput)) { setOneOffDays(d => [...d, oneOffInput].sort()); setOneOffInput(""); } }}
                  className="h-9 bg-amber-500 hover:bg-amber-600 text-white rounded-xl px-3"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              {oneOffDays.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {oneOffDays.map(d => (
                    <span key={d} className="flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      <button onClick={() => setOneOffDays(prev => prev.filter(x => x !== d))}>
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* STEP 5: FAQs */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${stepColor} flex items-center justify-center`}>
                <MessageSquare className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">FAQs for customers</h2>
                <p className="text-sm text-gray-500">Select ready-made answers or write your own</p>
              </div>
            </div>

            <div className="space-y-2">
              {PRESET_FAQS.map((faq, i) => (
                <button
                  key={i}
                  onClick={() => toggleFaq(i)}
                  className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${
                    selectedFaqs.has(i)
                      ? "border-indigo-400 bg-indigo-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${
                      selectedFaqs.has(i) ? "border-indigo-500 bg-indigo-500" : "border-gray-300"
                    }`}>
                      {selectedFaqs.has(i) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{faq.q}</p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{faq.a}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {customFaqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{faq.q}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{faq.a}</p>
                  </div>
                  <button onClick={() => setCustomFaqs(prev => prev.filter((_, j) => j !== i))} className="flex-shrink-0">
                    <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-800">Add Custom FAQ</p>
              <Input placeholder="Question" value={newFaq.q} onChange={e => setNewFaq(f => ({ ...f, q: e.target.value }))} className="rounded-xl h-10 text-sm border-gray-200" />
              <Textarea placeholder="Answer" value={newFaq.a} onChange={e => setNewFaq(f => ({ ...f, a: e.target.value }))} className="rounded-xl resize-none text-sm border-gray-200" rows={3} />
              <Button onClick={addCustomFaq} variant="outline" className="rounded-xl text-sm h-9 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add FAQ
              </Button>
            </div>

            {/* Launch summary */}
            <div className="bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl p-5 text-white shadow-lg">
              <p className="font-bold text-lg mb-3 flex items-center gap-2">🚀 Ready to go live!</p>
              <div className="space-y-1.5 text-sm text-violet-100">
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-300" /> Salon: <span className="font-semibold text-white">{basics.name}</span></p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-300" /> Services: <span className="font-semibold text-white">{services.length} service{services.length !== 1 ? "s" : ""}</span></p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-300" /> Staff: <span className="font-semibold text-white">{staffList.length > 0 ? `${staffList.length} member${staffList.length !== 1 ? "s" : ""}` : "Add from dashboard"}</span></p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-300" /> FAQs: <span className="font-semibold text-white">{selectedFaqs.size + customFaqs.length} selected</span></p>
                <p className="flex items-center gap-2"><Check className="w-4 h-4 text-violet-300" /> Cover photo: <span className="font-semibold text-white">{basics.imageUrl ? "Uploaded ✓" : "Not added"}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t shadow-lg">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          {/* Skip / secondary action */}
          {step < STEPS.length - 1 && (
            <button
              onClick={() => setStep(s => s + 1)}
              className="text-sm text-gray-400 hover:text-gray-600 font-medium px-3 py-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              Skip for now
            </button>
          )}

          {/* Primary CTA */}
          <Button
            onClick={handleNext}
            disabled={saving}
            className={`flex-1 h-12 rounded-xl font-semibold text-sm shadow-md bg-gradient-to-r ${stepColor} hover:opacity-90 transition-all text-white border-0`}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving…</>
            ) : step === STEPS.length - 1 ? (
              <><CheckCircle className="w-4 h-4 mr-2" /> Launch My Salon</>
            ) : (
              <>Continue <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
