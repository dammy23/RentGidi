import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/hooks/useToast';
import { useAuth } from '@/contexts/AuthContext';
import { getRentalAgreements, getRentalAgreementById, createRentalAgreement, signRentalAgreement } from '@/api/rentalAgreements';
import { getApplications } from '@/api/applications';
import { FileText, Calendar, DollarSign, Users, CheckCircle, Clock, AlertCircle, PenTool } from 'lucide-react';

interface RentalAgreement {
  _id: string;
  property: {
    _id: string;
    title: string;
    location: string;
    address: string;
    images: string[];
  };
  tenant: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
  };
  landlord: {
    _id: string;
    name: string;
    email: string;
    phone: string;
  };
  application: {
    _id: string;
    status: string;
    createdAt: string;
  };
  agreementTerms: {
    monthlyRent: number;
    securityDeposit: number;
    leaseStartDate: string;
    leaseEndDate: string;
    leaseDuration: number;
    paymentDueDate: number;
    lateFeeAmount: number;
    petPolicy: {
      allowed: boolean;
      deposit: number;
      monthlyFee: number;
    };
    utilities: Array<{
      name: string;
      includedInRent: boolean;
      estimatedCost: number;
    }>;
    specialTerms: string;
  };
  signatures: {
    tenant: {
      signedAt?: string;
      signatureData?: string;
    };
    landlord: {
      signedAt?: string;
      signatureData?: string;
    };
  };
  status: string;
  createdAt: string;
  fullySignedAt?: string;
}

interface Application {
  _id: string;
  property: {
    _id: string;
    title: string;
    location: string;
    price: number;
  };
  status: string;
  createdAt: string;
}

export function RentalAgreements() {
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<RentalAgreement[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedAgreement, setSelectedAgreement] = useState<RentalAgreement | null>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [signDialogOpen, setSignDialogOpen] = useState(false);
  const [signatureData, setSignatureData] = useState('');

  // Form state for creating agreement
  const [formData, setFormData] = useState({
    applicationId: '',
    monthlyRent: 0,
    securityDeposit: 0,
    leaseStartDate: '',
    leaseEndDate: '',
    leaseDuration: 12,
    paymentDueDate: 1,
    lateFeeAmount: 0,
    petPolicy: {
      allowed: false,
      deposit: 0,
      monthlyFee: 0
    },
    utilities: [] as Array<{
      name: string;
      includedInRent: boolean;
      estimatedCost: number;
    }>,
    specialTerms: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('RentalAgreements: Starting to fetch data...');
      
      const [agreementsResponse, applicationsResponse] = await Promise.all([
        getRentalAgreements(),
        getApplications()
      ]);

      console.log('RentalAgreements: Agreements response:', agreementsResponse);
      console.log('RentalAgreements: Applications response:', applicationsResponse);

      // Safely access agreements data
      if (agreementsResponse && agreementsResponse.data && agreementsResponse.data.agreements) {
        setAgreements(agreementsResponse.data.agreements);
        console.log('RentalAgreements: Set agreements:', agreementsResponse.data.agreements.length);
      } else {
        console.warn('RentalAgreements: Invalid agreements response structure:', agreementsResponse);
        setAgreements([]);
      }

      // Safely access applications data and filter approved applications
      if (applicationsResponse && applicationsResponse.data && applicationsResponse.data.applications) {
        const approvedApplications = applicationsResponse.data.applications.filter(
          (app: Application) => app.status === 'approved'
        );
        setApplications(approvedApplications);
        console.log('RentalAgreements: Set approved applications:', approvedApplications.length);
      } else {
        console.warn('RentalAgreements: Invalid applications response structure:', applicationsResponse);
        setApplications([]);
      }
    } catch (error: any) {
      console.error('RentalAgreements: Error in fetchData:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      // Set empty arrays on error to prevent further issues
      setAgreements([]);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgreement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRentalAgreement(formData);
      toast({
        title: "Success",
        description: "Rental agreement created successfully",
      });
      setCreateDialogOpen(false);
      fetchData();
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewDetails = async (agreementId: string) => {
    try {
      const response = await getRentalAgreementById(agreementId);
      setSelectedAgreement(response.data.agreement);
      setDetailsDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSignAgreement = async () => {
    if (!selectedAgreement || !signatureData.trim()) {
      toast({
        title: "Error",
        description: "Please provide a signature",
        variant: "destructive",
      });
      return;
    }

    try {
      await signRentalAgreement(selectedAgreement._id, signatureData);
      toast({
        title: "Success",
        description: "Agreement signed successfully",
      });
      setSignDialogOpen(false);
      setSignatureData('');
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      applicationId: '',
      monthlyRent: 0,
      securityDeposit: 0,
      leaseStartDate: '',
      leaseEndDate: '',
      leaseDuration: 12,
      paymentDueDate: 1,
      lateFeeAmount: 0,
      petPolicy: {
        allowed: false,
        deposit: 0,
        monthlyFee: 0
      },
      utilities: [],
      specialTerms: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      draft: { label: 'Draft', variant: 'secondary' as const, icon: Clock },
      pending_tenant_signature: { label: 'Pending Tenant Signature', variant: 'default' as const, icon: Clock },
      pending_landlord_signature: { label: 'Pending Landlord Signature', variant: 'default' as const, icon: Clock },
      fully_signed: { label: 'Fully Signed', variant: 'default' as const, icon: CheckCircle },
      expired: { label: 'Expired', variant: 'destructive' as const, icon: AlertCircle },
      terminated: { label: 'Terminated', variant: 'destructive' as const, icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const canSign = (agreement: RentalAgreement) => {
    if (user?.role === 'tenant') {
      return !agreement.signatures.tenant.signedAt;
    }
    if (user?.role === 'landlord') {
      return !agreement.signatures.landlord.signedAt;
    }
    return false;
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Rental Agreements</h1>
          <p className="text-muted-foreground">Manage your rental agreements and signatures</p>
        </div>
        {user?.role === 'landlord' && applications.length > 0 && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <FileText className="h-4 w-4 mr-2" />
                Create Agreement
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create Rental Agreement</DialogTitle>
                <DialogDescription>
                  Create a new rental agreement for an approved application
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateAgreement} className="space-y-4">
                <div>
                  <Label htmlFor="applicationId">Select Application</Label>
                  <Select value={formData.applicationId} onValueChange={(value) => setFormData(prev => ({ ...prev, applicationId: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an approved application" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app._id} value={app._id}>
                          {app.property.title} - {app.property.location}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="monthlyRent">Monthly Rent (₦)</Label>
                    <Input
                      id="monthlyRent"
                      type="number"
                      value={formData.monthlyRent}
                      onChange={(e) => setFormData(prev => ({ ...prev, monthlyRent: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="securityDeposit">Security Deposit (₦)</Label>
                    <Input
                      id="securityDeposit"
                      type="number"
                      value={formData.securityDeposit}
                      onChange={(e) => setFormData(prev => ({ ...prev, securityDeposit: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leaseStartDate">Lease Start Date</Label>
                    <Input
                      id="leaseStartDate"
                      type="date"
                      value={formData.leaseStartDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, leaseStartDate: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="leaseEndDate">Lease End Date</Label>
                    <Input
                      id="leaseEndDate"
                      type="date"
                      value={formData.leaseEndDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, leaseEndDate: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="leaseDuration">Lease Duration (months)</Label>
                    <Input
                      id="leaseDuration"
                      type="number"
                      value={formData.leaseDuration}
                      onChange={(e) => setFormData(prev => ({ ...prev, leaseDuration: Number(e.target.value) }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="paymentDueDate">Payment Due Date (day of month)</Label>
                    <Input
                      id="paymentDueDate"
                      type="number"
                      min="1"
                      max="31"
                      value={formData.paymentDueDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, paymentDueDate: Number(e.target.value) }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="lateFeeAmount">Late Fee Amount (₦)</Label>
                  <Input
                    id="lateFeeAmount"
                    type="number"
                    value={formData.lateFeeAmount}
                    onChange={(e) => setFormData(prev => ({ ...prev, lateFeeAmount: Number(e.target.value) }))}
                  />
                </div>

                <div>
                  <Label>Pet Policy</Label>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="petsAllowed"
                        checked={formData.petPolicy.allowed}
                        onCheckedChange={(checked) => setFormData(prev => ({
                          ...prev,
                          petPolicy: { ...prev.petPolicy, allowed: checked as boolean }
                        }))}
                      />
                      <Label htmlFor="petsAllowed">Pets Allowed</Label>
                    </div>
                    {formData.petPolicy.allowed && (
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <Label htmlFor="petDeposit">Pet Deposit (₦)</Label>
                          <Input
                            id="petDeposit"
                            type="number"
                            value={formData.petPolicy.deposit}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              petPolicy: { ...prev.petPolicy, deposit: Number(e.target.value) }
                            }))}
                          />
                        </div>
                        <div>
                          <Label htmlFor="petMonthlyFee">Monthly Pet Fee (₦)</Label>
                          <Input
                            id="petMonthlyFee"
                            type="number"
                            value={formData.petPolicy.monthlyFee}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              petPolicy: { ...prev.petPolicy, monthlyFee: Number(e.target.value) }
                            }))}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="specialTerms">Special Terms & Conditions</Label>
                  <Textarea
                    id="specialTerms"
                    value={formData.specialTerms}
                    onChange={(e) => setFormData(prev => ({ ...prev, specialTerms: e.target.value }))}
                    placeholder="Any additional terms or conditions..."
                    rows={3}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Agreement</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {agreements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Rental Agreements</h3>
            <p className="text-muted-foreground text-center">
              {user?.role === 'landlord'
                ? "Create rental agreements for your approved applications"
                : "Your rental agreements will appear here once created by landlords"
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {agreements.map((agreement) => (
            <Card key={agreement._id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {agreement.property.title}
                    </CardTitle>
                    <CardDescription>
                      {agreement.property.location} • {agreement.property.address}
                    </CardDescription>
                  </div>
                  {getStatusBadge(agreement.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Monthly Rent: ₦{agreement.agreementTerms.monthlyRent.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {new Date(agreement.agreementTerms.leaseStartDate).toLocaleDateString()} - {new Date(agreement.agreementTerms.leaseEndDate).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {user?.role === 'landlord' ? agreement.tenant.name : agreement.landlord.name}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>
                      Tenant Signed: {agreement.signatures.tenant.signedAt ? '✓' : '✗'}
                    </span>
                    <span>
                      Landlord Signed: {agreement.signatures.landlord.signedAt ? '✓' : '✗'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleViewDetails(agreement._id)}>
                      View Details
                    </Button>
                    {canSign(agreement) && (
                      <Button
                        onClick={() => {
                          setSelectedAgreement(agreement);
                          setSignDialogOpen(true);
                        }}
                      >
                        <PenTool className="h-4 w-4 mr-2" />
                        Sign Agreement
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Agreement Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Rental Agreement Details</DialogTitle>
            <DialogDescription>
              Complete rental agreement information and signatures
            </DialogDescription>
          </DialogHeader>
          {selectedAgreement && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Property Information</h3>
                <p><strong>Property:</strong> {selectedAgreement.property.title}</p>
                <p><strong>Location:</strong> {selectedAgreement.property.location}</p>
                <p><strong>Address:</strong> {selectedAgreement.property.address}</p>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">Parties</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Tenant:</strong> {selectedAgreement.tenant.name}</p>
                    <p><strong>Email:</strong> {selectedAgreement.tenant.email}</p>
                    <p><strong>Phone:</strong> {selectedAgreement.tenant.phone}</p>
                  </div>
                  <div>
                    <p><strong>Landlord:</strong> {selectedAgreement.landlord.name}</p>
                    <p><strong>Email:</strong> {selectedAgreement.landlord.email}</p>
                    <p><strong>Phone:</strong> {selectedAgreement.landlord.phone}</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">Agreement Terms</h3>
                <div className="grid grid-cols-2 gap-4">
                  <p><strong>Monthly Rent:</strong> ₦{selectedAgreement.agreementTerms.monthlyRent.toLocaleString()}</p>
                  <p><strong>Security Deposit:</strong> ₦{selectedAgreement.agreementTerms.securityDeposit.toLocaleString()}</p>
                  <p><strong>Lease Start:</strong> {new Date(selectedAgreement.agreementTerms.leaseStartDate).toLocaleDateString()}</p>
                  <p><strong>Lease End:</strong> {new Date(selectedAgreement.agreementTerms.leaseEndDate).toLocaleDateString()}</p>
                  <p><strong>Duration:</strong> {selectedAgreement.agreementTerms.leaseDuration} months</p>
                  <p><strong>Payment Due:</strong> {selectedAgreement.agreementTerms.paymentDueDate} of each month</p>
                </div>
                {selectedAgreement.agreementTerms.specialTerms && (
                  <div className="mt-4">
                    <p><strong>Special Terms:</strong></p>
                    <p className="text-sm text-muted-foreground mt-1">{selectedAgreement.agreementTerms.specialTerms}</p>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold mb-2">Signatures</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p><strong>Tenant Signature:</strong></p>
                    {selectedAgreement.signatures.tenant.signedAt ? (
                      <div>
                        <p className="text-sm text-green-600">✓ Signed on {new Date(selectedAgreement.signatures.tenant.signedAt).toLocaleString()}</p>
                        {selectedAgreement.signatures.tenant.signatureData && (
                          <img
                            src={selectedAgreement.signatures.tenant.signatureData}
                            alt="Tenant Signature"
                            className="mt-2 border rounded p-2 max-w-48 h-16 object-contain"
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not signed</p>
                    )}
                  </div>
                  <div>
                    <p><strong>Landlord Signature:</strong></p>
                    {selectedAgreement.signatures.landlord.signedAt ? (
                      <div>
                        <p className="text-sm text-green-600">✓ Signed on {new Date(selectedAgreement.signatures.landlord.signedAt).toLocaleString()}</p>
                        {selectedAgreement.signatures.landlord.signatureData && (
                          <img
                            src={selectedAgreement.signatures.landlord.signatureData}
                            alt="Landlord Signature"
                            className="mt-2 border rounded p-2 max-w-48 h-16 object-contain"
                          />
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Not signed</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Sign Agreement Dialog */}
      <Dialog open={signDialogOpen} onOpenChange={setSignDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign Rental Agreement</DialogTitle>
            <DialogDescription>
              Please provide your signature to sign this rental agreement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="signature">Signature (Type your full name)</Label>
              <Input
                id="signature"
                value={signatureData}
                onChange={(e) => setSignatureData(e.target.value)}
                placeholder="Type your full name as signature"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                By typing your name, you agree to electronically sign this rental agreement
              </p>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setSignDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSignAgreement} disabled={!signatureData.trim()}>
                Sign Agreement
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}