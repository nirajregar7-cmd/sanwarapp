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
  Scissors, IndianRupee, Calendar, Coffee, Info, Check,
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
  { label: "Basics", icon: Store, desc: "Name, type & photo" },
  { label: "Location", icon: MapPin, desc: "Address & social links" },
  { label: "Services", icon: Scissors, desc: "What you offer" },
  { label: "Staff", icon: Users, desc: "Your team" },
  { label: "Schedule", icon: Clock, desc: "Opening hours" },
  { label: "FAQs", icon: MessageSquare, desc: "Common questions" },
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

export default function SalonWizard() {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [step, setStep] = useState(0);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);
  const [imgPreview, setImgPreview] = useState("");
  const [imgUploading, setImgUploading] = useState(false);

  // Check existing salon
  const { data: existingSalon } = useQuery<any>({
    queryKey: ["/api/owner/salon"],
    retry: false,
  });

  // Step 0: Basics
  const [basics, setBasics] = useState({ name: "", phone: "", description: "", salonType: "unisex" as "unisex" | "male" | "female", imageUrl: "" });

  // Step 1: Location & Social
  const [location, setLocation] = useState({ address: "", googleMapsLink: "", instagramId: "", facebookId: "" });

  // Step 2: Services
  const [services, setServices] = useState<Service[]>([]);
  const [newService, setNewService] = useState<Service>({ name: "", price: "", duration: "30" });

  // Step 3: Staff
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [newStaff, setNewStaff] = useState<StaffMember>({ name: "", role: "Barber" });

  // Step 4: Schedule
  const [schedules, setSchedules] = useState<Record<number, DaySchedule>>(() => {
    const init: Record<number, DaySchedule> = {};
    for (let i = 0; i < 7; i++) {
      init[i] = { isOpen: i !== 0, openTime: "09:00", closeTime: "20:00", breakStart: "13:00", breakEnd: "14:00" };
    }
    return init;
  });
  const [applyAll, setApplyAll] = useState(false);
  const [oneOffDays, setOneOffDays] = useState<string[]>([]); // YYYY-MM-DD holiday dates
  const [oneOffInput, setOneOffInput] = useState("");

  // Step 5: FAQs
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

      // Step 1: Create or update salon
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

      // Step 2: Create services (in parallel)
      await Promise.allSettled(services.map(s => fetch(`/api/salons/${sid}/services`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: s.name, price: s.price, duration: parseInt(s.duration) }),
      })));

      // Step 3: Create staff (in parallel)
      await Promise.allSettled(staffList.map(st => fetch(`/api/salons/${sid}/staff`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name: st.name, role: st.role }),
      })));

      // Step 4: Save working hours for each day
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

      // Step 5: Save FAQs
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

  const progress = ((step) / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-white to-indigo-50">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Salon Setup Wizard</p>
              <p className="text-sm font-semibold text-gray-900">Step {step + 1} of {STEPS.length}: {STEPS[step].label}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">~{Math.max(1, STEPS.length - step - 1)} min left</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Step breadcrumbs (scrollable) */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="max-w-2xl mx-auto px-4 py-2 flex gap-1 min-w-max sm:min-w-0">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? "bg-violet-100 text-violet-700" : done ? "bg-green-100 text-green-700" : "text-gray-400"}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  {s.label}
                </div>
                {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-gray-300 mx-0.5 flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl mx-auto px-4 py-6 pb-32">
        {/* STEP 0: BASICS */}
        {step === 0 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tell us about your salon</h2>
              <p className="text-sm text-gray-500 mt-0.5">Basic info — takes about 30 seconds</p>
            </div>

            {/* Cover photo */}
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Cover Photo</label>
              <div
                onClick={() => imgInputRef.current?.click()}
                className="relative h-40 rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50 flex items-center justify-center cursor-pointer hover:border-violet-400 transition-all overflow-hidden"
              >
                {imgPreview ? (
                  <img src={imgPreview} alt="Cover" className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  <div className="text-center">
                    <Camera className="w-8 h-8 text-violet-300 mx-auto mb-2" />
                    <p className="text-sm text-violet-500 font-medium">Upload cover photo</p>
                    <p className="text-xs text-gray-400">JPG, PNG · Max 5MB</p>
                  </div>
                )}
                {imgUploading && (
                  <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-600" />
                  </div>
                )}
              </div>
              <input ref={imgInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Salon Name *</label>
              <Input placeholder="e.g. Style Hub, Sharma Cuts & Co." value={basics.name} onChange={e => setBasics(b => ({ ...b, name: e.target.value }))} className="rounded-xl h-11" />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Phone Number *</label>
              <Input type="tel" placeholder="10-digit mobile number" value={basics.phone} onChange={e => setBasics(b => ({ ...b, phone: e.target.value.replace(/\D/g, "").slice(0, 10) }))} className="rounded-xl h-11" maxLength={10} />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Short Description</label>
              <Textarea placeholder="Tell customers what makes your salon special..." value={basics.description} onChange={e => setBasics(b => ({ ...b, description: e.target.value }))} className="rounded-xl resize-none" rows={3} />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">Salon Type</label>
              <div className="grid grid-cols-3 gap-2">
                {(["unisex", "male", "female"] as const).map(type => (
                  <button
                    key={type}
                    onClick={() => setBasics(b => ({ ...b, salonType: type }))}
                    className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all capitalize ${basics.salonType === type ? "border-violet-500 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-500 hover:border-violet-200"}`}
                  >
                    {type === "unisex" ? "Unisex" : type === "male" ? "Men's" : "Women's"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: LOCATION & SOCIAL */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Where are you located?</h2>
              <p className="text-sm text-gray-500 mt-0.5">Help customers find you</p>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Full Address *</label>
              <Textarea placeholder="Shop No. 5, Main Bazaar, MG Road, Mumbai, Maharashtra" value={location.address} onChange={e => setLocation(l => ({ ...l, address: e.target.value }))} className="rounded-xl resize-none" rows={3} />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                <Globe className="w-4 h-4 inline mr-1 text-gray-400" />Google Maps Link
              </label>
              <Input placeholder="https://maps.google.com/..." value={location.googleMapsLink} onChange={e => setLocation(l => ({ ...l, googleMapsLink: e.target.value }))} className="rounded-xl h-11" />
              <p className="text-xs text-gray-400 mt-1">Paste the link from Google Maps → Share → Copy link</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  <Instagram className="w-4 h-4 inline mr-1 text-pink-400" />Instagram
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                  <Input placeholder="yoursalon" value={location.instagramId} onChange={e => setLocation(l => ({ ...l, instagramId: e.target.value.replace("@", "") }))} className="rounded-xl h-11 pl-7" />
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  <Facebook className="w-4 h-4 inline mr-1 text-blue-400" />Facebook
                </label>
                <Input placeholder="page name or ID" value={location.facebookId} onChange={e => setLocation(l => ({ ...l, facebookId: e.target.value }))} className="rounded-xl h-11" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SERVICES */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add your services</h2>
              <p className="text-sm text-gray-500 mt-0.5">Tap to add from presets, or add a custom one</p>
            </div>

            {/* Preset quick-add */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Quick Add — Tap to add</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_SERVICES.map((ps, i) => {
                  const added = services.find(s => s.name === ps.name);
                  return (
                    <button
                      key={i}
                      onClick={() => added ? removeService(services.findIndex(s => s.name === ps.name)) : addService(ps)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1 ${added ? "bg-violet-600 text-white border-violet-600" : "border-gray-200 text-gray-600 hover:border-violet-300 hover:text-violet-700"}`}
                    >
                      {added ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                      {ps.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom service */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Add Custom Service</p>
              <div className="grid grid-cols-5 gap-2">
                <div className="col-span-5 sm:col-span-2">
                  <Input placeholder="Service name" value={newService.name} onChange={e => setNewService(s => ({ ...s, name: e.target.value }))} className="rounded-xl h-10 text-sm" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="relative">
                    <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <Input type="number" placeholder="Price" value={newService.price} onChange={e => setNewService(s => ({ ...s, price: e.target.value }))} className="rounded-xl h-10 text-sm pl-6" />
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <div className="relative">
                    <Clock className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <Input type="number" placeholder="Min" value={newService.duration} onChange={e => setNewService(s => ({ ...s, duration: e.target.value }))} className="rounded-xl h-10 text-sm pl-6" />
                  </div>
                </div>
                <div className="col-span-1">
                  <Button onClick={() => addService()} className="w-full h-10 bg-violet-600 hover:bg-violet-700 rounded-xl px-2">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Added services list */}
            {services.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{services.length} service{services.length > 1 ? "s" : ""} added</p>
                {services.map((s, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-xl border px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <Scissors className="w-4 h-4 text-violet-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.name}</p>
                        <p className="text-xs text-gray-500">₹{s.price} · {s.duration} min</p>
                      </div>
                    </div>
                    <button onClick={() => removeService(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 3: STAFF */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add your team</h2>
              <p className="text-sm text-gray-500 mt-0.5">You can add more staff later too — this step is optional</p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Add Staff Member</p>
              <div className="flex gap-2">
                <Input
                  placeholder="Staff name"
                  value={newStaff.name}
                  onChange={e => setNewStaff(s => ({ ...s, name: e.target.value }))}
                  className="rounded-xl h-10 text-sm flex-1"
                  onKeyDown={e => e.key === "Enter" && addStaff()}
                />
                <select
                  value={newStaff.role}
                  onChange={e => setNewStaff(s => ({ ...s, role: e.target.value }))}
                  className="h-10 text-sm rounded-xl border border-gray-200 bg-white px-2 text-gray-700"
                >
                  {STAFF_ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <Button onClick={addStaff} className="h-10 bg-violet-600 hover:bg-violet-700 rounded-xl px-3">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {staffList.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{staffList.length} staff added</p>
                {staffList.map((st, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-xl border px-4 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm">{st.name[0]}</div>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{st.name}</p>
                        <p className="text-xs text-gray-500">{st.role}</p>
                      </div>
                    </div>
                    <button onClick={() => removeStaff(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No staff added yet</p>
                <p className="text-xs">You can skip this and add staff from your dashboard</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: SCHEDULE */}
        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Set your schedule</h2>
              <p className="text-sm text-gray-500 mt-0.5">When is your salon open?</p>
            </div>

            {/* Apply to all toggle */}
            <div className="flex items-center justify-between bg-violet-50 rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-violet-900">Apply same times to all open days</p>
                <p className="text-xs text-violet-600">Change one day and it updates all</p>
              </div>
              <button
                onClick={() => setApplyAll(!applyAll)}
                className={`w-11 h-6 rounded-full transition-all relative ${applyAll ? "bg-violet-600" : "bg-gray-300"}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${applyAll ? "left-5" : "left-0.5"}`} />
              </button>
            </div>

            {/* Days */}
            <div className="space-y-3">
              {DAYS.map((day, i) => {
                const sched = schedules[i];
                return (
                  <div key={i} className={`rounded-2xl border transition-all ${sched.isOpen ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100"}`}>
                    {/* Day header */}
                    <div className="flex items-center justify-between px-4 py-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => updateSchedule(i, "isOpen", !sched.isOpen)}
                          className={`w-10 h-5.5 h-6 rounded-full transition-all relative flex-shrink-0 ${sched.isOpen ? "bg-violet-600" : "bg-gray-300"}`}
                        >
                          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${sched.isOpen ? "left-4.5 left-[18px]" : "left-0.5"}`} />
                        </button>
                        <span className={`text-sm font-semibold ${sched.isOpen ? "text-gray-900" : "text-gray-400"}`}>{DAY_FULL[i]}</span>
                      </div>
                      {!sched.isOpen && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Closed</span>}
                    </div>

                    {sched.isOpen && (
                      <div className="px-4 pb-3 space-y-2 border-t pt-3">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 font-medium block mb-1">Opens</label>
                            <Input type="time" value={sched.openTime} onChange={e => updateSchedule(i, "openTime", e.target.value)} className="h-9 rounded-xl text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-medium block mb-1">Closes</label>
                            <Input type="time" value={sched.closeTime} onChange={e => updateSchedule(i, "closeTime", e.target.value)} className="h-9 rounded-xl text-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 font-medium block mb-1 flex items-center gap-1"><Coffee className="w-3 h-3" /> Break start</label>
                            <Input type="time" value={sched.breakStart} onChange={e => updateSchedule(i, "breakStart", e.target.value)} className="h-9 rounded-xl text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 font-medium block mb-1 flex items-center gap-1"><Coffee className="w-3 h-3" /> Break end</label>
                            <Input type="time" value={sched.breakEnd} onChange={e => updateSchedule(i, "breakEnd", e.target.value)} className="h-9 rounded-xl text-sm" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* One-off holidays */}
            <div className="bg-amber-50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-600" />
                <p className="text-sm font-semibold text-amber-900">One-off Holidays / Closed Days</p>
              </div>
              <p className="text-xs text-amber-700">Mark specific dates when your salon will be closed (public holidays, personal days, etc.)</p>
              <div className="flex gap-2">
                <Input type="date" value={oneOffInput} onChange={e => setOneOffInput(e.target.value)} className="rounded-xl h-9 text-sm flex-1" min={new Date().toISOString().split("T")[0]} />
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
                    <span key={d} className="flex items-center gap-1.5 bg-amber-100 text-amber-800 text-xs font-medium px-2.5 py-1 rounded-full">
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
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Add FAQs for customers</h2>
              <p className="text-sm text-gray-500 mt-0.5">Select from ready-made answers or write your own</p>
            </div>

            <div className="space-y-2">
              {PRESET_FAQS.map((faq, i) => (
                <button
                  key={i}
                  onClick={() => toggleFaq(i)}
                  className={`w-full text-left rounded-2xl border-2 p-4 transition-all ${selectedFaqs.has(i) ? "border-violet-400 bg-violet-50" : "border-gray-200 bg-white hover:border-violet-200"}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${selectedFaqs.has(i) ? "border-violet-500 bg-violet-500" : "border-gray-300"}`}>
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

            {/* Custom FAQ */}
            {customFaqs.map((faq, i) => (
              <div key={i} className="rounded-2xl border-2 border-green-300 bg-green-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{faq.q}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{faq.a}</p>
                  </div>
                  <button onClick={() => setCustomFaqs(prev => prev.filter((_, j) => j !== i))}>
                    <X className="w-4 h-4 text-gray-400 hover:text-red-400" />
                  </button>
                </div>
              </div>
            ))}

            <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Add Custom FAQ</p>
              <Input placeholder="Question" value={newFaq.q} onChange={e => setNewFaq(f => ({ ...f, q: e.target.value }))} className="rounded-xl h-10 text-sm" />
              <Textarea placeholder="Answer" value={newFaq.a} onChange={e => setNewFaq(f => ({ ...f, a: e.target.value }))} className="rounded-xl resize-none text-sm" rows={3} />
              <Button onClick={addCustomFaq} variant="outline" className="rounded-xl text-sm h-9 border-violet-200 text-violet-700 hover:bg-violet-50">
                <Plus className="w-3.5 h-3.5 mr-1" /> Add FAQ
              </Button>
            </div>

            {/* Summary */}
            <div className="bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl p-5 text-white">
              <p className="font-bold text-lg mb-3">Ready to launch! 🚀</p>
              <div className="space-y-1.5 text-sm text-violet-100">
                <p>✓ Salon: <span className="font-semibold text-white">{basics.name}</span></p>
                <p>✓ Services: <span className="font-semibold text-white">{services.length} service{services.length !== 1 ? "s" : ""}</span></p>
                <p>✓ Staff: <span className="font-semibold text-white">{staffList.length ? `${staffList.length} member${staffList.length !== 1 ? "s" : ""}` : "Not added yet"}</span></p>
                <p>✓ Hours: <span className="font-semibold text-white">{Object.values(schedules).filter(s => s.isOpen).length} days/week</span></p>
                <p>✓ FAQs: <span className="font-semibold text-white">{selectedFaqs.size + customFaqs.length} question{selectedFaqs.size + customFaqs.length !== 1 ? "s" : ""}</span></p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky bottom nav */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 z-30">
        <div className="max-w-2xl mx-auto flex gap-3">
          {step > 0 && (
            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="rounded-xl h-12 px-5">
              <ChevronLeft className="w-4 h-4 mr-1" /> Back
            </Button>
          )}
          <Button
            onClick={handleNext}
            disabled={saving || imgUploading}
            className="flex-1 h-12 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-semibold rounded-xl text-base"
          >
            {saving ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Setting up your salon...</>
            ) : step === STEPS.length - 1 ? (
              <><CheckCircle className="w-5 h-5 mr-2" /> Launch My Salon</>
            ) : (
              <>Continue <ChevronRight className="w-4 h-4 ml-1" /></>
            )}
          </Button>
          {step < STEPS.length - 1 && step === 3 && (
            <Button variant="ghost" onClick={() => setStep(4)} className="text-gray-400 text-sm rounded-xl">
              Skip
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
