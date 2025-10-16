import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ArrowLeft, CreditCard, Building2, DollarSign, TrendingUp, QrCode, Download, Gift } from "lucide-react";
import { Link } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import type { SalonOwnerAccount } from "@shared/schema";

const accountSchema = z.object({
  bankName: z.string().min(1, "Bank name is required"),
  accountHolderName: z.string().min(1, "Account holder name is required"),
  accountNumber: z.string().min(8, "Valid account number is required"),
  ifscCode: z.string().regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  branch: z.string().optional(),
  upiId: z.string().optional(),
});

type AccountFormData = z.infer<typeof accountSchema>;

export default function AccountDetails() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [qrDownloaded, setQrDownloaded] = useState(false);

  // Fetch account details
  const { data: account, isLoading: accountLoading } = useQuery({
    queryKey: ['/api/owner/account'],
    retry: false,
  });

  // Fetch revenue data
  const { data: revenue, isLoading: revenueLoading } = useQuery({
    queryKey: ['/api/owner/revenue'],
    retry: false,
  });

  // Fetch salon data for QR code
  const { data: salon } = useQuery({
    queryKey: ['/api/owner/salon'],
    retry: false,
  });

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      bankName: account?.bankName || "",
      accountHolderName: account?.accountHolderName || "",
      accountNumber: account?.accountNumber || "",
      ifscCode: account?.ifscCode || "",
      branch: account?.branch || "",
      upiId: account?.upiId || "",
    },
  });

  // Reset form when account data loads
  useEffect(() => {
    if (account) {
      form.reset({
        bankName: account.bankName || "",
        accountHolderName: account.accountHolderName || "",
        accountNumber: account.accountNumber || "",
        ifscCode: account.ifscCode || "",
        branch: account.branch || "",
        upiId: account.upiId || "",
      });
    }
  }, [account, form]);

  const saveAccountMutation = useMutation({
    mutationFn: async (data: AccountFormData) => {
      return await apiRequest('POST', '/api/owner/account', data);
    },
    onSuccess: async (response: Response) => {
      const data = await response.json();
      const verificationResult = data.verificationResult;
      
      if (verificationResult?.verified) {
        toast({
          title: "Success ✓",
          description: "Account details saved and verified successfully!",
        });
      } else if (verificationResult?.success === false) {
        toast({
          title: "Saved with Issues",
          description: verificationResult.message || "Account saved but verification failed",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Account details saved. Verification in progress...",
        });
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/owner/account'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save account details",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AccountFormData) => {
    saveAccountMutation.mutate(data);
  };

  // Download QR code function
  const downloadQRCode = () => {
    const svg = document.getElementById("sanwar-qr-code");
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");

      const downloadLink = document.createElement("a");
      downloadLink.download = `sanwar-discount-qr-${salon?.name?.replace(/\s+/g, '-')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      
      setQrDownloaded(true);
      toast({
        title: "QR Code Downloaded!",
        description: "Share this QR code with your customers to offer discounts",
      });
    };

    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  // Generate QR code URL
  const qrCodeUrl = salon?.id ? `${window.location.origin}/discount-enrollment/${salon.id}` : "";

  if (accountLoading || revenueLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4 mb-6">
        <Link href="/owner/dashboard">
          <Button variant="outline" size="sm" className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Back to Dashboard</span>
            <span className="xs:hidden">Back</span>
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Account Details</h1>
      </div>

      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Revenue Overview */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Revenue Overview
              </CardTitle>
              <CardDescription>
                Your earnings from booking confirmations (Platform takes 20%, you get 80%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    ₹{revenue?.totalEarnings || "0"}
                  </div>
                  <div className="text-sm text-gray-500">Total Earnings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    ₹{revenue?.pendingTransfers || "0"}
                  </div>
                  <div className="text-sm text-gray-500">Pending Transfer</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{revenue?.completedTransfers || "0"}
                  </div>
                  <div className="text-sm text-gray-500">Transferred</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {revenue?.totalBookings || "0"}
                  </div>
                  <div className="text-sm text-gray-500">Total Bookings</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Account Details Form */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Bank Account Details
              {account?.verificationStatus === 'verified' && (
                <Badge variant="default" className="bg-green-500">
                  ✓ Verified
                </Badge>
              )}
              {account?.verificationStatus === 'pending' && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  ⏳ Verifying...
                </Badge>
              )}
              {account?.verificationStatus === 'failed' && (
                <Badge variant="destructive">
                  ✗ Verification Failed
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Add your bank details to receive your share of booking confirmation payments
              {account?.verificationMessage && (
                <div className={`mt-2 text-sm ${
                  account.verificationStatus === 'verified' ? 'text-green-600' : 
                  account.verificationStatus === 'failed' ? 'text-red-600' : 
                  'text-yellow-600'
                }`}>
                  {account.verificationMessage}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., State Bank of India" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountHolderName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input placeholder="As per bank records" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., 1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., SBIN0001234" 
                            {...field}
                            onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="branch"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Branch (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Main Branch" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="upiId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UPI ID (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., yourname@upi" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="flex justify-between items-center pt-4">
                  <div className="text-sm text-gray-500">
                    All information is securely encrypted and used only for payment transfers
                  </div>
                  <Button 
                    type="submit" 
                    disabled={saveAccountMutation.isPending}
                    className="min-w-[120px]"
                  >
                    {saveAccountMutation.isPending ? "Saving..." : "Save Details"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      {/* Sanwar Discount QR Code - Only show if UPI ID is saved */}
      {account?.upiId && salon?.id && (
        <div className="mt-6">
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-purple-600" />
                Sanwar Discount QR Code
                <Badge className="bg-purple-600">New Feature!</Badge>
              </CardTitle>
              <CardDescription>
                Show this QR code to customers after service. They can scan to get 10% or 20% discount on their next visit and pay you directly via UPI!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="bg-white p-4 rounded-lg shadow-lg">
                  <QRCodeSVG
                    id="sanwar-qr-code"
                    value={qrCodeUrl}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                  <div className="text-center mt-2 text-sm font-medium text-gray-700">
                    Scan for Discount
                  </div>
                </div>
                
                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-2">How it works:</h3>
                    <ol className="space-y-2 text-sm text-gray-600">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-purple-600">1.</span>
                        <span>Customer scans QR code after enjoying your service</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-purple-600">2.</span>
                        <span>They choose 10% or 20% discount for next visit</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-purple-600">3.</span>
                        <span>Customer provides email and phone number</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-purple-600">4.</span>
                        <span>We send them their Sanwar discount card via email</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-purple-600">5.</span>
                        <span>Customer pays you directly via your UPI: <strong>{account.upiId}</strong></span>
                      </li>
                    </ol>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button onClick={downloadQRCode} variant="default" className="bg-purple-600 hover:bg-purple-700">
                      <Download className="h-4 w-4 mr-2" />
                      Download QR Code
                    </Button>
                    {qrDownloaded && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        ✓ Downloaded
                      </Badge>
                    )}
                  </div>
                  
                  <div className="bg-purple-100 p-3 rounded-md text-sm">
                    <strong>💡 Tip:</strong> Print this QR code and display it at your counter or send it digitally to customers after service!
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-2 mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5" />
              Payment Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            <ul className="space-y-2">
              <li>• Payments are processed within 2-3 business days</li>
              <li>• Minimum transfer amount: ₹100</li>
              <li>• You'll receive SMS/email confirmation for each transfer</li>
              <li>• Account verification may take 24-48 hours</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5" />
              Revenue Split
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-gray-600">
            <ul className="space-y-2">
              <li>• Platform commission: 20% of confirmation amount</li>
              <li>• Your share: 80% of confirmation amount</li>
              <li>• Full service payment collected at salon</li>
              <li>• No hidden fees or charges</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}