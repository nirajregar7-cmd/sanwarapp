import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Share2, X, CheckCircle, Calendar, Clock, MapPin, User, Scissors } from "lucide-react";
import { SiWhatsapp, SiInstagram, SiFacebook, SiTelegram } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface BookingShareCardProps {
  open: boolean;
  onClose: () => void;
  booking: {
    id: string;
    salonName: string;
    salonAddress?: string;
    services: string[];
    date: string;
    startTime: string;
    endTime: string;
    staffName?: string;
    totalAmount: number;
  };
}

export function BookingShareCard({ open, onClose, booking }: BookingShareCardProps) {
  const { toast } = useToast();
  const salonLink = "https://sanwarhub.in";
  const bookingId = booking.id.slice(-6).toUpperCase();

  const shareText = `✂️ Just booked at *${booking.salonName}* via Sanwar!\n\n📅 ${booking.date}\n⏰ ${booking.startTime} – ${booking.endTime}\n💇 ${booking.services.join(", ")}\n\nBook your appointment too 👉 ${salonLink}`;

  const shareViaWhatsApp = () =>
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank");

  const shareViaInstagram = () => {
    navigator.clipboard.writeText(shareText).then(() =>
      toast({ title: "Caption copied!", description: "Paste it in your Instagram story or post." })
    );
    window.open("https://www.instagram.com/", "_blank");
  };

  const shareViaFacebook = () =>
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(salonLink)}&quote=${encodeURIComponent(shareText)}`,
      "_blank"
    );

  const shareViaTelegram = () =>
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(salonLink)}&text=${encodeURIComponent(shareText)}`,
      "_blank"
    );

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Booked at ${booking.salonName}`, text: shareText, url: salonLink });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      toast({ title: "Copied!", description: "Share text copied to clipboard." });
    }
  };

  const formattedDate = (() => {
    try {
      return new Date(booking.date).toLocaleDateString("en-IN", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      });
    } catch { return booking.date; }
  })();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden rounded-3xl border-0 gap-0 [&>button]:hidden">
        <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 p-6 pb-10 text-white">
          <button onClick={onClose} className="absolute top-4 right-4 text-white/70 hover:text-white">
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-white/20 rounded-full p-1.5"><Scissors className="h-4 w-4" /></div>
            <span className="text-white/80 text-sm font-medium">sanwarhub.in</span>
          </div>
          <div className="flex items-start gap-3">
            <div className="bg-green-400 rounded-full p-2 flex-shrink-0 mt-0.5">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-white/70 text-xs uppercase tracking-widest mb-1">Booking Confirmed</p>
              <h2 className="text-xl font-bold leading-tight">{booking.salonName}</h2>
              <p className="text-white/70 text-xs mt-1">#{bookingId}</p>
            </div>
          </div>
        </div>

        <div className="bg-white mx-4 -mt-6 rounded-2xl shadow-lg p-4 mb-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Scissors className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">Services</p>
                <p className="text-sm font-semibold text-gray-800">{booking.services.join(" + ")}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Calendar className="h-4 w-4 text-blue-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">Date</p>
                <p className="text-sm font-semibold text-gray-800">{formattedDate}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clock className="h-4 w-4 text-amber-500" />
              </div>
              <div>
                <p className="text-[11px] text-gray-400 uppercase tracking-wide">Time</p>
                <p className="text-sm font-semibold text-gray-800">{booking.startTime} – {booking.endTime}</p>
              </div>
            </div>
            {booking.staffName && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-pink-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <User className="h-4 w-4 text-pink-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">Stylist</p>
                  <p className="text-sm font-semibold text-gray-800">{booking.staffName}</p>
                </div>
              </div>
            )}
            {booking.salonAddress && (
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <MapPin className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400 uppercase tracking-wide">Address</p>
                  <p className="text-sm font-semibold text-gray-800 leading-snug">{booking.salonAddress}</p>
                </div>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-400">Total Amount</span>
            <span className="text-lg font-bold text-purple-700">₹{booking.totalAmount.toFixed(2)}</span>
          </div>
        </div>

        <div className="px-4 pb-2">
          <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl px-4 py-3 text-center border border-purple-100">
            <p className="text-xs text-gray-500">Book your appointment at</p>
            <p className="text-sm font-bold text-purple-700">sanwarhub.in</p>
          </div>
        </div>

        <div className="px-4 pb-6 pt-2">
          <p className="text-xs text-gray-400 text-center mb-3">Share your experience</p>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={shareViaWhatsApp} className="flex flex-col items-center gap-1 p-3 bg-green-50 hover:bg-green-100 rounded-2xl transition-colors">
              <SiWhatsapp className="h-6 w-6 text-green-600" />
              <span className="text-[10px] text-green-700 font-medium">WhatsApp</span>
            </button>
            <button onClick={shareViaInstagram} className="flex flex-col items-center gap-1 p-3 bg-pink-50 hover:bg-pink-100 rounded-2xl transition-colors">
              <SiInstagram className="h-6 w-6 text-pink-600" />
              <span className="text-[10px] text-pink-700 font-medium">Instagram</span>
            </button>
            <button onClick={shareViaFacebook} className="flex flex-col items-center gap-1 p-3 bg-blue-50 hover:bg-blue-100 rounded-2xl transition-colors">
              <SiFacebook className="h-6 w-6 text-blue-600" />
              <span className="text-[10px] text-blue-700 font-medium">Facebook</span>
            </button>
            <button onClick={shareViaTelegram} className="flex flex-col items-center gap-1 p-3 bg-sky-50 hover:bg-sky-100 rounded-2xl transition-colors">
              <SiTelegram className="h-6 w-6 text-sky-500" />
              <span className="text-[10px] text-sky-700 font-medium">Telegram</span>
            </button>
          </div>
          <Button variant="outline" className="w-full mt-3 rounded-2xl border-purple-200 text-purple-700 hover:bg-purple-50" onClick={shareNative}>
            <Share2 className="h-4 w-4 mr-2" />
            More sharing options
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
