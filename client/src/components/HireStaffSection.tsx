import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import {
  MapPin,
  Briefcase,
  IndianRupee,
  Users,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  UserPlus,
} from "lucide-react";
import type { StaffRegistration } from "@shared/schema";

function getAvailabilityStyle(status: string | null) {
  if (!status) return { color: "text-gray-600", label: "Status unknown" };
  if (status.includes("Available")) return { color: "text-green-600", label: status };
  if (status.includes("Notice")) return { color: "text-orange-500", label: status };
  return { color: "text-yellow-600", label: status };
}

function getAvailabilityIcon(status: string | null) {
  if (!status) return <Clock className="h-4 w-4" />;
  if (status.includes("Available")) return <CheckCircle className="h-4 w-4" />;
  if (status.includes("Notice")) return <AlertCircle className="h-4 w-4" />;
  return <Clock className="h-4 w-4" />;
}

export default function HireStaffSection() {
  const { data: professionals = [], isLoading } = useQuery<StaffRegistration[]>({
    queryKey: ["/api/staff-registrations"],
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            🔥 Hire Salon Professionals
          </h2>
          <p className="text-gray-500 mt-1 text-sm">
            Browse and contact verified salon professionals looking for opportunities
          </p>
        </div>
        <Link href="/staff-registration">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full px-6 hover:shadow-lg flex items-center gap-2">
            <UserPlus className="h-4 w-4" />
            Register Staff
          </Button>
        </Link>
      </div>

      {/* Stats Banner */}
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

      {/* Professionals Grid */}
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
              <div className="h-3 bg-gray-200 rounded w-full mb-2" />
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
          <p className="text-gray-500 mb-6 max-w-xs mx-auto">
            Be the first to know when professionals register. Share the registration link with candidates!
          </p>
          <Link href="/staff-registration">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full px-8">
              Share Registration Link
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {professionals.map((pro) => {
            const availability = getAvailabilityStyle(pro.currentlyWorking ?? null);
            const AvailIcon = () => getAvailabilityIcon(pro.currentlyWorking ?? null);
            const initials = pro.fullName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2);

            return (
              <div
                key={pro.id}
                className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 relative border border-gray-50"
              >
                {/* Verified Badge */}
                {pro.isVerified && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified
                  </div>
                )}

                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-xl shadow flex-shrink-0">
                    {pro.profileImageUrl ? (
                      <img src={pro.profileImageUrl} alt={pro.fullName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 text-lg leading-tight truncate">{pro.fullName}</h3>
                    <p className="text-sm text-gray-500 leading-tight">
                      {pro.headline || `${pro.role}${pro.experience ? ` | ${pro.experience} Yrs Exp` : ""}`}
                    </p>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between items-center bg-gray-50 rounded-xl p-3 mb-4">
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-sm">{pro.experience || 0}+</p>
                    <p className="text-xs text-gray-500">Yrs Exp</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-sm">
                      {pro.expectedSalary ? `₹${(pro.expectedSalary / 1000).toFixed(0)}k` : "N/A"}
                    </p>
                    <p className="text-xs text-gray-500">Expected</p>
                  </div>
                  <div className="text-center">
                    <p className="font-bold text-gray-900 text-sm truncate max-w-[70px]">
                      {pro.comfortableWith || "Any"}
                    </p>
                    <p className="text-xs text-gray-500">Clients</p>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-gray-600 text-xs mb-3">
                  <MapPin className="h-3 w-3 flex-shrink-0" />
                  <span className="truncate">{pro.area}, {pro.city}</span>
                  {pro.willingToRelocate && (
                    <Badge variant="outline" className="ml-1 text-xs py-0 px-1 border-blue-300 text-blue-600">Relocate</Badge>
                  )}
                </div>

                {/* Skills */}
                {pro.skills && pro.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {pro.skills.slice(0, 4).map((skill) => (
                      <span
                        key={skill}
                        className="bg-blue-50 text-blue-700 text-xs px-2.5 py-1 rounded-full font-medium border border-blue-100"
                      >
                        {skill}
                      </span>
                    ))}
                    {pro.skills.length > 4 && (
                      <span className="text-xs text-gray-400 py-1">+{pro.skills.length - 4} more</span>
                    )}
                  </div>
                )}

                {/* Employment Type */}
                {pro.employmentType && (
                  <div className="flex items-center gap-1 text-gray-500 text-xs mb-3">
                    <Briefcase className="h-3 w-3" />
                    <span>{pro.employmentType}</span>
                  </div>
                )}

                {/* Availability */}
                <div className={`flex items-center gap-1.5 text-sm font-semibold mb-4 ${availability.color}`}>
                  <AvailIcon />
                  <span className="text-xs">{availability.label}</span>
                </div>

                {/* Contact Button */}
                <Button
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-semibold hover:shadow-lg hover:-translate-y-0.5 transition-all"
                  onClick={() => {
                    window.open(`tel:${pro.mobile}`, "_self");
                  }}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Professional
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
