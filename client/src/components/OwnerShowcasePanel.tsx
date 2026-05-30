import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Camera, CheckCircle, X, User, Clock, IndianRupee } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

export function OwnerShowcasePanel() {
  const queryClient = useQueryClient();
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["/api/owner/salon/showcase"],
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("POST", `/api/owner/salon/showcase/${id}/approve`, {});
    },
    onSuccess: () => {
      toast({ title: "Photo approved!", description: "Customer received ₹30 wallet credit." });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/salon/showcase"] });
    },
    onError: () => {
      toast({ title: "Failed to approve", variant: "destructive" });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest("DELETE", `/api/owner/salon/showcase/${id}`, {});
    },
    onSuccess: () => {
      toast({ title: "Photo removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/owner/salon/showcase"] });
    },
    onError: () => {
      toast({ title: "Failed to remove", variant: "destructive" });
    },
  });

  const pending = (data as any)?.pending || [];
  const approved = (data as any)?.approved || [];
  const salonId = (data as any)?.salonId;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-200 rounded-xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pending Approvals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Pending Submissions
                {pending.length > 0 && (
                  <Badge className="bg-amber-500 text-white">{pending.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>Approve customer photos to show them on your salon page</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {pending.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Camera className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No pending submissions. Customers can upload from the salon page.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {pending.map((entry: any) => (
                <div key={entry.id} className="group relative aspect-square rounded-xl overflow-hidden border border-amber-200 bg-amber-50">
                  <img
                    src={entry.photoUrl}
                    alt={entry.caption || "Customer photo"}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium truncate">{entry.customerName || "Customer"}</p>
                      {entry.serviceName && (
                        <p className="text-white/70 text-[10px] truncate">{entry.serviceName}</p>
                      )}
                    </div>
                  </div>
                  {/* Action buttons */}
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button
                      size="sm"
                      className="h-7 w-7 p-0 bg-green-500 hover:bg-green-600 text-white rounded-full"
                      onClick={() => approveMutation.mutate(entry.id)}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 w-7 p-0 bg-red-500 hover:bg-red-600 text-white rounded-full"
                      onClick={() => rejectMutation.mutate(entry.id)}
                      disabled={rejectMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  {/* Reward badge */}
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                    <IndianRupee className="h-3 w-3" />
                    {entry.rewardAmount || 30}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approved Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Approved Photos
            {approved.length > 0 && (
              <Badge className="bg-green-500 text-white">{approved.length}</Badge>
            )}
          </CardTitle>
          <CardDescription>These photos are visible on your salon page</CardDescription>
        </CardHeader>
        <CardContent>
          {approved.length === 0 ? (
            <div className="text-center py-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
              <Camera className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No approved photos yet. Approve pending submissions to display them here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
              {approved.map((entry: any) => (
                <div
                  key={entry.id}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer border border-gray-100 hover:border-green-300 transition-all"
                  onClick={() => setExpandedPhoto(entry.photoUrl)}
                >
                  <img
                    src={entry.photoUrl}
                    alt={entry.caption || "Customer photo"}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="absolute bottom-2 left-2 right-2">
                      <p className="text-white text-xs font-medium truncate">{entry.customerName || "Customer"}</p>
                      {entry.serviceName && (
                        <p className="text-white/70 text-[10px] truncate">{entry.serviceName}</p>
                      )}
                    </div>
                  </div>
                  {entry.isRewarded && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                      <IndianRupee className="h-3 w-3" />
                      Credited
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Expanded Photo Modal */}
      {expandedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setExpandedPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh]">
            <img
              src={expandedPhoto}
              alt="Customer photo"
              className="max-w-full max-h-[85vh] rounded-xl"
            />
            <button
              className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-2 hover:bg-black/70"
              onClick={() => setExpandedPhoto(null)}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
