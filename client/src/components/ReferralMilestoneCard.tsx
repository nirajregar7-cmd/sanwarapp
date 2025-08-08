import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Gift, Users, Trophy } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';

interface ReferralMilestone {
  id: string;
  referrerId: string;
  milestoneType: "5_customer_full_fee";
  targetCount: number;
  currentCount: number;
  isCompleted: boolean;
  rewardAmount: string;
  completedAt: string | null;
  rewardClaimed: boolean;
}

export default function ReferralMilestoneCard() {
  const { t } = useTranslation();
  
  const { data: milestone, isLoading } = useQuery<ReferralMilestone>({
    queryKey: ['/api/referral-milestone'],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            {t('referralMilestone.title', 'Refer & Earn Special Reward')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-2 bg-gray-200 rounded mb-4"></div>
            <div className="h-6 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!milestone) {
    return null;
  }

  const progressPercentage = (milestone.currentCount / milestone.targetCount) * 100;
  const remainingCustomers = milestone.targetCount - milestone.currentCount;

  return (
    <Card className="border-2 border-dashed border-orange-200 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
          {milestone.isCompleted ? (
            <Trophy className="h-5 w-5" />
          ) : (
            <Gift className="h-5 w-5" />
          )}
          {t('referralMilestone.title', 'Refer & Earn Special Reward')}
        </CardTitle>
        <CardDescription>
          {milestone.isCompleted 
            ? t('referralMilestone.completedDescription', 'Milestone completed! Reward credited to your wallet.') 
            : t('referralMilestone.description', 'Refer 5 customers and get 100% of their confirmation fees!')
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {milestone.isCompleted ? (
          <div className="text-center space-y-2">
            <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
              <Trophy className="h-3 w-3 mr-1" />
              {t('referralMilestone.completed', 'Milestone Completed!')}
            </Badge>
            <p className="text-sm font-medium text-green-600 dark:text-green-400">
              {t('referralMilestone.rewardCredited', 'Reward of ₹{{amount}} credited to wallet', { 
                amount: parseFloat(milestone.rewardAmount).toFixed(0) 
              })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('referralMilestone.cycleReset', 'Cycle resets for next 5 customers')}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {t('referralMilestone.progress', 'Progress: {{current}}/{{target}} customers', { 
                  current: milestone.currentCount, 
                  target: milestone.targetCount 
                })}
              </span>
              <Badge variant="outline" className="border-orange-200 text-orange-600 dark:border-orange-800 dark:text-orange-400">
                {remainingCustomers} {t('referralMilestone.remaining', 'remaining')}
              </Badge>
            </div>
            
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-orange-100 dark:bg-orange-950"
            />
            
            <div className="bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 border border-orange-100 dark:border-orange-800">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('referralMilestone.currentReward', 'Current reward pool:')}
                </span>
                <span className="font-bold text-orange-600 dark:text-orange-400">
                  ₹{parseFloat(milestone.rewardAmount).toFixed(0)}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t('referralMilestone.rewardExplanation', 'From {{count}} confirmed bookings', { 
                  count: milestone.currentCount 
                })}
              </p>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                {t('referralMilestone.howItWorks', 'Each referred customer who completes a paid booking adds their confirmation fee to your reward pool!')}
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}