import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Link } from "wouter";
import {
  MapPin,
  Briefcase,
  Users,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  UserPlus,
  X,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  MoveRight,
  Star,
} from "lucide-react";
import type { StaffRegistration } from "@shared/schema";

function getAvailability(status: string | null) {
  if (!status) return { color: "text-gray-500", bg: "bg-gray-100", label: "Status unknown", icon: Clock };
  if (status.includes("Available")) return { color: "text-green-700", bg: "bg-green-100", label: status, icon: CheckCircle };
  if (status.includes("Notice")) return { color: "text-orange-700", bg: "bg-orange-100", label: status, icon: AlertCircle };
  return { color: "text-yellow-700", bg: "bg-yellow-100", label: status, icon: Clock };
}

function Initials({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const sizeClass = size === "lg" ? "w-24 h-24 text-3xl" : size === "sm" ? "w-10 h-10 text-base" : "w-16 h-16 text-xl";
  return (
    <div className={`${sizeClass} rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold flex-shrink-0 shadow`}>
      {initials}
    </div>
  );
}

/* ─── Photo Lightbox ─────────────────────────────────────── */
function Lightbox({
  images,
  startIndex,
  onClose,
}: {
  images: string[];
  startIndex: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIndex);
  const prev = () => setIdx((i) => (i - 1 + images.length) % images.length);
  const next = () => setIdx((i) => (i + 1) % images.length);

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition"
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); prev(); }}
            className="absolute left-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); next(); }}
            className="absolute right-4 text-white bg-white/20 rounded-full p-2 hover:bg-white/30 transition"
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <img
        src={images[idx]}
        alt={`Photo ${idx + 1}`}
        className="max-h-[90vh] max-w-[90vw] object-contain rounded-xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />

      <div className="absolute bottom-4 text-white/60 text-sm">
        {idx + 1} / {images.length}
      </div>
    </div>
  );
}

/* ─── Full Profile Modal ─────────────────────────────────── */
function ProfileModal({
  pro,
  onClose,
}: {
  pro: StaffRegistration;
  onClose: () => void;
}) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const avail = getAvailability(pro.currentlyWorking ?? null);
  const AvailIcon = avail.icon;

  const allPhotos = [
    ...(pro.portfolioImages ?? []),
  ];

  return (
    <>
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="max-w-lg w-full p-0 overflow-hidden rounded-2xl max-h-[90vh] overflow-y-auto">
          {/* Header banner */}
          <div className="relative bg-gradient-to-br from-blue-600 to-purple-700 pt-8 pb-16 px-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-white/80 hover:text-white bg-white/15 rounded-full p-1.5 transition"
            >
              <X className="h-4 w-4" />
            </button>
            {pro.isVerified && (
              <div className="absolute top-3 left-3 bg-white/20 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Verified
              </div>
            )}
          </div>

          {/* Profile photo floats over banner */}
          <div className="px-6 -mt-10 relative z-10">
            <div className="flex items-end gap-4 mb-4">
              <div className="w-20 h-20 rounded-2xl border-4 border-white shadow-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-blue-400 to-purple-500">
                {pro.profileImageUrl ? (
                  <img
                    src={pro.profileImageUrl}
                    alt={pro.fullName}
                    className="w-full h-full object-cover cursor-pointer"
                    onClick={() => pro.profileImageUrl && setLightboxIdx(-1)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-2xl">
                    {pro.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-gray-900 leading-tight">{pro.fullName}</h2>
                <p className="text-sm text-gray-500">
                  {pro.headline || `${pro.role}${pro.experience ? ` | ${pro.experience} Yrs Exp` : ""}`}
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 divide-x divide-gray-100 bg-gray-50 rounded-2xl p-3 mb-5 border border-gray-100">
              <div className="text-center px-2">
                <p className="font-bold text-gray-900 text-lg">{pro.experience || 0}+</p>
                <p className="text-xs text-gray-500">Yrs Exp</p>
              </div>
              <div className="text-center px-2">
                <p className="font-bold text-gray-900 text-lg">
                  {pro.expectedSalary ? `₹${(pro.expectedSalary / 1000).toFixed(0)}k` : "N/A"}
                </p>
                <p className="text-xs text-gray-500">Expected</p>
              </div>
              <div className="text-center px-2">
                <p className="font-bold text-gray-900 text-sm leading-tight">
                  {pro.comfortableWith?.replace(" Clients", "") || "Any"}
                </p>
                <p className="text-xs text-gray-500">Clients</p>
              </div>
            </div>

            {/* Location & Availability */}
            <div className="flex flex-wrap gap-3 mb-5">
              <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                <MapPin className="h-4 w-4 text-gray-400" />
                <span>{pro.area}, {pro.city}</span>
                {pro.willingToRelocate && (
                  <span className="ml-1 text-xs bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full">
                    Open to relocate
                  </span>
                )}
              </div>
              {pro.employmentType && (
                <div className="flex items-center gap-1.5 text-gray-600 text-sm">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span>{pro.employmentType}</span>
                </div>
              )}
            </div>

            {/* Availability status */}
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-5 ${avail.bg} ${avail.color}`}>
              <AvailIcon className="h-4 w-4" />
              {avail.label}
            </div>

            {/* Skills */}
            {pro.skills && pro.skills.length > 0 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {pro.skills.map((skill) => (
                    <span
                      key={skill}
                      className="bg-blue-50 text-blue-700 text-sm px-3 py-1 rounded-full font-medium border border-blue-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Bio */}
            {pro.bio && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">About</p>
                <p className="text-sm text-gray-700 leading-relaxed">{pro.bio}</p>
              </div>
            )}

            {/* Work Photos */}
            {pro.portfolioImages && pro.portfolioImages.length > 0 && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Work Photos</p>
                <div className="grid grid-cols-3 gap-2">
                  {pro.portfolioImages.map((img, i) => (
                    <div
                      key={i}
                      className="relative group cursor-pointer overflow-hidden rounded-xl aspect-square"
                      onClick={() => setLightboxIdx(i)}
                    >
                      <img
                        src={img}
                        alt={`Work ${i + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">View</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile photo full-view */}
            {pro.profileImageUrl && (
              <div className="mb-6">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Profile Photo</p>
                <div
                  className="relative group cursor-pointer overflow-hidden rounded-xl w-32 h-32"
                  onClick={() => setLightboxIdx(-1)}
                >
                  <img
                    src={pro.profileImageUrl}
                    alt={pro.fullName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-xs font-medium">View</span>
                  </div>
                </div>
              </div>
            )}

            {/* Contact CTA */}
            <div className="pb-6">
              <Button
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full py-6 text-base font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all"
                onClick={() => window.open(`tel:${pro.mobile}`, "_self")}
              >
                <Phone className="h-5 w-5 mr-2" />
                Contact Professional
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lightbox for portfolio images */}
      {lightboxIdx !== null && (
        <Lightbox
          images={
            lightboxIdx === -1
              ? [pro.profileImageUrl!]
              : pro.portfolioImages ?? []
          }
          startIndex={lightboxIdx === -1 ? 0 : lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

/* ─── Main Section ───────────────────────────────────────── */
export default function HireStaffSection() {
  const [selected, setSelected] = useState<StaffRegistration | null>(null);

  const { data: professionals = [], isLoading } = useQuery<StaffRegistration[]>({
    queryKey: ["/api/staff-registrations"],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">🔥 Hire Salon Professionals</h2>
          <p className="text-gray-500 mt-1 text-sm">Browse and contact verified salon professionals looking for opportunities</p>
        </div>
        <Link href="/staff-registration">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full px-6 hover:shadow-lg flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Register Staff
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 text-center border border-blue-100">
          <p className="text-2xl font-bold text-blue-700">{professionals.length}</p>
          <p className="text-xs text-blue-600 font-medium mt-1">Total Profiles</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-4 text-center border border-green-100">
          <p className="text-2xl font-bold text-green-700">
            {professionals.filter(p => p.currentlyWorking?.includes("Available")).length}
          </p>
          <p className="text-xs text-green-600 font-medium mt-1">Available Now</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-2xl p-4 text-center border border-purple-100">
          <p className="text-2xl font-bold text-purple-700">
            {[...new Set(professionals.map(p => p.role))].length}
          </p>
          <p className="text-xs text-purple-600 font-medium mt-1">Roles Available</p>
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-gray-200" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                </div>
              </div>
              <div className="h-3 bg-gray-200 rounded mb-2" />
              <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
              <div className="h-10 bg-gray-200 rounded-full" />
            </div>
          ))}
        </div>
      ) : professionals.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-10 w-10 text-blue-500" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No professionals yet</h3>
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">Share the registration link with candidates!</p>
          <Link href="/staff-registration">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full px-8">
              Share Registration Link
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {professionals.map((pro) => {
            const avail = getAvailability(pro.currentlyWorking ?? null);
            const AvailIcon = avail.icon;

            return (
              <div
                key={pro.id}
                className="bg-white rounded-2xl p-5 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative border border-gray-50 cursor-pointer group"
                onClick={() => setSelected(pro)}
              >
                {pro.isVerified && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </div>
                )}

                {/* Profile Header */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg shadow flex-shrink-0">
                    {pro.profileImageUrl ? (
                      <img src={pro.profileImageUrl} alt={pro.fullName} className="w-full h-full object-cover" />
                    ) : (
                      pro.fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 leading-tight truncate">{pro.fullName}</h3>
                    <p className="text-xs text-gray-500 leading-tight truncate">
                      {pro.headline || `${pro.role}${pro.experience ? ` | ${pro.experience} Yrs` : ""}`}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between bg-gray-50 rounded-xl p-3 mb-3">
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-sm">{pro.experience || 0}+</p>
                    <p className="text-[10px] text-gray-500">Yrs Exp</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-sm">
                      {pro.expectedSalary ? `₹${(pro.expectedSalary / 1000).toFixed(0)}k` : "N/A"}
                    </p>
                    <p className="text-[10px] text-gray-500">Expected</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-sm truncate max-w-[60px]">
                      {pro.comfortableWith?.replace(" Clients", "") || "Any"}
                    </p>
                    <p className="text-[10px] text-gray-500">Clients</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{pro.area}, {pro.city}</span>
                </div>

                {/* Skills */}
                {pro.skills && pro.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {pro.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full border border-blue-100">
                        {skill}
                      </span>
                    ))}
                    {pro.skills.length > 3 && (
                      <span className="text-xs text-gray-400">+{pro.skills.length - 3} more</span>
                    )}
                  </div>
                )}

                {/* Work photos strip */}
                {pro.portfolioImages && pro.portfolioImages.length > 0 && (
                  <div className="flex gap-1.5 mb-3">
                    {pro.portfolioImages.slice(0, 3).map((img, i) => (
                      <div key={i} className="flex-1 h-16 rounded-lg overflow-hidden border border-gray-100">
                        <img src={img} alt={`Work ${i + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* Availability */}
                <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-3 ${avail.bg} ${avail.color}`}>
                  <AvailIcon className="h-3 w-3" />
                  {avail.label}
                </div>

                {/* View full profile hint */}
                <div className="flex items-center gap-1 text-blue-600 text-xs font-semibold mt-1 group-hover:gap-2 transition-all">
                  <span>View full profile</span>
                  <MoveRight className="h-3.5 w-3.5" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Profile Modal */}
      {selected && (
        <ProfileModal pro={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
