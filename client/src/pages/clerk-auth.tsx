import { SignIn, SignUp, UserButton } from '@clerk/clerk-react';
import { useAuth } from '@clerk/clerk-react';
import { useEffect } from 'react';
import { useLocation } from 'wouter';

export default function ClerkAuthPage() {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isSignedIn) {
      setLocation('/');
    }
  }, [isSignedIn, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome to Sanwar
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Smart salon booking platform
          </p>
        </div>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none",
              }
            }}
            signUpUrl="/clerk-signup"
          />
        </div>
      </div>
    </div>
  );
}

export function ClerkSignUpPage() {
  const { isSignedIn } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isSignedIn) {
      setLocation('/user-type-selection');
    }
  }, [isSignedIn, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Join Sanwar
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Create your account to get started
          </p>
        </div>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <SignUp 
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none",
              }
            }}
            signInUrl="/clerk-signin"
          />
        </div>
      </div>
    </div>
  );
}