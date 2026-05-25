import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  User, MapPin, Briefcase, Clock, IndianRupee, Scissors,
  CheckCircle, XCircle, LogOut, Sparkles, Phone, Building2,
  Bell, Star, ArrowLeft, Loader2, RefreshCw
} from "lucide-react";
import type { StaffRegistration, StaffJobOffer } from "@/../../shared/schema";

const PROFESSIONAL_TOKEN_KEY = "sanwar_professional_token";

function getToken() { return localStorage.getItem(PROFESSIONAL_TOKEN_KEY); }
function getHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

export default function ProfessionalDashboard() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"offers" | "profile">("offers");

  const token = getToken();
  useEffect(() => {
    if (!token) setLocation("/professional-login");
  }, [token]);

  const { data: profile, isLoading: profileLoading } = useQuery<StaffRegistration>({
    queryKey: ["/api/professional/me"],
    queryFn: async () => {
      const res = await fetch("/api/professional/me", { headers: getHeaders() });
      if (!res.ok) {
        if (res.status === 401) { localStorage.removeItem(PROFESSIONAL_TOKEN_KEY); setLocation("/professional-login"); }
        throw new Error("Failed to fetch profile");
      }
      return res.json();
    },
    enabled: !!token,
  });

  const { data: offers = [], isLoading: offersLoading, refetch } = useQuery<StaffJobOffer[]>({
    queryKey: ["/api/professional/job-offers"],
    queryFn: async () => {
      const res = await fetch("/api/professional/job-offers", { headers: getHeaders() });
      if (!res.ok) throw new Error("Failed to fetch offers");
      return res.json();
    },
    enabled: !!token,
  });

  const updateOfferMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/professional/job-offers/${id}`, {
        method: "PUT",
        headers: { ...getHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update offer");
      return res.json();
    },
    onSuccess: (_, { status }) => {
      toast({ title: status === "accepted" ? "Offer Accepted! 🎉" : "Offer Declined", description: status === "accepted" ? "The salon owner will be notified." : "You've declined this offer." });
      queryClient.invalidateQueries({ queryKey: ["/api/professional/job-offers"] });
    },
    onError: () => toast({ title: "Error", description: "Could not update offer.", variant: "destructive" }),
  });

  const logout = () => {
    localStorage.removeItem(PROFESSIONAL_TOKEN_KEY);
    setLocation("/professional-portal");
  };

  if (!token) return null;
  if (profileLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
    </div>
  );

  const pending = offers.filter(o => o.status === "pending");
  const accepted = offers.filter(o => o.status === "accepted");
  const rejected = offers.filter(o => o.status === "rejected");

  const getStatusColor = (status: string) => {
    if (status === "accepted") return "bg-green-100 text-green-700 border-green-200";
    if (status === "rejected") return "bg-red-100 text-red-700 border-red-200";
    return "bg-amber-100 text-amber-700 border-amber-200";
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/professional-portal">
              <ArrowLeft className="w-5 h-5 cursor-pointer opacity-80 hover:opacity-100" />
            </Link>
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-xs text-indigo-200">Professional Portal</p>
              <p className="font-bold text-sm">{profile?.fullName || "Professional"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {pending.length > 0 && (
              <div className="relative">
                <Bell className="w-5 h-5 text-white" />
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold">
                  {pending.length}
                </span>
              </div>
            )}
            <button onClick={logout} className="flex items-center gap-1.5 text-xs text-indigo-200 hover:text-white">
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </div>

        {/* Profile summary in header */}
        {profile && (
          <div className="max-w-3xl mx-auto px-4 pb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center overflow-hidden flex-shrink-0">
                {profile.profileImageUrl ? (
                  <img src={profile.profileImageUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                ) : (
                  <User className="w-8 h-8 text-white" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-extrabold">{profile.fullName}</h1>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="bg-white/20 text-xs px-2 py-0.5 rounded-full font-medium">{profile.role}</span>
                  {profile.city && (
                    <span className="text-indigo-200 text-xs flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {profile.city}
                    </span>
                  )}
                  {profile.isVerified && (
                    <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                      <CheckCircle className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 mt-4">
              {[
                { label: "Job Offers", value: offers.length, icon: Briefcase },
                { label: "Accepted", value: accepted.length, icon: CheckCircle },
                { label: "Experience", value: profile.experience === 0 ? "Fresher" : `${profile.experience}yr`, icon: Star },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="bg-white/15 rounded-xl p-3 text-center border border-white/20">
                  <p className="text-lg font-bold">{value}</p>
                  <p className="text-[10px] text-indigo-200">{label}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="max-w-3xl mx-auto px-4">
        <div className="flex border-b border-gray-200 bg-white rounded-t-none">
          {[
            { id: "offers", label: `Job Offers${pending.length > 0 ? ` (${pending.length})` : ""}` },
            { id: "profile", label: "My Profile" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "text-indigo-600 border-b-2 border-indigo-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="py-6">
          {/* Job Offers Tab */}
          {activeTab === "offers" && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-gray-900">
                  {offersLoading ? "Loading..." : `${offers.length} Job Offer${offers.length !== 1 ? "s" : ""}`}
                </h2>
                <button onClick={() => refetch()} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                  <RefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              {offersLoading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <div key={i} className="bg-white rounded-2xl p-5 animate-pulse border border-gray-100">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-3" />
                      <div className="h-3 bg-gray-100 rounded w-3/4" />
                    </div>
                  ))}
                </div>
              ) : offers.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
                  <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Briefcase className="w-8 h-8 text-indigo-400" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-700 mb-2">No Job Offers Yet</h3>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto">
                    Salon owners can find and send you offers once you have a profile. Make sure your profile is complete!
                  </p>
                  <Link href="/staff-registration">
                    <Button className="mt-4 bg-indigo-600 text-white">Update Profile</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {offers.map((offer) => (
                    <div key={offer.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center flex-shrink-0">
                              <Building2 className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-gray-900">{offer.salonName}</h3>
                              {offer.salonCity && (
                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" /> {offer.salonCity}
                                </p>
                              )}
                            </div>
                          </div>
                          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border capitalize ${getStatusColor(offer.status || "pending")}`}>
                            {offer.status || "pending"}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-3 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1.5">
                            <Scissors className="w-3.5 h-3.5 text-gray-400" /> {offer.role}
                          </span>
                          {offer.offeredSalary && (
                            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                              <IndianRupee className="w-3.5 h-3.5" /> ₹{offer.offeredSalary.toLocaleString()}/month
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-gray-400 text-xs">
                            <Clock className="w-3 h-3" />
                            {new Date(offer.createdAt!).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </div>

                        {offer.message && (
                          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600 italic border border-gray-100 mb-3">
                            "{offer.message}"
                          </div>
                        )}

                        {offer.ownerPhone && offer.status === "accepted" && (
                          <a href={`tel:${offer.ownerPhone}`} className="flex items-center gap-2 text-sm text-emerald-600 font-semibold bg-emerald-50 rounded-xl p-2.5 border border-emerald-100 mb-3">
                            <Phone className="w-4 h-4" /> Call Salon: {offer.ownerPhone}
                          </a>
                        )}

                        {offer.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold"
                              disabled={updateOfferMutation.isPending}
                              onClick={() => updateOfferMutation.mutate({ id: offer.id, status: "accepted" })}
                            >
                              <CheckCircle className="w-3.5 h-3.5 mr-1.5" /> Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="flex-1 border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-semibold"
                              disabled={updateOfferMutation.isPending}
                              onClick={() => updateOfferMutation.mutate({ id: offer.id, status: "rejected" })}
                            >
                              <XCircle className="w-3.5 h-3.5 mr-1.5" /> Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === "profile" && profile && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-900">Your Profile</h2>
                <Link href="/staff-registration">
                  <Button size="sm" variant="outline" className="text-xs rounded-xl">Edit Profile</Button>
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                {[
                  { label: "Full Name", value: profile.fullName, icon: User },
                  { label: "Mobile", value: profile.mobile, icon: Phone },
                  { label: "Role", value: profile.role, icon: Scissors },
                  { label: "City", value: `${profile.city}${profile.area ? `, ${profile.area}` : ""}`, icon: MapPin },
                  { label: "Experience", value: profile.experience === 0 ? "Fresher" : `${profile.experience} year(s)`, icon: Clock },
                  { label: "Expected Salary", value: profile.expectedSalary ? `₹${profile.expectedSalary.toLocaleString()}/month` : "Not set", icon: IndianRupee },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                    <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-[10px] text-gray-400 font-semibold uppercase tracking-wide">{label}</p>
                      <p className="text-gray-800 font-medium">{value || "—"}</p>
                    </div>
                  </div>
                ))}
              </div>

              {profile.headline && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Headline</p>
                  <p className="text-sm text-gray-700 italic">"{profile.headline}"</p>
                </div>
              )}

              {profile.skills && profile.skills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Skills</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map((s, i) => (
                      <span key={i} className="bg-indigo-50 text-indigo-700 text-xs px-3 py-1 rounded-full font-medium border border-indigo-100">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {profile.bio && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">About</p>
                  <p className="text-sm text-gray-600">{profile.bio}</p>
                </div>
              )}

              {profile.willingToRelocate && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 rounded-xl p-3 border border-green-100">
                  <CheckCircle className="w-4 h-4" /> Open to Relocation
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
