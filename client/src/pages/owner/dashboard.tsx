import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { 
  Store, Users, Calendar, IndianRupee, Clock, Star, Plus, 
  Edit, Trash2, Eye, Phone, MapPin, TrendingUp, Activity,
  BarChart3, DollarSign, UserPlus, Settings, Scissors, CheckCircle, Upload,
  CreditCard, Camera, User, MessageSquare, AlertCircle, Percent, Video, Play, 
  HelpCircle, Edit2, Palette, Tags, Mail, LogOut, Shield, Gift, Send, MessageCircle, ArrowLeft,
  Zap, Layers, Package, CheckSquare, Sparkles, X, Loader2, QrCode, Link2, Copy
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Link } from "wouter";
import { ObjectUploader } from "@/components/ObjectUploader";
import { LeafletLocationPicker } from "@/components/LeafletLocationPicker";
import type { UploadResult } from '@uppy/core';
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Salon, Service, Staff, BookingWithDetails, Review, ReviewWithReplies, SalonGallery, ServiceCategory, InsertServiceCategory } from "@shared/schema";

// Extended type for grouped bookings
interface GroupedBooking extends BookingWithDetails {
  servicesList: string[];
  servicesCount: number;
  totalGroupAmount: number;
  allBookingIds: string[];
  groupStatus: string;
}

// BookingCard component for displaying individual bookings in tabs
function BookingCard({ 
  booking, 
  completeBooking, 
  confirmBooking,
  suggestTime,
  updateBookingStatusMutation 
}: { 
  booking: GroupedBooking; 
  completeBooking: (id: string) => void;
  confirmBooking: (id: string) => void;
  suggestTime: (id: string, date: string, time: string, note: string) => void;
  updateBookingStatusMutation: { isPending: boolean; mutate: (args: { bookingId: string; status: string }) => void };
}) {
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestDate, setSuggestDate] = useState(booking.date || "");
  const [suggestTimeVal, setSuggestTimeVal] = useState(booking.startTime || "");
  const [suggestNote, setSuggestNote] = useState("");

  return (
    <div className="flex flex-col p-4 border rounded-lg hover:shadow-md transition-shadow gap-3">
      {/* Header row: avatar + name + status badge */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {booking.isWalkIn ? (
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-500" />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">
            {booking.isWalkIn ? booking.walkInCustomerName : booking.customer?.name || 'Customer'}
          </p>
          <p className="text-xs text-gray-400">Booking #{booking.id.slice(0, 8)}</p>
        </div>
        <Badge
          variant={
            booking.groupStatus === 'confirmed' ? 'default' :
            booking.groupStatus === 'completed' ? 'secondary' :
            booking.groupStatus === 'owner_suggested' ? 'outline' :
            booking.groupStatus.includes('cancelled') ? 'destructive' : 'outline'
          }
          className={`flex-shrink-0 text-xs ${booking.groupStatus === 'owner_suggested' ? 'border-orange-400 text-orange-600' : booking.groupStatus === 'pending' ? 'border-yellow-400 text-yellow-700 bg-yellow-50' : ''}`}
        >
          {booking.groupStatus === 'owner_suggested' ? '⏰ Suggested' : booking.groupStatus === 'pending' ? '⏳ Pending' : booking.groupStatus}
        </Badge>
      </div>

      {/* Details grid - 2 columns on all screens */}
      <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Service</p>
          <p className="font-medium text-gray-800 text-sm leading-snug">
            {booking.servicesList
              ? booking.servicesList.join(', ') + (booking.servicesCount > 1 ? ` (${booking.servicesCount})` : '')
              : (booking.service?.name || 'Service')}
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Date</p>
          <p className="font-medium text-gray-800">{booking.date}</p>
          <p className="text-xs text-gray-400">Booked: {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Time</p>
          <p className="font-medium text-gray-800">{booking.startTime} – {booking.endTime}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Amount</p>
          <p className="font-medium text-gray-800">₹{((booking.totalGroupAmount > 0 ? booking.totalGroupAmount : parseFloat(booking.totalAmount?.toString() || '0'))).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Payment</p>
          <Badge variant="outline" className="text-xs">{booking.paymentStatus || 'Pending'}</Badge>
        </div>
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Stylist</p>
          {booking.staff?.name
            ? <p className="font-medium text-blue-600">{booking.staff.name}</p>
            : <p className="text-gray-400 italic text-xs">Any available</p>}
        </div>
        {(booking.isWalkIn ? booking.walkInCustomerPhone : booking.customer?.phone) && (
          <div className="col-span-2">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">Phone</p>
            <p className="font-medium text-gray-800">{booking.isWalkIn ? booking.walkInCustomerPhone : booking.customer?.phone}</p>
          </div>
        )}
      </div>

      {/* Suggestion banner */}
      {(booking as any).suggestedDate && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg px-3 py-2 text-sm text-orange-800">
          <p className="font-medium">⏰ You suggested a new time</p>
          <p className="text-xs mt-0.5"><strong>{(booking as any).suggestedDate}</strong> at <strong>{(booking as any).suggestedTime}</strong></p>
          {(booking as any).ownerNote && <p className="text-xs mt-0.5 italic">Note: {(booking as any).ownerNote}</p>}
          <p className="text-xs text-orange-500 mt-0.5">Waiting for customer to accept or decline</p>
        </div>
      )}

      {/* Action buttons — full width, stacked or in row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {booking.status === 'pending' && (
          <>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white flex-1"
              onClick={() => confirmBooking(booking.id)}
              disabled={updateBookingStatusMutation.isPending}
            >
              ✓ Confirm
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-orange-400 text-orange-600 hover:bg-orange-50 flex-1"
              onClick={() => setShowSuggest(!showSuggest)}
            >
              ⏰ Suggest Time
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
              onClick={() => {
                if (confirm("Decline this booking request?")) {
                  updateBookingStatusMutation.mutate({ bookingId: booking.id, status: "cancelled" });
                }
              }}
              disabled={updateBookingStatusMutation.isPending}
            >
              ✕ Decline
            </Button>
          </>
        )}
        {booking.status === 'owner_suggested' && (
          <Button
            size="sm"
            variant="outline"
            className="border-orange-400 text-orange-600 hover:bg-orange-50 w-full"
            onClick={() => setShowSuggest(!showSuggest)}
          >
            ✏️ Edit Suggestion
          </Button>
        )}
        {booking.status === 'confirmed' && (
          <>
            <Button
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 flex-1"
              onClick={() => completeBooking(booking.id)}
              disabled={updateBookingStatusMutation.isPending}
            >
              ✓ Mark Complete
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-orange-400 text-orange-600 hover:bg-orange-50 flex-1"
              onClick={() => setShowSuggest(!showSuggest)}
            >
              ⏰ Reschedule
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-600 hover:bg-red-50 flex-1"
              onClick={() => {
                if (confirm("Cancel this confirmed booking?")) {
                  updateBookingStatusMutation.mutate({ bookingId: booking.id, status: "cancelled" });
                }
              }}
              disabled={updateBookingStatusMutation.isPending}
            >
              ✕ Cancel
            </Button>
          </>
        )}
        {booking.status === 'completed' && (
          <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
            <span className="text-green-500">✓</span> Completed
          </div>
        )}
      </div>

      {/* Suggest Time inline form */}
      {showSuggest && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
          <p className="text-sm font-semibold text-orange-800">Suggest an alternative time</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-600 font-medium mb-1 block">New Date</label>
              <input
                type="date"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 outline-none"
                value={suggestDate}
                onChange={e => setSuggestDate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 font-medium mb-1 block">New Time</label>
              <input
                type="time"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 outline-none"
                value={suggestTimeVal}
                onChange={e => setSuggestTimeVal(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-600 font-medium mb-1 block">Message to customer (optional)</label>
            <textarea
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-300 outline-none resize-none"
              rows={2}
              placeholder="e.g. Your requested slot is unavailable, this time works better for us."
              value={suggestNote}
              onChange={e => setSuggestNote(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => {
                if (!suggestDate || !suggestTimeVal) return;
                suggestTime(booking.id, suggestDate, suggestTimeVal, suggestNote);
                setShowSuggest(false);
              }}
              disabled={!suggestDate || !suggestTimeVal || updateBookingStatusMutation.isPending}
            >
              Send Suggestion
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowSuggest(false)}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  );
}

import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/hooks/useOnboarding";
import { OnboardingWalkthrough } from "@/components/OnboardingWalkthrough";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { WorkingHoursForm } from "@/components/WorkingHoursForm";
import { ReplyForm } from "@/components/ReplyForm";
import { MoodRatingDisplay } from "@/components/MoodRatingSelector";
import HireStaffSection from "@/components/HireStaffSection";

const salonSchema = z.object({
  name: z.string().min(1, "Salon name is required"),
  description: z.string().optional(),
  phone: z.string().min(10, "Valid phone number required"),
  address: z.string().min(1, "Address is required"),
  latitude: z.number({
    required_error: "Please mark your shop location on the map",
  }),
  longitude: z.number({
    required_error: "Please mark your shop location on the map",
  }),
  imageUrl: z.string().optional(),
  instagramId: z.string().optional(),
  facebookId: z.string().optional(),
  googleMapsLink: z.string().optional(),
  confirmationAmount: z.number().min(0),
  salonType: z.enum(["unisex", "male", "female"]).default("unisex"),
});

const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  price: z.number().min(1, "Price must be greater than 0"),
  duration: z.number().min(15, "Duration must be at least 15 minutes"),
  categoryId: z.string().optional(),
});

const staffSchema = z.object({
  name: z.string().min(1, "Staff name is required"),
  role: z.string().min(1, "Role is required"),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  photoUrl: z.string().optional(),
});

const gallerySchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  category: z.enum(['work', 'staff', 'interior']).default('work'),
});

const faqSchema = z.object({
  question: z.string().min(1, "Question is required"),
  answer: z.string().min(1, "Answer is required"),
  displayOrder: z.number().optional(),
  isActive: z.boolean().default(true),
});

const serviceCategorySchema = z.object({
  name: z.string().min(1, "Category name is required"),
  description: z.string().optional(),
  icon: z.string().min(1, "Please select an icon"),
  color: z.string().min(4, "Please select a color"),
});

const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  profileImageUrl: z.string().optional(),
});

type SalonFormData = z.infer<typeof salonSchema>;
type ServiceFormData = z.infer<typeof serviceSchema>;
type StaffFormData = z.infer<typeof staffSchema>;
type GalleryFormData = z.infer<typeof gallerySchema>;
type FaqFormData = z.infer<typeof faqSchema>;
type ServiceCategoryFormData = z.infer<typeof serviceCategorySchema>;
type ProfileFormData = z.infer<typeof profileSchema>;

// Premade category templates for quick add
const PREMADE_CATEGORIES = [
  { name: "Hair Care", description: "Haircuts, styling, treatments and coloring", icon: "Scissors", color: "#3B82F6" },
  { name: "Facial & Skin", description: "Facials, cleanups, and skin treatments", icon: "Sparkles", color: "#10B981" },
  { name: "Nail Services", description: "Manicure, pedicure, and nail art", icon: "Palette", color: "#F59E0B" },
  { name: "Bridal Services", description: "Bridal makeup, mehndi, and packages", icon: "Heart", color: "#EC4899" },
  { name: "Massage & Spa", description: "Body massage, spa therapies and relaxation", icon: "Star", color: "#8B5CF6" },
  { name: "Beard & Grooming", description: "Beard styling, shaves, and grooming", icon: "Crown", color: "#EF4444" },
  { name: "Makeup", description: "Party makeup, HD makeup, and special looks", icon: "Palette", color: "#EC4899" },
  { name: "Waxing & Threading", description: "Full body waxing, threading, and hair removal", icon: "Scissors", color: "#10B981" },
  { name: "Hair Treatments", description: "Dandruff, hair fall, protein and smoothing treatments", icon: "Sparkles", color: "#3B82F6" },
  { name: "Eye & Eyebrow", description: "Eyebrow shaping, tinting, lash extensions and lamination", icon: "Sparkles", color: "#8B5CF6" },
  { name: "Hair (Men)", description: "Haircuts, fades, and styling for men", icon: "Scissors", color: "#3B82F6" },
  { name: "Skin Care (Men)", description: "Facials, cleanups, and skin treatments for men", icon: "Sparkles", color: "#10B981" },
  { name: "Massage (Men)", description: "Relaxation and therapeutic massage for men", icon: "Star", color: "#8B5CF6" },
  { name: "Waxing (Men)", description: "Waxing services for men", icon: "Scissors", color: "#10B981" },
  { name: "Nail Care (Men)", description: "Manicure and pedicure for men", icon: "Palette", color: "#F59E0B" },
  { name: "Hair (Women)", description: "Haircuts, coloring, and styling for women", icon: "Scissors", color: "#EC4899" },
  { name: "Skin Care (Women)", description: "Facials and skin treatments for women", icon: "Sparkles", color: "#10B981" },
  { name: "Nail Care (Women)", description: "Nail art, extensions, and polish for women", icon: "Palette", color: "#F59E0B" },
  { name: "Makeup (Women)", description: "Party, HD, airbrush and festive makeup", icon: "Palette", color: "#EC4899" },
  { name: "Spa & Massage (Women)", description: "Spa, body massage and relaxation for women", icon: "Star", color: "#8B5CF6" },
  { name: "Saree Draping", description: "Traditional and bridal saree draping styles", icon: "Heart", color: "#EC4899" },
];

// Premade service templates grouped by category name for quick add
const PREMADE_SERVICES: Record<string, { name: string; description: string; price: number; duration: number }[]> = {
  "Hair Care": [
    { name: "Hair Cut", description: "Professional haircut with styling", price: 200, duration: 30 },
    { name: "Hair Wash & Blow Dry", description: "Deep cleansing wash with blow dry styling", price: 300, duration: 45 },
    { name: "Hair Coloring", description: "Root touch-up or full hair coloring", price: 800, duration: 90 },
    { name: "Hair Spa", description: "Nourishing hair spa treatment", price: 500, duration: 60 },
    { name: "Keratin Treatment", description: "Smoothing keratin hair treatment", price: 2500, duration: 120 },
    { name: "Hair Straightening", description: "Permanent hair straightening", price: 3000, duration: 150 },
    { name: "Head Massage", description: "Relaxing oil head massage", price: 250, duration: 30 },
    { name: "Hair Trim", description: "Quick trim and layering", price: 150, duration: 20 },
    { name: "Hair Highlights", description: "Partial or full hair highlights", price: 1200, duration: 90 },
    { name: "Balayage", description: "Hand-painted hair coloring technique", price: 2000, duration: 120 },
    { name: "Ombre Hair", description: "Gradient color from dark to light", price: 1800, duration: 110 },
    { name: "Hair Botox", description: "Deep repair and smoothing treatment", price: 3500, duration: 150 },
    { name: "Scalp Treatment", description: "Dandruff and scalp health treatment", price: 600, duration: 45 },
    { name: "Deep Conditioning", description: "Intensive moisture and repair mask", price: 400, duration: 40 },
  ],
  "Facial & Skin": [
    { name: "Basic Facial", description: "Cleansing, scrubbing, and face pack", price: 400, duration: 45 },
    { name: "Gold Facial", description: "Luxury gold facial for glowing skin", price: 800, duration: 60 },
    { name: "Diamond Facial", description: "Diamond facial for radiant skin", price: 1200, duration: 75 },
    { name: "Face Cleanup", description: "Blackhead removal and cleanup", price: 300, duration: 30 },
    { name: "Bleach", description: "Face and neck bleaching", price: 250, duration: 30 },
    { name: "De-Tan", description: "Tan removal treatment", price: 350, duration: 45 },
    { name: "Under Eye Treatment", description: "Dark circle and puffiness treatment", price: 400, duration: 30 },
    { name: "Fruit Facial", description: "Vitamin-rich fruit extract facial", price: 500, duration: 50 },
    { name: "Pearl Facial", description: "Brightening pearl facial treatment", price: 700, duration: 60 },
    { name: "Anti-Aging Facial", description: "Firming and wrinkle-reducing facial", price: 1000, duration: 75 },
    { name: "Oxygen Facial", description: "Rejuvenating oxygen infusion facial", price: 1500, duration: 60 },
    { name: "Whitening Facial", description: "Skin brightening and pigmentation treatment", price: 900, duration: 60 },
    { name: "Acne Treatment", description: "Deep pore cleansing for acne-prone skin", price: 600, duration: 45 },
    { name: "Microdermabrasion", description: "Exfoliation for smooth glowing skin", price: 1200, duration: 60 },
  ],
  "Nail Services": [
    { name: "Manicure", description: "Hand cleaning, shaping, and polish", price: 300, duration: 30 },
    { name: "Pedicure", description: "Foot spa with cleaning and polish", price: 400, duration: 45 },
    { name: "Nail Art", description: "Creative nail art design", price: 500, duration: 60 },
    { name: "Gel Nails", description: "Gel polish application", price: 600, duration: 45 },
    { name: "Acrylic Nails", description: "Acrylic nail extensions", price: 800, duration: 60 },
    { name: "French Manicure", description: "Classic French tip nail finish", price: 400, duration: 35 },
    { name: "Spa Manicure", description: "Luxury manicure with scrub and mask", price: 600, duration: 50 },
    { name: "Spa Pedicure", description: "Luxury pedicure with foot mask", price: 700, duration: 60 },
    { name: "Nail Extensions", description: "Fiberglass or gel nail extensions", price: 900, duration: 75 },
    { name: "Nail Polish Change", description: "Quick polish removal and reapplication", price: 150, duration: 15 },
    { name: "3D Nail Art", description: "3D embellishment nail designs", price: 800, duration: 75 },
    { name: "Chrome Nails", description: "Mirror chrome powder nail finish", price: 700, duration: 60 },
  ],
  "Bridal Services": [
    { name: "Bridal Makeup", description: "Complete bridal makeup package", price: 5000, duration: 180 },
    { name: "Mehndi", description: "Bridal mehndi / henna application", price: 1500, duration: 120 },
    { name: "Pre-Bridal Package", description: "Full body preparation package", price: 8000, duration: 240 },
    { name: "Engagement Makeup", description: "Light engagement makeup", price: 3000, duration: 90 },
    { name: "Bridal Hair Styling", description: "Traditional or modern bridal updo", price: 2000, duration: 90 },
    { name: "Reception Makeup", description: "Glamorous reception look", price: 4000, duration: 150 },
    { name: "Saree Draping (Bridal)", description: "Special bridal saree draping", price: 800, duration: 40 },
    { name: "Full Body Wax (Pre-Bridal)", description: "Pre-bridal full body waxing", price: 1200, duration: 90 },
    { name: "Bridal Mehndi (Feet)", description: "Intricate mehndi for hands and feet", price: 2000, duration: 150 },
  ],
  "Massage & Spa": [
    { name: "Full Body Massage", description: "Relaxing full body oil massage", price: 800, duration: 60 },
    { name: "Back Massage", description: "Focused back and shoulder massage", price: 400, duration: 30 },
    { name: "Body Scrub", description: "Exfoliating body scrub treatment", price: 600, duration: 45 },
    { name: "Body Polish", description: "Skin brightening body polish", price: 700, duration: 60 },
    { name: "Aromatherapy Massage", description: "Relaxing massage with essential oils", price: 1000, duration: 60 },
    { name: "Deep Tissue Massage", description: "Therapeutic deep muscle massage", price: 1200, duration: 75 },
    { name: "Hot Stone Massage", description: "Heated stone relaxation therapy", price: 1500, duration: 75 },
    { name: "Foot Reflexology", description: "Pressure point foot massage", price: 400, duration: 30 },
    { name: "Body Wrap", description: "Detoxifying full body wrap treatment", price: 1200, duration: 75 },
    { name: "Steam Bath", description: "Full body steam and relaxation", price: 300, duration: 20 },
  ],
  "Beard & Grooming": [
    { name: "Beard Trim", description: "Precision beard trimming and shaping", price: 100, duration: 15 },
    { name: "Beard Styling", description: "Creative beard styling and design", price: 200, duration: 30 },
    { name: "Shave", description: "Clean shave with hot towel", price: 150, duration: 20 },
    { name: "Beard Color", description: "Beard coloring and touch-up", price: 250, duration: 30 },
    { name: "Moustache Styling", description: "Moustache grooming and shaping", price: 80, duration: 10 },
    { name: "Royal Shave", description: "Luxury shave with pre-shave oil and towel", price: 300, duration: 35 },
    { name: "Beard Spa", description: "Deep conditioning beard treatment", price: 350, duration: 30 },
    { name: "D-Tan Beard", description: "Tan removal and brightening for beard area", price: 200, duration: 20 },
  ],
  "Makeup": [
    { name: "Party Makeup", description: "Glam party makeup look", price: 1500, duration: 60 },
    { name: "HD Makeup", description: "High-definition camera-ready makeup", price: 2500, duration: 90 },
    { name: "Natural Makeup", description: "Subtle everyday makeup", price: 1000, duration: 45 },
    { name: "Eye Makeup", description: "Dramatic eye makeup only", price: 500, duration: 30 },
    { name: "Airbrush Makeup", description: "Flawless airbrush foundation and finish", price: 3000, duration: 90 },
    { name: "Smokey Eye", description: "Bold smokey eye makeup look", price: 700, duration: 35 },
    { name: "Contouring & Highlighting", description: "Face sculpting with makeup", price: 800, duration: 40 },
    { name: "Festival Makeup", description: "Festive traditional makeup look", price: 1800, duration: 75 },
    { name: "Editorial Makeup", description: "Creative high-fashion makeup look", price: 3500, duration: 120 },
  ],
  "Waxing & Threading": [
    { name: "Full Body Wax", description: "Complete body waxing", price: 800, duration: 60 },
    { name: "Half Arms Wax", description: "Upper or lower arms waxing", price: 200, duration: 20 },
    { name: "Half Legs Wax", description: "Upper or lower legs waxing", price: 250, duration: 25 },
    { name: "Full Legs Wax", description: "Complete leg waxing", price: 400, duration: 40 },
    { name: "Underarms Wax", description: "Underarm hair removal", price: 100, duration: 10 },
    { name: "Bikini Wax", description: "Bikini line waxing", price: 500, duration: 30 },
    { name: "Full Back Wax", description: "Back and shoulder waxing", price: 400, duration: 30 },
    { name: "Chest Wax", description: "Chest hair waxing", price: 350, duration: 25 },
    { name: "Eyebrow Threading", description: "Eyebrow shaping with thread", price: 50, duration: 10 },
    { name: "Upper Lip Threading", description: "Upper lip hair removal", price: 30, duration: 5 },
    { name: "Full Face Threading", description: "Complete face threading", price: 150, duration: 20 },
    { name: "Chin Threading", description: "Chin area hair removal", price: 30, duration: 5 },
    { name: "Forehead Threading", description: "Forehead hair removal and shaping", price: 40, duration: 8 },
    { name: "Rica Wax (Full Legs)", description: "Sensitive rica wax for legs", price: 600, duration: 50 },
  ],
  "Hair Treatments": [
    { name: "Dandruff Treatment", description: "Anti-dandruff scalp treatment", price: 500, duration: 45 },
    { name: "Hair Fall Treatment", description: "Revitalizing hair fall control treatment", price: 700, duration: 60 },
    { name: "Protein Treatment", description: "Protein-rich strengthening hair mask", price: 800, duration: 60 },
    { name: "Olaplex Treatment", description: "Bond repair treatment for damaged hair", price: 1500, duration: 75 },
    { name: "Cysteine Treatment", description: "Semi-permanent smoothing treatment", price: 2000, duration: 120 },
    { name: "Perming", description: "Hair perming for curls or waves", price: 1500, duration: 90 },
    { name: "Hair Rebonding", description: "Permanent hair straightening rebonding", price: 4000, duration: 180 },
  ],
  "Eye & Eyebrow": [
    { name: "Eyebrow Shaping", description: "Eyebrow trimming and shaping", price: 100, duration: 15 },
    { name: "Eyebrow Tinting", description: "Eyebrow color tinting", price: 200, duration: 20 },
    { name: "Eyelash Extensions", description: "Individual lash extension application", price: 1500, duration: 90 },
    { name: "Lash Lift & Tint", description: "Lifting and tinting natural lashes", price: 800, duration: 60 },
    { name: "Eyebrow Lamination", description: "Groomed fluffy brow lamination", price: 700, duration: 45 },
    { name: "Microblading Consultation", description: "Consultation for semi-permanent brows", price: 200, duration: 30 },
  ],
};

// Gender-differentiated services: men-only services
const MEN_ONLY_SERVICES = {
  "Beard & Grooming": [
    { name: "Beard Trim", description: "Precision beard trimming and shaping", price: 100, duration: 15 },
    { name: "Beard Styling", description: "Creative beard styling and design", price: 200, duration: 30 },
    { name: "Shave", description: "Clean shave with hot towel", price: 150, duration: 20 },
    { name: "Beard Color", description: "Beard coloring and touch-up", price: 250, duration: 30 },
    { name: "Moustache Styling", description: "Moustache grooming and shaping", price: 80, duration: 10 },
    { name: "Royal Shave", description: "Luxury pre-shave oil and hot towel shave", price: 300, duration: 35 },
    { name: "Beard Spa", description: "Deep conditioning beard treatment", price: 350, duration: 30 },
    { name: "D-Tan Beard", description: "Tan removal for beard and neck area", price: 200, duration: 20 },
    { name: "Beard Straightening", description: "Semi-permanent beard straightening", price: 800, duration: 60 },
  ],
  "Men's Hair": [
    { name: "Men's Hair Cut", description: "Classic or modern men's haircut", price: 150, duration: 30 },
    { name: "Hair Wash & Styling", description: "Hair wash with styling product", price: 200, duration: 30 },
    { name: "Men's Hair Spa", description: "Deep conditioning hair treatment", price: 400, duration: 45 },
    { name: "Head Shave", description: "Complete head shave with hot towel", price: 120, duration: 20 },
    { name: "Buzz Cut", description: "Machine clipper buzz cut", price: 100, duration: 15 },
    { name: "Fade Cut", description: "Skin fade or taper fade haircut", price: 250, duration: 35 },
    { name: "Men's Hair Color", description: "Full or partial hair coloring for men", price: 500, duration: 60 },
    { name: "Men's Keratin", description: "Smoothing keratin treatment for men", price: 2000, duration: 120 },
    { name: "Undercut", description: "Modern undercut style haircut", price: 200, duration: 30 },
    { name: "Hair & Beard Combo", description: "Haircut with full beard grooming", price: 300, duration: 45 },
    { name: "Men's Hair Highlights", description: "Partial or full highlights for men", price: 800, duration: 75 },
    { name: "Men's Scalp Treatment", description: "Anti-dandruff scalp treatment", price: 400, duration: 40 },
  ],
  "Men's Skincare": [
    { name: "Men's Facial", description: "Deep cleansing facial for men", price: 500, duration: 45 },
    { name: "Men's D-Tan", description: "Tan removal face and neck treatment", price: 300, duration: 30 },
    { name: "Men's Cleanup", description: "Basic cleansing and pore clearing", price: 250, duration: 25 },
    { name: "Men's Anti-Tan Facial", description: "Brightening facial for tanned skin", price: 600, duration: 50 },
    { name: "Men's Acne Treatment", description: "Deep pore cleansing for oily skin", price: 500, duration: 40 },
    { name: "Men's Gold Facial", description: "Luxury gold radiance facial", price: 800, duration: 60 },
    { name: "Men's Bleach", description: "Face and neck bleaching", price: 200, duration: 25 },
  ],
  "Men's Massage": [
    { name: "Back & Shoulder Massage", description: "Deep tissue back massage", price: 400, duration: 30 },
    { name: "Head & Neck Massage", description: "Relaxing head and neck massage", price: 250, duration: 25 },
    { name: "Full Body Massage", description: "Complete relaxation body massage", price: 800, duration: 60 },
    { name: "Foot Massage", description: "Soothing foot and leg massage", price: 300, duration: 25 },
    { name: "Sports Massage", description: "Deep tissue sports recovery massage", price: 1000, duration: 60 },
    { name: "Aromatherapy Massage", description: "Relaxation massage with essential oils", price: 900, duration: 60 },
  ],
  "Men's Waxing": [
    { name: "Back Wax", description: "Back and shoulder hair waxing", price: 400, duration: 30 },
    { name: "Chest Wax", description: "Chest hair waxing", price: 350, duration: 25 },
    { name: "Arms Wax", description: "Full arm waxing", price: 300, duration: 25 },
    { name: "Legs Wax", description: "Full leg waxing", price: 400, duration: 40 },
    { name: "Underarms Wax", description: "Underarm hair waxing", price: 100, duration: 10 },
  ],
  "Men's Nail Care": [
    { name: "Men's Manicure", description: "Hand cleaning, trimming, and buffing", price: 200, duration: 20 },
    { name: "Men's Pedicure", description: "Foot cleaning and nail care", price: 300, duration: 30 },
    { name: "Nail Buffing", description: "Nail shine buffing and cleaning", price: 100, duration: 10 },
  ],
};

// Gender-differentiated services: women-only services
const WOMEN_ONLY_SERVICES = {
  "Women's Hair": [
    { name: "Women's Hair Cut", description: "Ladies haircut with styling", price: 300, duration: 45 },
    { name: "Blow Dry & Styling", description: "Wash, blow dry and styling", price: 400, duration: 45 },
    { name: "Hair Straightening (Temporary)", description: "Iron straightening for smooth hair", price: 500, duration: 60 },
    { name: "Curling & Waves", description: "Professional curling or beach waves", price: 450, duration: 50 },
    { name: "Hair Wash & Conditioning", description: "Deep conditioning wash treatment", price: 350, duration: 40 },
    { name: "Hair Color (Global)", description: "Full hair coloring", price: 1500, duration: 120 },
    { name: "Hair Color (Root Touch-up)", description: "Root color touch-up only", price: 600, duration: 60 },
    { name: "Hair Highlights", description: "Partial or full highlights", price: 1200, duration: 90 },
    { name: "Hair Rebonding", description: "Permanent hair straightening", price: 4000, duration: 180 },
    { name: "Keratin Treatment", description: "Smoothing frizz-free keratin treatment", price: 2500, duration: 120 },
    { name: "Balayage", description: "Hand-painted gradient coloring", price: 2000, duration: 120 },
    { name: "Ombre Hair", description: "Dark-to-light gradient coloring", price: 1800, duration: 110 },
    { name: "Hair Updo / Bun", description: "Formal updo or bun styling", price: 500, duration: 40 },
    { name: "Braiding", description: "Creative braid styles and plaits", price: 400, duration: 45 },
    { name: "Hair Spa", description: "Nourishing hair spa treatment", price: 700, duration: 60 },
  ],
  "Women's Facial & Skin": [
    { name: "Basic Facial", description: "Cleansing, scrubbing, and face pack", price: 400, duration: 45 },
    { name: "Gold Facial", description: "Luxury gold glow facial", price: 800, duration: 60 },
    { name: "Diamond Facial", description: "Diamond radiance facial", price: 1200, duration: 75 },
    { name: "Fruit Facial", description: "Vitamin-rich fruit extract facial", price: 500, duration: 50 },
    { name: "Pearl Facial", description: "Brightening pearl facial", price: 700, duration: 60 },
    { name: "Anti-Aging Facial", description: "Firming and wrinkle-reducing facial", price: 1000, duration: 75 },
    { name: "Oxygen Facial", description: "Rejuvenating oxygen infusion facial", price: 1500, duration: 60 },
    { name: "Face Cleanup", description: "Blackhead removal and deep cleansing", price: 300, duration: 30 },
    { name: "Bleach", description: "Face and neck bleaching", price: 250, duration: 30 },
    { name: "D-Tan", description: "Tan removal treatment", price: 350, duration: 45 },
    { name: "Whitening Facial", description: "Skin brightening and pigmentation control", price: 900, duration: 60 },
    { name: "Acne Facial", description: "Pore cleansing for acne-prone skin", price: 600, duration: 45 },
    { name: "Hydra Facial", description: "Hydrating multi-step skin treatment", price: 2000, duration: 75 },
    { name: "Under Eye Treatment", description: "Dark circle and puffiness treatment", price: 400, duration: 30 },
  ],
  "Women's Nail Services": [
    { name: "Manicure", description: "Hand cleaning, shaping, and polish", price: 300, duration: 30 },
    { name: "Pedicure", description: "Foot spa with cleaning and polish", price: 400, duration: 45 },
    { name: "Nail Art", description: "Creative nail art designs", price: 500, duration: 60 },
    { name: "Gel Nails", description: "Gel polish application", price: 600, duration: 45 },
    { name: "Acrylic Nails", description: "Acrylic nail extensions", price: 800, duration: 60 },
    { name: "Nail Extensions", description: "Fiberglass or gel extensions", price: 900, duration: 75 },
    { name: "French Manicure", description: "Classic French tip finish", price: 400, duration: 35 },
    { name: "Spa Manicure", description: "Luxury manicure with scrub and mask", price: 600, duration: 50 },
    { name: "Spa Pedicure", description: "Luxury pedicure with foot mask", price: 700, duration: 60 },
    { name: "Chrome Nails", description: "Mirror chrome powder finish", price: 700, duration: 60 },
    { name: "3D Nail Art", description: "3D embellishment nail designs", price: 800, duration: 75 },
    { name: "Nail Polish Change", description: "Polish removal and reapplication", price: 150, duration: 15 },
  ],
  "Women's Makeup": [
    { name: "Party Makeup", description: "Glam party makeup look", price: 1500, duration: 60 },
    { name: "HD Makeup", description: "High-definition camera-ready makeup", price: 2500, duration: 90 },
    { name: "Natural Makeup", description: "Subtle everyday makeup", price: 1000, duration: 45 },
    { name: "Airbrush Makeup", description: "Flawless airbrush finish makeup", price: 3000, duration: 90 },
    { name: "Smokey Eye", description: "Bold smokey eye look", price: 700, duration: 35 },
    { name: "Festival Makeup", description: "Traditional festive makeup look", price: 1800, duration: 75 },
    { name: "Contouring & Highlighting", description: "Face sculpting makeup technique", price: 800, duration: 40 },
    { name: "Eye Makeup Only", description: "Dramatic eye makeup with liner and lashes", price: 500, duration: 30 },
    { name: "Reception Makeup", description: "Glamorous reception evening look", price: 3500, duration: 120 },
  ],
  "Waxing & Threading": [
    { name: "Full Body Wax", description: "Complete body waxing", price: 800, duration: 60 },
    { name: "Full Arms Wax", description: "Complete arm waxing", price: 350, duration: 30 },
    { name: "Half Arms Wax", description: "Half arm waxing", price: 200, duration: 20 },
    { name: "Full Legs Wax", description: "Complete leg waxing", price: 400, duration: 40 },
    { name: "Half Legs Wax", description: "Half leg waxing", price: 250, duration: 25 },
    { name: "Underarms Wax", description: "Underarm hair removal", price: 100, duration: 10 },
    { name: "Bikini Wax", description: "Bikini line waxing", price: 500, duration: 30 },
    { name: "Full Back Wax", description: "Back waxing", price: 400, duration: 30 },
    { name: "Rica Wax (Full Legs)", description: "Sensitive rica wax for legs", price: 600, duration: 50 },
    { name: "Eyebrow Threading", description: "Eyebrow shaping with thread", price: 50, duration: 10 },
    { name: "Upper Lip Threading", description: "Upper lip hair removal", price: 30, duration: 5 },
    { name: "Full Face Threading", description: "Complete face threading", price: 150, duration: 20 },
    { name: "Chin Threading", description: "Chin area threading", price: 30, duration: 5 },
    { name: "Forehead Threading", description: "Forehead shaping and threading", price: 40, duration: 8 },
    { name: "Sideburns Threading", description: "Sideburn area hair removal", price: 50, duration: 8 },
  ],
  "Women's Spa & Massage": [
    { name: "Full Body Massage", description: "Relaxing full body oil massage", price: 1000, duration: 60 },
    { name: "Back Massage", description: "Deep tissue back massage", price: 500, duration: 30 },
    { name: "Foot Reflexology", description: "Pressure point foot massage", price: 400, duration: 30 },
    { name: "Aromatherapy Massage", description: "Relaxation massage with essential oils", price: 1200, duration: 60 },
    { name: "Hot Stone Massage", description: "Heated stone relaxation therapy", price: 1500, duration: 75 },
    { name: "Body Scrub", description: "Exfoliating body scrub", price: 700, duration: 45 },
    { name: "Body Polish", description: "Skin brightening body polish", price: 800, duration: 60 },
    { name: "Body Wrap", description: "Detoxifying body wrap treatment", price: 1200, duration: 75 },
    { name: "Steam Bath", description: "Full body steam and relaxation", price: 300, duration: 20 },
  ],
  "Bridal Services": [
    { name: "Bridal Makeup", description: "Complete bridal makeup package", price: 5000, duration: 180 },
    { name: "Mehndi (Hands)", description: "Bridal mehndi for hands", price: 1500, duration: 120 },
    { name: "Mehndi (Hands & Feet)", description: "Full bridal mehndi for hands and feet", price: 2500, duration: 180 },
    { name: "Bridal Hair Styling", description: "Traditional or modern bridal hair", price: 2000, duration: 90 },
    { name: "Pre-Bridal Package", description: "Full body preparation package", price: 8000, duration: 240 },
    { name: "Engagement Makeup", description: "Elegant engagement day makeup", price: 3000, duration: 90 },
    { name: "Reception Makeup", description: "Glamorous reception look", price: 4000, duration: 150 },
    { name: "Saree Draping (Bridal)", description: "Special bridal saree draping", price: 800, duration: 40 },
    { name: "Bridal Facial Package", description: "Glow facial for wedding day skin", price: 2000, duration: 90 },
  ],
  "Saree Draping": [
    { name: "Saree Draping", description: "Traditional saree draping service", price: 300, duration: 20 },
    { name: "Bridal Saree Draping", description: "Special bridal saree draping", price: 500, duration: 30 },
    { name: "Lehenga Draping", description: "Lehenga and dupatta styling", price: 400, duration: 25 },
    { name: "Nivi Style Draping", description: "Classic Nivi draping style", price: 300, duration: 20 },
    { name: "Bengali Style Draping", description: "Traditional Bengali saree draping", price: 350, duration: 25 },
  ],
  "Eye & Eyebrow": [
    { name: "Eyebrow Shaping", description: "Eyebrow trimming and shaping", price: 100, duration: 15 },
    { name: "Eyebrow Tinting", description: "Eyebrow color tinting", price: 200, duration: 20 },
    { name: "Eyelash Extensions", description: "Individual lash extension application", price: 1500, duration: 90 },
    { name: "Lash Lift & Tint", description: "Lifting and tinting natural lashes", price: 800, duration: 60 },
    { name: "Eyebrow Lamination", description: "Fluffy groomed brow lamination", price: 700, duration: 45 },
    { name: "False Lash Application", description: "Strip lash application and styling", price: 300, duration: 20 },
  ],
};

// Combined unisex services + gender specific for easy access
const ALL_SERVICES_BY_GENDER = {
  unisex: PREMADE_SERVICES,
  men: MEN_ONLY_SERVICES,
  women: WOMEN_ONLY_SERVICES,
};

// Premade staff templates for quick add
const PREMADE_STAFF = [
  { name: "Ravi Kumar", role: "Senior Hair Stylist", phone: "", email: "", specialties: ["Hair Cutting", "Coloring", "Styling"], experience: "5+ years", description: "Expert in precision cuts, creative coloring, and trend-forward styling. Known for transforming looks with a personalized approach for every client." },
  { name: "Priya Sharma", role: "Beautician", phone: "", email: "", specialties: ["Facials", "Waxing", "Threading"], experience: "3+ years", description: "Skilled in skin care routines, facial treatments, and precise threading. Dedicated to giving every client a flawless, refreshed look." },
  { name: "Amit Singh", role: "Barber", phone: "", email: "", specialties: ["Beard Styling", "Shaving", "Men's Haircuts"], experience: "4+ years", description: "Specializes in sharp fades, classic shaves, and well-groomed beard shaping. A go-to stylist for men who value a clean, confident look." },
  { name: "Neha Gupta", role: "Nail Technician", phone: "", email: "", specialties: ["Manicure", "Pedicure", "Nail Art"], experience: "2+ years", description: "Creative nail artist with a flair for intricate designs and long-lasting finishes. Delivers salon-quality manicures and pedicures every time." },
  { name: "Rajesh Verma", role: "Massage Therapist", phone: "", email: "", specialties: ["Full Body Massage", "Head Massage", "Back Massage"], experience: "6+ years", description: "Certified therapist trained in relaxation and deep-tissue techniques. Helps clients de-stress and rejuvenate with every session." },
  { name: "Anita Patel", role: "Bridal Makeup Artist", phone: "", email: "", specialties: ["Bridal Makeup", "Mehndi", "HD Makeup"], experience: "7+ years", description: "Transforms brides into their most radiant selves with flawless HD makeup and mehndi artistry. Trusted by hundreds of happy brides." },
  { name: "Suresh Yadav", role: "Hair Colorist", phone: "", email: "", specialties: ["Hair Coloring", "Highlights", "Balayage"], experience: "4+ years", description: "Color specialist with expertise in highlights, balayage, and custom blends. Creates vibrant, damage-free color results tailored to each client." },
  { name: "Pooja Mehta", role: "Skin Specialist", phone: "", email: "", specialties: ["Facials", "Skin Treatment", "De-Tan"], experience: "3+ years", description: "Focuses on skin health through targeted facials and de-tan treatments. Helps clients achieve clear, glowing skin with every visit." },
];

// Premade FAQs for wizard setup
const PREMADE_FACILITIES = [
  { icon: "❄️", name: "Air Conditioning", description: "Fully air-conditioned salon" },
  { icon: "📶", name: "Free WiFi", description: "High-speed WiFi for customers" },
  { icon: "📺", name: "TV Entertainment", description: "TV for customer entertainment" },
  { icon: "🚗", name: "Free Parking", description: "Ample parking space available" },
  { icon: "☕", name: "Refreshments", description: "Tea, coffee & water served" },
  { icon: "🎵", name: "Music System", description: "Relaxing background music" },
  { icon: "💺", name: "Premium Seating", description: "Comfortable waiting area" },
  { icon: "🔌", name: "Charging Points", description: "USB charging stations available" },
  { icon: "🚽", name: "Clean Washroom", description: "Well-maintained restrooms" },
  { icon: "🧴", name: "Hand Sanitizer", description: "Sanitizers placed throughout" },
  { icon: "♿", name: "Wheelchair Access", description: "Accessible for all customers" },
  { icon: "💳", name: "Card / UPI Payment", description: "Cards, UPI & digital wallets" },
  { icon: "🌿", name: "Organic Products", description: "Eco-friendly product options" },
  { icon: "🔒", name: "CCTV Security", description: "24/7 security surveillance" },
  { icon: "📖", name: "Reading Materials", description: "Magazines & reading material" },
  { icon: "💧", name: "Purified Water", description: "Clean drinking water provided" },
];

const PREMADE_PRODUCTS = [
  { name: "Schwarzkopf Professional Shampoo", brand: "Schwarzkopf", category: "Shampoo & Conditioner", price: 850, description: "Professional salon-grade shampoo" },
  { name: "L'Oréal Serie Expert", brand: "L'Oréal Professionnel", category: "Hair Care", price: 750, description: "Expert hair treatment range" },
  { name: "Wella Color Brilliance", brand: "Wella", category: "Hair Color", price: 650, description: "Vivid, long-lasting hair color" },
  { name: "Kérastase Elixir Ultime", brand: "Kérastase", category: "Hair Care", price: 2500, description: "Luxury hair oil & serum" },
  { name: "Matrix Biolage Shampoo", brand: "Matrix", category: "Shampoo & Conditioner", price: 450, description: "Natural ingredient hair care" },
  { name: "TRESemmé Heat Protect Spray", brand: "TRESemmé", category: "Styling Products", price: 299, description: "Heat protection for styling" },
  { name: "Streax Hair Serum", brand: "Streax", category: "Hair Care", price: 199, description: "Frizz-control hair serum" },
  { name: "Dove Nourishing Conditioner", brand: "Dove", category: "Shampoo & Conditioner", price: 250, description: "Intense moisture conditioner" },
  { name: "Biotique Bio Bhringraj Shampoo", brand: "Biotique", category: "Shampoo & Conditioner", price: 180, description: "Ayurvedic hair growth shampoo" },
  { name: "OGX Coconut Milk Shampoo", brand: "OGX", category: "Shampoo & Conditioner", price: 599, description: "Coconut milk strengthening shampoo" },
  { name: "Lakme Skin Gloss Face Serum", brand: "Lakme", category: "Skin Care", price: 349, description: "Brightening skin serum" },
  { name: "Himalaya Face Wash", brand: "Himalaya", category: "Skin Care", price: 120, description: "Gentle daily face wash" },
  { name: "Gatsby Styling Wax", brand: "Gatsby", category: "Styling Products", price: 199, description: "Strong hold styling wax" },
  { name: "Park Avenue Hair Gel", brand: "Park Avenue", category: "Styling Products", price: 149, description: "Professional hold hair gel" },
  { name: "Professional Straightener Brush", brand: "Generic", category: "Hair Tools", price: 1299, description: "Electric hair straightener brush" },
];

const WIZARD_FAQS = [
  { q: "Do I need to book in advance?", a: "We recommend booking in advance to secure your time slot. Walk-ins welcome based on availability." },
  { q: "What payment methods do you accept?", a: "We accept cash, UPI (PhonePe, Google Pay, Paytm), and card payments." },
  { q: "Is parking available?", a: "Yes, parking is available nearby. Contact us for exact directions." },
  { q: "How long does a typical session take?", a: "Duration varies by service. You'll see exact duration when booking." },
  { q: "Can I reschedule my appointment?", a: "Yes! Reschedule or cancel up to 2 hours before your appointment through the app." },
  { q: "Do you use hygienic tools?", a: "We maintain strict hygiene standards and sterilize all tools after every use." },
  { q: "Do you offer home service?", a: "Currently we only provide services at our salon." },
  { q: "Are your products safe for sensitive skin?", a: "We use dermatologically tested products. Please inform your stylist of any allergies." },
];

// Premade offer templates for quick add
const PREMADE_OFFERS = [
  { title: "New Customer Special", description: "Welcome discount for first-time customers. Get a great deal on your first visit!", discountType: "percentage", discountValue: "20", minOrderAmount: "0", maxDiscountAmount: "300", maxUsagePerCustomer: "1", maxTotalUsage: "100" },
  { title: "Weekend Flash Sale", description: "Special weekend discounts on all services. Valid Saturday and Sunday only!", discountType: "percentage", discountValue: "15", minOrderAmount: "500", maxDiscountAmount: "500", maxUsagePerCustomer: "2", maxTotalUsage: "50" },
  { title: "Happy Hours — 10% Off", description: "Book between 10 AM to 2 PM and enjoy discounted rates on all services.", discountType: "percentage", discountValue: "10", minOrderAmount: "0", maxDiscountAmount: "200", maxUsagePerCustomer: "3", maxTotalUsage: "" },
  { title: "Festive Season Offer", description: "Celebrate the festival season with special discounts on bridal and party packages!", discountType: "fixed_amount", discountValue: "500", minOrderAmount: "2000", maxDiscountAmount: "", maxUsagePerCustomer: "1", maxTotalUsage: "30" },
  { title: "Refer a Friend — ₹100 Off", description: "Refer a friend and both get ₹100 off on your next booking. Share the love!", discountType: "fixed_amount", discountValue: "100", minOrderAmount: "500", maxDiscountAmount: "", maxUsagePerCustomer: "5", maxTotalUsage: "" },
  { title: "Combo Deal — 25% Off", description: "Book any 2 or more services together and get 25% off the total bill.", discountType: "percentage", discountValue: "25", minOrderAmount: "800", maxDiscountAmount: "1000", maxUsagePerCustomer: "2", maxTotalUsage: "40" },
  { title: "Loyalty Reward — ₹200 Cashback", description: "For our loyal customers! Get ₹200 cashback on bookings above ₹1500.", discountType: "fixed_amount", discountValue: "200", minOrderAmount: "1500", maxDiscountAmount: "", maxUsagePerCustomer: "1", maxTotalUsage: "20" },
  { title: "Birthday Special — 30% Off", description: "It's your birthday! Enjoy 30% off on any service during your birthday month.", discountType: "percentage", discountValue: "30", minOrderAmount: "0", maxDiscountAmount: "600", maxUsagePerCustomer: "1", maxTotalUsage: "" },
];

export default function OwnerDashboard() {
  const { user, isAuthenticated } = useAuth();
  const { shouldShowOnboarding, onboardingSteps, completeOnboarding, skipOnboarding } = useOnboarding('salon-owner');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("overview");
  const [salonDialogOpen, setSalonDialogOpen] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState<string>("");
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [quickAddDialogOpen, setQuickAddDialogOpen] = useState(false);
  const [quickAddType, setQuickAddType] = useState<'categories' | 'services' | 'staff' | 'offers'>('categories');
  const [selectedPremade, setSelectedPremade] = useState<Set<number>>(new Set());
  const [serviceGenderFilter, setServiceGenderFilter] = useState<'men' | 'women' | 'unisex'>('unisex');
  const [editedStaffData, setEditedStaffData] = useState<Record<number, { name: string; experience: string }>>({});
  const [staffDialogOpen, setStaffDialogOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [galleryDialogOpen, setGalleryDialogOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [exitingImpersonation, setExitingImpersonation] = useState(false);
  const [promoVideoDialogOpen, setPromoVideoDialogOpen] = useState(false);

  // First-time setup wizard
  const [setupWizardOpen, setSetupWizardOpen] = useState(false);
  const [setupWizardStep, setSetupWizardStep] = useState(0);
  const [wizardFaqSelected, setWizardFaqSelected] = useState<Set<number>>(new Set([0, 1, 4, 5]));
  const [wizardFaqSaving, setWizardFaqSaving] = useState(false);
  const [wizardLocating, setWizardLocating] = useState(false);
  const [wizardLocationSet, setWizardLocationSet] = useState(false);
  const [wizardUploading, setWizardUploading] = useState(false);
  const [wizardUploadedCount, setWizardUploadedCount] = useState(0);
  const [wizardServSaving, setWizardServSaving] = useState(false);
  const [wizardFacilitiesSelected, setWizardFacilitiesSelected] = useState<Set<number>>(new Set([0, 1, 4, 8, 11]));
  const [wizardProductsSelected, setWizardProductsSelected] = useState<Set<number>>(new Set());
  const [wizardAmenitiesSaving, setWizardAmenitiesSaving] = useState(false);

  const closeSetupWizard = () => {
    setSetupWizardOpen(false);
    localStorage.setItem('sanwar_setup_done', '1');
  };

  // Check if we're in impersonation mode
  useEffect(() => {
    const checkImpersonationStatus = async () => {
      try {
        const response = await fetch('/api/auth/user', {
          method: 'GET',
          credentials: 'include'
        });
        
        if (response.ok) {
          const userData = await response.json();
          // Check if this is an impersonation by looking at session data
          const checkSession = await fetch('/api/auth/session-check', {
            method: 'GET',
            credentials: 'include'
          });
          
          if (checkSession.ok) {
            const sessionData = await checkSession.json();
            setIsImpersonating(sessionData.isImpersonating || false);
          }
        }
      } catch (error) {
        console.error('Error checking impersonation status:', error);
      }
    };

    checkImpersonationStatus();
  }, []);

  const exitImpersonation = async () => {
    try {
      setExitingImpersonation(true);
      
      const response = await fetch('/api/admin/exit-impersonation', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Returned to Admin Account",
          description: "You have successfully returned to your admin account",
        });
        
        // Redirect to admin dashboard
        window.location.href = '/admin/dashboard';
      } else {
        throw new Error('Failed to exit impersonation');
      }
    } catch (error) {
      console.error('Error exiting impersonation:', error);
      toast({
        title: "Exit Failed",
        description: "Unable to return to admin account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExitingImpersonation(false);
    }
  };
  const [faqDialogOpen, setFaqDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [salonLocation, setSalonLocation] = useState<{lat: number, lng: number} | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editingWorkingHours, setEditingWorkingHours] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileImageUploading, setProfileImageUploading] = useState(false);
  const [tempProfileImageUrl, setTempProfileImageUrl] = useState<string>("");

  // Fetch user's salon - optimized caching
  const { data: salon, isLoading: salonLoading, error: salonError } = useQuery<Salon>({
    queryKey: ['/api/owner/salon'],
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    retry: (failureCount, error: any) => {
      // Don't retry on 404 (salon not found) - this is expected for new salon owners
      if (error?.status === 404) {
        return false;
      }
      // Retry up to 3 times for other errors
      return failureCount < 3;
    },
  });

  // Fetch salon services - parallel loading with caching
  const { data: services = [], isLoading: servicesLoading } = useQuery<Service[]>({
    queryKey: [`/api/salons/${salon?.id}/services`],
    enabled: !!salon?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Fetch salon staff - parallel loading with caching
  const { data: staff = [], isLoading: staffLoading } = useQuery<Staff[]>({
    queryKey: [`/api/salons/${salon?.id}/staff`],
    enabled: !!salon?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  // Auto-show first-time setup wizard
  useEffect(() => {
    if (localStorage.getItem('sanwar_setup_done')) return;
    if (salonLoading) return; // Always wait for salon to resolve first
    if (!salon) {
      // No salon yet — start from step 0 (Create Profile)
      // Don't wait for services/staff — they're disabled when there's no salon
      setSetupWizardOpen(true);
      setSetupWizardStep(0);
    } else if (!servicesLoading && !staffLoading && services.length === 0 && staff.length === 0) {
      // Salon exists but no services or staff — start from step 1
      setSetupWizardOpen(true);
      setSetupWizardStep(1);
    }
  }, [salonLoading, servicesLoading, staffLoading, salon?.id, services.length, staff.length]);


  // Fetch service categories for the salon - parallel loading with caching
  const { data: serviceCategories = [], isLoading: categoriesLoading } = useQuery<any[]>({
    queryKey: [`/api/salons/${salon?.id}/categories`],
    enabled: !!salon?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
    retry: false, // Don't retry if endpoint doesn't exist yet
    refetchOnMount: false,
  });


  // Group bookings by customer, date and time slot for multiple services
  const groupBookingsByAppointment = (bookings: BookingWithDetails[]): GroupedBooking[] => {
    const groups = new Map<string, BookingWithDetails[]>();
    
    bookings.forEach(booking => {
      // Create unique customer identifier to avoid collisions
      const customerId = booking.isWalkIn ? 
        `walk-in-${booking.walkInCustomerPhone || booking.walkInCustomerName || booking.id}` : 
        booking.customer?.id || `unknown-${booking.id}`;
      const key = `${customerId}-${booking.date}-${booking.startTime}-${booking.endTime}`;
      
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(booking);
    });
    
    // Helper function to aggregate status
    const getGroupStatus = (group: BookingWithDetails[]): string => {
      const statuses = group.map(b => b.status);
      const uniqueStatuses = [...new Set(statuses)];
      
      if (uniqueStatuses.length === 1) {
        return uniqueStatuses[0] || 'unknown';
      }
      
      // Mixed statuses - prioritize based on importance
      if (statuses.includes('cancelled')) {
        return 'partially cancelled';
      }
      if (statuses.includes('pending')) {
        return 'pending';
      }
      if (statuses.includes('confirmed')) {
        return 'confirmed';
      }
      return 'mixed status';
    };
    
    // Convert groups to array and sort by date/time
    return Array.from(groups.values())
      .map(group => {
        // Sort services within group and return the primary booking with services list
        const sortedGroup = group.sort((a, b) => 
          new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime()
        );
        const primaryBooking = sortedGroup[0];
        
        return {
          ...primaryBooking,
          servicesList: sortedGroup.map(b => b.service?.name || 'Service'),
          servicesCount: sortedGroup.length,
          totalGroupAmount: sortedGroup.reduce((sum, b) => sum + parseFloat(b.totalAmount?.toString() || '0'), 0),
          allBookingIds: sortedGroup.map(b => b.id),
          groupStatus: getGroupStatus(sortedGroup)
        } as GroupedBooking;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date} ${a.startTime}`);
        const dateB = new Date(`${b.date} ${b.startTime}`);
        return dateB.getTime() - dateA.getTime();
      });
  };

  // Fetch salon bookings - optimized refresh
  const { data: rawBookings = [], isLoading: bookingsLoading } = useQuery<BookingWithDetails[]>({
    queryKey: [`/api/owner/bookings`],
    enabled: !!salon?.id,
    staleTime: 0, // No cache - force fresh data for debugging
    gcTime: 0, // Don't cache the response (replaces old cacheTime)
  });

  // Group the bookings for display
  const bookings = groupBookingsByAppointment(rawBookings);

  // Fetch salon reviews with replies - long cache
  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<ReviewWithReplies[]>({
    queryKey: [`/api/salons/${salon?.id}/reviews`],
    enabled: !!salon?.id,
    staleTime: 15 * 60 * 1000, // 15 minutes cache - reviews don't change often
  });

  // Fetch salon gallery - long cache
  const { data: gallery = [], isLoading: galleryLoading } = useQuery<SalonGallery[]>({
    queryKey: [`/api/salons/${salon?.id}/gallery`],
    enabled: !!salon?.id,
    staleTime: 30 * 60 * 1000, // 30 minutes cache - gallery doesn't change often
  });

  // Fetch brand invitations - optimized caching
  const { data: brandInvitationsData, isLoading: invitationsLoading } = useQuery<{sent: any[], received: any[]}>({
    queryKey: [`/api/brand-invitations/${user?.id}`],
    enabled: isAuthenticated && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Fetch brand messages - optimized caching
  const { data: brandMessages = [], isLoading: messagesLoading } = useQuery<any[]>({
    queryKey: ['/api/owner/messages'],
    enabled: isAuthenticated && !!salon?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch customer conversations
  const { data: customerConversations = [], isLoading: conversationsLoading } = useQuery<any[]>({
    queryKey: [`/api/salons/${salon?.id}/conversations`],
    enabled: isAuthenticated && !!salon?.id,
    refetchInterval: 15000,
  });

  const [selectedChatCustomer, setSelectedChatCustomer] = useState<any>(null);
  const [chatReplyMessage, setChatReplyMessage] = useState("");

  const { data: chatMessages = [], isLoading: chatMessagesLoading } = useQuery<any[]>({
    queryKey: ['/api/salons', salon?.id, 'chat', selectedChatCustomer?.customer_id],
    queryFn: async () => {
      if (!salon?.id || !selectedChatCustomer?.customer_id) return [];
      const res = await fetch(`/api/salons/${salon.id}/chat/${selectedChatCustomer.customer_id}`, { credentials: 'include' });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!salon?.id && !!selectedChatCustomer?.customer_id,
    refetchInterval: selectedChatCustomer ? 5000 : false,
  });

  const chatReplyMutation = useMutation({
    mutationFn: async ({ customerId, message }: { customerId: string; message: string }) => {
      return apiRequest("POST", `/api/salons/${salon?.id}/chat`, { message, customerId });
    },
    onSuccess: () => {
      setChatReplyMessage("");
      queryClient.invalidateQueries({ queryKey: ['/api/salons', salon?.id, 'chat', selectedChatCustomer?.customer_id] });
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/conversations`] });
    },
  });

  // Fetch working hours data
  const { data: workingHours = [], isLoading: workingHoursLoading } = useQuery<any[]>({
    queryKey: [`/api/salons/${salon?.id}/working-hours`],
    enabled: !!salon?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });

  // Working hours update mutation
  const updateWorkingHoursMutation = useMutation({
    mutationFn: async (hoursData: any[]) => {
      return await apiRequest("POST", `/api/salons/${salon?.id}/working-hours`, {
        workingHours: hoursData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/working-hours`] });
      setEditingWorkingHours(false);
      toast({
        title: "Success",
        description: "Salon working hours updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update working hours",
        variant: "destructive",
      });
    },
  });

  // FAQ queries and mutations
  const { data: faqs = [], isLoading: faqsLoading } = useQuery<any[]>({
    queryKey: [`/api/owner/salon/faqs`],
    enabled: !!salon?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const createFaqMutation = useMutation({
    mutationFn: async (faqData: FaqFormData) => {
      return await apiRequest("POST", `/api/owner/salon/faqs`, faqData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/owner/salon/faqs`] });
      setFaqDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Success",
        description: "FAQ created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create FAQ",
        variant: "destructive",
      });
    },
  });

  const updateFaqMutation = useMutation({
    mutationFn: async ({ id, ...faqData }: FaqFormData & { id: string }) => {
      return await apiRequest("PUT", `/api/owner/salon/faqs/${id}`, faqData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/owner/salon/faqs`] });
      setFaqDialogOpen(false);
      setEditingItem(null);
      toast({
        title: "Success",
        description: "FAQ updated successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update FAQ",
        variant: "destructive",
      });
    },
  });

  const deleteFaqMutation = useMutation({
    mutationFn: async (faqId: string) => {
      return await apiRequest("DELETE", `/api/owner/salon/faqs/${faqId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/owner/salon/faqs`] });
      toast({
        title: "Success",
        description: "FAQ deleted successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete FAQ",
        variant: "destructive",
      });
    },
  });

  // Helper function to format working hours display
  const getWorkingHoursForDay = (dayName: string) => {
    const dayMap: { [key: string]: number } = {
      'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 
      'Friday': 5, 'Saturday': 6, 'Sunday': 0
    };
    
    const dayOfWeek = dayMap[dayName];
    const daySchedule = workingHours.find(wh => wh.dayOfWeek === dayOfWeek);
    
    if (!daySchedule || !daySchedule.isOpen) {
      return { isOpen: false, hours: 'Closed' };
    }
    
    const formatTime = (time: string) => {
      if (!time) return '';
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${displayHour}:${minutes} ${ampm}`;
    };
    
    let hoursText = '';
    if (daySchedule.openTime && daySchedule.closeTime) {
      hoursText = `${formatTime(daySchedule.openTime)} - ${formatTime(daySchedule.closeTime)}`;
      
      // Add break time if available
      if (daySchedule.breakStartTime && daySchedule.breakEndTime) {
        hoursText += ` (Break: ${formatTime(daySchedule.breakStartTime)} - ${formatTime(daySchedule.breakEndTime)})`;
      }
    }
    
    return { 
      isOpen: true, 
      hours: hoursText || '9:00 AM - 8:00 PM' // fallback to default
    };
  };

  const brandInvitations = brandInvitationsData?.received || [];

  const salonForm = useForm<SalonFormData>({
    resolver: zodResolver(salonSchema),
    defaultValues: {
      name: salon?.name || "",
      description: salon?.description || "",
      phone: salon?.phone || "",
      address: salon?.address || "",
      latitude: salon?.latitude ? Number(salon.latitude) : undefined,
      longitude: salon?.longitude ? Number(salon.longitude) : undefined,
      imageUrl: salon?.imageUrl || "",
      instagramId: salon?.instagramId || "",
      facebookId: salon?.facebookId || "",
      googleMapsLink: salon?.googleMapsLink || "",
      confirmationAmount: salon?.confirmationAmount || 0,
      salonType: (salon as any)?.salonType || "unisex",
    },
  });

  const serviceForm = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      duration: 30,
      categoryId: "",
    },
  });

  const staffForm = useForm<StaffFormData>({
    resolver: zodResolver(staffSchema),
    defaultValues: {
      name: "",
      role: "",
      phone: "",
      email: "",
      photoUrl: "",
    },
  });

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phone || "",
      profileImageUrl: user?.profileImageUrl || "",
    },
  });

  // Mutation for responding to brand invitations
  const respondToInvitationMutation = useMutation({
    mutationFn: async ({ invitationId, status }: { invitationId: string, status: 'accepted' | 'rejected' }) => {
      const response = await apiRequest('PUT', `/api/brand-invitations/${invitationId}`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/brand-invitations/${user?.id}`] });
      toast({
        title: "Response sent",
        description: "Your response to the brand invitation has been recorded.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mark message as read mutation
  const markMessageAsReadMutation = useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiRequest("PUT", `/api/owner/messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/owner/messages'] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to mark message as read", description: error.message, variant: "destructive" });
    },
  });

  // Promotional video upload mutation
  const updatePromoVideoMutation = useMutation({
    mutationFn: async (promotionalVideoUrl: string) => {
      return await apiRequest("PUT", `/api/salons/${salon?.id}/promotional-video`, {
        promotionalVideoUrl
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/owner/salon'] });
      toast({
        title: "Video Updated!",
        description: "Your promotional video has been updated successfully.",
      });
      setPromoVideoDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to update promotional video",
        variant: "destructive",
      });
    },
  });

  // Fix promotional video ACL mutation
  const fixPromoVideoAclMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/fix-promo-video-acl", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/owner/salon'] });
      toast({
        title: "Video Fixed!",
        description: "Video permissions have been updated and should now play correctly.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: "Failed to fix video permissions",
        variant: "destructive",
      });
    },
  });

  const galleryForm = useForm<GalleryFormData>({
    resolver: zodResolver(gallerySchema),
    defaultValues: {
      title: "",
      description: "",
      category: "work",
    },
  });

  // FAQ form hook - moved to top level to avoid hooks violation
  const faqForm = useForm<FaqFormData>({
    resolver: zodResolver(faqSchema),
    defaultValues: {
      question: "",
      answer: "",
      isActive: true,
      displayOrder: 0,
    },
  });

  // Category form hook
  const categoryForm = useForm<ServiceCategoryFormData>({
    resolver: zodResolver(serviceCategorySchema),
    defaultValues: {
      name: "",
      description: "",
      icon: "Scissors",
      color: "#3B82F6",
    },
  });

  // Category mutation
  const categoryMutation = useMutation({
    mutationFn: async (data: ServiceCategoryFormData) => {
      const endpoint = editingItem ? `/api/categories/${editingItem.id}` : `/api/salons/${salon?.id}/categories`;
      const method = editingItem ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Category Updated!" : "Category Added!",
        description: editingItem ? "Service category has been updated." : "New service category has been created.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/categories`] });
      categoryForm.reset();
      setCategoryDialogOpen(false);
      setEditingItem(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to ${editingItem ? 'update' : 'create'} category. Please try again.`,
        variant: "destructive",
      });
    },
  });

  // Quick add categories mutation
  const quickAddCategoriesMutation = useMutation({
    mutationFn: async (categories: typeof PREMADE_CATEGORIES) => {
      const results = [];
      for (const cat of categories) {
        const res = await apiRequest('POST', `/api/salons/${salon?.id}/categories`, cat);
        results.push(await res.json());
      }
      return results;
    },
    onSuccess: (data) => {
      toast({
        title: `${data.length} Categories Added!`,
        description: "All selected categories have been added to your salon.",
      });
      setQuickAddDialogOpen(false);
      setSelectedPremade(new Set());
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/categories`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Quick add services mutation
  const quickAddServicesMutation = useMutation({
    mutationFn: async (servicesToAdd: { name: string; description: string; price: number; duration: number; categoryId: string | null }[]) => {
      const results = [];
      for (const svc of servicesToAdd) {
        const res = await apiRequest('POST', `/api/salons/${salon?.id}/services`, svc);
        results.push(await res.json());
      }
      return results;
    },
    onSuccess: (data) => {
      toast({
        title: `${data.length} Services Added!`,
        description: "All selected services have been added to your salon.",
      });
      setQuickAddDialogOpen(false);
      setSelectedPremade(new Set());
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/services`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Quick add staff mutation
  const quickAddStaffMutation = useMutation({
    mutationFn: async (staffToAdd: typeof PREMADE_STAFF) => {
      const results = [];
      for (const member of staffToAdd) {
        const res = await apiRequest('POST', `/api/salons/${salon?.id}/staff`, member);
        results.push(await res.json());
      }
      return results;
    },
    onSuccess: (data) => {
      toast({
        title: `${data.length} Staff Added!`,
        description: "All selected staff members have been added to your salon.",
      });
      setQuickAddDialogOpen(false);
      setSelectedPremade(new Set());
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/staff`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Quick add offers mutation
  const quickAddOffersMutation = useMutation({
    mutationFn: async (offersToAdd: typeof PREMADE_OFFERS) => {
      const results = [];
      const now = new Date();
      const validFrom = now.toISOString().split('T')[0] + 'T00:00:00.000Z';
      const validUntil = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T23:59:59.000Z';
      for (const offer of offersToAdd) {
        const payload = {
          ...offer,
          discountValue: parseFloat(offer.discountValue),
          minOrderAmount: parseFloat(offer.minOrderAmount || "0"),
          maxDiscountAmount: offer.maxDiscountAmount ? parseFloat(offer.maxDiscountAmount) : null,
          maxUsagePerCustomer: parseInt(offer.maxUsagePerCustomer),
          maxTotalUsage: offer.maxTotalUsage ? parseInt(offer.maxTotalUsage) : null,
          validFrom: new Date(validFrom),
          validUntil: new Date(validUntil),
          isApplicableToAllServices: true,
          applicableServices: [],
          isActive: true,
          isVisible: true,
          priority: 0,
          promoCode: "",
          isPromoCodeRequired: false,
        };
        const res = await apiRequest('POST', '/api/owner/salon/offers', payload);
        results.push(await res.json());
      }
      return results;
    },
    onSuccess: (data) => {
      toast({
        title: `${data.length} Offers Added!`,
        description: "All selected offers have been created for your salon.",
      });
      setQuickAddDialogOpen(false);
      setSelectedPremade(new Set());
      queryClient.invalidateQueries({ queryKey: ['/api/owner/salon/offers'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset FAQ form when dialog opens/closes or editing item changes
  useEffect(() => {
    if (faqDialogOpen) {
      if (editingItem) {
        // Pre-populate form for editing
        faqForm.reset({
          question: editingItem.question || "",
          answer: editingItem.answer || "",
          isActive: editingItem.isActive ?? true,
          displayOrder: editingItem.displayOrder || 0,
        });
      } else {
        // Reset form for new FAQ
        faqForm.reset({
          question: "",
          answer: "",
          isActive: true,
          displayOrder: faqs.length,
        });
      }
    }
  }, [faqDialogOpen, editingItem, faqs.length, faqForm]);

  // Reset salon form when dialog opens/closes
  useEffect(() => {
    if (salonDialogOpen && salon) {
      // Pre-populate form for editing existing salon
      salonForm.reset({
        name: salon.name || "",
        description: salon.description || "",
        phone: salon.phone || "",
        address: salon.address || "",
        latitude: salon.latitude ? Number(salon.latitude) : undefined,
        longitude: salon.longitude ? Number(salon.longitude) : undefined,
        imageUrl: salon.imageUrl || "",
        instagramId: salon.instagramId || "",
        facebookId: salon.facebookId || "",
        googleMapsLink: salon.googleMapsLink || "",
        confirmationAmount: salon.confirmationAmount || 0,
        salonType: (salon as any).salonType || "unisex",
      });
      // Reset temporary image state
      setTempImageUrl("");
      setImageUploading(false);
    }
  }, [salonDialogOpen, salon, salonForm]);

  // Wizard cover photo upload — uses local filesystem, no Object Storage needed
  const handleWizardCoverUpload = async (file: File) => {
    if (!file) return;
    // Show instant local preview via FileReader
    const reader = new FileReader();
    reader.onload = (e) => setTempImageUrl(e.target?.result as string);
    reader.readAsDataURL(file);

    setImageUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/owner/salon/cover-upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (res.ok) {
        const { imageUrl } = await res.json();
        setTempImageUrl(imageUrl);
        salonForm.setValue('imageUrl', imageUrl);
        toast({ title: "Cover photo added!", description: "Your photo will appear on your salon card." });
      } else {
        toast({ title: "Upload failed", description: "Could not save photo. Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Upload failed", description: "Network error. Please try again.", variant: "destructive" });
    } finally {
      setImageUploading(false);
    }
  };

  // Manual image upload function
  const handleImageUpload = async (file: File) => {
    if (!file) return;
    
    setImageUploading(true);
    try {
      // Get upload URL
      const response = await fetch('/api/objects/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const { uploadURL } = await response.json();

      // Upload file
      await fetch(uploadURL, {
        method: 'PUT',
        body: file,
      });

      // Set ACL policy
      try {
        const aclResponse = await fetch('/api/salon-images', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageUrl: uploadURL }),
        });
        
        if (aclResponse.ok) {
          const { objectPath } = await aclResponse.json();
          setTempImageUrl(objectPath);
          salonForm.setValue('imageUrl', objectPath);
        } else {
          setTempImageUrl(uploadURL);
          salonForm.setValue('imageUrl', uploadURL);
        }
      } catch (error) {
        console.error("Error setting image ACL:", error);
        setTempImageUrl(uploadURL);
        salonForm.setValue('imageUrl', uploadURL);
      }

      toast({
        title: "Image Ready",
        description: "Click 'Update Salon' below to save your new image.",
      });
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: "Upload Failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
    } finally {
      setImageUploading(false);
    }
  };

  // Salon mutation
  const salonMutation = useMutation({
    mutationFn: async (data: SalonFormData) => {
      const endpoint = salon ? `/api/salons/${salon.id}` : '/api/salons';
      const method = salon ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, {
        ...data,
        // Keep confirmationAmount as is - server expects rupees, not paisa
      });
    },
    onSuccess: (data) => {
      toast({
        title: salon ? "Salon Updated!" : "Salon Created!",
        description: salon ? "Your salon details have been updated." : "Your salon has been created successfully.",
      });
      setSalonDialogOpen(false);
      // Clear the cache and immediately set the new salon data
      queryClient.setQueryData(['/api/owner/salon'], data);
      // Also invalidate to trigger a fresh fetch
      queryClient.invalidateQueries({ queryKey: ['/api/owner/salon'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ── Wizard advancement effects (placed after all mutations are defined) ──
  // Step 0 → 1: salon profile created
  useEffect(() => {
    if (setupWizardOpen && setupWizardStep === 0 && salonMutation.isSuccess) {
      setSetupWizardStep(1);
      salonMutation.reset();
    }
  }, [salonMutation.isSuccess, setupWizardOpen, setupWizardStep]);

  // Step 1 → 2: services added
  useEffect(() => {
    if (setupWizardOpen && setupWizardStep === 1 && quickAddServicesMutation.isSuccess) {
      setSetupWizardStep(2);
      setSelectedPremade(new Set());
      quickAddServicesMutation.reset();
    }
  }, [quickAddServicesMutation.isSuccess, setupWizardOpen, setupWizardStep]);

  // Step 2 → 3: staff added
  useEffect(() => {
    if (setupWizardOpen && setupWizardStep === 2 && quickAddStaffMutation.isSuccess) {
      setSetupWizardStep(3);
      setSelectedPremade(new Set());
      setEditedStaffData({});
      quickAddStaffMutation.reset();
    }
  }, [quickAddStaffMutation.isSuccess, setupWizardOpen, setupWizardStep]);

  // Step 5 → 6: schedule saved
  useEffect(() => {
    if (setupWizardOpen && setupWizardStep === 5 && updateWorkingHoursMutation.isSuccess) {
      setSetupWizardStep(6);
      updateWorkingHoursMutation.reset();
    }
  }, [updateWorkingHoursMutation.isSuccess, setupWizardOpen, setupWizardStep]);

  const profileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest('PUT', '/api/customer/profile', data);
    },
    onSuccess: (data) => {
      toast({
        title: "Profile Updated!",
        description: "Your profile information has been updated successfully.",
      });
      setProfileDialogOpen(false);
      // Clear the cache and invalidate user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Service mutation
  const serviceMutation = useMutation({
    mutationFn: async (data: ServiceFormData) => {
      const endpoint = editingItem ? `/api/services/${editingItem.id}` : `/api/salons/${salon?.id}/services`;
      const method = editingItem ? 'PUT' : 'POST';
      
      // Filter out "none" category value and convert to null if needed
      const serviceData = {
        ...data,
        categoryId: data.categoryId === "none" || data.categoryId === "" ? null : data.categoryId
      };
      
      return apiRequest(method, endpoint, serviceData);
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Service Updated!" : "Service Added!",
        description: editingItem ? "Service has been updated." : "New service has been added to your salon.",
      });
      setServiceDialogOpen(false);
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/services`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      return apiRequest('DELETE', `/api/services/${serviceId}`, {});
    },
    onSuccess: () => {
      toast({
        title: "Service Deleted!",
        description: "Service has been removed from your salon.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/services`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Staff mutation
  const staffMutation = useMutation({
    mutationFn: async (data: StaffFormData) => {
      console.log('Staff mutation data:', data);
      const endpoint = editingItem ? `/api/staff/${editingItem.id}` : `/api/salons/${salon?.id}/staff`;
      const method = editingItem ? 'PUT' : 'POST';
      console.log('Staff API call:', { method, endpoint, data });
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Staff Updated!" : "Staff Added!",
        description: editingItem ? "Staff member has been updated." : "New staff member has been added.",
      });
      setStaffDialogOpen(false);
      setEditingItem(null);
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/staff`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Staff delete mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      return apiRequest("DELETE", `/api/staff/${staffId}`);
    },
    onSuccess: () => {
      toast({
        title: "Staff Deleted",
        description: "The staff member has been removed from your salon.",
      });
      setStaffToDelete(null);
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/staff`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Gallery mutation
  const galleryMutation = useMutation({
    mutationFn: async (data: { imageUrl: string } & GalleryFormData) => {
      const endpoint = editingItem ? `/api/salons/${salon?.id}/gallery/${editingItem.id}` : `/api/salons/${salon?.id}/gallery`;
      const method = editingItem ? 'PUT' : 'POST';
      return apiRequest(method, endpoint, data);
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Gallery Updated!" : "Image Added!",
        description: editingItem ? "Gallery image has been updated." : "New image has been added to your gallery.",
      });
      setGalleryDialogOpen(false);
      setEditingItem(null);
      galleryForm.reset();
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/gallery`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Gallery delete mutation
  const deleteGalleryMutation = useMutation({
    mutationFn: async (imageId: string) => {
      return apiRequest("DELETE", `/api/salons/${salon?.id}/gallery/${imageId}`);
    },
    onSuccess: () => {
      toast({
        title: "Image Deleted",
        description: "The image has been removed from your gallery.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/gallery`] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update booking status mutations
  const updateBookingStatusMutation = useMutation({
    mutationFn: async ({ bookingId, status, suggestedDate, suggestedTime, ownerNote }: { bookingId: string; status: string; suggestedDate?: string; suggestedTime?: string; ownerNote?: string }) => {
      return apiRequest("PUT", `/api/bookings/${bookingId}/status`, { status, suggestedDate, suggestedTime, ownerNote });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/bookings"] });
      toast({ title: "Booking updated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Failed to update booking", 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  const confirmBooking = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status: "confirmed" });
  };

  const cancelBooking = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status: "cancelled" });
  };

  const completeBooking = (bookingId: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status: "completed" });
  };

  const suggestBookingTime = (bookingId: string, date: string, time: string, note: string) => {
    updateBookingStatusMutation.mutate({ bookingId, status: "owner_suggested", suggestedDate: date, suggestedTime: time, ownerNote: note || undefined });
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Salon Owner Dashboard</h2>
          <p className="text-gray-600 mb-6">Please log in to access your salon dashboard</p>
          <Button asChild>
            <a href="/api/login">Log In</a>
          </Button>
        </div>
      </div>
    );
  }

  if (salonLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-300 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-gray-300 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const handleEditService = (service: Service) => {
    setEditingItem(service);
    serviceForm.reset({
      name: service.name,
      description: service.description || "",
      price: Number(service.price),
      duration: service.duration,
      categoryId: (service as any).categoryId || "none",
    });
    setServiceDialogOpen(true);
  };

  const handleDeleteService = (service: Service) => {
    if (window.confirm(`Are you sure you want to delete "${service.name}"? This action cannot be undone.`)) {
      deleteServiceMutation.mutate(service.id);
    }
  };

  const handleQuickCategoryChange = (service: Service, newCategoryId: string) => {
    const categoryValue = newCategoryId === "none" ? null : newCategoryId;
    
    // Set the service as being edited to use PUT method instead of POST
    setEditingItem(service);
    
    const updateData = {
      name: service.name,
      description: service.description || "",
      price: Number(service.price),
      duration: service.duration,
      categoryId: categoryValue,
    };
    
    serviceMutation.mutate(updateData);
  };

  const handleEditStaff = (member: Staff) => {
    setEditingItem(member);
    staffForm.reset({
      name: member.name,
      role: member.role,
      phone: member.phone || "",
      email: member.email || "",
      photoUrl: member.photoUrl || "",
    });
    setStaffDialogOpen(true);
  };

  const handleEditGallery = (galleryItem: SalonGallery) => {
    setEditingItem(galleryItem);
    galleryForm.reset({
      title: galleryItem.title || "",
      description: galleryItem.description || "",
      category: (galleryItem.category as "work" | "staff" | "interior") || "work",
    });
    setGalleryDialogOpen(true);
  };

  const handleGalleryUpload = async (): Promise<{ method: "PUT"; url: string }> => {
    try {
      const response = await apiRequest('POST', '/api/objects/upload');
      const data = await response.json() as { uploadURL: string };
      console.log("Upload URL response:", data);
      return {
        method: "PUT",
        url: data.uploadURL,
      };
    } catch (error) {
      console.error("Error getting upload URL:", error);
      throw error;
    }
  };

  const handleGalleryUploadComplete = (result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
    console.log("Upload result:", result);
    if (result.successful && result.successful.length > 0) {
      const uploadedFile = result.successful[0];
      console.log("Uploaded file:", uploadedFile);
      
      // Extract the URL from Uppy's response 
      // After successful upload to S3, the file URL is in the uploadURL field
      const uploadURL = (uploadedFile as any).uploadURL || (uploadedFile as any).response?.uploadURL;
      let imageUrl = uploadURL;
      
      // Remove query parameters to get clean URL for storage
      if (imageUrl && imageUrl.includes('?')) {
        imageUrl = imageUrl.split('?')[0];
      }
      
      // If we still don't have a URL, construct it manually from the original upload URL
      if (!imageUrl) {
        // This should not happen with proper upload, but fallback
        console.error("No image URL found in upload response, checking alternative sources");
        console.log("Upload file object:", uploadedFile);
      }
      
      console.log("Final image URL:", imageUrl);
      
      if (imageUrl) {
        // Submit the form with the uploaded image URL
        const formData = galleryForm.getValues();
        galleryMutation.mutate({
          ...formData,
          imageUrl,
        });
        // Close the dialog
        setGalleryDialogOpen(false);
      } else {
        console.error("No image URL found in upload result");
        alert("Upload failed - no URL found. Please try again.");
      }
    }
  };

  const handleDeleteGallery = (imageId: string) => {
    if (confirm("Are you sure you want to delete this image?")) {
      deleteGalleryMutation.mutate(imageId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Admin Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-red-600 text-white px-4 py-3 sticky top-0 z-50 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-5 w-5" />
              <div>
                <span className="font-semibold">Admin Mode:</span> You are viewing this salon owner's dashboard
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={exitImpersonation}
              disabled={exitingImpersonation}
              className="bg-white text-red-600 hover:bg-gray-100 border-white"
            >
              {exitingImpersonation ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                  Exiting...
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4 mr-2" />
                  Return to Admin
                </>
              )}
            </Button>
          </div>
        </div>
      )}
      
      {/* Premium Header */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(168,85,247,0.15)_0%,_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(234,179,8,0.12)_0%,_transparent_60%)]" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Salon Avatar */}
              <div className="relative flex-shrink-0">
                <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden border-2 border-white/20 shadow-xl">
                  {salon?.imageUrl ? (
                    <img
                      src={salon.imageUrl}
                      alt={salon.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        target.style.display = 'none';
                        const fallback = target.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    className="w-full h-full bg-gradient-to-br from-amber-500 to-orange-600 items-center justify-center"
                    style={{ display: salon?.imageUrl ? 'none' : 'flex' }}
                  >
                    <Scissors className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                </div>
                {salon?.verificationStatus === 'approved' && (
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <CheckCircle className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              {/* Salon Info */}
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                    {salon ? salon.name : "Setup Your Salon"}
                  </h1>
                  {salon && (
                    <Badge className={
                      salon.verificationStatus === 'approved'
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs"
                        : salon.verificationStatus === 'rejected'
                        ? "bg-red-500/20 text-red-300 border border-red-500/30 text-xs"
                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs"
                    }>
                      {salon.verificationStatus === 'approved' ? '✓ Verified' :
                       salon.verificationStatus === 'rejected' ? '✗ Rejected' : '⏳ Pending Review'}
                    </Badge>
                  )}
                  {salon && (salon as any).salonType && (
                    <Badge className="bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs capitalize">
                      {(salon as any).salonType === 'male' ? '👨 Men\'s Salon' :
                       (salon as any).salonType === 'female' ? '👩 Women\'s Salon' :
                       '👥 Unisex Salon'}
                    </Badge>
                  )}
                </div>
                <p className="text-slate-400 text-sm">
                  {salon ? "Premium Salon Dashboard — Grow your business with Sanwar" : "Create your salon profile to get started"}
                </p>
                {salon?.address && (
                  <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                    <MapPin className="h-3 w-3" />{salon.address}
                  </p>
                )}
              </div>
            </div>
            {/* Right side stats */}
            {salon && (
              <div className="flex items-center gap-3 sm:gap-4">
                {/* Preview My Salon button */}
                <a
                  href={`/salon/${salon.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white text-sm font-semibold transition-all shadow-sm"
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">Preview Salon</span>
                  <span className="sm:hidden">Preview</span>
                </a>
                <div className="text-center px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-lg sm:text-xl font-bold text-amber-400">{bookings.length}</p>
                  <p className="text-xs text-slate-400">Bookings</p>
                </div>
                <div className="text-center px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-lg sm:text-xl font-bold text-emerald-400">
                    ₹{bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0).toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">Revenue</p>
                </div>
                <div className="text-center px-3 py-2 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-lg sm:text-xl font-bold text-yellow-400">
                    {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "—"}
                  </p>
                  <p className="text-xs text-slate-400">Rating</p>
                </div>
              </div>
            )}
            {!salon && (
              <Button
                onClick={() => { setSetupWizardOpen(true); setSetupWizardStep(0); }}
                size="lg"
                className="bg-amber-500 hover:bg-amber-400 text-white border-0 shadow-lg shadow-amber-500/25"
              >
                <Store className="h-4 w-4 mr-2" />
                Create Salon Profile
              </Button>
            )}
          </div>
          {salon?.verificationNotes && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
              <p className="text-sm text-blue-300"><span className="font-semibold">Admin Note:</span> {salon.verificationNotes}</p>
            </div>
          )}
        </div>
      </div>

      {!salon ? (
        // Salon Setup Screen
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="text-center mb-6 sm:mb-8">
            <Scissors className="h-12 w-12 sm:h-16 sm:w-16 text-primary mx-auto mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Welcome to Sanwar!</h2>
            <p className="text-base sm:text-lg text-gray-600">Let's set up your salon profile to start attracting customers</p>
          </div>
          
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl">Setup Your Salon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-gray-600 mb-4 text-sm sm:text-base">
                    Complete your salon profile to appear on our platform and start receiving bookings from customers.
                  </p>
                  <Button 
                    onClick={() => { setSetupWizardOpen(true); setSetupWizardStep(0); }}
                    size="lg" 
                    className="w-full"
                  >
                    <Store className="h-4 w-4 mr-2" />
                    Create Salon Profile
                  </Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="font-semibold mb-4">What you'll get:</h3>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Eye className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">Your salon visible to thousands of customers</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">Automated booking management system</span>
                    </div>
                    <div className="flex items-center">
                      <IndianRupee className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">Secure payment processing</span>
                    </div>
                    <div className="flex items-center">
                      <BarChart3 className="h-4 w-4 text-green-500 mr-3" />
                      <span className="text-sm">Business analytics and insights</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Main Dashboard
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="mb-6">
              {/* Mobile Tab Navigation */}
              <div className="block sm:hidden">
                <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1">
                  <TabsTrigger value="overview" className="text-xs py-3">Overview</TabsTrigger>
                  <TabsTrigger value="services" className="text-xs py-3" data-testid="services-section">Services</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1 mt-1">
                  <TabsTrigger value="staff" className="text-xs py-3 col-span-2" data-testid="staff-tab">Staff</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1 mt-1">
                  <TabsTrigger value="gallery" className="text-xs py-3">Media Gallery</TabsTrigger>
                  <TabsTrigger value="bookings" className="text-xs py-3" data-testid="bookings-tab">Bookings</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1 mt-1">
                  <TabsTrigger value="offers" className="text-xs py-3">Offers</TabsTrigger>
                  <TabsTrigger value="faqs" className="text-xs py-3">FAQs</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-1 gap-1 h-auto p-1 mt-1">
                  <TabsTrigger value="reviews" className="text-xs py-3">Reviews</TabsTrigger>
                </TabsList>
                <TabsList className="grid w-full grid-cols-2 gap-1 h-auto p-1 mt-1">
                  <TabsTrigger
                    value="hire-staff"
                    className="text-xs py-3 relative"
                    disabled={salon?.verificationStatus !== 'approved'}
                    onClick={(e) => {
                      if (salon?.verificationStatus !== 'approved') {
                        e.preventDefault();
                      }
                    }}
                  >
                    {salon?.verificationStatus !== 'approved' ? '🔒' : '🔥'} Hire Staff
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="text-xs py-3" data-testid="settings-tab">Settings</TabsTrigger>
                </TabsList>
              </div>
              
              {/* Desktop Tab Navigation */}
              <div className="hidden sm:block">
                <TabsList className="grid w-full grid-cols-10 gap-1">
                  <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
                  <TabsTrigger value="services" className="text-sm">Services</TabsTrigger>
                  <TabsTrigger value="staff" className="text-sm">Staff</TabsTrigger>
                  <TabsTrigger value="gallery" className="text-sm">Media Gallery</TabsTrigger>
                  <TabsTrigger value="bookings" className="text-sm">Bookings</TabsTrigger>
                  <TabsTrigger value="offers" className="text-sm">Offers</TabsTrigger>
                  <TabsTrigger value="faqs" className="text-sm">FAQs</TabsTrigger>
                  <TabsTrigger value="reviews" className="text-sm">Reviews</TabsTrigger>
                  <TabsTrigger
                    value="hire-staff"
                    className={`text-sm font-semibold ${salon?.verificationStatus === 'approved' ? 'text-blue-600' : 'text-gray-400 opacity-60'}`}
                    disabled={salon?.verificationStatus !== 'approved'}
                  >
                    {salon?.verificationStatus !== 'approved' ? '🔒' : '🔥'} Hire Staff
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="text-sm">Settings</TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value="overview" className="space-y-4 sm:space-y-6">

              {/* Salon Type Selector */}
              <div className="rounded-2xl border bg-gradient-to-br from-slate-50 to-white p-4 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-8 w-8 rounded-lg bg-purple-100 flex items-center justify-center">
                    <Store className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Salon Type</h3>
                    <p className="text-xs text-gray-500">Select who your salon primarily serves</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: "unisex", label: "Unisex", emoji: "👥", desc: "Men & Women", color: "border-purple-300 bg-purple-50", active: "border-purple-500 bg-purple-100 shadow-md shadow-purple-100" },
                    { value: "male", label: "Men's", emoji: "👨", desc: "Men Only", color: "border-blue-300 bg-blue-50", active: "border-blue-500 bg-blue-100 shadow-md shadow-blue-100" },
                    { value: "female", label: "Women's", emoji: "👩", desc: "Women Only", color: "border-pink-300 bg-pink-50", active: "border-pink-500 bg-pink-100 shadow-md shadow-pink-100" },
                  ].map((type) => {
                    const currentType = (salon as any)?.salonType || "unisex";
                    const isActive = currentType === type.value;
                    return (
                      <button
                        key={type.value}
                        onClick={async () => {
                          try {
                            await apiRequest("PUT", `/api/salons/${salon.id}`, { salonType: type.value });
                            queryClient.invalidateQueries({ queryKey: ['/api/owner/salon'] });
                            toast({ title: "Salon type updated!", description: `Salon set to ${type.label} type.` });
                          } catch {
                            toast({ title: "Error", description: "Could not update salon type.", variant: "destructive" });
                          }
                        }}
                        className={`relative flex flex-col items-center p-3 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${isActive ? type.active : type.color + ' hover:border-opacity-70'}`}
                      >
                        {isActive && (
                          <div className="absolute top-2 right-2 h-4 w-4 rounded-full bg-green-500 flex items-center justify-center">
                            <CheckCircle className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <span className="text-2xl sm:text-3xl mb-1">{type.emoji}</span>
                        <span className="font-semibold text-gray-900 text-xs sm:text-sm">{type.label}</span>
                        <span className="text-xs text-gray-500 hidden sm:block">{type.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Actions — Premium Cards */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-amber-500" />
                  <h3 className="font-semibold text-gray-900">Quick Actions</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  <Link href="/owner/staff-slot-generator" className="group">
                    <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 sm:p-5 hover:shadow-lg hover:border-blue-200 transition-all cursor-pointer h-full">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center mb-3 shadow-lg shadow-blue-200">
                        <Calendar className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Staff Time Slots</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">Generate individual slots for each staff member</p>
                      <div className="mt-3 flex items-center text-blue-600 text-xs font-medium group-hover:gap-2 gap-1 transition-all">
                        Open <span>→</span>
                      </div>
                    </div>
                  </Link>

                  <button onClick={() => setPromoVideoDialogOpen(true)} className="group text-left w-full">
                    <div className="relative overflow-hidden rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-pink-50 p-4 sm:p-5 hover:shadow-lg hover:border-purple-200 transition-all cursor-pointer h-full">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="h-10 w-10 rounded-xl bg-purple-600 flex items-center justify-center mb-3 shadow-lg shadow-purple-200">
                        <Video className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Promotional Video</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">Upload a video tour of your salon for customers</p>
                      <div className="mt-3 flex items-center text-purple-600 text-xs font-medium group-hover:gap-2 gap-1 transition-all">
                        Upload <span>→</span>
                      </div>
                    </div>
                  </button>

                  <Link href="/owner/account-details" className="group">
                    <div className="relative overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-4 sm:p-5 hover:shadow-lg hover:border-emerald-200 transition-all cursor-pointer h-full">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="h-10 w-10 rounded-xl bg-emerald-600 flex items-center justify-center mb-3 shadow-lg shadow-emerald-200">
                        <CreditCard className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Account Details</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">Setup bank account for payment transfers</p>
                      <div className="mt-3 flex items-center text-emerald-600 text-xs font-medium group-hover:gap-2 gap-1 transition-all">
                        Setup <span>→</span>
                      </div>
                    </div>
                  </Link>

                  <Link href="/owner/messages" className="group">
                    <div className="relative overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-4 sm:p-5 hover:shadow-lg hover:border-amber-200 transition-all cursor-pointer h-full">
                      <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                      <div className="h-10 w-10 rounded-xl bg-amber-600 flex items-center justify-center mb-3 shadow-lg shadow-amber-200">
                        <MessageSquare className="h-5 w-5 text-white" />
                      </div>
                      <h4 className="font-semibold text-gray-900 text-sm mb-1">Customer Messages</h4>
                      <p className="text-xs text-gray-500 leading-relaxed">Chat directly with your customers</p>
                      <div className="mt-3 flex items-center text-amber-600 text-xs font-medium group-hover:gap-2 gap-1 transition-all">
                        Open <span>→</span>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-testid="salon-stats">
                {[
                  { icon: Calendar, label: "Total Bookings", value: bookings.length, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100" },
                  { icon: IndianRupee, label: "Total Revenue", value: `₹${bookings.reduce((sum, b) => sum + Number(b.totalAmount || 0), 0).toLocaleString()}`, color: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100" },
                  { icon: Star, label: "Avg Rating", value: salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New", color: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100" },
                  { icon: Users, label: "Team Members", value: staff.length, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100" },
                ].map(({ icon: Icon, label, value, color, bg, border }) => (
                  <Card key={label} className={`border ${border} shadow-sm hover:shadow-md transition-shadow`}>
                    <CardContent className="p-4 sm:p-5">
                      <div className={`h-10 w-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                      </div>
                      <p className="text-xs sm:text-sm font-medium text-gray-500 mb-1">{label}</p>
                      <p className={`text-xl sm:text-2xl font-bold ${color}`}>{value}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Salon ID Card for Brand Invitations */}
              <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg sm:text-xl flex items-center">
                    <Store className="h-5 w-5 mr-2 text-indigo-600" />
                    Salon ID for Brand Partners
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Your Salon ID</p>
                          <p className="text-lg font-mono bg-gray-100 px-3 py-1 rounded border select-all">
                            {salon?.id}
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(salon?.id || '');
                            toast({
                              title: "Copied!",
                              description: "Salon ID copied to clipboard",
                            });
                          }}
                        >
                          Copy ID
                        </Button>
                      </div>
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p className="font-medium">📋 How to use this ID:</p>
                      <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Share this ID with brand owners who want to partner with your salon</li>
                        <li>Brand owners can use this ID to send you partnership invitations</li>
                        <li>You'll receive notifications about partnership requests in your dashboard</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Brand Invitations */}
              {brandInvitations.length > 0 && (
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg sm:text-xl flex items-center justify-between">
                      <div className="flex items-center">
                        <Users className="h-5 w-5 mr-2 text-purple-600" />
                        Brand Partnership Requests
                      </div>
                      <Badge variant="secondary">{brandInvitations.filter(inv => inv.status === 'pending').length} pending</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {invitationsLoading ? (
                      <div className="space-y-4">
                        {Array.from({ length: 2 }).map((_, i) => (
                          <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {brandInvitations.map((invitation) => (
                          <div key={invitation.id} className="bg-white p-4 rounded-lg border">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className="font-semibold text-gray-900">
                                    {invitation.brandName || 'Brand Owner'}
                                  </h4>
                                  <Badge 
                                    variant={
                                      invitation.status === 'pending' ? 'outline' :
                                      invitation.status === 'accepted' ? 'default' : 'destructive'
                                    }
                                  >
                                    {invitation.status}
                                  </Badge>
                                </div>
                                {invitation.message && (
                                  <p className="text-sm text-gray-600 mb-3">
                                    "{invitation.message}"
                                  </p>
                                )}
                                <p className="text-xs text-gray-500">
                                  Received: {new Date(invitation.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              {invitation.status === 'pending' && (
                                <div className="flex gap-2 ml-4">
                                  <Button
                                    size="sm"
                                    onClick={() => respondToInvitationMutation.mutate({ 
                                      invitationId: invitation.id, 
                                      status: 'accepted' 
                                    })}
                                    disabled={respondToInvitationMutation.isPending}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => respondToInvitationMutation.mutate({ 
                                      invitationId: invitation.id, 
                                      status: 'rejected' 
                                    })}
                                    disabled={respondToInvitationMutation.isPending}
                                  >
                                    Decline
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Recent Bookings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Recent Bookings
                    <Badge variant="secondary">{bookings.length} total</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {bookingsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : bookings.length > 0 ? (
                    <div className="space-y-4">
                      {bookings.slice(0, 5).map((booking) => (
                        <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-medium text-gray-900">
                                {booking.service?.name || 'Service Booking'}
                              </p>
                              <Badge 
                                variant={
                                  booking.status === 'confirmed' ? 'default' :
                                  booking.status === 'completed' ? 'secondary' :
                                  booking.status === 'cancelled' ? 'destructive' : 'outline'
                                }
                              >
                                {booking.status}
                              </Badge>
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm text-gray-600">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(booking.date).toLocaleDateString('en-US', { 
                                  weekday: 'short',
                                  month: 'short', 
                                  day: 'numeric'
                                })} at {booking.startTime} - {booking.endTime}
                              </p>
                              {booking.customer?.name && (
                                <p className="text-sm text-gray-600">
                                  Customer: {booking.customer.name}
                                </p>
                              )}
                              {booking.staff?.name && (
                                <p className="text-sm text-gray-600">
                                  Staff: {booking.staff.name}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-right ml-4">
                            <p className="text-lg font-semibold text-green-600">
                              ₹{parseFloat(booking.totalAmount?.toString() || '0').toFixed(2)}
                            </p>
                            <p className="text-xs text-gray-500">
                              {booking.paymentStatus === 'completed' ? 'Paid' : 'Pending'}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No bookings yet. Customers will appear here once they book your services.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="services" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Services & Pricing
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuickAddType('services');
                          setSelectedPremade(new Set());
                          setQuickAddDialogOpen(true);
                        }}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Quick Add
                      </Button>
                      <Button onClick={() => {
                        setEditingItem(null);
                        serviceForm.reset();
                        setServiceDialogOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {servicesLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-20 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : services.length > 0 ? (
                    <div className="space-y-4">
                      {services.map((service) => (
                        <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <h3 className="font-semibold">{service.name}</h3>
                            <p className="text-sm text-gray-600">{service.description}</p>
                            <div className="flex items-center mt-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3 mr-1" />
                              {service.duration} mins
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div className="text-lg font-semibold text-green-600">₹{service.price}</div>
                            </div>
                            <Select
                              value={(service as any).categoryId || "none"}
                              onValueChange={(value) => handleQuickCategoryChange(service, value)}
                            >
                              <SelectTrigger className="h-8 w-40 text-xs">
                                {(() => {
                                  const cat = serviceCategories.find((c: any) => c.id === (service as any).categoryId);
                                  return cat ? (
                                    <div className="flex items-center gap-1.5 overflow-hidden">
                                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color || '#3B82F6' }} />
                                      <span className="truncate">{cat.name}</span>
                                    </div>
                                  ) : (
                                    <span className="text-gray-400">No Category</span>
                                  );
                                })()}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">No Category</SelectItem>
                                {serviceCategories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    <div className="flex items-center space-x-2">
                                      <div 
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: category.color || '#3B82F6' }}
                                      />
                                      <span>{category.name}</span>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditService(service)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteService(service)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No services added yet. Add your first service to start accepting bookings.</p>
                      <Button onClick={() => {
                        setEditingItem(null);
                        serviceForm.reset();
                        setServiceDialogOpen(true);
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Your First Service
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>


              {/* Categories Section inside Services */}
              <Card>
                <CardHeader>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl">Service Categories</CardTitle>
                      <CardDescription>
                        Organize your services into categories to help customers find what they need
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuickAddType('categories');
                          setSelectedPremade(new Set());
                          setQuickAddDialogOpen(true);
                        }}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Quick Add
                      </Button>
                      <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                        <DialogTrigger asChild>
                          <Button onClick={() => {
                            setEditingItem(null);
                            categoryForm.reset({
                              name: "",
                              description: "",
                              icon: "Scissors",
                              color: "#3B82F6",
                            });
                          }}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Category
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>
                              {editingItem ? "Edit Category" : "Add New Category"}
                            </DialogTitle>
                            <DialogDescription>
                              Create categories to organize your services and help customers navigate your offerings
                            </DialogDescription>
                          </DialogHeader>
                          <Form {...categoryForm}>
                            <form onSubmit={categoryForm.handleSubmit((data) => {
                              categoryMutation.mutate(data);
                            })}>
                              <div className="space-y-4">
                                <FormField
                                  control={categoryForm.control}
                                  name="name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Category Name *</FormLabel>
                                      <FormControl>
                                        <Input 
                                          {...field} 
                                          placeholder="e.g., Hair Care, Facial Treatments, Nail Services"
                                          data-testid="input-category-name"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={categoryForm.control}
                                  name="description"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description (Optional)</FormLabel>
                                      <FormControl>
                                        <Textarea 
                                          {...field} 
                                          placeholder="Brief description of services in this category"
                                          rows={2}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                  <FormField
                                    control={categoryForm.control}
                                    name="icon"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Icon *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Choose an icon" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="Scissors">✂️ Scissors</SelectItem>
                                            <SelectItem value="Sparkles">✨ Sparkles</SelectItem>
                                            <SelectItem value="Palette">🎨 Palette</SelectItem>
                                            <SelectItem value="Heart">❤️ Heart</SelectItem>
                                            <SelectItem value="Star">⭐ Star</SelectItem>
                                            <SelectItem value="Crown">👑 Crown</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                  <FormField
                                    control={categoryForm.control}
                                    name="color"
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Color *</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value}>
                                          <FormControl>
                                            <SelectTrigger>
                                              <SelectValue placeholder="Choose a color" />
                                            </SelectTrigger>
                                          </FormControl>
                                          <SelectContent>
                                            <SelectItem value="#3B82F6">🔵 Blue</SelectItem>
                                            <SelectItem value="#10B981">🟢 Green</SelectItem>
                                            <SelectItem value="#F59E0B">🟡 Yellow</SelectItem>
                                            <SelectItem value="#EF4444">🔴 Red</SelectItem>
                                            <SelectItem value="#8B5CF6">🟣 Purple</SelectItem>
                                            <SelectItem value="#EC4899">🩷 Pink</SelectItem>
                                          </SelectContent>
                                        </Select>
                                        <FormMessage />
                                      </FormItem>
                                    )}
                                  />
                                </div>
                              </div>
                              <div className="flex justify-end space-x-2 mt-6">
                                <Button 
                                  type="button" 
                                  variant="outline" 
                                  onClick={() => setCategoryDialogOpen(false)}
                                >
                                  Cancel
                                </Button>
                                <Button type="submit" data-testid="button-save-category">
                                  {editingItem ? "Update Category" : "Add Category"}
                                </Button>
                              </div>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {serviceCategories.length === 0 ? (
                    <div className="text-center py-8">
                      <Tags className="h-10 w-10 text-gray-400 mx-auto mb-3" />
                      <h3 className="text-base font-medium text-gray-900 mb-2">No categories yet</h3>
                      <p className="text-gray-600 mb-4 text-sm">
                        Create categories to organize your services and make them easier for customers to find
                      </p>
                      <Button onClick={() => setCategoryDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Category
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {serviceCategories.map((category) => (
                        <Card key={category.id} className="p-4">
                          <div className="flex items-start space-x-3">
                            <div 
                              className="w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                              style={{ backgroundColor: category.color || '#3B82F6' }}
                            >
                              {category.icon === 'Scissors' ? '✂️' : 
                               category.icon === 'Sparkles' ? '✨' : 
                               category.icon === 'Palette' ? '🎨' :
                               category.icon === 'Heart' ? '❤️' :
                               category.icon === 'Star' ? '⭐' : 
                               category.icon === 'Crown' ? '👑' : '💫'}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-gray-900 truncate" data-testid={`text-category-name-${category.id}`}>
                                {category.name}
                              </h3>
                              {category.description && (
                                <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                              )}
                              <div className="flex justify-end space-x-2 mt-3">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    setEditingItem(category);
                                    categoryForm.reset({
                                      name: category.name,
                                      description: category.description || "",
                                      icon: category.icon || "Scissors",
                                      color: category.color || "#3B82F6",
                                    });
                                    setCategoryDialogOpen(true);
                                  }}
                                  data-testid={`button-edit-category-${category.id}`}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => {
                                    if (window.confirm(`Are you sure you want to delete "${category.name}"? Services in this category will become uncategorized.`)) {
                                      console.log('Delete category:', category.id);
                                    }
                                  }}
                                  data-testid={`button-delete-category-${category.id}`}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="staff" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Team Management
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuickAddType('staff');
                          setSelectedPremade(new Set());
                          setQuickAddDialogOpen(true);
                        }}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Quick Add
                      </Button>
                      <Button onClick={() => {
                        setEditingItem(null);
                        staffForm.reset();
                        setStaffDialogOpen(true);
                      }}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Staff
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {staffLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  ) : staff.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {staff.map((member) => (
                        <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                              {member.photoUrl ? (
                                <img 
                                  src={member.photoUrl.startsWith('/objects/') ? member.photoUrl : `/objects/uploads/${member.photoUrl}`} 
                                  alt={member.name} 
                                  className="w-12 h-12 rounded-full object-cover" 
                                />
                              ) : (
                                <Users className="h-6 w-6 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <h4 className="font-semibold">{member.name}</h4>
                              <p className="text-sm text-gray-600">{member.role}</p>
                              {member.phone && (
                                <p className="text-xs text-gray-500">{member.phone}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => handleEditStaff(member)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              type="button"
                              onClick={() => setStaffToDelete(member)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No staff members added yet. Add your team to help customers choose their preferred stylist.</p>
                      <Button onClick={() => {
                        setEditingItem(null);
                        staffForm.reset();
                        setStaffDialogOpen(true);
                      }}>
                        <UserPlus className="h-4 w-4 mr-2" />
                        Add Your First Team Member
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

            </TabsContent>

            <TabsContent value="gallery" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Media Gallery Management
                    <Button asChild>
                      <Link href="/shopkeeper/media-gallery">
                        <Camera className="h-4 w-4 mr-2" />
                        Open Media Gallery
                      </Link>
                    </Button>
                  </CardTitle>
                  <CardDescription>
                    Manage your salon photos and videos (up to 50 files). Upload high-quality images to showcase your work.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 space-y-6">
                    <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-600 rounded-2xl flex items-center justify-center mb-6">
                      <Camera className="h-10 w-10 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Enhanced Media Gallery</h3>
                      <p className="text-gray-600 max-w-md mx-auto">
                        Upload up to 50 photos and videos to showcase your salon's work. 
                        Support for images and videos with advanced categorization and management.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-lg mx-auto text-sm text-gray-600">
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        50 files limit
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Photos & Videos
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Categories
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        100MB per file
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Drag & Drop
                      </div>
                      <div className="flex items-center">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        Cloud Storage
                      </div>
                    </div>
                    <Button size="lg" asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
                      <Link href="/shopkeeper/media-gallery">
                        <Camera className="h-5 w-5 mr-2" />
                        Access Media Gallery
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="bookings" className="space-y-6">
              {/* Queue Management */}
              <Card className="border-2 border-orange-200 bg-gradient-to-r from-orange-50 to-amber-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-lg">
                    <Clock className="h-5 w-5 mr-2 text-orange-600" />
                    Queue Management
                    <Badge variant="outline" className="ml-2 bg-orange-100 text-orange-700 border-orange-300">
                      Live
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Update wait time for walk-in customers. This will be displayed on your salon card.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">Next customer in:</span>
                    {[5, 10, 15, 20, 30, 45, 60].map((mins) => (
                      <Button
                        key={mins}
                        variant={salon?.queueWaitTime === mins ? "default" : "outline"}
                        size="sm"
                        className={salon?.queueWaitTime === mins 
                          ? "bg-orange-600 hover:bg-orange-700" 
                          : "hover:bg-orange-100 hover:border-orange-300"
                        }
                        onClick={async () => {
                          try {
                            await apiRequest('PUT', '/api/owner/salon/queue', { queueWaitTime: mins });
                            queryClient.invalidateQueries({ queryKey: ['/api/owner/salon'] });
                            toast({
                              title: "Queue Updated",
                              description: `Wait time set to ${mins} minutes`,
                            });
                          } catch (error) {
                            toast({
                              title: "Error",
                              description: "Failed to update queue status",
                              variant: "destructive"
                            });
                          }
                        }}
                      >
                        {mins} min
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={async () => {
                        try {
                          await apiRequest('DELETE', '/api/owner/salon/queue');
                          queryClient.invalidateQueries({ queryKey: ['/api/owner/salon'] });
                          toast({
                            title: "Queue Cleared",
                            description: "Wait time has been cleared",
                          });
                        } catch (error) {
                          toast({
                            title: "Error",
                            description: "Failed to clear queue status",
                            variant: "destructive"
                          });
                        }
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                  {salon?.queueWaitTime && (
                    <div className="mt-3 p-2 bg-orange-100 rounded-lg flex items-center">
                      <Clock className="h-4 w-4 text-orange-600 mr-2" />
                      <span className="text-sm text-orange-800">
                        Currently showing: <strong>{salon.queueWaitTime} min wait</strong> on your salon card
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Booking Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Calendar className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Today's Bookings</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {bookings.filter(b => b.date === new Date().toISOString().split('T')[0]).length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-orange-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Pending</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {bookings.filter(b => b.status === 'pending').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Completed</p>
                        <p className="text-2xl font-bold text-gray-900">
                          {bookings.filter(b => b.status === 'completed').length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <IndianRupee className="h-8 w-8 text-purple-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-600">Today's Revenue</p>
                        <p className="text-2xl font-bold text-gray-900">
                          ₹{bookings
                            .filter(b => b.date === new Date().toISOString().split('T')[0])
                            .reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0)
                            .toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* All Bookings with Tabs */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span className="text-lg font-bold">All Bookings</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="text-xs px-2 sm:px-3">
                        <Calendar className="h-4 w-4 sm:mr-1.5" />
                        <span className="hidden sm:inline">Filter by Date</span>
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs px-2 sm:px-3">
                        <span className="hidden sm:inline">Export</span>
                        <span className="sm:hidden">↓</span>
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="today" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mb-4 h-auto">
                      <TabsTrigger value="today" className="text-xs sm:text-sm py-2.5">
                        Today ({bookings.filter(b => {
                          const today = new Date().toISOString().split('T')[0];
                          return b.date === today;
                        }).length})
                      </TabsTrigger>
                      <TabsTrigger value="tomorrow" className="text-xs sm:text-sm py-2.5">
                        Tomorrow ({bookings.filter(b => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          return b.date === tomorrow.toISOString().split('T')[0];
                        }).length})
                      </TabsTrigger>
                      <TabsTrigger value="upcoming" className="text-xs sm:text-sm py-2.5">
                        Upcoming ({bookings.filter(b => {
                          const dayAfterTomorrow = new Date();
                          dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
                          return b.date >= dayAfterTomorrow.toISOString().split('T')[0];
                        }).length})
                      </TabsTrigger>
                      <TabsTrigger value="previous" className="text-xs sm:text-sm py-2.5">
                        Previous ({bookings.filter(b => {
                          const today = new Date().toISOString().split('T')[0];
                          return b.date < today;
                        }).length})
                      </TabsTrigger>
                    </TabsList>
                    
                    {/* Today's Bookings */}
                    <TabsContent value="today">
                      {bookingsLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      ) : (() => {
                        const today = new Date().toISOString().split('T')[0];
                        const todayBookings = bookings.filter(b => b.date === today);
                        return todayBookings.length > 0 ? (
                          <div className="space-y-4">
                            {todayBookings.map((booking) => (
                              <BookingCard key={booking.id} booking={booking} completeBooking={completeBooking} confirmBooking={confirmBooking} suggestTime={suggestBookingTime} updateBookingStatusMutation={updateBookingStatusMutation} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No bookings for today</p>
                          </div>
                        );
                      })()}
                    </TabsContent>
                    
                    {/* Tomorrow's Bookings */}
                    <TabsContent value="tomorrow">
                      {bookingsLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      ) : (() => {
                        const tomorrow = new Date();
                        tomorrow.setDate(tomorrow.getDate() + 1);
                        const tomorrowStr = tomorrow.toISOString().split('T')[0];
                        const tomorrowBookings = bookings.filter(b => b.date === tomorrowStr);
                        return tomorrowBookings.length > 0 ? (
                          <div className="space-y-4">
                            {tomorrowBookings.map((booking) => (
                              <BookingCard key={booking.id} booking={booking} completeBooking={completeBooking} confirmBooking={confirmBooking} suggestTime={suggestBookingTime} updateBookingStatusMutation={updateBookingStatusMutation} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No bookings for tomorrow</p>
                          </div>
                        );
                      })()}
                    </TabsContent>
                    
                    {/* Upcoming Bookings (beyond tomorrow) */}
                    <TabsContent value="upcoming">
                      {bookingsLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      ) : (() => {
                        const dayAfterTomorrow = new Date();
                        dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
                        const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];
                        const upcomingBookings = bookings.filter(b => b.date >= dayAfterTomorrowStr);
                        return upcomingBookings.length > 0 ? (
                          <div className="space-y-4">
                            {upcomingBookings.map((booking) => (
                              <BookingCard key={booking.id} booking={booking} completeBooking={completeBooking} confirmBooking={confirmBooking} suggestTime={suggestBookingTime} updateBookingStatusMutation={updateBookingStatusMutation} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No upcoming bookings</p>
                          </div>
                        );
                      })()}
                    </TabsContent>
                    
                    {/* Previous Bookings */}
                    <TabsContent value="previous">
                      {bookingsLoading ? (
                        <div className="space-y-4">
                          {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="h-16 bg-gray-200 rounded animate-pulse"></div>
                          ))}
                        </div>
                      ) : (() => {
                        const today = new Date().toISOString().split('T')[0];
                        const previousBookings = bookings.filter(b => b.date < today);
                        return previousBookings.length > 0 ? (
                          <div className="space-y-4">
                            {previousBookings.map((booking) => (
                              <BookingCard key={booking.id} booking={booking} completeBooking={completeBooking} confirmBooking={confirmBooking} suggestTime={suggestBookingTime} updateBookingStatusMutation={updateBookingStatusMutation} />
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>No previous bookings</p>
                          </div>
                        );
                      })()}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button 
                      className="h-16 flex-col space-y-2"
                      onClick={() => window.location.href = '/owner/walk-in-bookings'}
                    >
                      <UserPlus className="h-6 w-6" />
                      <span>Add Walk-in Customer</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col space-y-2">
                      <Calendar className="h-6 w-6" />
                      <span>Block Time Slot</span>
                    </Button>
                    <Button variant="outline" className="h-16 flex-col space-y-2">
                      <BarChart3 className="h-6 w-6" />
                      <span>View Reports</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="offers" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Percent className="h-5 w-5 mr-2" />
                      Promotional Offers Management
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setQuickAddType('offers');
                          setSelectedPremade(new Set());
                          setQuickAddDialogOpen(true);
                        }}
                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                      >
                        <Zap className="h-4 w-4 mr-1" />
                        Quick Add
                      </Button>
                      <Link href="/shopkeeper/offers">
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create New Offer
                        </Button>
                      </Link>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Create and manage special offers to attract more customers to your salon
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Percent className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Manage Your Offers</h3>
                    <p className="text-gray-600 mb-6">
                      Click "Create New Offer" to set up promotional campaigns for your services.
                      You can create percentage-based or fixed-amount discounts with custom validity periods.
                    </p>
                    <Link href="/shopkeeper/offers">
                      <Button>
                        <Percent className="h-4 w-4 mr-2" />
                        Go to Offers Management
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="reviews" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2" />
                    Customer Reviews & Replies
                  </CardTitle>
                  <p className="text-sm text-gray-600">
                    Manage and respond to customer reviews to build trust
                  </p>
                </CardHeader>
                <CardContent>
                  {reviewsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="text-center py-8">
                      <Star className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                      <p className="text-gray-500 mb-6">
                        Your salon doesn't have any customer reviews yet. Great reviews help build trust and attract more customers.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {reviews.map((review: ReviewWithReplies) => (
                        <div key={review.id} className="border border-gray-100 rounded-lg p-6 bg-white shadow-sm" data-testid={`review-card-${review.id}`}>
                          {/* Header with Profile, Name, Rating & Date */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start space-x-4">
                              {/* Profile Circle with Initial */}
                              <div className="bg-orange-500 rounded-full h-12 w-12 flex items-center justify-center flex-shrink-0">
                                <span className="text-white font-semibold text-lg">
                                  {(review.customerFirstName?.[0] || 'U').toUpperCase()}
                                </span>
                              </div>
                              
                              {/* Name and Rating */}
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-3">
                                    {/* Star Rating */}
                                    <div className="flex items-center">
                                      {Array.from({ length: 5 }).map((_, index) => (
                                        <Star
                                          key={index}
                                          className={`h-4 w-4 ${index < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                                        />
                                      ))}
                                    </div>
                                    {/* Customer Name */}
                                    <h4 className="font-medium text-gray-900" data-testid={`review-customer-${review.id}`}>
                                      {review.customerFirstName} {review.customerLastName}
                                    </h4>
                                  </div>
                                  {/* Date */}
                                  <div className="text-sm text-gray-500" data-testid={`review-date-${review.id}`}>
                                    {new Date(review.createdAt).toLocaleDateString('en-US', { 
                                      month: 'numeric', 
                                      day: 'numeric', 
                                      year: 'numeric' 
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Review Content */}
                          <div className="mb-4 pl-16">
                            <p className="text-gray-700 leading-relaxed text-base" data-testid={`review-text-${review.id}`}>
                              {review.comment}
                            </p>
                          </div>

                          {/* Service Details */}
                          {review.serviceName && (
                            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Service:</span> {review.serviceName}
                              </p>
                              {review.staffName && (
                                <p className="text-sm text-gray-600">
                                  <span className="font-medium">Staff:</span> {review.staffName}
                                </p>
                              )}
                            </div>
                          )}

                          {/* Existing Reply */}
                          {review.replies && review.replies.length > 0 && (
                            <div className="mb-4 ml-6 p-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-lg">
                              <div className="flex items-center mb-2">
                                <div className="bg-blue-500 rounded-full h-6 w-6 flex items-center justify-center mr-2">
                                  <User className="h-3 w-3 text-white" />
                                </div>
                                <span className="font-medium text-blue-900">Your Reply</span>
                                <span className="text-xs text-blue-600 ml-2">
                                  {new Date(review.replies[0].createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-blue-800 leading-relaxed" data-testid={`reply-text-${review.replies[0].id}`}>
                                {review.replies[0].replyText}
                              </p>
                            </div>
                          )}

                          {/* Reply Form */}
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <ReplyForm
                              reviewId={review.id}
                              existingReply={review.replies?.[0]}
                              onReplySuccess={() => {
                                // Refresh the reviews after successful reply
                                queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/reviews`] });
                              }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6">
              {/* Customer Conversations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-purple-600" />
                    Customer Messages
                    {customerConversations.filter((c: any) => c.unread_count > 0).length > 0 && (
                      <Badge variant="destructive" className="ml-2">
                        {customerConversations.reduce((sum: number, c: any) => sum + (c.unread_count || 0), 0)} new
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600">Messages from customers about your salon</p>
                </CardHeader>
                <CardContent>
                  {conversationsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : selectedChatCustomer ? (
                    <div>
                      <Button variant="ghost" size="sm" onClick={() => setSelectedChatCustomer(null)} className="mb-3">
                        <ArrowLeft className="h-4 w-4 mr-1" /> Back to conversations
                      </Button>
                      <div className="border rounded-lg p-3 mb-3 bg-gray-50">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                            {selectedChatCustomer.customer_image ? (
                              <img src={selectedChatCustomer.customer_image} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{selectedChatCustomer.customer_name || 'Customer'}</p>
                            <p className="text-xs text-gray-500">{selectedChatCustomer.customer_email}</p>
                          </div>
                        </div>
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-3 p-3 bg-gray-50 rounded-lg mb-3">
                        {chatMessagesLoading ? (
                          <div className="text-center py-4 text-gray-500">Loading...</div>
                        ) : chatMessages.length === 0 ? (
                          <div className="text-center py-4 text-gray-500">No messages yet</div>
                        ) : (
                          chatMessages.map((msg: any) => (
                            <div key={msg.id} className={`flex ${msg.senderType === 'owner' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                                msg.senderType === 'owner'
                                  ? 'bg-purple-600 text-white rounded-br-md'
                                  : 'bg-white text-gray-900 border rounded-bl-md shadow-sm'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                                <p className={`text-xs mt-1 ${msg.senderType === 'owner' ? 'text-purple-200' : 'text-gray-400'}`}>
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </p>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                      <form onSubmit={(e) => {
                        e.preventDefault();
                        if (chatReplyMessage.trim() && selectedChatCustomer) {
                          chatReplyMutation.mutate({ customerId: selectedChatCustomer.customer_id, message: chatReplyMessage });
                        }
                      }} className="flex gap-2">
                        <Input value={chatReplyMessage} onChange={(e: any) => setChatReplyMessage(e.target.value)} placeholder="Type your reply..." className="flex-1" disabled={chatReplyMutation.isPending} />
                        <Button type="submit" size="sm" disabled={!chatReplyMessage.trim() || chatReplyMutation.isPending} className="bg-purple-600 hover:bg-purple-700">
                          <Send className="h-4 w-4" />
                        </Button>
                      </form>
                    </div>
                  ) : customerConversations.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No customer messages yet</p>
                      <p className="text-sm text-gray-400">When customers message you, conversations will appear here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {customerConversations.map((conv: any) => (
                        <div key={conv.customer_id} onClick={() => {
                          setSelectedChatCustomer(conv);
                          if (salon?.id) {
                            fetch(`/api/salons/${salon.id}/chat/${conv.customer_id}/read`, { method: 'PUT', credentials: 'include' })
                              .then(() => queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon.id}/conversations`] }));
                          }
                        }} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors border ${conv.unread_count > 0 ? 'bg-purple-50 border-purple-200' : 'border-gray-200'}`}>
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {conv.customer_image ? (
                              <img src={conv.customer_image} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <User className="h-5 w-5 text-purple-600" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{conv.customer_name || 'Customer'}</p>
                              <span className="text-xs text-gray-400">{conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString() : ''}</span>
                            </div>
                            <p className="text-xs text-gray-500 truncate">{conv.last_sender_type === 'owner' ? 'You: ' : ''}{conv.last_message}</p>
                          </div>
                          {conv.unread_count > 0 && (
                            <Badge variant="destructive" className="flex-shrink-0">{conv.unread_count}</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Brand Messages */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Brand Messages
                  </CardTitle>
                  <p className="text-sm text-gray-600">Messages from your brand owner</p>
                </CardHeader>
                <CardContent>
                  {messagesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                  ) : brandMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No messages yet</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {brandMessages.map((message: any) => (
                        <div 
                          key={message.id} 
                          className={`border rounded-lg p-4 transition-colors ${
                            !message.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-purple-600" />
                              </div>
                              <div>
                                <p className="font-medium text-sm">Brand Owner</p>
                                <p className="text-xs text-gray-500">
                                  {new Date(message.createdAt).toLocaleDateString()} at {' '}
                                  {new Date(message.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              {message.priority === 'high' && (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                              {message.priority === 'medium' && (
                                <Clock className="h-4 w-4 text-yellow-500" />
                              )}
                              {!message.isRead && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => markMessageAsReadMutation.mutate(message.id)}
                                  disabled={markMessageAsReadMutation.isPending}
                                >
                                  Mark as Read
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="ml-10">
                            <p className="text-gray-700 leading-relaxed">{message.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="faqs" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Frequently Asked Questions
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-500">
                        {faqs.length}/10 FAQs
                      </span>
                      <Button 
                        onClick={() => {
                          if (faqs.length >= 10) {
                            toast({
                              title: "Limit Reached",
                              description: "You can have maximum 10 FAQs to maintain customer focus",
                              variant: "destructive",
                            });
                            return;
                          }
                          setEditingItem(null);
                          setFaqDialogOpen(true);
                        }}
                        disabled={faqs.length >= 10}
                        size="sm"
                        data-testid="button-add-faq"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add FAQ
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>
                    Help customers by answering common questions about your salon. This builds trust and reduces repetitive inquiries. You can add up to 10 FAQs.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {faqsLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-full"></div>
                        </div>
                      ))}
                    </div>
                  ) : faqs.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="rounded-full bg-blue-50 w-12 h-12 flex items-center justify-center mx-auto mb-4">
                        <HelpCircle className="h-6 w-6 text-blue-500" />
                      </div>
                      <h3 className="text-lg font-medium mb-2">No FAQs yet</h3>
                      <p className="text-gray-600 mb-4">
                        Add frequently asked questions to help your customers and build trust.
                      </p>
                      <Button 
                        onClick={() => {
                          setEditingItem(null);
                          setFaqDialogOpen(true);
                        }}
                        data-testid="button-add-first-faq"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Your First FAQ
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {faqs.map((faq: any, index: number) => (
                        <div key={faq.id} className="border rounded-lg p-4" data-testid={`faq-item-${faq.id}`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2 py-1 rounded">
                                  Q{index + 1}
                                </span>
                                {!faq.isActive && (
                                  <span className="bg-gray-100 text-gray-600 text-xs font-medium px-2 py-1 rounded">
                                    Inactive
                                  </span>
                                )}
                              </div>
                              <h4 className="font-medium text-gray-900 mb-2" data-testid={`faq-question-${faq.id}`}>
                                {faq.question}
                              </h4>
                              <p className="text-gray-600 text-sm leading-relaxed" data-testid={`faq-answer-${faq.id}`}>
                                {faq.answer}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 ml-4">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingItem(faq);
                                  setFaqDialogOpen(true);
                                }}
                                data-testid={`button-edit-faq-${faq.id}`}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  if (confirm("Are you sure you want to delete this FAQ?")) {
                                    deleteFaqMutation.mutate(faq.id);
                                  }
                                }}
                                disabled={deleteFaqMutation.isPending}
                                data-testid={`button-delete-faq-${faq.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Hire Salon Staff Tab */}
            <TabsContent value="hire-staff" className="space-y-6">
              {salon?.verificationStatus === 'approved' ? (
                <HireStaffSection />
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-5 text-4xl">
                    🔒
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Verification Required</h3>
                  <p className="text-gray-500 max-w-sm mb-6 text-sm leading-relaxed">
                    The Hire Staff feature is only available to verified salons. Get your salon verified to browse and contact salon professionals.
                  </p>
                  <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 text-amber-800 text-sm font-medium">
                    {salon?.verificationStatus === 'pending'
                      ? '⏳ Your verification is under review. We\'ll unlock this once approved.'
                      : '📋 Submit your salon details for verification to unlock this feature.'}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              {/* Salon QR Code & Shareable Link */}
              {salon && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <QrCode className="h-5 w-5 text-purple-600" />
                      Salon QR Code & Share Link
                    </CardTitle>
                    <CardDescription>Let customers scan to visit your salon page instantly</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start">
                      <div className="flex-shrink-0 bg-white border-2 border-purple-100 rounded-2xl p-4 shadow-sm">
                        <QRCodeSVG
                          value={`https://sanwarhub.in/salon/${salon.id}`}
                          size={140}
                          bgColor="#ffffff"
                          fgColor="#7c3aed"
                          level="M"
                        />
                        <p className="text-center text-[11px] text-gray-400 mt-2 font-medium">Scan to visit salon</p>
                      </div>
                      <div className="flex-1 space-y-4 w-full">
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-1">Your Salon Page Link</p>
                          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2">
                            <Link2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                            <span className="text-sm text-gray-600 truncate flex-1">
                              sanwarhub.in/salon/{salon.id}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-purple-600 hover:bg-purple-50"
                              onClick={() => {
                                navigator.clipboard.writeText(`https://sanwarhub.in/salon/${salon.id}`);
                                toast({ title: "Link copied!", description: "Share it anywhere to get more bookings." });
                              }}
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant="outline"
                            className="rounded-xl border-green-200 text-green-700 hover:bg-green-50"
                            onClick={() => {
                              const text = `Book an appointment at *${salon.name}* 💇\n\n👉 https://sanwarhub.in/salon/${salon.id}`;
                              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
                            }}
                          >
                            Share on WhatsApp
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-xl border-purple-200 text-purple-700 hover:bg-purple-50"
                            onClick={() => {
                              const text = `Book an appointment at ${salon.name} 💇 https://sanwarhub.in/salon/${salon.id}`;
                              navigator.clipboard.writeText(text);
                              toast({ title: "Copied!", description: "Paste this in Instagram bio or story." });
                            }}
                          >
                            Copy for Instagram
                          </Button>
                        </div>
                        <p className="text-xs text-gray-400">Print the QR code and display it at your salon counter for walk-in customers to follow you instantly.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Owner Profile Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Owner Profile
                    </div>
                    <Button onClick={() => {
                      profileForm.reset({
                        firstName: user?.firstName || "",
                        lastName: user?.lastName || "",
                        email: user?.email || "",
                        phone: user?.phone || "",
                        profileImageUrl: user?.profileImageUrl || "",
                      });
                      setProfileDialogOpen(true);
                    }}>
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start space-x-6">
                    {/* Profile Picture */}
                    <div className="flex-shrink-0">
                      <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200">
                        {user?.profileImageUrl ? (
                          <img 
                            src={user.profileImageUrl} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-semibold text-2xl">
                            {user?.firstName?.[0]?.toUpperCase() || "O"}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Profile Information */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {user?.firstName} {user?.lastName}
                        </h3>
                        <p className="text-gray-500 text-sm">Salon Owner</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-600">{user?.email || "Not provided"}</span>
                        </div>
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          <span className="text-gray-600">{user?.phone || "Not provided"}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Edit Profile Button */}
                    <div className="flex-shrink-0">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          profileForm.reset({
                            firstName: user?.firstName || "",
                            lastName: user?.lastName || "",
                            email: user?.email || "",
                            phone: user?.phone || "",
                            profileImageUrl: user?.profileImageUrl || "",
                          });
                          setTempProfileImageUrl(user?.profileImageUrl || "");
                          setProfileDialogOpen(true);
                        }}
                        data-testid="button-edit-profile"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Profile
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Salon Settings
                    <Button onClick={() => {
                      salonForm.reset({
                        name: salon?.name || "",
                        description: salon?.description || "",
                        phone: salon?.phone || "",
                        address: salon?.address || "",
                        latitude: salon?.latitude ? Number(salon.latitude) : undefined,
                        longitude: salon?.longitude ? Number(salon.longitude) : undefined,
                        imageUrl: salon?.imageUrl || "",
                        instagramId: salon?.instagramId || "",
                        facebookId: salon?.facebookId || "",
                        googleMapsLink: salon?.googleMapsLink || "",
                        confirmationAmount: salon?.confirmationAmount || 0,
                        salonType: (salon as any)?.salonType || "unisex",
                      });
                      setSalonDialogOpen(true);
                    }}>
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Salon
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{salon.name}</h3>
                      <p className="text-gray-600 mb-4">{salon.description}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {salon.phone}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {salon.address}
                        </div>
                        <div className="flex items-center">
                          <IndianRupee className="h-4 w-4 mr-2 text-gray-400" />
                          Confirmation Amount: ₹{salon.confirmationAmount || 0}
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 mr-2 text-gray-400" />
                          Rating: {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"} ({salon.totalReviews} reviews)
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Working Hours Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Working Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {workingHoursLoading ? (
                      // Loading state
                      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                        <div key={day} className="flex items-center justify-between p-4 border rounded-lg animate-pulse">
                          <div className="h-4 bg-gray-200 rounded w-20"></div>
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                        </div>
                      ))
                    ) : (
                      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                        const dayHours = getWorkingHoursForDay(day);
                        return (
                          <div key={day} className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="font-medium">{day}</div>
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4 text-gray-400" />
                                <span className={`text-sm ${dayHours.isOpen ? 'text-gray-600' : 'text-red-500'}`}>
                                  {dayHours.hours}
                                </span>
                              </div>
                              <Switch checked={dayHours.isOpen} disabled />
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div className="pt-4 border-t space-y-2">
                      <Button 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => setEditingWorkingHours(true)}
                        data-testid="button-configure-salon-hours"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Configure Salon Hours
                      </Button>
                      <Link href="/owner/staff-schedule">
                        <Button variant="ghost" className="w-full text-sm" data-testid="button-configure-staff-schedule">
                          <Users className="h-4 w-4 mr-2" />
                          Manage Staff Schedules
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Business Performance */}
              <Card>
                <CardHeader>
                  <CardTitle>Business Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        ₹{bookings.reduce((sum, booking) => sum + Number(booking.totalAmount || 0), 0).toLocaleString()}
                      </div>
                      <div className="text-sm text-green-600">This Month Revenue</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{bookings.length}</div>
                      <div className="text-sm text-blue-600">Total Bookings</div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                      <div className="text-2xl font-bold text-purple-600">
                        {salon.averageRating ? Number(salon.averageRating).toFixed(1) : "New"}
                      </div>
                      <div className="text-sm text-purple-600">Average Rating</div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                      <div className="text-2xl font-bold text-orange-600">{staff.length}</div>
                      <div className="text-sm text-orange-600">Team Members</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      {/* Salon Form Dialog */}
      <Dialog open={salonDialogOpen} onOpenChange={setSalonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{salon ? "Edit Salon" : "Create Salon Profile"}</DialogTitle>
            <DialogDescription>
              {salon ? "Update your salon information" : "Create your salon profile to start receiving bookings"}
            </DialogDescription>
          </DialogHeader>
          <Form {...salonForm}>
            <form onSubmit={salonForm.handleSubmit((data) => {
              console.log("Form submitted with data:", data);
              salonMutation.mutate(data);
            })} className="space-y-4">
              <FormField
                control={salonForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salon Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your Salon Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={salonForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Tell customers about your salon..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={salonForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number *</FormLabel>
                      <FormControl>
                        <Input placeholder="9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={salonForm.control}
                  name="confirmationAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmation Amount (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="20" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={salonForm.control}
                  name="instagramId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instagram ID (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="yourhandle (without @)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={salonForm.control}
                  name="facebookId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Facebook ID (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="yourpage (without facebook.com/)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={salonForm.control}
                name="googleMapsLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Google Maps Link (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://maps.app.goo.gl/..." {...field} data-testid="input-google-maps-link" />
                    </FormControl>
                    <p className="text-xs text-muted-foreground">
                      Paste your Google Maps link so customers can get directions easily
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={salonForm.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address *</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Full address with area and city..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Location Picker */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Mark Your Shop Location on Map *
                </label>
                <p className="text-sm text-muted-foreground">
                  Required: Help customers find your exact location. Click "Use My GPS Location" to automatically detect your shop's location using Google Location Services
                </p>
                <LeafletLocationPicker
                  initialLat={salon?.latitude ? Number(salon.latitude) : undefined}
                  initialLng={salon?.longitude ? Number(salon.longitude) : undefined}
                  onLocationSelect={(lat, lng) => {
                    setSalonLocation({ lat, lng });
                    salonForm.setValue('latitude', lat);
                    salonForm.setValue('longitude', lng);
                  }}
                  onLocationReset={() => {
                    setSalonLocation(null);
                    salonForm.setValue('latitude', undefined as any);
                    salonForm.setValue('longitude', undefined as any);
                  }}
                  disabled={false}
                />
              </div>
              
              <FormField
                control={salonForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Salon Image</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        <Input 
                          placeholder="Or paste image URL..." 
                          {...field} 
                        />
                        <div className="flex items-center justify-center">
                          <span className="text-sm text-gray-500">OR</span>
                        </div>
                        <div className="space-y-2">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(file);
                              }
                            }}
                            className="hidden"
                            id="salon-image-upload"
                          />
                          <label
                            htmlFor="salon-image-upload"
                            className="w-full inline-flex items-center justify-center space-x-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 cursor-pointer"
                          >
                            {imageUploading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Uploading...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4" />
                                <span>Upload Image from Gallery</span>
                              </>
                            )}
                          </label>
                        </div>
                        {field.value && (
                          <div className="mt-4">
                            <img 
                              src={field.value} 
                              alt="Salon preview" 
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setSalonDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={salonMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  {salonMutation.isPending ? "Saving..." : (salon ? "Update Salon" : "Create Salon")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Service Form Dialog */}
      <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update service details and pricing" : "Add a new service to your salon menu"}
            </DialogDescription>
          </DialogHeader>
          <Form {...serviceForm}>
            <form onSubmit={serviceForm.handleSubmit((data) => serviceMutation.mutate(data))} className="space-y-4">
              <FormField
                control={serviceForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Haircut, Facial, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={serviceForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe this service..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Service Category Selection - Always show with option to create categories */}
              <FormField
                control={serviceForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={serviceCategories.length > 0 ? "Select a category (optional)" : "No categories yet - leave uncategorized"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">No Category</SelectItem>
                        {serviceCategories.length > 0 ? (
                          serviceCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center space-x-2">
                                <div 
                                  className="w-4 h-4 rounded-full flex items-center justify-center text-xs"
                                  style={{ backgroundColor: category.color || '#3B82F6' }}
                                >
                                  {category.icon === 'Scissors' ? '✂️' : 
                                   category.icon === 'Sparkles' ? '✨' : 
                                   category.icon === 'Palette' ? '🎨' :
                                   category.icon === 'Heart' ? '❤️' :
                                   category.icon === 'Star' ? '⭐' : '💫'}
                                </div>
                                <span>{category.name}</span>
                              </div>
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="create-first" disabled>
                            <span className="text-gray-500 italic">Create categories first to organize services</span>
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={serviceForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="500" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={serviceForm.control}
                  name="duration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (mins) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="30" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setServiceDialogOpen(false);
                  setEditingItem(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={serviceMutation.isPending}>
                  {serviceMutation.isPending ? "Saving..." : (editingItem ? "Update Service" : "Add Service")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Staff Form Dialog */}
      <Dialog open={staffDialogOpen} onOpenChange={setStaffDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Staff Member" : "Add New Staff Member"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update staff member information" : "Add a new team member to your salon"}
            </DialogDescription>
          </DialogHeader>
          <Form {...staffForm}>
            <form onSubmit={staffForm.handleSubmit((data) => staffMutation.mutate(data))} className="space-y-4">
              <FormField
                control={staffForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Staff member name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={staffForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role *</FormLabel>
                    <FormControl>
                      <Input placeholder="Hair Stylist, Makeup Artist, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={staffForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="9876543210" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={staffForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="staff@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={staffForm.control}
                name="photoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profile Picture</FormLabel>
                    <FormControl>
                      <div className="space-y-4">
                        {field.value && (
                          <div className="flex items-center space-x-4">
                            <img 
                              src={field.value} 
                              alt="Staff preview" 
                              className="w-16 h-16 rounded-full object-cover border-2 border-gray-200"
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm"
                              onClick={() => field.onChange('')}
                            >
                              Remove Photo
                            </Button>
                          </div>
                        )}
                        <ObjectUploader
                          maxNumberOfFiles={1}
                          maxFileSize={5242880} // 5MB
                          onGetUploadParameters={async () => {
                            const response = await apiRequest('POST', '/api/objects/upload');
                            const data = await response.json();
                            return {
                              method: 'PUT' as const,
                              url: data.uploadURL,
                            };
                          }}
                          onComplete={(result) => {
                            console.log('Staff photo upload completed:', result);
                            if (result.successful && result.successful.length > 0) {
                              const uploadedFile = result.successful[0];
                              const imageUrl = uploadedFile.uploadURL;
                              console.log('Uploaded file URL:', imageUrl);
                              
                              if (imageUrl) {
                                // Convert Google Storage URL to our object path format
                                let finalUrl = imageUrl;
                                if (imageUrl.startsWith('https://storage.googleapis.com/')) {
                                  // Extract path and convert to /objects/ format
                                  const url = new URL(imageUrl);
                                  const pathParts = url.pathname.split('/');
                                  console.log('URL path parts:', pathParts);
                                  if (pathParts.length >= 4) {
                                    // Extract bucket and object path - avoid double "uploads" 
                                    const objectPath = pathParts.slice(3).join('/');
                                    console.log('Extracted object path:', objectPath);
                                    // Don't add "/uploads/" if it already starts with "uploads/"
                                    if (objectPath.startsWith('uploads/')) {
                                      finalUrl = `/objects/${objectPath}`;
                                    } else {
                                      finalUrl = `/objects/uploads/${objectPath}`;
                                    }
                                  }
                                }
                                
                                console.log('Final URL being set:', finalUrl);
                                field.onChange(finalUrl);
                                toast({
                                  title: "Photo uploaded!",
                                  description: "Staff profile picture has been uploaded successfully.",
                                });
                              }
                            }
                          }}
                          buttonClassName="w-full"
                        >
                          <div className="flex items-center gap-2">
                            <Camera className="h-4 w-4" />
                            <span>{field.value ? 'Change Photo' : 'Upload Photo'}</span>
                          </div>
                        </ObjectUploader>
                        <p className="text-xs text-gray-500">
                          Upload a profile picture for this staff member (max 5MB)
                        </p>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => {
                  setStaffDialogOpen(false);
                  setEditingItem(null);
                }}>
                  Cancel
                </Button>
                <Button type="submit" disabled={staffMutation.isPending}>
                  {staffMutation.isPending ? "Saving..." : (editingItem ? "Update Staff" : "Add Staff")}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Staff Delete Confirmation Dialog */}
      <AlertDialog open={!!staffToDelete} onOpenChange={(open) => !open && setStaffToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{staffToDelete?.name}</strong>? This action cannot be undone. All their bookings and time slots will also be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStaffToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => staffToDelete && deleteStaffMutation.mutate(staffToDelete.id)}
              className="bg-red-500 hover:bg-red-600"
              disabled={deleteStaffMutation.isPending}
            >
              {deleteStaffMutation.isPending ? "Deleting..." : "Delete Staff"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Gallery Form Dialog */}
      <Dialog open={galleryDialogOpen} onOpenChange={setGalleryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Gallery Image" : "Add Gallery Image"}</DialogTitle>
            <DialogDescription>
              {editingItem ? "Update image details" : "Upload and describe your image"}
            </DialogDescription>
          </DialogHeader>
          <Form {...galleryForm}>
            <form onSubmit={galleryForm.handleSubmit((data) => {
              // For editing, just update the metadata without re-uploading
              if (editingItem) {
                galleryMutation.mutate({
                  ...data,
                  imageUrl: editingItem.imageUrl,
                });
              }
              // For new images, the upload will handle submission via handleGalleryUploadComplete
            })} className="space-y-4">
              {!editingItem && (
                <div>
                  <label className="text-sm font-medium">Upload Image</label>
                  <div className="mt-2">
                    <ObjectUploader
                      onGetUploadParameters={handleGalleryUpload}
                      onComplete={handleGalleryUploadComplete}
                      maxFileSize={10485760} // 10MB
                      buttonClassName="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </ObjectUploader>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Max 10MB. JPG, PNG supported.</p>
                </div>
              )}

              <FormField
                control={galleryForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title (optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Hair Styling, Bridal Makeup" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={galleryForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe this work..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={galleryForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="work">Work Samples</SelectItem>
                        <SelectItem value="staff">Team Photos</SelectItem>
                        <SelectItem value="interior">Salon Interior</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {editingItem && (
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setGalleryDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={galleryMutation.isPending}>
                    {galleryMutation.isPending ? "Updating..." : "Update Image"}
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Promotional Video Upload Dialog */}
      <Dialog open={promoVideoDialogOpen} onOpenChange={setPromoVideoDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Upload Promotional Video</DialogTitle>
            <DialogDescription>
              Add a video tour of your salon to give customers a preview of your professional atmosphere
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {salon?.promotionalVideoUrl && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Video</label>
                <div className="relative rounded-lg overflow-hidden bg-black">
                  <video 
                    src={salon.promotionalVideoUrl} 
                    className="w-full max-h-48 object-contain"
                    poster=""
                    autoPlay
                    loop
                    muted
                    playsInline
                    onError={() => {
                      console.log("Video failed to load, attempting to fix permissions...");
                      fixPromoVideoAclMutation.mutate();
                    }}
                    ref={(video) => {
                      if (video) {
                        // Ensure video plays when loaded
                        video.addEventListener('loadeddata', () => {
                          video.play().catch(() => {
                            // If autoplay fails, we'll show play button
                          });
                        });
                      }
                    }}
                  />
                  
                  {/* Custom controls overlay */}
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const video = e.currentTarget.parentElement?.parentElement?.querySelector('video');
                        if (video) {
                          if (video.paused) {
                            video.play();
                          } else {
                            video.pause();
                          }
                        }
                      }}
                      className="bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                      data-testid="owner-video-play-pause-button"
                    >
                      <Video className="h-3 w-3" />
                    </button>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const video = e.currentTarget.parentElement?.parentElement?.querySelector('video');
                        if (video) {
                          video.muted = !video.muted;
                        }
                      }}
                      className="bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-full transition-colors"
                      data-testid="owner-video-audio-button"
                    >
                      {/* Audio icon */}
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M6 10l4-4v12l-4-4H3a1 1 0 01-1-1v-2a1 1 0 011-1h3z" />
                      </svg>
                    </button>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fixPromoVideoAclMutation.mutate()}
                  disabled={fixPromoVideoAclMutation.isPending}
                  className="text-xs"
                >
                  {fixPromoVideoAclMutation.isPending ? "Fixing..." : "Fix Video Permissions"}
                </Button>
              </div>
            )}
            
            <div>
              <label className="text-sm font-medium">
                {salon?.promotionalVideoUrl ? 'Replace Video' : 'Upload Video'}
              </label>
              <div className="mt-2">
                <ObjectUploader
                  onGetUploadParameters={async () => {
                    const response = await apiRequest("POST", "/api/objects/upload");
                    const data = await response.json();
                    return {
                      method: 'PUT' as const,
                      url: data.uploadURL,
                    };
                  }}
                  onComplete={(result) => {
                    if (result.successful && result.successful.length > 0) {
                      const uploadURL = result.successful[0].uploadURL;
                      updatePromoVideoMutation.mutate(uploadURL);
                    }
                  }}
                  maxFileSize={100 * 1024 * 1024} // 100MB for videos
                  buttonClassName="w-full"
                >
                  <Video className="h-4 w-4 mr-2" />
                  {salon?.promotionalVideoUrl ? 'Replace Video' : 'Choose Video'}
                </ObjectUploader>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Upload MP4, WebM, or MOV files up to 100MB. Keep videos under 2 minutes for best customer experience.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAQ Form Dialog */}
      <Dialog open={faqDialogOpen} onOpenChange={setFaqDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit FAQ" : "Add New FAQ"}</DialogTitle>
            <DialogDescription>
              {editingItem 
                ? "Update this frequently asked question and its answer." 
                : `Add a helpful question and answer (${faqs.length}/10 FAQs used).`
              }
            </DialogDescription>
          </DialogHeader>
          <Form {...faqForm}>
            <form onSubmit={faqForm.handleSubmit(async (values) => {
                if (editingItem) {
                  updateFaqMutation.mutate({ ...values, id: editingItem.id });
                } else {
                  createFaqMutation.mutate(values);
                }
              })} className="space-y-4">
                
                <FormField
                  control={faqForm.control}
                  name="question"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="What customers frequently ask..."
                          className="min-h-[80px]"
                          data-testid="input-faq-question"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={faqForm.control}
                  name="answer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Answer</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Your helpful response..."
                          className="min-h-[100px]"
                          data-testid="input-faq-answer"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center space-x-2">
                  <FormField
                    control={faqForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                            data-testid="switch-faq-active"
                          />
                        </FormControl>
                        <FormLabel className="!mt-0">Show to customers</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setFaqDialogOpen(false)}
                    data-testid="button-cancel-faq"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createFaqMutation.isPending || updateFaqMutation.isPending}
                    data-testid="button-save-faq"
                  >
                    {createFaqMutation.isPending || updateFaqMutation.isPending ? "Saving..." : 
                     editingItem ? "Update FAQ" : "Add FAQ"}
                  </Button>
                </div>
              </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Working Hours Management Dialog */}
      <Dialog open={editingWorkingHours} onOpenChange={setEditingWorkingHours}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Configure Salon Working Hours</DialogTitle>
            <DialogDescription>
              Set your salon's opening and closing times for each day of the week
            </DialogDescription>
          </DialogHeader>
          <WorkingHoursForm 
            workingHours={workingHours}
            onSave={(hoursData) => updateWorkingHoursMutation.mutate(hoursData)}
            onCancel={() => setEditingWorkingHours(false)}
            isLoading={updateWorkingHoursMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Profile Edit Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your personal information and profile picture
            </DialogDescription>
          </DialogHeader>
          <Form {...profileForm}>
            <form onSubmit={profileForm.handleSubmit((data) => profileMutation.mutate(data))} className="space-y-4">
              {/* Profile Picture Upload */}
              <div className="flex flex-col items-center space-y-4">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                  {tempProfileImageUrl || user?.profileImageUrl ? (
                    <img 
                      src={tempProfileImageUrl || user?.profileImageUrl || ""} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-600 to-orange-600 flex items-center justify-center text-white font-semibold text-xl">
                      {user?.firstName?.[0]?.toUpperCase() || "O"}
                    </div>
                  )}
                </div>
                
                <ObjectUploader
                  onGetUploadParameters={async () => {
                    setProfileImageUploading(true);
                    const response = await apiRequest("POST", "/api/objects/upload");
                    const data = await response.json();
                    return {
                      method: "PUT" as const,
                      url: data.uploadURL,
                    };
                  }}
                  onComplete={(result) => {
                    setProfileImageUploading(false);
                    const photoUrl = result.successful?.[0]?.uploadURL || "";
                    
                    if (photoUrl) {
                      const normalizedPath = photoUrl.startsWith('/objects/') 
                        ? photoUrl 
                        : photoUrl.includes('/uploads/') 
                          ? `/objects${photoUrl.split('/uploads')[1] ? '/uploads' + photoUrl.split('/uploads')[1] : ''}`
                          : photoUrl;
                      
                      setTempProfileImageUrl(normalizedPath);
                      profileForm.setValue('profileImageUrl', normalizedPath);
                    }
                  }}
                  maxFileSize={5485760} // 5MB
                  buttonClassName="w-full"
                  buttonType="button"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {profileImageUploading ? "Uploading..." : "Change Photo"}
                </ObjectUploader>
              </div>

              <FormField
                control={profileForm.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="Your first name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your last name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input placeholder="your@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={profileForm.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="9876543210" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setProfileDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={profileMutation.isPending}
                  data-testid="button-save-profile"
                >
                  {profileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Quick Add Dialog */}
      <Dialog open={quickAddDialogOpen} onOpenChange={setQuickAddDialogOpen}>
        <DialogContent className="sm:max-w-[650px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-orange-500" />
              Quick Add {quickAddType === 'categories' ? 'Categories' : quickAddType === 'services' ? 'Services' : quickAddType === 'staff' ? 'Staff' : 'Offers'}
            </DialogTitle>
            <DialogDescription>
              {quickAddType === 'categories'
                ? "Select from premade categories and add them to your salon in one click."
                : quickAddType === 'services'
                ? "Select services by gender type and add them to your salon. Prices are editable later."
                : quickAddType === 'staff'
                ? "Select premade staff profiles and add them to your team. You can edit details later."
                : "Select premade promotional offers and activate them for your salon. Valid for 30 days by default."}
            </DialogDescription>
          </DialogHeader>

          {quickAddType === 'categories' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Click to select the categories you want to add:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PREMADE_CATEGORIES.map((cat, index) => {
                  const isSelected = selectedPremade.has(index);
                  const alreadyExists = serviceCategories.some(
                    (existing: any) => existing.name.toLowerCase() === cat.name.toLowerCase()
                  );
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        if (alreadyExists) return;
                        const newSelected = new Set(selectedPremade);
                        if (isSelected) newSelected.delete(index);
                        else newSelected.add(index);
                        setSelectedPremade(newSelected);
                      }}
                      disabled={alreadyExists}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        alreadyExists
                          ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                          : isSelected
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0"
                          style={{ backgroundColor: cat.color + '20', color: cat.color }}
                        >
                          {cat.icon === 'Scissors' ? '✂️' :
                           cat.icon === 'Sparkles' ? '✨' :
                           cat.icon === 'Palette' ? '🎨' :
                           cat.icon === 'Heart' ? '❤️' :
                           cat.icon === 'Star' ? '⭐' :
                           cat.icon === 'Crown' ? '👑' : '💫'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{cat.name}</p>
                            {alreadyExists && (
                              <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">Added</span>
                            )}
                            {isSelected && !alreadyExists && (
                              <CheckSquare className="h-4 w-4 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate">{cat.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : quickAddType === 'services' ? (
            <div className="space-y-3">
              {/* Gender Filter Tabs */}
              <div className="flex gap-2 mb-2">
                {(['unisex', 'men', 'women'] as const).map((gender) => (
                  <button
                    key={gender}
                    onClick={() => {
                      setServiceGenderFilter(gender);
                      setSelectedPremade(new Set());
                    }}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      serviceGenderFilter === gender
                        ? 'bg-orange-100 text-orange-700 border border-orange-300'
                        : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                    }`}
                  >
                    {gender === 'unisex' ? '👥 Unisex' : gender === 'men' ? '👨 Men' : '👩 Women'}
                  </button>
                ))}
              </div>
              <p className="text-sm text-gray-500">
                Showing {serviceGenderFilter} services. Select the ones to add to your salon:
              </p>
              {(() => {
                const sourceData = serviceGenderFilter === 'unisex'
                  ? PREMADE_SERVICES
                  : serviceGenderFilter === 'men'
                  ? MEN_ONLY_SERVICES
                  : WOMEN_ONLY_SERVICES;
                return Object.entries(sourceData).map(([categoryName, servicesList]) => {
                  const categoryKeys = Object.keys(sourceData);
                  const catOffset = Object.entries(sourceData)
                    .slice(0, categoryKeys.indexOf(categoryName))
                    .reduce((sum, [, list]) => sum + list.length, 0);
                  const availableIndices = servicesList
                    .map((svc, i) => ({ idx: catOffset + i, svc }))
                    .filter(({ svc }) => !services.some((ex: any) => ex.name.toLowerCase() === svc.name.toLowerCase()))
                    .map(({ idx }) => idx);
                  const allSelected = availableIndices.length > 0 && availableIndices.every(i => selectedPremade.has(i));
                  const someSelected = availableIndices.some(i => selectedPremade.has(i));

                  return (
                  <div key={categoryName} className="border rounded-lg overflow-hidden">
                    <button
                      className={`w-full px-4 py-2.5 flex items-center gap-2 transition-all text-left ${
                        allSelected ? 'bg-orange-50 border-b border-orange-200' : someSelected ? 'bg-orange-50/50 border-b border-orange-100' : 'bg-gray-50 border-b border-gray-100 hover:bg-orange-50/40'
                      }`}
                      onClick={() => {
                        const newSelected = new Set(selectedPremade);
                        if (allSelected) {
                          availableIndices.forEach(i => newSelected.delete(i));
                        } else {
                          availableIndices.forEach(i => newSelected.add(i));
                        }
                        setSelectedPremade(newSelected);
                      }}
                    >
                      {allSelected
                        ? <CheckSquare className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        : someSelected
                        ? <CheckSquare className="h-4 w-4 text-orange-300 flex-shrink-0" />
                        : <Layers className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                      <span className={`text-sm font-semibold ${allSelected || someSelected ? 'text-orange-700' : 'text-gray-700'}`}>{categoryName}</span>
                      <span className="text-xs text-gray-400">({servicesList.length} services)</span>
                      {availableIndices.length > 0 && (
                        <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${allSelected ? 'bg-orange-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
                          {allSelected ? 'All selected' : 'Select all'}
                        </span>
                      )}
                    </button>
                    <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {servicesList.map((svc, svcIndex) => {
                        const globalIndex = catOffset + svcIndex;
                        const isSelected = selectedPremade.has(globalIndex);
                        const alreadyExists = services.some(
                          (existing: any) => existing.name.toLowerCase() === svc.name.toLowerCase()
                        );
                        return (
                          <button
                            key={globalIndex}
                            onClick={() => {
                              if (alreadyExists) return;
                              const newSelected = new Set(selectedPremade);
                              if (isSelected) newSelected.delete(globalIndex);
                              else newSelected.add(globalIndex);
                              setSelectedPremade(newSelected);
                            }}
                            disabled={alreadyExists}
                            className={`p-2 rounded border text-left transition-all ${
                              alreadyExists
                                ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                                : isSelected
                                ? 'border-orange-400 bg-orange-50'
                                : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{svc.name}</p>
                                <p className="text-xs text-gray-500 truncate">{svc.description}</p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="text-sm font-semibold text-green-600">₹{svc.price}</p>
                                <p className="text-xs text-gray-400">{svc.duration}m</p>
                              </div>
                              {alreadyExists && (
                                <span className="text-xs bg-gray-200 text-gray-600 px-1 rounded">Added</span>
                              )}
                              {isSelected && !alreadyExists && (
                                <CheckSquare className="h-4 w-4 text-orange-500 flex-shrink-0" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  );
                });
              })()}
            </div>
          ) : quickAddType === 'staff' ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-orange-600">Click to select</span> a staff member, then <span className="font-medium text-orange-600">edit their name and experience</span> before adding:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PREMADE_STAFF.map((member, index) => {
                  const isSelected = selectedPremade.has(index);
                  const alreadyExists = staff.some(
                    (existing: any) => existing.name.toLowerCase() === (editedStaffData[index]?.name || member.name).toLowerCase()
                  );
                  const edits = editedStaffData[index] || { name: member.name, experience: member.experience };
                  return (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        alreadyExists
                          ? 'border-gray-200 bg-gray-50 opacity-60'
                          : isSelected
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                          {edits.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {isSelected && !alreadyExists && (
                              <CheckSquare className="h-4 w-4 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-orange-600 font-medium">{member.role}</p>
                        </div>
                        <button
                          onClick={() => {
                            if (alreadyExists) return;
                            const newSelected = new Set(selectedPremade);
                            if (isSelected) {
                              newSelected.delete(index);
                              const newEdits = { ...editedStaffData };
                              delete newEdits[index];
                              setEditedStaffData(newEdits);
                            } else {
                              newSelected.add(index);
                            }
                            setSelectedPremade(newSelected);
                          }}
                          disabled={alreadyExists}
                          className={`px-3 py-1 rounded text-xs font-medium transition-all ${
                            alreadyExists
                              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                              : isSelected
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : 'bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600'
                          }`}
                        >
                          {alreadyExists ? 'Added' : isSelected ? 'Selected' : 'Select'}
                        </button>
                      </div>

                      <div className="space-y-2 mt-1">
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">Name</label>
                          <input
                            type="text"
                            value={edits.name}
                            onChange={(e) => {
                              setEditedStaffData(prev => ({
                                ...prev,
                                [index]: { ...edits, name: e.target.value }
                              }));
                            }}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-orange-300"
                            placeholder="Staff name"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">Experience</label>
                          <input
                            type="text"
                            value={edits.experience}
                            onChange={(e) => {
                              setEditedStaffData(prev => ({
                                ...prev,
                                [index]: { ...edits, experience: e.target.value }
                              }));
                            }}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-1 focus:ring-orange-300"
                            placeholder="e.g. 5+ years"
                          />
                        </div>
                        <p className="text-xs text-gray-400 truncate">
                          {member.specialties?.join(', ')}
                        </p>
                        <p className="text-xs text-gray-500 leading-relaxed mt-1 line-clamp-2">
                          {member.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Click to select the promotional offers you want to create:</p>
              <div className="grid grid-cols-1 gap-3">
                {PREMADE_OFFERS.map((offer, index) => {
                  const isSelected = selectedPremade.has(index);
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        const newSelected = new Set(selectedPremade);
                        if (isSelected) newSelected.delete(index);
                        else newSelected.add(index);
                        setSelectedPremade(newSelected);
                      }}
                      className={`p-3 rounded-lg border-2 text-left transition-all ${
                        isSelected
                          ? 'border-orange-400 bg-orange-50'
                          : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold text-sm flex-shrink-0">
                          {offer.discountType === 'percentage' ? `${offer.discountValue}%` : `₹${offer.discountValue}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm">{offer.title}</p>
                            {isSelected && (
                              <CheckSquare className="h-4 w-4 text-orange-500 flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">{offer.description}</p>
                          <div className="flex gap-2 mt-1.5">
                            <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                              {offer.discountType === 'percentage' ? 'Percentage' : 'Fixed Amount'}
                            </span>
                            {parseFloat(offer.minOrderAmount) > 0 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                Min ₹{offer.minOrderAmount}
                              </span>
                            )}
                            <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              Max {offer.maxUsagePerCustomer} use{parseInt(offer.maxUsagePerCustomer) > 1 ? 's' : ''}/customer
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-2">
            <p className="text-sm text-gray-500">
              {selectedPremade.size} {quickAddType === 'categories' ? 'categories' : quickAddType === 'services' ? 'services' : quickAddType === 'staff' ? 'staff' : 'offers'} selected
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setQuickAddDialogOpen(false);
                  setSelectedPremade(new Set());
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (quickAddType === 'categories') {
                    const selected = PREMADE_CATEGORIES.filter((_, i) => selectedPremade.has(i));
                    quickAddCategoriesMutation.mutate(selected);
                  } else if (quickAddType === 'services') {
                    const sourceData = serviceGenderFilter === 'unisex'
                      ? PREMADE_SERVICES
                      : serviceGenderFilter === 'men'
                      ? MEN_ONLY_SERVICES
                      : WOMEN_ONLY_SERVICES;

                    // Collect unique category names used in selected services
                    let globalIdx = 0;
                    const usedCategories = new Set<string>();
                    for (const [categoryName, svcList] of Object.entries(sourceData)) {
                      for (const _ of svcList) {
                        if (selectedPremade.has(globalIdx)) usedCategories.add(categoryName);
                        globalIdx++;
                      }
                    }

                    // Auto-create any missing categories, then add services
                    (async () => {
                      const categoryColorMap: Record<string, string> = {
                        "Hair Care": "#3B82F6", "Women's Hair": "#EC4899", "Men's Hair": "#3B82F6",
                        "Hair Treatments": "#3B82F6",
                        "Facial & Skin": "#10B981", "Women's Facial & Skin": "#10B981", "Men's Skincare": "#10B981",
                        "Nail Services": "#F59E0B", "Women's Nail Services": "#F59E0B", "Men's Nail Care": "#F59E0B",
                        "Bridal Services": "#EC4899", "Saree Draping": "#EC4899",
                        "Massage & Spa": "#8B5CF6", "Men's Massage": "#8B5CF6", "Women's Spa & Massage": "#8B5CF6",
                        "Beard & Grooming": "#EF4444",
                        "Makeup": "#EC4899", "Women's Makeup": "#EC4899",
                        "Waxing & Threading": "#10B981", "Men's Waxing": "#10B981",
                        "Eye & Eyebrow": "#8B5CF6",
                      };
                      const categoryIconMap: Record<string, string> = {
                        "Hair Care": "Scissors", "Women's Hair": "Scissors", "Men's Hair": "Scissors",
                        "Hair Treatments": "Sparkles",
                        "Facial & Skin": "Sparkles", "Women's Facial & Skin": "Sparkles", "Men's Skincare": "Sparkles",
                        "Nail Services": "Palette", "Women's Nail Services": "Palette", "Men's Nail Care": "Palette",
                        "Bridal Services": "Heart", "Saree Draping": "Heart",
                        "Massage & Spa": "Star", "Men's Massage": "Star", "Women's Spa & Massage": "Star",
                        "Beard & Grooming": "Crown",
                        "Makeup": "Palette", "Women's Makeup": "Palette",
                        "Waxing & Threading": "Scissors", "Men's Waxing": "Scissors",
                        "Eye & Eyebrow": "Sparkles",
                      };

                      // Build up-to-date category map (existing + newly created)
                      const categoryIdMap: Record<string, string> = {};
                      for (const cat of serviceCategories) {
                        categoryIdMap[(cat as any).name.toLowerCase()] = (cat as any).id;
                      }

                      // Create missing categories
                      for (const catName of usedCategories) {
                        if (!categoryIdMap[catName.toLowerCase()]) {
                          try {
                            const res = await apiRequest('POST', `/api/salons/${salon?.id}/categories`, {
                              name: catName,
                              description: `${catName} services`,
                              icon: categoryIconMap[catName] || "Scissors",
                              color: categoryColorMap[catName] || "#3B82F6",
                            });
                            const created = await res.json();
                            if (created?.id) categoryIdMap[catName.toLowerCase()] = created.id;
                          } catch {}
                        }
                      }

                      // Invalidate categories so they reload
                      queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/categories`] });

                      // Now build services with correct categoryIds
                      let idx = 0;
                      const selectedServices: { name: string; description: string; price: number; duration: number; categoryId: string | null }[] = [];
                      for (const [categoryName, svcList] of Object.entries(sourceData)) {
                        const catId = categoryIdMap[categoryName.toLowerCase()] || null;
                        for (const svc of svcList) {
                          if (selectedPremade.has(idx)) {
                            selectedServices.push({ ...svc, categoryId: catId });
                          }
                          idx++;
                        }
                      }
                      quickAddServicesMutation.mutate(selectedServices);
                    })();
                  } else if (quickAddType === 'staff') {
                    const selected = PREMADE_STAFF
                      .map((m, i) => ({ ...m, _index: i }))
                      .filter((m) => selectedPremade.has(m._index))
                      .map((m) => ({
                        ...m,
                        name: editedStaffData[m._index]?.name || m.name,
                        experience: editedStaffData[m._index]?.experience || m.experience,
                      }));
                    quickAddStaffMutation.mutate(selected);
                  } else {
                    const selected = PREMADE_OFFERS.filter((_, i) => selectedPremade.has(i));
                    quickAddOffersMutation.mutate(selected);
                  }
                }}
                disabled={selectedPremade.size === 0 ||
                  quickAddCategoriesMutation.isPending ||
                  quickAddServicesMutation.isPending ||
                  quickAddStaffMutation.isPending ||
                  quickAddOffersMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {quickAddCategoriesMutation.isPending || quickAddServicesMutation.isPending || quickAddStaffMutation.isPending || quickAddOffersMutation.isPending
                  ? 'Adding...'
                  : `Add ${selectedPremade.size} ${quickAddType}`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Onboarding Walkthrough */}
      {shouldShowOnboarding && (
        <OnboardingWalkthrough
          steps={onboardingSteps}
          userType="salon-owner"
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
        />
      )}

      {/* ─── FIRST-TIME SETUP WIZARD ─── */}
      {setupWizardOpen && (
        <div className="fixed inset-0 z-[200] bg-gray-50 flex flex-col overflow-hidden">

          {/* Header */}
          <div className="flex-shrink-0 bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3.5 flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-white text-sm leading-tight">Salon Setup</p>
                <p className="text-xs text-orange-100">Step {setupWizardStep + 1} of 7 — Get your salon live in minutes</p>
              </div>
            </div>
            <button
              onClick={closeSetupWizard}
              className="flex items-center gap-1.5 text-white/80 hover:text-white hover:bg-white/20 transition-all px-3 py-1.5 rounded-lg text-xs font-medium"
            >
              <X className="h-4 w-4" />
              <span>Exit</span>
            </button>
          </div>

          {/* Step progress bar */}
          <div className="flex-shrink-0 border-b bg-white px-4 pt-3 pb-0 shadow-sm">
            <div className="flex gap-0 overflow-x-auto scrollbar-hide">
              {[
                { label: "Profile", icon: "🏪", color: "orange" },
                { label: "Services", icon: "✂️", color: "blue" },
                { label: "Staff", icon: "👥", color: "purple" },
                { label: "Amenities", icon: "🏠", color: "teal" },
                { label: "Photos", icon: "📷", color: "pink" },
                { label: "Schedule", icon: "🕐", color: "green" },
                { label: "FAQs", icon: "💬", color: "indigo" },
              ].map((s, i) => {
                const done = i < setupWizardStep;
                const active = i === setupWizardStep;
                const colorMap: Record<string, string> = {
                  orange: "border-orange-500 text-orange-600",
                  blue: "border-blue-500 text-blue-600",
                  purple: "border-purple-500 text-purple-600",
                  teal: "border-teal-500 text-teal-600",
                  pink: "border-pink-500 text-pink-600",
                  green: "border-green-500 text-green-600",
                  indigo: "border-indigo-500 text-indigo-600",
                };
                return (
                  <button
                    key={i}
                    onClick={() => done && setSetupWizardStep(i)}
                    className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap flex-shrink-0 ${
                      active
                        ? `${colorMap[s.color]} bg-transparent`
                        : done
                        ? "border-green-400 text-green-600 cursor-pointer hover:bg-green-50"
                        : "border-transparent text-gray-400 cursor-default"
                    }`}
                  >
                    {done ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <span>{s.icon}</span>}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                );
              })}
            </div>
            <div className="h-0.5 bg-gray-100 mt-0">
              <div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-500"
                style={{ width: `${Math.min((setupWizardStep / 6) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* ── PERSISTENT LIVE CARD PREVIEW (all steps) ── */}
          <div className="flex-shrink-0 bg-white border-b border-gray-100 px-4 py-3 shadow-sm">
            <div className="max-w-2xl mx-auto flex items-center gap-3">

              {/* Mini card thumbnail */}
              <div className="w-48 flex-shrink-0 rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white flex flex-col">
                <div className="h-16 relative overflow-hidden bg-gradient-to-br from-orange-100 to-amber-50">
                  {tempImageUrl
                    ? <img src={tempImageUrl} alt="preview" className="w-full h-full object-cover" />
                    : <div className="flex items-center justify-center h-full text-orange-200"><Camera className="h-7 w-7" /></div>
                  }
                  <div className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                    {salonForm.watch('salonType') === 'male' ? '💈 Men' : salonForm.watch('salonType') === 'female' ? '💅 Women' : '✂️ Unisex'}
                  </div>
                </div>
                <div className="px-2 py-1.5">
                  <p className="text-[11px] font-bold text-gray-900 truncate leading-tight">{salonForm.watch('name') || 'Your Salon Name'}</p>
                  <p className="text-[9px] text-gray-400 truncate mt-0.5">{salonForm.watch('address') || 'Address shown here'}</p>
                  <div className="flex items-center gap-0.5 mt-0.5">
                    {[1,2,3,4,5].map(s => <span key={s} className="text-yellow-400 text-[9px]">★</span>)}
                    <span className="text-[9px] text-gray-400 ml-1">New</span>
                  </div>
                </div>
              </div>

              {/* Live stats — update as each step completes */}
              <div className="flex-1 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {[
                  {
                    icon: "📸",
                    label: "Photo",
                    value: tempImageUrl ? "✓ Set" : "Not set",
                    done: !!tempImageUrl,
                  },
                  {
                    icon: "✂️",
                    label: "Services",
                    value: services?.length > 0 ? `${services.length} added` : "None yet",
                    done: services?.length > 0,
                  },
                  {
                    icon: "👥",
                    label: "Staff",
                    value: staff?.length > 0 ? `${staff.length} added` : "None yet",
                    done: staff?.length > 0,
                  },
                  {
                    icon: "🕐",
                    label: "Hours",
                    value: workingHours?.some((h: any) => h.isOpen) ? "Set ✓" : "Not set",
                    done: workingHours?.some((h: any) => h.isOpen),
                  },
                ].map((stat) => (
                  <div key={stat.label} className={`rounded-lg px-2 py-1.5 text-center border transition-all ${stat.done ? "bg-green-50 border-green-200" : "bg-gray-50 border-gray-100"}`}>
                    <span className="text-sm">{stat.icon}</span>
                    <p className={`text-[9px] font-bold uppercase tracking-wide mt-0.5 ${stat.done ? "text-green-600" : "text-gray-400"}`}>{stat.label}</p>
                    <p className={`text-[10px] font-semibold ${stat.done ? "text-green-700" : "text-gray-500"}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="flex-shrink-0 flex flex-col items-center gap-1.5">
                <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">Live Preview</p>
                {salon?.id ? (
                  <a
                    href={`/salon/${salon.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold transition-all shadow-sm"
                  >
                    <Eye className="h-3 w-3" />
                    Full Preview
                  </a>
                ) : (
                  <span className="text-[9px] text-gray-400">Save profile first</span>
                )}
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto">

            {/* ── STEP 0 — SALON PROFILE ── */}
            {setupWizardStep === 0 && (
              <div className="p-4 max-w-2xl mx-auto space-y-4">

                {/* Cover photo upload — compact, no duplicate card preview */}
                <label className="flex items-center gap-3 bg-white rounded-2xl border-2 border-dashed px-4 py-3.5 cursor-pointer transition-all group hover:border-orange-400 hover:bg-orange-50/30 relative overflow-hidden"
                  style={{ borderColor: tempImageUrl ? '#f97316' : undefined }}>
                  <input type="file" accept="image/*" className="hidden"
                    disabled={imageUploading}
                    onChange={(e) => { const file = e.target.files?.[0]; if (file) handleWizardCoverUpload(file); e.target.value = ""; }} />
                  {tempImageUrl ? (
                    <img src={tempImageUrl} alt="Cover" className="w-12 h-12 rounded-xl object-cover flex-shrink-0 ring-2 ring-orange-400" />
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      {imageUploading ? <Loader2 className="h-5 w-5 text-orange-400 animate-spin" /> : <Camera className="h-5 w-5 text-orange-400" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{tempImageUrl ? "Cover photo added ✓" : imageUploading ? "Uploading photo..." : "Add a cover photo"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{tempImageUrl ? "Tap to change — this appears on your salon card" : "Tap to upload — shown on your salon card to customers"}</p>
                  </div>
                  {tempImageUrl && <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />}
                </label>

                <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm space-y-4">
                  <p className="font-semibold text-gray-900 text-base">Setup Your Salon</p>
                  <p className="text-sm text-gray-500">Complete your salon profile to appear on our platform and start receiving bookings from customers.</p>
                  <Form {...salonForm}>
                    <form
                      id="wizard-salon-form"
                      onSubmit={salonForm.handleSubmit((data) => salonMutation.mutate(data))}
                      className="space-y-4"
                    >
                      <FormField
                        control={salonForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Salon Name *</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Salon Name" {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={salonForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Tell customers about your salon..." {...field} className="rounded-xl resize-none" rows={3} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={salonForm.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="9876543210" {...field} className="rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={salonForm.control}
                          name="salonType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Salon Type *</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="rounded-xl">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="unisex">👥 Unisex</SelectItem>
                                  <SelectItem value="male">👨 Men Only</SelectItem>
                                  <SelectItem value="female">👩 Women Only</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Location — required */}
                      <FormField
                        control={salonForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address *</FormLabel>
                            <FormControl>
                              <Input placeholder="Shop address, area, city" {...field} className="rounded-xl" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* GPS Location picker */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Salon Location *</label>
                        <div className={`rounded-xl border-2 p-3.5 flex items-center justify-between gap-3 transition-all ${wizardLocationSet ? "border-green-400 bg-green-50" : "border-dashed border-gray-300 bg-gray-50"}`}>
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${wizardLocationSet ? "bg-green-100" : "bg-gray-200"}`}>
                              <MapPin className={`h-5 w-5 ${wizardLocationSet ? "text-green-600" : "text-gray-400"}`} />
                            </div>
                            <div className="min-w-0">
                              {wizardLocationSet ? (
                                <>
                                  <p className="text-sm font-semibold text-green-700">Location detected ✓</p>
                                  <p className="text-xs text-green-600 truncate">
                                    {salonForm.watch('latitude')?.toFixed(4)}, {salonForm.watch('longitude')?.toFixed(4)}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-sm font-medium text-gray-600">Tap to detect your location</p>
                                  <p className="text-xs text-gray-400">Required — helps customers find you</p>
                                </>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={wizardLocating}
                            onClick={() => {
                              if (!navigator.geolocation) {
                                toast({ title: "Not supported", description: "Your browser doesn't support GPS location.", variant: "destructive" });
                                return;
                              }
                              setWizardLocating(true);
                              navigator.geolocation.getCurrentPosition(
                                async (pos) => {
                                  const { latitude, longitude } = pos.coords;
                                  salonForm.setValue('latitude', latitude, { shouldValidate: true });
                                  salonForm.setValue('longitude', longitude, { shouldValidate: true });
                                  setWizardLocationSet(true);
                                  setWizardLocating(false);
                                  // Reverse geocode to fill address if empty
                                  if (!salonForm.getValues('address')) {
                                    try {
                                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                                      const data = await res.json();
                                      const addr = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
                                      salonForm.setValue('address', addr.substring(0, 120));
                                    } catch {}
                                  }
                                  toast({ title: "Location detected!", description: "Your salon location has been set." });
                                },
                                (err) => {
                                  setWizardLocating(false);
                                  toast({ title: "Location access denied", description: "Please allow location access or type your address manually.", variant: "destructive" });
                                },
                                { enableHighAccuracy: true, timeout: 10000 }
                              );
                            }}
                            className="rounded-xl flex-shrink-0 border-gray-300 text-xs"
                          >
                            {wizardLocating
                              ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />Locating...</>
                              : wizardLocationSet
                              ? <><MapPin className="h-3.5 w-3.5 mr-1" />Re-detect</>
                              : <><MapPin className="h-3.5 w-3.5 mr-1" />Use GPS Location</>}
                          </Button>
                        </div>
                        {salonForm.formState.errors.latitude && (
                          <p className="text-xs text-red-500">Please detect your location using the GPS button above</p>
                        )}
                      </div>

                      <FormField
                        control={salonForm.control}
                        name="confirmationAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Booking Confirmation Amount (₹)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="0" {...field} className="rounded-xl"
                                onChange={(e) => field.onChange(Number(e.target.value))} />
                            </FormControl>
                            <p className="text-xs text-gray-400">Amount customers pay upfront to confirm booking (0 = free booking)</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={salonForm.control}
                          name="instagramId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Instagram (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="yourhandle (without @)" {...field} className="rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={salonForm.control}
                          name="facebookId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Facebook (optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="yourpage (without facebook.com/)" {...field} className="rounded-xl" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={salonForm.control}
                        name="googleMapsLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Maps Link (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://maps.app.goo.gl/..." {...field} className="rounded-xl" />
                            </FormControl>
                            <p className="text-xs text-gray-400">Paste your Google Maps link so customers can get directions easily</p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </form>
                  </Form>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-700">What you'll get:</p>
                  <div className="space-y-1.5">
                    {["Your salon visible to thousands of customers", "Real-time booking management", "Instant payment collection", "Customer reviews & ratings"].map(item => (
                      <div key={item} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 1 — SERVICES ── */}
            {setupWizardStep === 1 && (
              <div className="p-4 space-y-4 max-w-2xl mx-auto">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Your Services</h2>
                  <p className="text-sm text-gray-500">Select services you offer. Prices can be edited anytime later.</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {(['unisex', 'men', 'women'] as const).map((g) => (
                    <button
                      key={g}
                      onClick={() => { setServiceGenderFilter(g); setSelectedPremade(new Set()); }}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all border ${serviceGenderFilter === g ? "bg-orange-100 text-orange-700 border-orange-300" : "bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200"}`}
                    >
                      {g === 'unisex' ? '👥 Unisex' : g === 'men' ? '👨 Men' : '👩 Women'}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500">Showing {serviceGenderFilter} services. Tap to select:</p>
                {(() => {
                  const sourceData = serviceGenderFilter === 'unisex' ? PREMADE_SERVICES : serviceGenderFilter === 'men' ? MEN_ONLY_SERVICES : WOMEN_ONLY_SERVICES;
                  return Object.entries(sourceData).map(([categoryName, servicesList]: [string, any[]]) => {
                    const categoryKeys = Object.keys(sourceData);
                    const catOffset = Object.entries(sourceData).slice(0, categoryKeys.indexOf(categoryName)).reduce((sum, [, list]: [string, any]) => sum + list.length, 0);
                    const availableIndices = servicesList.map((_, i) => catOffset + i).filter(i => !services.some((ex: any) => ex.name.toLowerCase() === servicesList[i - catOffset].name.toLowerCase()));
                    const allSelected = availableIndices.length > 0 && availableIndices.every(i => selectedPremade.has(i));
                    return (
                      <div key={categoryName} className="border rounded-xl overflow-hidden">
                        <button
                          className={`w-full px-4 py-2.5 flex items-center gap-2 text-left transition-all ${allSelected ? "bg-orange-50 border-b border-orange-100" : "bg-gray-50 border-b border-gray-100 hover:bg-orange-50/40"}`}
                          onClick={() => {
                            const newSelected = new Set(selectedPremade);
                            if (allSelected) availableIndices.forEach(i => newSelected.delete(i));
                            else availableIndices.forEach(i => newSelected.add(i));
                            setSelectedPremade(newSelected);
                          }}
                        >
                          <Layers className="h-4 w-4 text-gray-400" />
                          <span className="text-sm font-semibold text-gray-700">{categoryName}</span>
                          <span className="text-xs text-gray-400">({servicesList.length})</span>
                          <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full ${allSelected ? "bg-orange-500 text-white" : "bg-gray-200 text-gray-600"}`}>
                            {allSelected ? "All selected" : "Select all"}
                          </span>
                        </button>
                        <div className="p-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {servicesList.map((svc: any, svcIdx: number) => {
                            const globalIdx = catOffset + svcIdx;
                            const isSelected = selectedPremade.has(globalIdx);
                            const alreadyExists = services.some((ex: any) => ex.name.toLowerCase() === svc.name.toLowerCase());
                            return (
                              <button
                                key={globalIdx}
                                onClick={() => {
                                  if (alreadyExists) return;
                                  const newSelected = new Set(selectedPremade);
                                  isSelected ? newSelected.delete(globalIdx) : newSelected.add(globalIdx);
                                  setSelectedPremade(newSelected);
                                }}
                                disabled={alreadyExists}
                                className={`p-2.5 rounded-lg border text-left transition-all ${alreadyExists ? "border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed" : isSelected ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-200 hover:bg-orange-50/30"}`}
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{svc.name}</p>
                                    <p className="text-xs text-gray-400 truncate">{svc.description}</p>
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    <p className="text-sm font-semibold text-green-600">₹{svc.price}</p>
                                    <p className="text-xs text-gray-400">{svc.duration}m</p>
                                  </div>
                                  {isSelected && !alreadyExists && <CheckCircle className="h-4 w-4 text-orange-500 flex-shrink-0" />}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* ── STEP 2 — STAFF ── */}
            {setupWizardStep === 2 && (
              <div className="p-4 space-y-4 max-w-2xl mx-auto">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Your Team</h2>
                  <p className="text-sm text-gray-500"><span className="text-orange-600 font-medium">Click Select</span>, edit the name & experience, then we'll add them.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {PREMADE_STAFF.map((member, index) => {
                    const isSelected = selectedPremade.has(index);
                    const alreadyExists = staff.some((ex: any) => ex.name.toLowerCase() === (editedStaffData[index]?.name || member.name).toLowerCase());
                    const edits = editedStaffData[index] || { name: member.name, experience: member.experience };
                    return (
                      <div key={index} className={`p-3 rounded-xl border-2 transition-all ${alreadyExists ? "border-gray-200 bg-gray-50 opacity-50" : isSelected ? "border-orange-400 bg-orange-50" : "border-gray-200 hover:border-orange-200"}`}>
                        <div className="flex items-center gap-2.5 mb-2">
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm flex-shrink-0">
                            {edits.name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-orange-600 font-medium">{member.role}</p>
                            <p className="text-xs text-gray-400">{member.specialties.slice(0, 2).join(', ')}</p>
                          </div>
                          <button
                            onClick={() => {
                              if (alreadyExists) return;
                              const newSelected = new Set(selectedPremade);
                              if (isSelected) { newSelected.delete(index); const newEdits = { ...editedStaffData }; delete newEdits[index]; setEditedStaffData(newEdits); }
                              else newSelected.add(index);
                              setSelectedPremade(newSelected);
                            }}
                            disabled={alreadyExists}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all flex-shrink-0 ${alreadyExists ? "bg-gray-200 text-gray-400 cursor-not-allowed" : isSelected ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600"}`}
                          >
                            {alreadyExists ? "Added" : isSelected ? "✓ Selected" : "Select"}
                          </button>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed mt-1.5 line-clamp-2">
                          {member.description}
                        </p>
                        {isSelected && !alreadyExists && (
                          <div className="space-y-1.5 mt-1">
                            <input type="text" value={edits.name}
                              onChange={e => setEditedStaffData(prev => ({ ...prev, [index]: { ...edits, name: e.target.value } }))}
                              placeholder="Name"
                              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-400" />
                            <input type="text" value={edits.experience}
                              onChange={e => setEditedStaffData(prev => ({ ...prev, [index]: { ...edits, experience: e.target.value } }))}
                              placeholder="Experience (e.g. 3+ years)"
                              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-400" />
                            <input type="url" value={edits.photoUrl || ""}
                              onChange={e => setEditedStaffData(prev => ({ ...prev, [index]: { ...edits, photoUrl: e.target.value } }))}
                              placeholder="Photo URL (optional) — paste image link"
                              className="w-full text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-400" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── STEP 3 — AMENITIES (Products & Facilities) ── */}
            {setupWizardStep === 3 && (
              <div className="p-4 max-w-2xl mx-auto space-y-5">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">🏠 Amenities & Products</h2>
                  <p className="text-sm text-gray-500">Tap to select what your salon offers. Customers love seeing these listed!</p>
                </div>

                {/* Facilities */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">✨ Facilities ({wizardFacilitiesSelected.size} selected)</p>
                    <button onClick={() => setWizardFacilitiesSelected(new Set())} className="text-xs text-gray-400 hover:text-red-400 transition-colors">Clear all</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {PREMADE_FACILITIES.map((fac, i) => (
                      <button
                        key={i}
                        onClick={() => setWizardFacilitiesSelected(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; })}
                        className={`flex items-center gap-2.5 rounded-xl border-2 px-3 py-2.5 text-left transition-all ${wizardFacilitiesSelected.has(i) ? "border-teal-400 bg-teal-50" : "border-gray-200 bg-white hover:border-teal-200"}`}
                      >
                        <span className="text-lg flex-shrink-0">{fac.icon}</span>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold text-gray-800 leading-tight truncate">{fac.name}</p>
                          <p className="text-[10px] text-gray-400 leading-tight truncate">{fac.description}</p>
                        </div>
                        {wizardFacilitiesSelected.has(i) && <CheckCircle className="h-3.5 w-3.5 text-teal-500 flex-shrink-0" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-gray-700">🧴 Products You Sell ({wizardProductsSelected.size} selected)</p>
                    <button onClick={() => setWizardProductsSelected(new Set())} className="text-xs text-gray-400 hover:text-red-400 transition-colors">Clear all</button>
                  </div>
                  <div className="space-y-2">
                    {PREMADE_PRODUCTS.map((prod, i) => (
                      <button
                        key={i}
                        onClick={() => setWizardProductsSelected(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; })}
                        className={`w-full flex items-center gap-3 rounded-xl border-2 px-3.5 py-2.5 text-left transition-all ${wizardProductsSelected.has(i) ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-200"}`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${wizardProductsSelected.has(i) ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}>
                          {wizardProductsSelected.has(i) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-800 leading-tight">{prod.name}</p>
                          <p className="text-xs text-gray-400">{prod.brand} · {prod.category} · ₹{prod.price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-center text-xs text-gray-400">You can manage these anytime from the Products & Facilities section</p>
              </div>
            )}

            {/* ── STEP 4 — PHOTOS ── */}
            {setupWizardStep === 4 && (
              <div className="p-4 max-w-2xl mx-auto space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">📷 Add Salon Photos</h2>
                  <p className="text-sm text-gray-500">Great photos attract 3× more bookings. Upload your best work, interior, and team shots!</p>
                </div>

                <div className="flex gap-3 items-start">
                  {/* Upload zone */}
                  <label className={`flex-1 flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-6 cursor-pointer transition-all min-h-[130px] ${wizardUploading ? "border-pink-300 bg-pink-50" : "border-gray-300 bg-white hover:border-pink-400 hover:bg-pink-50/40"}`}>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      multiple
                      className="hidden"
                      disabled={wizardUploading}
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length || !salon?.id) return;
                        setWizardUploading(true);
                        try {
                          const formData = new FormData();
                          formData.append('salonId', salon.id);
                          files.forEach(f => formData.append('files', f));
                          const res = await fetch('/api/salons/media/upload', {
                            method: 'POST',
                            body: formData,
                            credentials: 'include',
                          });
                          if (res.ok) {
                            const data = await res.json();
                            const added = Array.isArray(data?.uploadedFiles) ? data.uploadedFiles.length : Array.isArray(data) ? data.length : 1;
                            setWizardUploadedCount(prev => prev + added);
                            queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon.id}/media`] });
                            toast({ title: `${added} photo${added > 1 ? 's' : ''} uploaded!`, description: "Your salon gallery has been updated." });
                          } else {
                            const err = await res.json().catch(() => ({}));
                            toast({ title: "Upload failed", description: err.message || "Please try again.", variant: "destructive" });
                          }
                        } catch {
                          toast({ title: "Upload failed", description: "Network error. Please try again.", variant: "destructive" });
                        } finally {
                          setWizardUploading(false);
                          e.target.value = "";
                        }
                      }}
                    />
                    {wizardUploading ? (
                      <><Loader2 className="h-9 w-9 text-pink-500 animate-spin" /><p className="text-sm font-semibold text-pink-600">Uploading...</p></>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-400 to-pink-600 flex items-center justify-center shadow-md">
                          <Camera className="h-6 w-6 text-white" />
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-semibold text-gray-800">Tap to upload photos</p>
                          <p className="text-xs text-gray-400 mt-0.5">Images & videos · Multiple files ok</p>
                        </div>
                      </>
                    )}
                  </label>

                  {/* Stats / tips card */}
                  <div className="w-36 flex-shrink-0 space-y-2">
                    {wizardUploadedCount > 0 ? (
                      <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-center">
                        <div className="text-2xl font-bold text-green-600">{wizardUploadedCount}</div>
                        <p className="text-[10px] font-semibold text-green-500 uppercase tracking-wide">Photo{wizardUploadedCount > 1 ? 's' : ''} Added</p>
                        <CheckCircle className="h-5 w-5 text-green-500 mx-auto mt-1" />
                      </div>
                    ) : (
                      <div className="rounded-xl bg-pink-50 border border-pink-100 p-3 text-center">
                        <div className="text-2xl">📸</div>
                        <p className="text-[10px] text-pink-600 font-semibold mt-1">0 photos yet</p>
                        <p className="text-[9px] text-gray-400 mt-0.5">Add at least 3</p>
                      </div>
                    )}
                    <div className="rounded-xl bg-blue-50 border border-blue-100 p-2.5 space-y-1.5">
                      <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wide">Pro Tips</p>
                      {["Bright, natural light", "Show your work area", "Include team photos"].map((tip) => (
                        <div key={tip} className="flex items-start gap-1">
                          <span className="text-blue-400 text-[9px] mt-0.5">•</span>
                          <p className="text-[9px] text-gray-600">{tip}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => window.open('/owner/media-gallery', '_blank')}
                  className="w-full rounded-xl border-gray-200 text-gray-600 h-10 text-sm hover:border-pink-300 hover:text-pink-600"
                >
                  <Camera className="h-4 w-4 mr-2" /> Open Full Media Gallery
                </Button>

                <p className="text-center text-xs text-gray-400">You can always add more photos later from your dashboard</p>
              </div>
            )}

            {/* ── STEP 5 — SCHEDULE ── */}
            {setupWizardStep === 5 && (
              <div className="p-4 max-w-2xl mx-auto space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Set Your Working Hours</h2>
                  <p className="text-sm text-gray-500">Tell customers when you're open. You can always change this later.</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
                  <WorkingHoursForm
                    workingHours={workingHours}
                    onSave={(hoursData) => updateWorkingHoursMutation.mutate(hoursData)}
                    onCancel={() => setSetupWizardStep(6)}
                    isLoading={updateWorkingHoursMutation.isPending}
                  />
                </div>
              </div>
            )}

            {/* ── STEP 6 — FAQs ── */}
            {setupWizardStep === 6 && (
              <div className="p-4 max-w-2xl mx-auto space-y-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Add Customer FAQs</h2>
                  <p className="text-sm text-gray-500">Pick ready-made answers to common questions. Saves customers from calling you!</p>
                </div>
                <div className="space-y-2">
                  {WIZARD_FAQS.map((faq, i) => (
                    <button
                      key={i}
                      onClick={() => setWizardFaqSelected(prev => { const next = new Set(prev); next.has(i) ? next.delete(i) : next.add(i); return next; })}
                      className={`w-full text-left rounded-xl border-2 p-3.5 transition-all ${wizardFaqSelected.has(i) ? "border-orange-400 bg-orange-50" : "border-gray-200 bg-white hover:border-orange-200"}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-all ${wizardFaqSelected.has(i) ? "border-orange-500 bg-orange-500" : "border-gray-300"}`}>
                          {wizardFaqSelected.has(i) && <CheckCircle className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{faq.q}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{faq.a}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* ── STEP 7 — DONE ── */}
            {setupWizardStep === 7 && (
              <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm mx-auto pt-16">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-md">
                  <CheckCircle className="h-12 w-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">You're all set! 🎉</h2>
                <p className="text-gray-500 mb-2">Your salon is live on Sanwar!</p>
                <p className="text-sm text-gray-400 mb-8">Customers can now discover, browse, and book appointments with you.</p>
                <Button onClick={closeSetupWizard} className="bg-green-600 hover:bg-green-700 text-white font-semibold rounded-xl px-10 h-12 text-base shadow-md">
                  Go to Dashboard →
                </Button>
              </div>
            )}

          </div>

          {/* Footer */}
          {setupWizardStep < 7 && (
            <div className="flex-shrink-0 border-t bg-white px-4 py-3 flex items-center justify-between gap-3 shadow-[0_-1px_8px_rgba(0,0,0,0.06)]">
              <button onClick={closeSetupWizard} className="text-sm text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-gray-50">
                <X className="h-3.5 w-3.5" />
                <span>Exit setup</span>
              </button>
              <div className="flex gap-2">
                {setupWizardStep > 0 && setupWizardStep !== 5 && (
                  <Button variant="outline" onClick={() => setSetupWizardStep(s => s - 1)} className="rounded-xl h-10 px-4 text-sm border-gray-200 hover:border-gray-300">
                    ← Back
                  </Button>
                )}

                {/* Step 0 — Save profile */}
                {setupWizardStep === 0 && (
                  <Button
                    form="wizard-salon-form"
                    type="submit"
                    disabled={salonMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 px-5 text-sm font-semibold"
                  >
                    {salonMutation.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Creating...</>
                      : "Create Salon Profile →"}
                  </Button>
                )}

                {/* Step 1 — Add services */}
                {setupWizardStep === 1 && (
                  <Button
                    onClick={async () => {
                      if (selectedPremade.size === 0) { setSetupWizardStep(2); return; }
                      const sourceData = serviceGenderFilter === 'unisex' ? PREMADE_SERVICES : serviceGenderFilter === 'men' ? MEN_ONLY_SERVICES : WOMEN_ONLY_SERVICES;

                      // Collect selected services grouped by category
                      const byCategory: Record<string, { name: string; description: string; price: number; duration: number }[]> = {};
                      let globalIdx = 0;
                      for (const [catName, svcList] of Object.entries(sourceData)) {
                        for (const svc of svcList as any[]) {
                          if (selectedPremade.has(globalIdx)) {
                            if (!byCategory[catName]) byCategory[catName] = [];
                            byCategory[catName].push({ ...svc, price: parseFloat(String(svc.price)) });
                          }
                          globalIdx++;
                        }
                      }
                      if (Object.keys(byCategory).length === 0) { setSetupWizardStep(2); return; }

                      const CATEGORY_COLORS: Record<string, string> = {
                        "Hair Care": "#F97316", "Men's Hair": "#3B82F6", "Women's Hair": "#F97316",
                        "Facial & Skin": "#EC4899", "Men's Skincare": "#64748B", "Women's Facial & Skin": "#EC4899",
                        "Nail Services": "#A855F7", "Women's Nail Services": "#A855F7", "Men's Nail Care": "#A855F7",
                        "Bridal Services": "#EF4444", "Massage & Spa": "#3B82F6", "Men's Massage": "#3B82F6",
                        "Women's Spa & Massage": "#3B82F6", "Beard & Grooming": "#78350F",
                        "Makeup": "#F472B6", "Women's Makeup": "#F472B6", "Waxing & Threading": "#EAB308",
                        "Men's Waxing": "#EAB308", "Hair Treatments": "#0D9488", "Eye & Eyebrow": "#6366F1",
                        "Saree Draping": "#BE185D",
                      };
                      const CATEGORY_ICONS: Record<string, string> = {
                        "Hair Care": "Scissors", "Men's Hair": "Scissors", "Women's Hair": "Scissors",
                        "Hair Treatments": "Sparkles", "Facial & Skin": "Sparkles", "Men's Skincare": "Sparkles",
                        "Women's Facial & Skin": "Sparkles", "Nail Services": "Sparkles",
                        "Women's Nail Services": "Sparkles", "Men's Nail Care": "Sparkles",
                        "Bridal Services": "Heart", "Massage & Spa": "Star", "Men's Massage": "Star",
                        "Women's Spa & Massage": "Star", "Makeup": "Palette", "Women's Makeup": "Palette",
                        "Waxing & Threading": "Scissors", "Men's Waxing": "Scissors",
                        "Eye & Eyebrow": "Star", "Beard & Grooming": "Scissors", "Saree Draping": "Heart",
                      };

                      setWizardServSaving(true);
                      try {
                        const categoryMap: Record<string, string> = {};
                        let catOrder = 0;
                        for (const catName of Object.keys(byCategory)) {
                          try {
                            const res = await apiRequest('POST', `/api/salons/${salon?.id}/categories`, {
                              name: catName,
                              description: `${catName} services`,
                              icon: CATEGORY_ICONS[catName] || 'Scissors',
                              color: CATEGORY_COLORS[catName] || '#6B7280',
                              order: catOrder++,
                            });
                            const cat = await res.json();
                            if (cat?.id) categoryMap[catName] = cat.id;
                          } catch {}
                        }
                        const allServices = Object.entries(byCategory).flatMap(([catName, svcs]) =>
                          svcs.map(svc => ({ ...svc, categoryId: categoryMap[catName] || null }))
                        );
                        for (const svc of allServices) {
                          await apiRequest('POST', `/api/salons/${salon?.id}/services`, svc);
                        }
                        queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/services`] });
                        queryClient.invalidateQueries({ queryKey: [`/api/salons/${salon?.id}/categories`] });
                        toast({ title: `${allServices.length} Services Added!`, description: "Services added with categories." });
                        setSelectedPremade(new Set());
                        setSetupWizardStep(2);
                      } catch {
                        toast({ title: "Error adding services", variant: "destructive" });
                      } finally {
                        setWizardServSaving(false);
                      }
                    }}
                    disabled={wizardServSaving}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 px-5 text-sm font-semibold"
                  >
                    {wizardServSaving
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Adding...</>
                      : selectedPremade.size > 0 ? `Add ${selectedPremade.size} Services →` : "Skip →"}
                  </Button>
                )}

                {/* Step 2 — Add staff */}
                {setupWizardStep === 2 && (
                  <Button
                    onClick={() => {
                      if (selectedPremade.size === 0) { setSetupWizardStep(3); return; }
                      const selected = PREMADE_STAFF
                        .map((m, i) => ({ ...m, _index: i }))
                        .filter(m => selectedPremade.has(m._index))
                        .map(({ _index, ...m }) => ({
                          ...m,
                          name: editedStaffData[_index]?.name || m.name,
                          experience: editedStaffData[_index]?.experience || m.experience,
                          photoUrl: editedStaffData[_index]?.photoUrl || null,
                        }));
                      quickAddStaffMutation.mutate(selected, {
                        onSettled: () => {
                          setSetupWizardStep(3);
                          setSelectedPremade(new Set());
                          setEditedStaffData({});
                        },
                      });
                    }}
                    disabled={quickAddStaffMutation.isPending}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 px-5 text-sm font-semibold"
                  >
                    {quickAddStaffMutation.isPending
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Adding...</>
                      : selectedPremade.size > 0 ? `Add ${selectedPremade.size} Staff →` : "Skip →"}
                  </Button>
                )}

                {/* Step 3 — Amenities: save facilities + products then next */}
                {setupWizardStep === 3 && (
                  <Button
                    onClick={async () => {
                      if (wizardFacilitiesSelected.size === 0 && wizardProductsSelected.size === 0) {
                        setSetupWizardStep(4);
                        return;
                      }
                      setWizardAmenitiesSaving(true);
                      try {
                        for (const i of wizardFacilitiesSelected) {
                          const fac = PREMADE_FACILITIES[i];
                          await apiRequest("POST", `/api/salons/${salon?.id}/facilities`, {
                            name: fac.name,
                            icon: fac.icon,
                            description: fac.description,
                            isAvailable: true,
                          });
                        }
                        for (const i of wizardProductsSelected) {
                          const prod = PREMADE_PRODUCTS[i];
                          await apiRequest("POST", `/api/salons/${salon?.id}/products`, {
                            name: prod.name,
                            brand: prod.brand,
                            category: prod.category,
                            price: String(prod.price),
                            description: prod.description,
                            inStock: true,
                            stockQuantity: 10,
                          });
                        }
                        queryClient.invalidateQueries({ queryKey: ["/api/salons", salon?.id, "facilities"] });
                        queryClient.invalidateQueries({ queryKey: ["/api/salons", salon?.id, "products"] });
                        const total = wizardFacilitiesSelected.size + wizardProductsSelected.size;
                        toast({ title: `${total} item${total > 1 ? 's' : ''} added!`, description: "Facilities and products saved." });
                      } catch {
                        toast({ title: "Error saving amenities", variant: "destructive" });
                      } finally {
                        setWizardAmenitiesSaving(false);
                      }
                      setSetupWizardStep(4);
                    }}
                    disabled={wizardAmenitiesSaving}
                    className="bg-teal-600 hover:bg-teal-700 text-white rounded-xl h-10 px-5 text-sm font-semibold"
                  >
                    {wizardAmenitiesSaving
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Saving...</>
                      : (wizardFacilitiesSelected.size + wizardProductsSelected.size) > 0
                        ? `Save ${wizardFacilitiesSelected.size + wizardProductsSelected.size} Items →`
                        : "Skip →"}
                  </Button>
                )}

                {/* Step 4 — Photos (just next) */}
                {setupWizardStep === 4 && (
                  <Button onClick={() => setSetupWizardStep(5)} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 px-5 text-sm font-semibold">
                    Next → Schedule
                  </Button>
                )}

                {/* Step 5 — Schedule: form has its own Save/Skip buttons via WorkingHoursForm onCancel */}

                {/* Step 6 — FAQs & Finish */}
                {setupWizardStep === 6 && (
                  <Button
                    onClick={async () => {
                      if (wizardFaqSelected.size > 0) {
                        setWizardFaqSaving(true);
                        try {
                          const selectedFaqs = [...wizardFaqSelected].map(i => WIZARD_FAQS[i]);
                          for (const faq of selectedFaqs) {
                            await apiRequest("POST", "/api/owner/salon/faqs", { question: faq.q, answer: faq.a });
                          }
                          queryClient.invalidateQueries({ queryKey: ["/api/owner/salon/faqs"] });
                        } catch {}
                        setWizardFaqSaving(false);
                      }
                      setSetupWizardStep(7);
                    }}
                    disabled={wizardFaqSaving}
                    className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl h-10 px-5 text-sm font-semibold"
                  >
                    {wizardFaqSaving
                      ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" />Saving...</>
                      : wizardFaqSelected.size > 0 ? `Add ${wizardFaqSelected.size} FAQs & Finish 🎉` : "Finish →"}
                  </Button>
                )}
              </div>
            </div>
          )}

        </div>
      )}
      {/* ─── END SETUP WIZARD ─── */}

    </div>
  );
}