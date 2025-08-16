import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Calendar, Users, Percent, IndianRupee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const offerFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  discountType: z.enum(["percentage", "fixed_amount"]),
  discountValue: z.string().min(1, "Discount value is required"),
  minOrderAmount: z.string().optional(),
  maxDiscountAmount: z.string().optional(),
  validFrom: z.string().min(1, "Start date is required"),
  validUntil: z.string().min(1, "End date is required"),
  maxUsagePerCustomer: z.string().min(1, "Usage limit per customer is required"),
  maxTotalUsage: z.string().optional(),
  isApplicableToAllServices: z.boolean().default(true),
  applicableServices: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
  priority: z.string().optional(),
  promoCode: z.string().optional(),
  isPromoCodeRequired: z.boolean().default(false),
});

type OfferForm = z.infer<typeof offerFormSchema>;

interface Offer {
  id: string;
  title: string;
  description: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: string;
  minOrderAmount?: string;
  maxDiscountAmount?: string;
  validFrom: string;
  validUntil: string;
  maxUsagePerCustomer: number;
  maxTotalUsage?: number;
  currentUsageCount: number;
  isActive: boolean;
  isVisible: boolean;
  priority: number;
  promoCode?: string;
  isPromoCodeRequired: boolean;
  createdAt: string;
}

export default function OffersPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<OfferForm>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      title: "",
      description: "",
      discountType: "percentage",
      discountValue: "",
      minOrderAmount: "",
      maxDiscountAmount: "",
      validFrom: "",
      validUntil: "",
      maxUsagePerCustomer: "1",
      maxTotalUsage: "",
      isApplicableToAllServices: true,
      applicableServices: [],
      isActive: true,
      isVisible: true,
      isPromoCodeRequired: false,
      promoCode: "",
      priority: "0",
    },
  });

  const { data: offers = [], isLoading } = useQuery<Offer[]>({
    queryKey: ["/api/owner/salon/offers"],
  });

  // Fetch salon services for service selection
  const { data: services = [] } = useQuery({
    queryKey: ["/api/owner/salon/services"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/owner/salon/services");
      if (!response.ok) throw new Error("Failed to fetch services");
      return response.json();
    },
  });

  const createOfferMutation = useMutation({
    mutationFn: (data: OfferForm) => {
      const payload = {
        ...data,
        discountValue: parseFloat(data.discountValue),
        minOrderAmount: data.minOrderAmount ? parseFloat(data.minOrderAmount) : 0,
        maxDiscountAmount: data.maxDiscountAmount ? parseFloat(data.maxDiscountAmount) : null,
        validFrom: new Date(data.validFrom),
        validUntil: new Date(data.validUntil),
        maxUsagePerCustomer: parseInt(data.maxUsagePerCustomer),
        maxTotalUsage: data.maxTotalUsage ? parseInt(data.maxTotalUsage) : null,
        priority: parseInt(data.priority || "0"),
      };
      return apiRequest("POST", "/api/owner/salon/offers", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/salon/offers"] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Offer created successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create offer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateOfferMutation = useMutation({
    mutationFn: (data: OfferForm & { id: string }) => {
      const { id, ...payload } = data;
      const formattedPayload = {
        ...payload,
        discountValue: parseFloat(payload.discountValue),
        minOrderAmount: payload.minOrderAmount ? parseFloat(payload.minOrderAmount) : 0,
        maxDiscountAmount: payload.maxDiscountAmount ? parseFloat(payload.maxDiscountAmount) : null,
        validFrom: new Date(payload.validFrom),
        validUntil: new Date(payload.validUntil),
        maxUsagePerCustomer: parseInt(payload.maxUsagePerCustomer),
        maxTotalUsage: payload.maxTotalUsage ? parseInt(payload.maxTotalUsage) : null,
        priority: parseInt(payload.priority || "0"),
      };
      return apiRequest("PUT", `/api/owner/salon/offers/${id}`, formattedPayload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/salon/offers"] });
      setIsEditDialogOpen(false);
      setEditingOffer(null);
      form.reset();
      toast({
        title: "Success",
        description: "Offer updated successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update offer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteOfferMutation = useMutation({
    mutationFn: (offerId: string) => apiRequest("DELETE", `/api/owner/salon/offers/${offerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/owner/salon/offers"] });
      toast({
        title: "Success",
        description: "Offer deleted successfully!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete offer. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCreateOffer = (data: OfferForm) => {
    createOfferMutation.mutate(data);
  };

  const handleEditOffer = (offer: Offer) => {
    setEditingOffer(offer);
    form.reset({
      title: offer.title,
      description: offer.description,
      discountType: offer.discountType,
      discountValue: offer.discountValue?.toString() || "",
      minOrderAmount: offer.minOrderAmount?.toString() || "",
      maxDiscountAmount: offer.maxDiscountAmount?.toString() || "",
      validFrom: new Date(offer.validFrom).toISOString().split('T')[0],
      validUntil: new Date(offer.validUntil).toISOString().split('T')[0],
      maxUsagePerCustomer: offer.maxUsagePerCustomer.toString(),
      maxTotalUsage: offer.maxTotalUsage?.toString() || "",
      isActive: offer.isActive,
      isVisible: offer.isVisible,
      priority: offer.priority.toString(),
      promoCode: offer.promoCode || "",
      isPromoCodeRequired: offer.isPromoCodeRequired,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateOffer = (data: OfferForm) => {
    if (!editingOffer) return;
    updateOfferMutation.mutate({ ...data, id: editingOffer.id });
  };

  const handleDeleteOffer = (offerId: string) => {
    if (confirm("Are you sure you want to delete this offer?")) {
      deleteOfferMutation.mutate(offerId);
    }
  };

  const formatDiscount = (offer: Offer) => {
    if (offer.discountType === "percentage") {
      return `${offer.discountValue}% off`;
    }
    return `₹${offer.discountValue} off`;
  };

  const isOfferActive = (offer: Offer) => {
    const now = new Date();
    const validFrom = new Date(offer.validFrom);
    const validUntil = new Date(offer.validUntil);
    return offer.isActive && now >= validFrom && now <= validUntil;
  };

  const getOfferStatus = (offer: Offer) => {
    const now = new Date();
    const validFrom = new Date(offer.validFrom);
    const validUntil = new Date(offer.validUntil);

    if (!offer.isActive) return { label: "Disabled", variant: "secondary" as const };
    if (now < validFrom) return { label: "Scheduled", variant: "outline" as const };
    if (now > validUntil) return { label: "Expired", variant: "destructive" as const };
    return { label: "Active", variant: "default" as const };
  };

  return (
    <div className="container mx-auto p-6" data-testid="page-offers">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">Manage Offers</h1>
          <p className="text-muted-foreground" data-testid="text-page-description">
            Create and manage promotional offers for your salon
          </p>
        </div>
        <Button 
          onClick={() => setIsCreateDialogOpen(true)}
          data-testid="button-create-offer"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Offer
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : offers.length === 0 ? (
        <Card className="text-center py-12" data-testid="card-no-offers">
          <CardContent>
            <Percent className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No offers yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first promotional offer to attract more customers
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Offer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {offers.map((offer: Offer) => {
            const status = getOfferStatus(offer);
            return (
              <Card key={offer.id} data-testid={`card-offer-${offer.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg" data-testid={`text-offer-title-${offer.id}`}>
                        {offer.title}
                      </CardTitle>
                      <CardDescription data-testid={`text-offer-description-${offer.id}`}>
                        {formatDiscount(offer)}
                      </CardDescription>
                    </div>
                    <Badge variant={status.variant} data-testid={`badge-offer-status-${offer.id}`}>
                      {status.label}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground" data-testid={`text-offer-desc-${offer.id}`}>
                      {offer.description}
                    </p>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span data-testid={`text-offer-validity-${offer.id}`}>
                        {new Date(offer.validFrom).toLocaleDateString()} - {new Date(offer.validUntil).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4" />
                      <span data-testid={`text-offer-usage-${offer.id}`}>
                        Used {offer.currentUsageCount} times
                        {offer.maxTotalUsage && ` of ${offer.maxTotalUsage}`}
                      </span>
                    </div>

                    {offer.minOrderAmount && parseFloat(offer.minOrderAmount) > 0 && (
                      <div className="flex items-center gap-2 text-sm">
                        <IndianRupee className="w-4 h-4" />
                        <span data-testid={`text-offer-min-amount-${offer.id}`}>
                          Min order: ₹{offer.minOrderAmount}
                        </span>
                      </div>
                    )}

                    {offer.promoCode && (
                      <div className="text-sm">
                        <span className="font-medium">Promo Code: </span>
                        <Badge variant="outline" data-testid={`badge-promo-code-${offer.id}`}>
                          {offer.promoCode}
                        </Badge>
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditOffer(offer)}
                        data-testid={`button-edit-offer-${offer.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteOffer(offer.id)}
                        data-testid={`button-delete-offer-${offer.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/Edit Offer Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setEditingOffer(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-offer-form">
          <DialogHeader>
            <DialogTitle data-testid="text-dialog-title">
              {editingOffer ? "Edit Offer" : "Create New Offer"}
            </DialogTitle>
            <DialogDescription>
              {editingOffer ? "Update your promotional offer details" : "Create a new promotional offer for your customers"}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(editingOffer ? handleUpdateOffer : handleCreateOffer)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Offer Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Weekend Special" {...field} data-testid="input-offer-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="discountType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-discount-type">
                            <SelectValue placeholder="Select discount type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="percentage">Percentage Off</SelectItem>
                          <SelectItem value="fixed_amount">Fixed Amount Off</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Service Selection */}
              <FormField
                control={form.control}
                name="isApplicableToAllServices"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Apply to All Services</FormLabel>
                      <FormDescription>
                        Enable this if the offer applies to all salon services
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-all-services"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {!form.watch("isApplicableToAllServices") && (
                <FormField
                  control={form.control}
                  name="applicableServices"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Services</FormLabel>
                      <FormDescription>
                        Choose which services this offer applies to
                      </FormDescription>
                      <FormControl>
                        <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                          {services.map((service: any) => (
                            <div key={service.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={service.id}
                                checked={field.value?.includes(service.id) || false}
                                onCheckedChange={(checked) => {
                                  const currentServices = field.value || [];
                                  if (checked) {
                                    field.onChange([...currentServices, service.id]);
                                  } else {
                                    field.onChange(currentServices.filter((id: string) => id !== service.id));
                                  }
                                }}
                                data-testid={`checkbox-service-${service.id}`}
                              />
                              <label
                                htmlFor={service.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                              >
                                {service.name} - ₹{service.price}
                              </label>
                            </div>
                          ))}
                          {services.length === 0 && (
                            <p className="text-sm text-muted-foreground">No services found. Please add services first.</p>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe your offer..."
                        {...field} 
                        data-testid="textarea-offer-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="discountValue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Discount Value {form.watch("discountType") === "percentage" ? "(%)" : "(₹)"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={form.watch("discountType") === "percentage" ? "20" : "100"}
                          {...field} 
                          data-testid="input-discount-value"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="minOrderAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min Order Amount (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field} 
                          data-testid="input-min-order-amount"
                        />
                      </FormControl>
                      <FormDescription>Minimum amount to avail offer</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("discountType") === "percentage" && (
                  <FormField
                    control={form.control}
                    name="maxDiscountAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Discount (₹)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="500"
                            {...field} 
                            data-testid="input-max-discount-amount"
                          />
                        </FormControl>
                        <FormDescription>Maximum discount amount</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          data-testid="input-valid-from"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validUntil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid Until</FormLabel>
                      <FormControl>
                        <Input 
                          type="date" 
                          {...field} 
                          data-testid="input-valid-until"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="maxUsagePerCustomer"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Per Customer</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="1"
                          {...field} 
                          data-testid="input-max-usage-per-customer"
                        />
                      </FormControl>
                      <FormDescription>Times each customer can use</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxTotalUsage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Usage Limit</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="100"
                          {...field} 
                          data-testid="input-max-total-usage"
                        />
                      </FormControl>
                      <FormDescription>Total times offer can be used</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="0"
                          {...field} 
                          data-testid="input-priority"
                        />
                      </FormControl>
                      <FormDescription>Higher shows first</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="promoCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promo Code (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="WEEKEND20"
                          {...field} 
                          data-testid="input-promo-code"
                        />
                      </FormControl>
                      <FormDescription>Optional promo code for this offer</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4 pt-6">
                  <FormField
                    control={form.control}
                    name="isPromoCodeRequired"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-promo-code-required"
                          />
                        </FormControl>
                        <FormLabel>Require Promo Code</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isVisible"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-visible"
                          />
                        </FormControl>
                        <FormLabel>Show on Customer Dashboard</FormLabel>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="switch-is-active"
                          />
                        </FormControl>
                        <FormLabel>Active</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCreateDialogOpen(false);
                    setIsEditDialogOpen(false);
                    setEditingOffer(null);
                    form.reset();
                  }}
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createOfferMutation.isPending || updateOfferMutation.isPending}
                  data-testid="button-save-offer"
                >
                  {createOfferMutation.isPending || updateOfferMutation.isPending ? "Saving..." : 
                   editingOffer ? "Update Offer" : "Create Offer"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}