import { Link } from "wouter";
import PublicNav from "@/components/PublicNav";
import { Button } from "@/components/ui/button";
import {
  User, Briefcase, CheckCircle, Star, MapPin, Scissors,
  Users, Shield, ArrowRight, Sparkles, Building2
} from "lucide-react";

const PROFESSIONAL_ROLES = ["Barbers", "Hair Stylists", "Beauticians", "Nail Artists", "Makeup Artists", "Helpers"];
const OWNER_FEATURES = ["Post a Job", "Browse Profiles", "Verified Skills", "Salary Filters", "Instant Connect", "Free Listing"];

const PRO_STEPS = [
  { n: 1, label: "Fill profile" },
  { n: 2, label: "Add skills" },
  { n: 3, label: "Set salary" },
  { n: 4, label: "Get hired!" },
];

const OWNER_STEPS = [
  { n: 1, label: "List vacancy" },
  { n: 2, label: "Browse" },
  { n: 3, label: "Shortlist" },
  { n: 4, label: "Hire & grow!" },
];

export default function ProfessionalPortal() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PublicNav />

      {/* Hero */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-purple-950 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-white/20">
            <Sparkles className="w-4 h-4 text-amber-400" />
            Sanwar Professional Portal
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold mb-4 leading-tight">
            India's Salon Job &<br />
            <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Hiring Marketplace</span>
          </h1>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto">
            Whether you're a skilled professional looking for your next opportunity, or a salon owner ready to grow your team — you're in the right place.
          </p>
        </div>
      </div>

      {/* Two Cards */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 pb-16">
        <div className="grid sm:grid-cols-2 gap-6">

          {/* For Professionals */}
          <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 p-7 text-white shadow-2xl flex flex-col">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-5 w-fit">
              <User className="w-3.5 h-3.5" /> For Professionals
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Get Salon Job</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-5">
              Are you a barber, stylist, beautician, or makeup artist?<br />
              Register your profile and get discovered by verified salons.
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {PROFESSIONAL_ROLES.map((r) => (
                <span key={r} className="bg-white/20 border border-white/30 text-white text-xs px-3 py-1 rounded-full font-medium">
                  {r}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {PRO_STEPS.map(({ n, label }) => (
                <div key={n} className="bg-white/15 rounded-xl p-2 text-center border border-white/20">
                  <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold mx-auto mb-1">{n}</div>
                  <p className="text-[10px] text-blue-100 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto space-y-2">
              <Link href="/professional-login">
                <Button className="w-full bg-white text-indigo-700 hover:bg-blue-50 font-bold rounded-xl h-11">
                  Login / Check Offers <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <Link href="/staff-registration">
                <Button variant="outline" className="w-full border-white/40 text-white hover:bg-white/10 font-semibold rounded-xl h-10 bg-transparent">
                  Register as a Professional →
                </Button>
              </Link>
            </div>
          </div>

          {/* For Salon Owners */}
          <div className="rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-7 text-white shadow-2xl flex flex-col">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold mb-5 w-fit">
              <Building2 className="w-3.5 h-3.5" /> For Salon Owners
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Hire Skilled Staff</h2>
            <p className="text-emerald-50 text-sm leading-relaxed mb-5">
              Find verified, experienced beauty professionals for your salon. Browse profiles, check skills & salary expectations, and hire the perfect fit.
            </p>

            <div className="flex flex-wrap gap-2 mb-5">
              {OWNER_FEATURES.map((f) => (
                <span key={f} className="bg-white/20 border border-white/30 text-white text-xs px-3 py-1 rounded-full font-medium">
                  {f}
                </span>
              ))}
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {OWNER_STEPS.map(({ n, label }) => (
                <div key={n} className="bg-white/15 rounded-xl p-2 text-center border border-white/20">
                  <div className="w-7 h-7 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold mx-auto mb-1">{n}</div>
                  <p className="text-[10px] text-emerald-100 leading-tight">{label}</p>
                </div>
              ))}
            </div>

            <div className="mt-auto">
              <Link href="/hire-staff">
                <Button className="w-full bg-white text-teal-700 hover:bg-emerald-50 font-bold rounded-xl h-11">
                  Start Hiring Now <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <p className="text-[11px] text-emerald-100 text-center mt-2">
                * Salon profile required to send job offers
              </p>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { icon: Users, label: "Professionals", value: "500+", color: "text-indigo-600 bg-indigo-50" },
            { icon: Building2, label: "Partner Salons", value: "100+", color: "text-emerald-600 bg-emerald-50" },
            { icon: CheckCircle, label: "Successful Hires", value: "200+", color: "text-blue-600 bg-blue-50" },
            { icon: Star, label: "Avg Rating", value: "4.8★", color: "text-amber-600 bg-amber-50" },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
              <div className={`w-10 h-10 rounded-full ${color.split(' ')[1]} flex items-center justify-center mx-auto mb-2`}>
                <Icon className={`w-5 h-5 ${color.split(' ')[0]}`} />
              </div>
              <p className="text-2xl font-extrabold text-gray-900">{value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Why Sanwar section */}
        <div className="mt-10 bg-white rounded-3xl p-7 shadow-sm border border-gray-100">
          <h3 className="text-xl font-extrabold text-gray-900 mb-6 text-center">Why Sanwar?</h3>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { icon: Shield, title: "Verified Profiles", desc: "All professionals are verified by our team for authenticity.", color: "bg-blue-50 text-blue-600" },
              { icon: MapPin, title: "City-Based Search", desc: "Find the right talent or job in your city with smart filters.", color: "bg-purple-50 text-purple-600" },
              { icon: Scissors, title: "Skill Matching", desc: "Role-based matching ensures you find the perfect fit for your salon.", color: "bg-emerald-50 text-emerald-600" },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="flex gap-3">
                <div className={`w-10 h-10 rounded-xl ${color.split(' ')[0]} flex items-center justify-center flex-shrink-0`}>
                  <Icon className={`w-5 h-5 ${color.split(' ')[1]}`} />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 text-sm mb-1">{title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <footer className="bg-gray-900 text-gray-400 py-6 px-4 text-center text-sm">
        © Sanwar — Digitalizing India's Salon Industry ·{" "}
        <Link href="/about" className="hover:text-white">About</Link> ·{" "}
        <Link href="/contact" className="hover:text-white">Contact</Link>
      </footer>
    </div>
  );
}
