import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Gift, Mail, Phone, User, Calendar, Percent } from "lucide-react";
import { Link } from "wouter";
import type { SanwarDiscountCard } from "@shared/schema";
import { format } from "date-fns";

export default function DiscountCustomers() {
  const { data: customers, isLoading } = useQuery<SanwarDiscountCard[]>({
    queryKey: ['/api/owner/discount-customers'],
  });

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const activeCustomers = customers?.filter(c => c.status === 'active') || [];
  const usedCustomers = customers?.filter(c => c.status === 'used') || [];

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6">
      <div className="flex flex-col xs:flex-row items-start xs:items-center gap-3 xs:gap-4 mb-6">
        <Link href="/shopkeeper/dashboard">
          <Button variant="outline" size="sm" className="w-fit">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden xs:inline">Back to Dashboard</span>
            <span className="xs:hidden">Back</span>
          </Button>
        </Link>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Discount Card Customers</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Cards Issued</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{customers?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Active Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{activeCustomers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Used Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{usedCustomers.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Customer List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-purple-600" />
            All Discount Card Customers
          </CardTitle>
          <CardDescription>
            View all customers who have enrolled in your Sanwar discount program
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!customers || customers.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">No discount cards issued yet</p>
              <p className="text-sm text-gray-400">
                Share your Sanwar QR code with customers to start building loyalty!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {customers.map((customer) => (
                <div
                  key={customer.id}
                  className="border rounded-lg p-4 hover:border-purple-200 transition-colors"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-start gap-3">
                        <div className="bg-purple-100 p-2 rounded-full">
                          <User className="h-5 w-5 text-purple-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">
                              {customer.customerName || 'Customer'}
                            </h3>
                            <Badge
                              variant={customer.status === 'active' ? 'default' : 'secondary'}
                              className={customer.status === 'active' ? 'bg-green-600' : ''}
                            >
                              {customer.status === 'active' ? 'Active' : 'Used'}
                            </Badge>
                            <Badge className="bg-purple-600">
                              <Percent className="h-3 w-3 mr-1" />
                              {customer.discountPercentage}% OFF
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              <span className="truncate">{customer.customerEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone className="h-4 w-4" />
                              <span>{customer.customerPhone}</span>
                            </div>
                          </div>

                          {customer.serviceEnjoyed && (
                            <div className="mt-2">
                              <p className="text-sm text-gray-600">
                                <span className="font-medium">Service enjoyed:</span>{' '}
                                {customer.serviceEnjoyed}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(customer.createdAt!), 'MMM dd, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Powered by Sanwar */}
      <div className="text-center mt-6">
        <p className="text-xs text-gray-500">
          Powered by <span className="font-bold text-purple-600">Sanwar</span> - Smart Salon Booking Platform
        </p>
      </div>
    </div>
  );
}
