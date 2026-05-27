import { useState, useMemo } from "react";
import { Link } from "wouter";
import {
  Search, Scissors, Sparkles, Waves, Crown, HandMetal, Palette,
  Star, MapPin, X, SlidersHorizontal, Tag, ChevronDown, ChevronUp, Check
} from "lucide-react";
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

const RATING_OPTIONS = [
  { label: "Any Rating", value: 0 },
  { label: "3★ & above", value: 3 },
  { label: "4★ & above", value: 4 },
  { label: "4.5★ & above", value: 4.5 },
];

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.4;
  return (
    <div className={`flex items-center gap-0.5 ${size === "md" ? "gap-1" : ""}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`${size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} ${
            i <= full
              ? "fill-amber-400 text-amber-400"
              : i === full + 1 && half
              ? "fill-amber-200 text-amber-400"
              : "fill-gray-200 text-gray-300"
          }`}
        />
      ))}
    </div>
  );
}

type SalonWithExtras = Salon & {
  distance?: number;
  primaryImageUrl?: string | null;
  hasActiveOffers?: boolean;
};

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [showFilters, setShowFilters] = useState(true);
  const [minRating, setMinRating] = useState(0);
  const [selectedBrand, setSelectedBrand] = useState("");
  const [offersOnly, setOffersOnly] = useState(false);
  const { locationPreference } = useLocation();

  const { data: nearbySalons = [], isLoading: nearbyLoading } = useQuery<SalonWithExtras[]>({
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

  const { data: featuredSalons = [], isLoading: featuredLoading } = useQuery<SalonWithExtras[]>({
    queryKey: ["/api/salons/featured"],
    staleTime: 5 * 60 * 1000,
  });

  const allSalons = nearbySalons.length > 0 ? nearbySalons : featuredSalons;
  const isLoading = nearbyLoading || featuredLoading;

  const brands = useMemo(() => {
    const set = new Set<string>();
    allSalons.forEach((s) => { if ((s as any).brandName) set.add((s as any).brandName); });
    return Array.from(set).sort();
  }, [allSalons]);

  const activeFilterCount = (minRating > 0 ? 1 : 0) + (selectedBrand ? 1 : 0) + (offersOnly ? 1 : 0);

  const filtered = allSalons.filter((s) => {
    const matchSearch =
      !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.address?.toLowerCase().includes(search.toLowerCase());
    const matchCategory =
      !activeCategory ||
      s.name?.toLowerCase().includes(activeCategory) ||
      (s as any).services?.some((svc: any) => svc.name?.toLowerCase().includes(activeCategory));
    const matchRating =
      minRating === 0 || parseFloat((s as any).averageRating || "0") >= minRating;
    const matchBrand =
      !selectedBrand || (s as any).brandName === selectedBrand;
    const matchOffers =
      !offersOnly || (s as any).hasActiveOffers === true;
    return matchSearch && matchCategory && matchRating && matchBrand && matchOffers;
  });

  const clearAllFilters = () => {
    setMinRating(0);
    setSelectedBrand("");
    setOffersOnly(false);
    setSearch("");
    setActiveCategory("");
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-purple-700 via-purple-600 to-pink-500 px-4 pt-8 pb-10">
        <h1 className="text-white text-2xl font-bold mb-0.5">Explore Salons</h1>
        <p className="text-purple-200 text-sm mb-5">
          {locationPreference?.lat ? "Salons near you" : "Top-rated salons"}
        </p>
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search salons, services..."
            className="pl-10 pr-10 bg-white border-0 h-12 rounded-2xl text-sm shadow-xl"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3.5 top-1/2 -translate-y-1/2">
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* Category pills */}
      <div className="px-4 -mt-5">
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {CATEGORIES.map(({ label, icon: Icon, filter }) => {
            const active = activeCategory === filter;
            return (
              <button
                key={label}
                onClick={() => setActiveCategory(filter)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap border transition-all flex-shrink-0 shadow-sm ${
                  active
                    ? "bg-purple-600 text-white border-purple-600 shadow-purple-200 shadow-md"
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

      {/* Results bar + filter button */}
      <div className="px-4 mt-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">
          {isLoading
            ? "Finding salons…"
            : `${filtered.length} salon${filtered.length !== 1 ? "s" : ""} found`}
          {nearbySalons.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-xs text-purple-600 font-medium">
              <MapPin className="h-3 w-3" /> Near you
            </span>
          )}
        </p>
        <button
          onClick={() => setShowFilters((v) => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
            activeFilterCount > 0
              ? "bg-purple-600 text-white border-purple-600"
              : "bg-white text-gray-600 border-gray-200"
          }`}
        >
          <SlidersHorizontal className="h-3.5 w-3.5" />
          Filters
          {activeFilterCount > 0 && (
            <span className="bg-white text-purple-600 rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold ml-0.5">
              {activeFilterCount}
            </span>
          )}
          {showFilters ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </button>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <div className="mx-4 mt-3 bg-white rounded-2xl border border-gray-100 shadow-md p-4 space-y-4">
          {/* Rating filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Minimum Rating</p>
            <div className="flex flex-wrap gap-2">
              {RATING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setMinRating(opt.value)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    minRating === opt.value
                      ? "bg-amber-500 text-white border-amber-500"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  {opt.value > 0 && <Star className="h-3 w-3 fill-current" />}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Offers filter */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Tag className="h-4 w-4 text-green-600" />
              <p className="text-sm font-medium text-gray-700">Has Active Offers</p>
            </div>
            <button
              onClick={() => setOffersOnly((v) => !v)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                offersOnly ? "bg-green-500" : "bg-gray-200"
              }`}
            >
              <div
                className={`w-4.5 h-4.5 bg-white rounded-full shadow absolute top-0.5 transition-transform ${
                  offersOnly ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Brand filter */}
          {brands.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Brand</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedBrand("")}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    !selectedBrand
                      ? "bg-purple-600 text-white border-purple-600"
                      : "bg-gray-50 text-gray-600 border-gray-200"
                  }`}
                >
                  All Brands
                </button>
                {brands.map((brand) => (
                  <button
                    key={brand}
                    onClick={() => setSelectedBrand(brand === selectedBrand ? "" : brand)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                      selectedBrand === brand
                        ? "bg-purple-600 text-white border-purple-600"
                        : "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {selectedBrand === brand && <Check className="h-3 w-3" />}
                    {brand}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeFilterCount > 0 && (
            <button
              onClick={() => { setMinRating(0); setSelectedBrand(""); setOffersOnly(false); }}
              className="text-xs text-red-500 font-semibold mt-1"
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Salon list */}
      <div className="px-4 mt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-purple-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Scissors className="h-8 w-8 text-purple-300" />
            </div>
            <p className="text-gray-700 font-semibold">No salons found</p>
            <p className="text-gray-400 text-sm mt-1">Try different filters or search terms</p>
            <Button variant="outline" size="sm" className="mt-4 rounded-xl" onClick={clearAllFilters}>
              Clear all filters
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((salon) => {
              const rating = parseFloat((salon as any).averageRating || "0");
              const reviews = (salon as any).totalReviews || 0;
              const brand = (salon as any).brandName;
              const distance = (salon as any).distance;
              const imgUrl = (salon as any).primaryImageUrl || (salon as any).imageUrl;
              const hasOffers = (salon as any).hasActiveOffers;

              return (
                <Link key={salon.id} href={`/salon/${salon.id}`}>
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden active:scale-[0.98] transition-transform cursor-pointer">
                    <div className="flex gap-0">
                      {/* Image */}
                      <div className="w-28 h-28 flex-shrink-0 bg-gradient-to-br from-purple-100 to-pink-100 relative">
                        {imgUrl ? (
                          <img src={imgUrl} alt={salon.name} className="w-full h-full object-cover"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).src = "https://images.unsplash.com/photo-1560066984-138dadb4c035?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200"; }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Scissors className="h-10 w-10 text-purple-300" />
                          </div>
                        )}
                        {hasOffers && (
                          <div className="absolute top-1.5 left-1.5 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Tag className="h-2 w-2" /> OFFER
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0 p-3 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between gap-1">
                            <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2 flex-1">
                              {salon.name}
                            </h3>
                            {(salon as any).isVerified && (
                              <span className="flex-shrink-0 bg-blue-50 text-blue-600 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-blue-100">
                                ✓
                              </span>
                            )}
                          </div>

                          {brand && (
                            <p className="text-[10px] text-purple-600 font-semibold mt-0.5">{brand}</p>
                          )}

                          <div className="flex items-center gap-1 mt-1">
                            <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                            <p className="text-xs text-gray-500 truncate">{salon.address}</p>
                          </div>
                        </div>

                        {/* Bottom row: rating + distance */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center gap-1.5">
                            {rating > 0 ? (
                              <>
                                <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-lg px-2 py-1">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  <span className="text-xs font-bold text-amber-700">{rating.toFixed(1)}</span>
                                </div>
                                {reviews > 0 && (
                                  <span className="text-[11px] text-gray-400">({reviews})</span>
                                )}
                              </>
                            ) : (
                              <span className="text-[11px] text-gray-400 italic">No reviews yet</span>
                            )}
                          </div>

                          {distance != null && (
                            <span className="text-[11px] text-purple-600 font-semibold bg-purple-50 px-2 py-0.5 rounded-full">
                              {Number(distance).toFixed(1)} km
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
