import { useState } from "react";
import { Link } from "wouter";
import { Search, Scissors, Sparkles, Waves, Crown, HandMetal, Palette, Star, MapPin, SlidersHorizontal, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "@/contexts/LocationContext";
import type { Salon } from "@shared/schema";

const CATEGORIES = [
  { label: "All", icon: null, filter: "" },
  { label: "Haircut", icon: Scissors, filter: "haircut" },
  { label: "Spa", icon: Waves, filter: "spa" },
  { label: "Facial", icon: Sparkles, filter: "facial" },
  { label: "Bridal", icon: Crown, filter: "bridal" },
  { label: "Beard", icon: HandMetal, filter: "beard" },
  { label: "Color", icon: Palette, filter: "color" },
];

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const { locationPreference } = useLocation();

  const { data: nearbySalons = [], isLoading: nearbyLoading } = useQuery<Salon[]>({
    queryKey: ["/api/salons/nearby", locationPreference?.lat, locationPreference?.lng],
    queryFn: async () => {
      if (!locationPreference?.lat || !locationPreference?.lng) return [];
      const res = await fetch(
        `/api/salons/nearby?lat=${locationPreference.lat}&lng=${locationPreference.lng}&radius=${locationPreference.radius || 30}`
      );
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!locationPreference?.lat,
    staleTime: 2 * 60 * 1000,
  });

  const { data: featuredSalons = [], isLoading: featuredLoading } = useQuery<Salon[]>({
    queryKey: ["/api/salons/featured"],
    staleTime: 5 * 60 * 1000,
  });

  const allSalons = nearbySalons.length > 0 ? nearbySalons : featuredSalons;
  const isLoading = nearbyLoading || featuredLoading;

  const filtered = allSalons.filter((s) => {
    const matchSearch =
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.address?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      !activeCategory ||
      s.name?.toLowerCase().includes(activeCategory) ||
      (s as any).services?.some((svc: any) =>
        svc.name?.toLowerCase().includes(activeCategory)
      );
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-pink-600 px-4 pt-6 pb-8">
        <h1 className="text-white text-xl font-bold mb-1">Explore Salons</h1>
        <p className="text-purple-200 text-sm mb-4">
          {locationPreference?.lat ? "Salons near you" : "Top-rated salons"}
        </p>

        {/* Search bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search salons, services..."
            className="pl-9 pr-9 bg-white border-0 h-11 rounded-xl text-sm shadow-lg"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className="px-4 -mt-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map(({ label, icon: Icon, filter }) => {
            const active = activeCategory === filter;
            return (
              <button
                key={label}
                onClick={() => setActiveCategory(filter)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 shadow-sm ${
                  active
                    ? "bg-purple-600 text-white border-purple-600"
                    : "bg-white text-gray-600 border-gray-200 hover:border-purple-300"
                }`}
              >
                {Icon && <Icon className="h-3.5 w-3.5" />}
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results */}
      <div className="px-4 mt-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">
            {isLoading ? "Finding salons..." : `${filtered.length} salon${filtered.length !== 1 ? "s" : ""} found`}
          </p>
          {nearbySalons.length > 0 && (
            <span className="flex items-center gap-1 text-xs text-purple-600 font-medium">
              <MapPin className="h-3 w-3" /> Near you
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-28 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <Scissors className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No salons found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different search or category</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={() => { setSearch(""); setActiveCategory(""); }}
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((salon) => (
              <Link key={salon.id} href={`/salon/${salon.id}`}>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex gap-3 active:scale-[0.98] transition-transform cursor-pointer">
                  {/* Image / placeholder */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-100 to-pink-100">
                    {(salon as any).imageUrl ? (
                      <img
                        src={(salon as any).imageUrl}
                        alt={salon.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Scissors className="h-8 w-8 text-purple-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-gray-900 text-sm truncate">{salon.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                      <p className="text-xs text-gray-500 truncate">{salon.address}</p>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {(salon as any).rating != null && (
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-amber-600">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                          {Number((salon as any).rating).toFixed(1)}
                        </span>
                      )}
                      {(salon as any).distance != null && (
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5 text-purple-600 border-purple-200">
                          {Number((salon as any).distance).toFixed(1)} km
                        </Badge>
                      )}
                      {(salon as any).isVerified && (
                        <Badge className="text-[10px] h-4 px-1.5 bg-green-100 text-green-700 border-0">
                          ✓ Verified
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 self-center text-gray-300">›</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
