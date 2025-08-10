import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Wifi, AirVent, Tv, Car, Utensils } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { SalonFacility, InsertSalonFacility, SalonProduct, InsertSalonProduct } from "@shared/schema";

// Common facility icons mapping
const FACILITY_ICONS = {
  "🌿": "AC",
  "📱": "WiFi", 
  "📺": "TV",
  "🚗": "Parking",
  "☕": "Refreshments",
  "🎵": "Music",
  "💺": "Comfortable Seating",
  "🔌": "Charging Points",
  "🚽": "Clean Washroom",
  "💧": "Water",
  "🧴": "Sanitizer",
  "📖": "Magazines"
};

// Product categories
const PRODUCT_CATEGORIES = [
  "Hair Care",
  "Skin Care", 
  "Hair Tools",
  "Styling Products",
  "Shampoo & Conditioner",
  "Hair Color",
  "Accessories",
  "Other"
];

export default function ProductsFacilitiesPage() {
  const { toast } = useToast();
  const [facilitiesOpen, setFacilitiesOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);
  const [editingFacility, setEditingFacility] = useState<SalonFacility | null>(null);
  const [editingProduct, setEditingProduct] = useState<SalonProduct | null>(null);

  // Get salon info
  const { data: salon } = useQuery({
    queryKey: ["/api/owner/salon"]
  });

  // Fetch facilities
  const { data: facilities = [], isLoading: facilitiesLoading } = useQuery({
    queryKey: ["/api/salons", salon?.id, "facilities"],
    enabled: !!salon?.id
  });

  // Fetch products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["/api/salons", salon?.id, "products"],
    enabled: !!salon?.id
  });

  // Add facility mutation
  const addFacilityMutation = useMutation({
    mutationFn: async (data: InsertSalonFacility) => {
      const res = await apiRequest("POST", `/api/salons/${salon?.id}/facilities`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salons", salon?.id, "facilities"] });
      setFacilitiesOpen(false);
      toast({ title: "Facility added successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to add facility", variant: "destructive" });
    }
  });

  // Update facility mutation
  const updateFacilityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSalonFacility> }) => {
      const res = await apiRequest("PUT", `/api/salons/${salon?.id}/facilities/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salons", salon?.id, "facilities"] });
      setEditingFacility(null);
      toast({ title: "Facility updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update facility", variant: "destructive" });
    }
  });

  // Delete facility mutation
  const deleteFacilityMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/salons/${salon?.id}/facilities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salons", salon?.id, "facilities"] });
      toast({ title: "Facility deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete facility", variant: "destructive" });
    }
  });

  // Add product mutation
  const addProductMutation = useMutation({
    mutationFn: async (data: InsertSalonProduct) => {
      const res = await apiRequest("POST", `/api/salons/${salon?.id}/products`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salons", salon?.id, "products"] });
      setProductsOpen(false);
      toast({ title: "Product added successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to add product", variant: "destructive" });
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertSalonProduct> }) => {
      const res = await apiRequest("PUT", `/api/salons/${salon?.id}/products/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salons", salon?.id, "products"] });
      setEditingProduct(null);
      toast({ title: "Product updated successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to update product", variant: "destructive" });
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/salons/${salon?.id}/products/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salons", salon?.id, "products"] });
      toast({ title: "Product deleted successfully!" });
    },
    onError: () => {
      toast({ title: "Failed to delete product", variant: "destructive" });
    }
  });

  const handleAddFacility = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: InsertSalonFacility = {
      salonId: salon?.id || "",
      name: formData.get("name") as string,
      icon: formData.get("icon") as string,
      description: formData.get("description") as string || null,
      isAvailable: formData.get("isAvailable") === "on"
    };

    addFacilityMutation.mutate(data);
  };

  const handleUpdateFacility = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingFacility) return;
    
    const formData = new FormData(e.currentTarget);
    
    const data: Partial<InsertSalonFacility> = {
      name: formData.get("name") as string,
      icon: formData.get("icon") as string,
      description: formData.get("description") as string || null,
      isAvailable: formData.get("isAvailable") === "on"
    };

    updateFacilityMutation.mutate({ id: editingFacility.id, data });
  };

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data: InsertSalonProduct = {
      salonId: salon?.id || "",
      name: formData.get("name") as string,
      brand: formData.get("brand") as string || null,
      category: formData.get("category") as string || null,
      price: formData.get("price") ? parseFloat(formData.get("price") as string).toString() : null,
      description: formData.get("description") as string || null,
      imageUrl: formData.get("imageUrl") as string || null,
      inStock: formData.get("inStock") === "on",
      stockQuantity: formData.get("stockQuantity") ? parseInt(formData.get("stockQuantity") as string) : 0
    };

    addProductMutation.mutate(data);
  };

  const handleUpdateProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    
    const formData = new FormData(e.currentTarget);
    
    const data: Partial<InsertSalonProduct> = {
      name: formData.get("name") as string,
      brand: formData.get("brand") as string || null,
      category: formData.get("category") as string || null,
      price: formData.get("price") ? parseFloat(formData.get("price") as string).toString() : null,
      description: formData.get("description") as string || null,
      imageUrl: formData.get("imageUrl") as string || null,
      inStock: formData.get("inStock") === "on",
      stockQuantity: formData.get("stockQuantity") ? parseInt(formData.get("stockQuantity") as string) : 0
    };

    updateProductMutation.mutate({ id: editingProduct.id, data });
  };

  if (!salon) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading salon details...</h2>
          <p className="text-muted-foreground">Please wait while we load your salon information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products & Facilities</h1>
          <p className="text-muted-foreground mt-2">
            Manage your salon's facilities and products to attract more customers
          </p>
        </div>
      </div>

      <Tabs defaultValue="facilities" className="space-y-6">
        <TabsList className="grid w-full max-w-[400px] grid-cols-2">
          <TabsTrigger value="facilities">Facilities</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        {/* Facilities Tab */}
        <TabsContent value="facilities">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Salon Facilities</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Add amenities your salon offers (AC, WiFi, TV, Parking, etc.)
                </p>
              </div>
              <Dialog open={facilitiesOpen} onOpenChange={setFacilitiesOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Facility
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Facility</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddFacility} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Facility Name</Label>
                      <Input name="name" placeholder="e.g., Air Conditioning, WiFi" required />
                    </div>
                    <div>
                      <Label htmlFor="icon">Icon/Emoji</Label>
                      <Select name="icon">
                        <SelectTrigger>
                          <SelectValue placeholder="Select icon" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(FACILITY_ICONS).map(([icon, name]) => (
                            <SelectItem key={icon} value={icon}>
                              {icon} {name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea name="description" placeholder="Brief description..." />
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch name="isAvailable" defaultChecked />
                      <Label>Currently Available</Label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setFacilitiesOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addFacilityMutation.isPending}>
                        {addFacilityMutation.isPending ? "Adding..." : "Add Facility"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {facilitiesLoading ? (
                <div className="text-center py-8">Loading facilities...</div>
              ) : facilities.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No facilities added yet.</p>
                  <p className="text-sm">Add facilities to attract more customers!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {facilities.map((facility: SalonFacility) => (
                    <Card key={facility.id} className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-2xl">{facility.icon}</span>
                            <h3 className="font-medium">{facility.name}</h3>
                            <Badge variant={facility.isAvailable ? "default" : "secondary"}>
                              {facility.isAvailable ? "Available" : "Unavailable"}
                            </Badge>
                          </div>
                          {facility.description && (
                            <p className="text-sm text-muted-foreground">{facility.description}</p>
                          )}
                        </div>
                        <div className="flex space-x-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingFacility(facility)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteFacilityMutation.mutate(facility.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Salon Products</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Showcase products available for purchase at your salon
                </p>
              </div>
              <Dialog open={productsOpen} onOpenChange={setProductsOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input name="name" placeholder="e.g., Hair Serum" required />
                      </div>
                      <div>
                        <Label htmlFor="brand">Brand</Label>
                        <Input name="brand" placeholder="e.g., L'Oreal" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="category">Category</Label>
                        <Select name="category">
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {PRODUCT_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category.toLowerCase().replace(" ", "_")}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input name="price" type="number" step="0.01" placeholder="0.00" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea name="description" placeholder="Product description..." />
                    </div>
                    <div>
                      <Label htmlFor="imageUrl">Image URL (Optional)</Label>
                      <Input name="imageUrl" type="url" placeholder="https://..." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stockQuantity">Stock Quantity</Label>
                        <Input name="stockQuantity" type="number" defaultValue="0" />
                      </div>
                      <div className="flex items-center space-x-2 pt-6">
                        <Switch name="inStock" defaultChecked />
                        <Label>In Stock</Label>
                      </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setProductsOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={addProductMutation.isPending}>
                        {addProductMutation.isPending ? "Adding..." : "Add Product"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {productsLoading ? (
                <div className="text-center py-8">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No products added yet.</p>
                  <p className="text-sm">Add products to showcase what you sell!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {products.map((product: SalonProduct) => (
                    <Card key={product.id} className="p-4">
                      <div className="space-y-3">
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-24 object-cover rounded"
                          />
                        )}
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-medium">{product.name}</h3>
                            {product.brand && (
                              <p className="text-sm text-muted-foreground">{product.brand}</p>
                            )}
                            {product.price && (
                              <p className="text-lg font-semibold text-green-600">
                                ₹{product.price}
                              </p>
                            )}
                            <div className="flex space-x-2 mt-2">
                              {product.category && (
                                <Badge variant="secondary">{product.category}</Badge>
                              )}
                              <Badge variant={product.inStock ? "default" : "destructive"}>
                                {product.inStock ? "In Stock" : "Out of Stock"}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex space-x-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingProduct(product)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteProductMutation.mutate(product.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Facility Dialog */}
      <Dialog open={!!editingFacility} onOpenChange={() => setEditingFacility(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Facility</DialogTitle>
          </DialogHeader>
          {editingFacility && (
            <form onSubmit={handleUpdateFacility} className="space-y-4">
              <div>
                <Label htmlFor="name">Facility Name</Label>
                <Input name="name" defaultValue={editingFacility.name} required />
              </div>
              <div>
                <Label htmlFor="icon">Icon/Emoji</Label>
                <Select name="icon" defaultValue={editingFacility.icon || ""}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(FACILITY_ICONS).map(([icon, name]) => (
                      <SelectItem key={icon} value={icon}>
                        {icon} {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" defaultValue={editingFacility.description || ""} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch name="isAvailable" defaultChecked={editingFacility.isAvailable} />
                <Label>Currently Available</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingFacility(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateFacilityMutation.isPending}>
                  {updateFacilityMutation.isPending ? "Updating..." : "Update Facility"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Product Dialog */}
      <Dialog open={!!editingProduct} onOpenChange={() => setEditingProduct(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          {editingProduct && (
            <form onSubmit={handleUpdateProduct} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name</Label>
                  <Input name="name" defaultValue={editingProduct.name} required />
                </div>
                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input name="brand" defaultValue={editingProduct.brand || ""} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select name="category" defaultValue={editingProduct.category || ""}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PRODUCT_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category.toLowerCase().replace(" ", "_")}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="price">Price (₹)</Label>
                  <Input 
                    name="price" 
                    type="number" 
                    step="0.01" 
                    defaultValue={editingProduct.price?.toString() || ""} 
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea name="description" defaultValue={editingProduct.description || ""} />
              </div>
              <div>
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input name="imageUrl" type="url" defaultValue={editingProduct.imageUrl || ""} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="stockQuantity">Stock Quantity</Label>
                  <Input 
                    name="stockQuantity" 
                    type="number" 
                    defaultValue={editingProduct.stockQuantity || 0} 
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Switch name="inStock" defaultChecked={editingProduct.inStock} />
                  <Label>In Stock</Label>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setEditingProduct(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateProductMutation.isPending}>
                  {updateProductMutation.isPending ? "Updating..." : "Update Product"}
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}