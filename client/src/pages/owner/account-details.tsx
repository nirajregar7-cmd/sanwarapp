import { useEffect } from "react";
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
import { ArrowLeft, CreditCard, Building2, DollarSign, TrendingUp } from "lucide-react";
import { Link } from "wouter";
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
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Account details saved successfully",
      });
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
                Your earnings from booking confirmations (Platform takes 45%, you get 55%)
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
              {account?.isVerified && (
                <Badge variant="default" className="bg-green-500">
                  Verified
                </Badge>
              )}
              {account && !account.isVerified && (
                <Badge variant="secondary">
                  Pending Verification
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              Add your bank details to receive your share of booking confirmation payments
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
              <li>• Platform commission: 45% of confirmation amount</li>
              <li>• Your share: 55% of confirmation amount</li>
              <li>• Full service payment collected at salon</li>
              <li>• No hidden fees or charges</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}