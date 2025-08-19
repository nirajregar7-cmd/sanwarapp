import { Button } from "@/components/ui/button";
import { FaGoogle, FaFacebook } from "react-icons/fa";

interface SocialLoginButtonsProps {
  userType?: "customer" | "salon_owner" | "brand_owner";
  isLogin?: boolean;
  showRoleSelection?: boolean;
}

export function SocialLoginButtons({ userType, isLogin = true, showRoleSelection = false }: SocialLoginButtonsProps) {
  const handleSocialLogin = (provider: 'google' | 'facebook') => {
    // Construct the social login URL with user type if specified
    const baseUrl = `/api/auth/${provider}`;
    const params = new URLSearchParams();
    
    if (userType) {
      params.set('userType', userType);
    }
    if (!isLogin) {
      params.set('action', 'register');
    }
    
    // Redirect to social login endpoint
    const urlParams = params.toString();
    window.location.href = urlParams ? `${baseUrl}?${urlParams}` : baseUrl;
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