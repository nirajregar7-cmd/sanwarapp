import { Button } from "@/components/ui/button";
import { FaGoogle, FaFacebook } from "react-icons/fa";

interface SocialLoginButtonsProps {
  userType: "customer" | "salon_owner";
  isLogin?: boolean;
}

export function SocialLoginButtons({ userType, isLogin = true }: SocialLoginButtonsProps) {
  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    // Construct the social login URL with user type
    const baseUrl = `/api/auth/${provider}`;
    const params = new URLSearchParams({
      userType: userType,
      action: isLogin ? 'login' : 'register'
    });
    
    // Redirect to social login endpoint
    window.location.href = `${baseUrl}?${params.toString()}`;
  };

  const actionText = isLogin ? "Sign in" : "Sign up";

  return (
    <div className="space-y-3">
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-3 h-11 bg-white hover:bg-gray-50"
        onClick={() => handleSocialLogin('google')}
      >
        <FaGoogle className="h-5 w-5 text-red-500" />
        <span className="text-gray-700">{actionText} with Google</span>
      </Button>
      
      <Button
        type="button"
        variant="outline"
        className="w-full flex items-center justify-center gap-3 h-11 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
        onClick={() => handleSocialLogin('facebook')}
      >
        <FaFacebook className="h-5 w-5 text-white" />
        <span>{actionText} with Facebook</span>
      </Button>
    </div>
  );
}