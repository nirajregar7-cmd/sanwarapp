import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { ArrowLeft, Gift, Users, Share2, Smartphone, MessageCircle, Copy, CheckCircle } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

interface ReferralCampaign {
  id: string;
  referrerId: string;
  referralCode: string;
  totalReferred: number;
  completedReferrals: number;
  totalEarned: string;
  isActive: boolean;
  nextMilestone: number;
  progressToMilestone: number;
  milestoneReward: string;
  createdAt: string;
}

interface ReferralHistory {
  id: string;
  referredCustomerName: string;
  referredCustomerPhone: string;
  status: "pending" | "completed";
  rewardAmount: string;
  completedAt?: string;
  bookingId?: string;
}

export default function ShopkeeperReferEarn() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // Get shopkeeper's referral campaign
  const { data: campaign, isLoading: campaignLoading } = useQuery<ReferralCampaign>({
    queryKey: ["/api/owner/referral-campaign"],
  });

  // Get referral history
  const { data: referralHistory = [], isLoading: historyLoading } = useQuery<ReferralHistory[]>({
    queryKey: ["/api/owner/referral-history"],
  });

  // Create referral campaign
  const createCampaignMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/owner/referral-campaign");
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Referral campaign created! Start sharing your code to earn rewards.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/referral-campaign"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const copyReferralCode = () => {
    if (campaign?.referralCode) {
      navigator.clipboard.writeText(campaign.referralCode);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const shareWhatsApp = () => {
    if (campaign?.referralCode) {
      const message = `🎉 Book your salon appointment easily with Sanwar! Use my referral code: ${campaign.referralCode} and get the best service. Download now and book instantly! 💇‍♀️✨`;
      const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(url, '_blank');
    }
  };

  const shareSMS = () => {
    if (campaign?.referralCode) {
      const message = `Book your salon appointment with Sanwar! Use referral code: ${campaign.referralCode} for great service. Book now!`;
      const url = `sms:?body=${encodeURIComponent(message)}`;
      window.location.href = url;
    }
  };

  if (campaignLoading || historyLoading) {
    return (
      <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-48 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
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
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Refer & Earn</h1>
      </div>

      {!campaign ? (
        // No campaign yet - show introduction
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-500" />
                Start Earning with Customer Referrals
              </CardTitle>
              <CardDescription>
                Refer customers to your salon and earn rewards when they complete bookings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
                <h3 className="font-semibold text-lg mb-4">How it Works:</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Share2 className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-medium">1. Share Your Code</h4>
                    <p className="text-sm text-gray-600">Share your unique referral code with potential customers</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-medium">2. Customer Books</h4>
                    <p className="text-sm text-gray-600">When they book using your code, you both benefit</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Gift className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="font-medium">3. Earn Rewards</h4>
                    <p className="text-sm text-gray-600">Get full confirmation charges after 3 successful referrals</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <h4 className="font-semibold text-yellow-800">Reward Structure:</h4>
                <p className="text-yellow-700 mt-1">
                  Refer 3 customers who complete bookings → Earn the full confirmation amount they paid!
                </p>
              </div>

              <Button 
                onClick={() => createCampaignMutation.mutate()} 
                disabled={createCampaignMutation.isPending}
                className="w-full"
              >
                {createCampaignMutation.isPending ? "Setting up..." : "Start My Referral Campaign"}
              </Button>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Campaign exists - show dashboard
        <div className="space-y-6">
          {/* Referral Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-green-500" />
                Your Referral Progress
              </CardTitle>
              <CardDescription>
                Milestone: {campaign.progressToMilestone}/3 customers referred
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{campaign.totalReferred}</div>
                  <div className="text-sm text-gray-500">Total Referred</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{campaign.completedReferrals}</div>
                  <div className="text-sm text-gray-500">Completed Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">₹{campaign.totalEarned}</div>
                  <div className="text-sm text-gray-500">Total Earned</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{campaign.progressToMilestone}/3</div>
                  <div className="text-sm text-gray-500">Current Milestone</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-green-400 to-blue-500 h-3 rounded-full transition-all duration-300"
                  style={{ width: `${(campaign.progressToMilestone / 3) * 100}%` }}
                ></div>
              </div>

              {campaign.progressToMilestone === 3 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="font-semibold text-green-700">Milestone Achieved!</span>
                  </div>
                  <p className="text-green-600 mt-1">
                    You've earned ₹{campaign.milestoneReward} from your referrals!
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-700">
                    Refer {3 - campaign.progressToMilestone} more customer(s) to earn your next reward!
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Share Your Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Share2 className="h-5 w-5" />
                Share Your Referral Code
              </CardTitle>
              <CardDescription>
                Share this code with potential customers
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Label htmlFor="referralCode">Your Referral Code:</Label>
                <div className="flex items-center gap-2 flex-1">
                  <Input 
                    id="referralCode"
                    value={campaign.referralCode} 
                    readOnly 
                    className="font-mono text-lg font-bold text-center"
                  />
                  <Button onClick={copyReferralCode} size="sm" variant="outline">
                    {copied ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={shareWhatsApp} className="flex-1" variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Share via WhatsApp
                </Button>
                <Button onClick={shareSMS} className="flex-1" variant="outline">
                  <Smartphone className="h-4 w-4 mr-2" />
                  Share via SMS
                </Button>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <Label className="text-sm font-medium">Sample Message:</Label>
                <Textarea 
                  readOnly
                  value={`🎉 Book your salon appointment easily with Sanwar! Use my referral code: ${campaign.referralCode} and get the best service. Download now and book instantly! 💇‍♀️✨`}
                  className="mt-2"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Referral History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Referral History
              </CardTitle>
              <CardDescription>
                Track your referred customers and earnings
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referralHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No referrals yet. Start sharing your code!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {referralHistory.map((referral) => (
                    <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{referral.referredCustomerName}</h4>
                        <p className="text-sm text-gray-500">{referral.referredCustomerPhone}</p>
                        {referral.completedAt && (
                          <p className="text-xs text-gray-400">
                            Completed: {new Date(referral.completedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant={referral.status === "completed" ? "default" : "secondary"}>
                          {referral.status}
                        </Badge>
                        {referral.status === "completed" && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            +₹{referral.rewardAmount}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}