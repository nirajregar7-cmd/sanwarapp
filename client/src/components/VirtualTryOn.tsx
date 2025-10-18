import { Camera, Sparkles, MessageCircle } from "lucide-react";

export function VirtualTryOn() {
  return (
    <div className="text-center space-y-6 py-12">
      <div className="space-y-2">
        <h2 className="text-3xl font-bold">Sanwar AI Virtual Try-On</h2>
        <p className="text-gray-600">
          Preview different hairstyles with AI before visiting the salon
        </p>
      </div>

      <div className="max-w-2xl mx-auto bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl p-8 border-2 border-purple-200">
        <Sparkles className="h-16 w-16 mx-auto mb-4 text-purple-600" />
        <h3 className="text-2xl font-semibold mb-3">Coming Soon!</h3>
        <p className="text-gray-700 mb-4">
          We're working on Sanwar Virtual Try-On – an amazing AI-powered feature
          that will let you try on different hairstyles virtually before booking
          your appointment.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            <span>Take or upload photos</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <span>10+ AI-generated looks</span>
          </div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            <span>AI stylist advice</span>
          </div>
        </div>
      </div>
    </div>
  );
}
