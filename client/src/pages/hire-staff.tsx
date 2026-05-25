import { useState } from "react";
import PublicNav from "@/components/PublicNav";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  Briefcase,
  Star,
  Phone,
  User,
  Filter,
  ChevronRight,
  Building2,
  IndianRupee,
  Clock,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Users,
  Send,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { StaffRegistration } from "@/../../shared/schema";

const ROLES = [
  "All Roles",
  "Barber",
  "Hair Stylist",
  "Beautician",
  "Nail Artist",
  "Makeup Artist",
  "Helper",
  "Receptionist",
  "Spa Therapist",
  "Hair Color Specialist",
];

const CITIES = [
  "All Cities",
  "Mumbai",
  "Delhi",
  "Bangalore",
  "Chennai",
  "Hyderabad",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Jaipur",
  "Surat",
  "Lucknow",
  "Chandigarh",
  "Coimbatore",
  "Nagpur",
];

const EXPERIENCE_OPTIONS = [
  { label: "Any Experience", value: "all" },
  { label: "Fresher (0-1 yr)", value: "0" },
  { label: "1–3 years", value: "1" },
  { label: "3–5 years", value: "3" },
  { label: "5+ years", value: "5" },
];

export default function HireStaff() {
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [citySearch, setCitySearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [minExp, setMinExp] = useState("all");
  const [nameSearch, setNameSearch] = useState("");
  const [contactedId, setContactedId] = useState<string | null>(null);
  const [offerTarget, setOfferTarget] = useState<StaffRegistration | null>(null);
  const [offerMsg, setOfferMsg] = useState("");
  const [offerSalary, setOfferSalary] = useState("");
  const [sentOffers, setSentOffers] = useState<Set<string>>(new Set());

  const sendOfferMutation = useMutation({
    mutationFn: async (person: StaffRegistration) => {
      return apiRequest("POST", "/api/staff-job-offers", {
        professionalMobile: person.mobile,
        professionalName: person.fullName,
        role: person.role,
        message: offerMsg || undefined,
        offeredSalary: offerSalary ? parseInt(offerSalary) : undefined,
      });
    },
    onSuccess: (_, person) => {
      setSentOffers(prev => new Set([...prev, person.id]));
      setOfferTarget(null);
      setOfferMsg("");
      setOfferSalary("");
      toast({ title: "Job Offer Sent! 🎉", description: `${offerTarget?.fullName || "Professional"} will see your offer in their dashboard.` });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message || "Could not send offer", variant: "destructive" });
    },
  });

  const userType = (user as any)?.userType;
  const isSalonOwner = userType === "salon_owner";

  const { data: mySalons = [] } = useQuery<any[]>({
    queryKey: ["/api/salons/my"],
    enabled: isSalonOwner,
  });
  const hasSalon = mySalons.length > 0;

  const params = new URLSearchParams();
  if (citySearch.trim()) params.set("city", citySearch.trim());
  if (selectedRole !== "all") params.set("role", selectedRole);
  if (selectedGender !== "all") params.set("gender", selectedGender);

  const { data: staff = [], isLoading } = useQuery<StaffRegistration[]>({
    queryKey: ["/api/staff-registrations/search", citySearch, selectedRole, selectedGender],
    queryFn: async () => {
      const res = await fetch(`/api/staff-registrations/search?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const filtered = staff.filter((s) => {
    if (nameSearch.trim()) {
      const q = nameSearch.toLowerCase();
      if (!s.fullName.toLowerCase().includes(q) && !s.role.toLowerCase().includes(q)) return false;
    }
    if (minExp !== "all") {
      const exp = s.experience ?? 0;
      const minExpNum = parseInt(minExp);
      if (exp < minExpNum) return false;
      if (minExpNum === 5 && exp < 5) return false;
      if (minExpNum === 3 && (exp < 3 || exp >= 5)) return false;
      if (minExpNum === 1 && (exp < 1 || exp >= 3)) return false;
      if (minExpNum === 0 && exp > 1) return false;
    }
    return true;
  });

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      Barber: "bg-blue-100 text-blue-700",
      "Hair Stylist": "bg-purple-100 text-purple-700",
      Beautician: "bg-pink-100 text-pink-700",
      "Nail Artist": "bg-rose-100 text-rose-700",
      "Makeup Artist": "bg-orange-100 text-orange-700",
      Helper: "bg-gray-100 text-gray-700",
      Receptionist: "bg-teal-100 text-teal-700",
      "Spa Therapist": "bg-green-100 text-green-700",
      "Hair Color Specialist": "bg-amber-100 text-amber-700",
    };
    return colors[role] || "bg-indigo-100 text-indigo-700";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />

      {/* HERO BANNER */}
      <div className="bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white py-10 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
            🏪 For Salon Owners
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold mb-3">
            Find & Hire Skilled Salon Professionals
          </h1>
          <p className="text-teal-50 text-lg max-w-xl mx-auto mb-8">
            Browse verified barbers, stylists, beauticians and more. Filter by city, role, and experience to find the perfect fit for your salon.
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-2xl p-3 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto shadow-xl">
            <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3 py-2">
              <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <Input
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                placeholder="Search by city (e.g. Chennai, Mumbai)"
                className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0 placeholder:text-gray-400"
              />
            </div>
            <div className="flex items-center gap-2 flex-1 bg-gray-50 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <Input
                value={nameSearch}
                onChange={(e) => setNameSearch(e.target.value)}
                placeholder="Search by name or role"
                className="border-0 bg-transparent p-0 h-auto text-sm font-medium focus-visible:ring-0 placeholder:text-gray-400"
              />
            </div>
            <Button className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold rounded-xl px-6">
              <Search className="w-4 h-4 mr-1.5" /> Search
            </Button>
          </div>
        </div>
      </div>

      {/* ACCESS NOTICE */}
      {!isAuthenticated && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3 text-amber-800 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>You're browsing as a guest. <Link href="/auth" className="font-bold underline">Login as a Salon Owner</Link> to view contact details and connect with professionals.</span>
          </div>
        </div>
      )}
      {isAuthenticated && isSalonOwner && !hasSalon && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3 text-orange-800 text-sm">
            <Building2 className="w-4 h-4 flex-shrink-0" />
            <span>You need to <Link href="/owner/register" className="font-bold underline">register your salon first</Link> before you can connect with professionals.</span>
          </div>
        </div>
      )}
      {isAuthenticated && !isSalonOwner && (
        <div className="bg-blue-50 border-b border-blue-200 px-4 py-3">
          <div className="max-w-5xl mx-auto flex items-center gap-3 text-blue-800 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>This section is for Salon Owners. <Link href="/api/login?user_intent=salon_owner" className="font-bold underline">Switch to a Salon Owner account</Link> to hire staff.</span>
          </div>
        </div>
      )}

      {/* FILTERS + RESULTS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-6">

          {/* Sidebar Filters */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-20">
              <div className="flex items-center gap-2 mb-4 font-bold text-gray-800">
                <Filter className="w-4 h-4 text-purple-600" /> Filters
              </div>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Role</label>
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="w-full rounded-xl border-gray-200 text-sm">
                      <SelectValue placeholder="All Roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Roles</SelectItem>
                      {ROLES.slice(1).map((r) => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Gender</label>
                  <Select value={selectedGender} onValueChange={setSelectedGender}>
                    <SelectTrigger className="w-full rounded-xl border-gray-200 text-sm">
                      <SelectValue placeholder="Any Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any Gender</SelectItem>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="any">Any</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Experience</label>
                  <Select value={minExp} onValueChange={setMinExp}>
                    <SelectTrigger className="w-full rounded-xl border-gray-200 text-sm">
                      <SelectValue placeholder="Any Experience" />
                    </SelectTrigger>
                    <SelectContent>
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 block">Quick Cities</label>
                  <div className="flex flex-wrap gap-1.5">
                    {["Chennai", "Mumbai", "Delhi", "Bangalore", "Hyderabad"].map((c) => (
                      <button
                        key={c}
                        onClick={() => setCitySearch(citySearch === c ? "" : c)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                          citySearch === c
                            ? "bg-purple-600 text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-purple-100"
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl text-sm"
                  onClick={() => {
                    setCitySearch("");
                    setSelectedRole("all");
                    setSelectedGender("all");
                    setMinExp("all");
                    setNameSearch("");
                  }}
                >
                  Clear All Filters
                </Button>
              </div>
            </div>
          </aside>

          {/* Main Results */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {isLoading ? "Loading professionals..." : `${filtered.length} Professionals Found`}
                </h2>
                {(citySearch || selectedRole !== "all") && (
                  <p className="text-sm text-gray-500 mt-0.5">
                    {citySearch && `in "${citySearch}"`} {selectedRole !== "all" && `· ${selectedRole}`}
                  </p>
                )}
              </div>
            </div>

            {isLoading ? (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 animate-pulse">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 bg-gray-200 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-100 rounded" />
                      <div className="h-3 bg-gray-100 rounded w-5/6" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-700 mb-2">No professionals found</h3>
                <p className="text-gray-500 mb-4">Try adjusting your filters or search for a different city/role.</p>
                <Button variant="outline" onClick={() => { setCitySearch(""); setSelectedRole("all"); setMinExp("all"); }}>
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filtered.map((person) => (
                  <div key={person.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col">
                    {/* Profile top */}
                    <div className="p-5 flex-1">
                      <div className="flex items-start gap-3 mb-3">
                        <div className="relative flex-shrink-0">
                          {person.profileImageUrl ? (
                            <img
                              src={person.profileImageUrl}
                              alt={person.fullName}
                              className="w-14 h-14 rounded-full object-cover border-2 border-gray-100"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center border-2 border-gray-100">
                              <User className="w-7 h-7 text-purple-400" />
                            </div>
                          )}
                          {person.isVerified && (
                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-gray-900 truncate">{person.fullName}</h3>
                          <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full mt-0.5 ${getRoleBadgeColor(person.role)}`}>
                            {person.role}
                          </span>
                        </div>
                      </div>

                      {person.headline && (
                        <p className="text-xs text-gray-500 italic mb-3 line-clamp-2">"{person.headline}"</p>
                      )}

                      <div className="space-y-1.5 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{person.city}{person.area ? `, ${person.area}` : ""}</span>
                        </div>
                        {typeof person.experience === "number" && (
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-gray-400" />
                            <span>{person.experience === 0 ? "Fresher" : `${person.experience} yr${person.experience > 1 ? "s" : ""} experience`}</span>
                          </div>
                        )}
                        {person.expectedSalary && (
                          <div className="flex items-center gap-1.5">
                            <IndianRupee className="w-3.5 h-3.5 text-gray-400" />
                            <span>₹{person.expectedSalary.toLocaleString()}/month</span>
                          </div>
                        )}
                        {person.comfortableWith && person.comfortableWith !== "any" && (
                          <div className="flex items-center gap-1.5">
                            <Scissors className="w-3.5 h-3.5 text-gray-400" />
                            <span className="capitalize">{person.comfortableWith} clients</span>
                          </div>
                        )}
                      </div>

                      {person.skills && person.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {person.skills.slice(0, 4).map((skill, i) => (
                            <span key={i} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-medium">
                              {skill}
                            </span>
                          ))}
                          {person.skills.length > 4 && (
                            <span className="bg-gray-100 text-gray-400 text-[10px] px-2 py-0.5 rounded-full">
                              +{person.skills.length - 4}
                            </span>
                          )}
                        </div>
                      )}

                      {person.willingToRelocate && (
                        <div className="mt-2">
                          <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                            ✓ Open to Relocation
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action footer */}
                    <div className="px-5 pb-5 space-y-2">
                      {!isAuthenticated ? (
                        <Link href="/auth">
                          <Button size="sm" className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold">
                            Login to Connect
                          </Button>
                        </Link>
                      ) : !isSalonOwner ? (
                        <Link href="/auth">
                          <Button size="sm" variant="outline" className="w-full rounded-xl font-semibold text-sm">
                            Login as Salon Owner
                          </Button>
                        </Link>
                      ) : !hasSalon ? (
                        <Link href="/owner/register">
                          <Button size="sm" variant="outline" className="w-full rounded-xl font-semibold text-sm border-orange-300 text-orange-600 hover:bg-orange-50">
                            Register Your Salon First
                          </Button>
                        </Link>
                      ) : sentOffers.has(person.id) ? (
                        <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-semibold py-2 bg-emerald-50 rounded-xl border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4" /> Offer Sent!
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-semibold"
                            onClick={() => setContactedId(contactedId === person.id ? null : person.id)}
                          >
                            <Phone className="w-3.5 h-3.5 mr-1.5" /> View Contact
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="w-full rounded-xl font-semibold border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                            onClick={() => setOfferTarget(person)}
                          >
                            <Send className="w-3.5 h-3.5 mr-1.5" /> Send Job Offer
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Revealed contact */}
                    {contactedId === person.id && (
                      <div className="mx-5 mb-5 -mt-1 p-3 bg-green-50 rounded-xl border border-green-200">
                        <p className="text-xs text-green-700 font-semibold mb-1">Contact Details</p>
                        <a href={`tel:${person.mobile}`} className="flex items-center gap-2 text-sm font-bold text-green-800 hover:underline">
                          <Phone className="w-4 h-4" /> {person.mobile}
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CTA for professionals */}
      <div className="bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white py-12 px-4 mt-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Are You a Salon Professional?</h2>
          <p className="text-blue-100 mb-6 text-lg">
            Register your profile and get discovered by hundreds of verified salon owners across India.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/staff-registration">
              <Button size="lg" className="bg-white text-blue-700 hover:bg-blue-50 font-bold px-8 rounded-full shadow-lg">
                Register as a Professional →
              </Button>
            </Link>
            <Link href="/professional-login">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10 font-bold px-8 rounded-full bg-transparent">
                Professional Login / Check Offers
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-6 px-4 text-center text-sm">
        © Sanwar — Digitalizing India's Salon Industry · <Link href="/about" className="hover:text-white">About</Link> · <Link href="/contact" className="hover:text-white">Contact</Link> · <Link href="/privacy" className="hover:text-white">Privacy</Link>
      </footer>

      {/* Send Job Offer Dialog */}
      <Dialog open={!!offerTarget} onOpenChange={(open) => { if (!open) { setOfferTarget(null); setOfferMsg(""); setOfferSalary(""); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-indigo-600" />
              Send Job Offer
            </DialogTitle>
            <DialogDescription>
              Sending offer to <span className="font-semibold text-gray-900">{offerTarget?.fullName}</span> ({offerTarget?.role})
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Offered Salary (₹/month) <span className="normal-case font-normal text-gray-400">— optional</span>
              </label>
              <div className="relative">
                <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="number"
                  placeholder="e.g. 20000"
                  value={offerSalary}
                  onChange={(e) => setOfferSalary(e.target.value)}
                  className="pl-9 rounded-xl"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 block">
                Personal Message <span className="normal-case font-normal text-gray-400">— optional</span>
              </label>
              <Textarea
                placeholder="Tell them about your salon, work culture, and why they should join..."
                value={offerMsg}
                onChange={(e) => setOfferMsg(e.target.value)}
                className="rounded-xl resize-none"
                rows={4}
              />
            </div>

            <div className="flex gap-2 pt-1">
              <Button
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => { setOfferTarget(null); setOfferMsg(""); setOfferSalary(""); }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold"
                disabled={sendOfferMutation.isPending}
                onClick={() => offerTarget && sendOfferMutation.mutate(offerTarget)}
              >
                {sendOfferMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-1.5" />
                ) : (
                  <Send className="w-4 h-4 mr-1.5" />
                )}
                Send Offer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
