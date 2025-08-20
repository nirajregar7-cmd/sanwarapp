import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Copy, Share2, Users, Gift, Target, Clock, BarChart3, User, Calendar, CheckCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface ReferralCampaign {
  id: string;
  referrerId: string;
  campaignType: string;
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  freeBookingCredits: number;
  creditsUsed: number;
  createdAt: string;
  completedAt?: string;
  updatedAt: string;
}

interface FreeBookingCredit {
  id: string;
  customerId: string;
  creditType: "shopkeeper_referral" | "customer_milestone";
  maxAmount: string;
  isUsed: boolean;
  referenceId: string;
  description: string;
  expiresAt?: string;
  createdAt: string;
  usedAt?: string;
}

export function ReferAndEarn() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  // Fetch referral campaign progress
  const { data: campaign, isLoading: campaignLoading } = useQuery<ReferralCampaign>({
    queryKey: ["/api/referrals/campaign"],
  });

  // Fetch free booking credits
  const { data: credits = [], isLoading: creditsLoading } = useQuery<FreeBookingCredit[]>({
    queryKey: ["/api/free-credits"],
  });

  // Fetch referral usage statistics
  const { data: referralStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/referral-stats"],
    retry: false,
  });

  // Create referral code mutation
  const createReferralMutation = useMutation({
    mutationFn: async ({ referralType, targetUserType }: { referralType: string; targetUserType?: string }) => {
      const response = await apiRequest("POST", "/api/referrals/create", {
        referralType,
        targetUserType,
      });
      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedCode(data.referralCode);
      setShareUrl(data.shareUrl);
      toast({
        title: "Referral Code Created!",
        description: data.message,
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const shareReferral = async (shareUrl: string) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Sanwar - Smart Salon Booking",
          text: "Book salons easily with Sanwar! Use my referral code to get started.",
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error sharing:", err);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const progressPercentage = campaign ? Math.min((campaign.currentCount / campaign.targetCount) * 100, 100) : 0;
  const availableCredits = credits.filter(credit => !credit.isUsed);
  const usedCredits = credits.filter(credit => credit.isUsed);

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Refer & Earn</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share Sanwar with friends and salon owners to earn free booking credits!
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="create">Create Code</TabsTrigger>
          <TabsTrigger value="credits">My Credits</TabsTrigger>
          <TabsTrigger value="stats">Usage Stats</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Progress Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                10-Customer Milestone
              </CardTitle>
              <CardDescription>
                Refer 10 customers to earn 1 free booking credit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {campaignLoading ? (
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                </div>
              ) : campaign ? (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Progress</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {campaign.currentCount} / {campaign.targetCount} customers
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                  {campaign.isCompleted && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      <Gift className="h-3 w-3 mr-1" />
                      Milestone Completed!
                    </Badge>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No active campaign</p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Gift className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Available Credits</p>
                    <p className="text-2xl font-bold text-green-600">{availableCredits.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Referrals Made</p>
                    <p className="text-2xl font-bold text-blue-600">{campaign?.currentCount || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-medium">Credits Used</p>
                    <p className="text-2xl font-bold text-purple-600">{usedCredits.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Customer Referral */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  Refer Customers
                </CardTitle>
                <CardDescription>
                  Earn 1 free booking when 10 referred customers complete their first booking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => createReferralMutation.mutate({ referralType: "customer_to_customer" })}
                  disabled={createReferralMutation.isPending}
                  className="w-full"
                >
                  Create Customer Referral Code
                </Button>
              </CardContent>
            </Card>

            {/* Shopkeeper Referral */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-green-600" />
                  Refer Salon Owners
                </CardTitle>
                <CardDescription>
                  Earn 1 free booking immediately when a salon owner signs up
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => createReferralMutation.mutate({ 
                    referralType: "customer_to_shopkeeper", 
                    targetUserType: "salon_owner" 
                  })}
                  disabled={createReferralMutation.isPending}
                  className="w-full"
                  variant="outline"
                >
                  Create Shopkeeper Referral Code
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Generated Code Display */}
          {generatedCode && shareUrl && (
            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
              <CardHeader>
                <CardTitle>Your Referral Code</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input
                    value={generatedCode}
                    readOnly
                    className="font-mono text-lg font-bold text-center"
                  />
                  <Button
                    onClick={() => copyToClipboard(generatedCode)}
                    size="icon"
                    variant="outline"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => shareReferral(shareUrl)}
                    className="flex-1"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share Link
                  </Button>
                  <Button
                    onClick={() => copyToClipboard(shareUrl)}
                    variant="outline"
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="credits" className="space-y-6">
          <div className="grid gap-4">
            {creditsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                ))}
              </div>
            ) : credits.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <Gift className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600 dark:text-gray-400">No booking credits yet</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                    Create referral codes to start earning credits
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Available Credits */}
                {availableCredits.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Gift className="h-5 w-5 text-green-600" />
                      Available Credits ({availableCredits.length})
                    </h3>
                    <div className="space-y-3">
                      {availableCredits.map((credit) => (
                        <Card key={credit.id} className="border-green-200 dark:border-green-800">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="font-medium text-green-700 dark:text-green-300">
                                  ₹{credit.maxAmount} Free Booking
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {credit.description}
                                </p>
                                {credit.expiresAt && (
                                  <p className="text-xs text-orange-600 dark:text-orange-400">
                                    Expires: {new Date(credit.expiresAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {credit.creditType === "shopkeeper_referral" ? "Shopkeeper" : "Milestone"}
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Used Credits */}
                {usedCredits.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-gray-600" />
                      Used Credits ({usedCredits.length})
                    </h3>
                    <div className="space-y-3">
                      {usedCredits.map((credit) => (
                        <Card key={credit.id} className="border-gray-200 dark:border-gray-700 opacity-60">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="font-medium text-gray-700 dark:text-gray-300">
                                  ₹{credit.maxAmount} Free Booking
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {credit.description}
                                </p>
                                {credit.usedAt && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500">
                                    Used: {new Date(credit.usedAt).toLocaleDateString()}
                                  </p>
                                )}
                              </div>
                              <Badge variant="outline">Used</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </TabsContent>

        {/* Usage Statistics Tab */}
        <TabsContent value="stats" className="space-y-6">
          {statsLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : referralStats ? (
            <div className="space-y-6">
              {/* Summary Statistics */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <BarChart3 className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-2xl font-bold">{referralStats.summary.totalReferrals}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Referrals</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-2xl font-bold text-green-600">{referralStats.summary.completedReferrals}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-orange-600" />
                      <div>
                        <p className="text-2xl font-bold text-orange-600">{referralStats.summary.pendingReferrals}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Code Usage Breakdown */}
              {referralStats.codeUsage && referralStats.codeUsage.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Referral Code Usage
                    </CardTitle>
                    <CardDescription>
                      How many times each of your referral codes has been used
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {referralStats.codeUsage.map((codeData: any) => (
                        <div key={codeData.code} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-lg font-semibold bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded">
                                {codeData.code}
                              </span>
                              <Badge variant="outline">{codeData.totalUses} uses</Badge>
                            </div>
                            <div className="flex gap-2">
                              <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                {codeData.completedUses} completed
                              </Badge>
                              {codeData.pendingUses > 0 && (
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                                  {codeData.pendingUses} pending
                                </Badge>
                              )}
                            </div>
                          </div>
                          
                          {/* Users who used this code */}
                          {codeData.users && codeData.users.length > 0 && (
                            <div className="space-y-2">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                People who used this code:
                              </p>
                              <div className="space-y-2">
                                {codeData.users.map((userData: any, index: number) => (
                                  <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 p-2 rounded">
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-gray-500" />
                                      <span className="text-sm font-medium">{userData.name}</span>
                                      <span className="text-xs text-gray-500">{userData.email}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={userData.status === 'completed' ? 'default' : 'secondary'}>
                                        {userData.status}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        {new Date(userData.signedUpAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recent Referral Activity */}
              {referralStats.recentReferrals && referralStats.recentReferrals.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Recent Referral Activity
                    </CardTitle>
                    <CardDescription>
                      Your latest 10 referrals and their status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {referralStats.recentReferrals.map((referral: any) => (
                        <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                                {referral.referralCode}
                              </span>
                              {referral.referredUserName && (
                                <span className="text-sm text-gray-600 dark:text-gray-400">
                                  → {referral.referredUserName}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {new Date(referral.createdAt).toLocaleDateString()}
                              {referral.completedAt && (
                                <span className="ml-2">
                                  • Completed: {new Date(referral.completedAt).toLocaleDateString()}
                                </span>
                              )}
                            </p>
                          </div>
                          <Badge variant={referral.status === 'completed' ? 'default' : 'secondary'}>
                            {referral.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6 text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">No referral data available yet.</p>
                <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                  Create referral codes and share them to see usage statistics here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}