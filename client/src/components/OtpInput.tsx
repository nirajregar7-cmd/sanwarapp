import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  length,
  value,
  onChange,
  className = '',
  disabled = false,
}) => {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Initialize OTP array from value prop
    const otpArray = (value || '').split('').slice(0, length);
    while (otpArray.length < length) {
      otpArray.push('');
    }
    setOtp(otpArray);
  }, [value, length]);

  const handleChange = (element: HTMLInputElement, index: number) => {
    if (isNaN(Number(element.value))) return;

    const newOtp = [...otp];
    // Only take the last character if user types multiple characters
    newOtp[index] = element.value.slice(-1);
    setOtp(newOtp);

    const otpValue = newOtp.join('');
    console.log("OTP component calling onChange with:", otpValue);
    onChange(otpValue);

    // Focus next input
    if (element.value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    // Handle backspace
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (otp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
      } else if (index > 0) {
        // Move to previous input and clear it
        newOtp[index - 1] = '';
        setOtp(newOtp);
        onChange(newOtp.join(''));
        inputRefs.current[index - 1]?.focus();
      }
    }
    
    // Handle arrow keys
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    const otpArray = pastedData.split('').filter(char => !isNaN(Number(char)));
    
    if (otpArray.length > 0) {
      const newOtp = [...otp];
      otpArray.forEach((char, index) => {
        if (index < length) {
          newOtp[index] = char;
        }
      });
      
      // Fill remaining with empty strings
      for (let i = otpArray.length; i < length; i++) {
        newOtp[i] = '';
      }
      
      setOtp(newOtp);
      onChange(newOtp.join(''));
      
      // Focus the next empty input or the last input
      const nextIndex = Math.min(otpArray.length, length - 1);
      inputRefs.current[nextIndex]?.focus();
    }
  };

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={index === 0 ? handlePaste : undefined}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg",
            "focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none",
            "disabled:bg-gray-100 disabled:cursor-not-allowed",
            "dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:border-blue-400 dark:focus:ring-blue-300"
          )}
          data-testid={`otp-input-${index}`}
        />
      ))}
    </div>
  );
};