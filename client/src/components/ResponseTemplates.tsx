import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  FileText, 
  Copy, 
  CheckCircle, 
  AlertCircle,
  Mail,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface ResponseTemplate {
  id: number;
  category: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  legalBasis: string;
  templateContent: string;
  isActive: boolean;
}

interface GeneratedTemplate {
  id: number;
  title: string;
  category: string;
  content: string;
  legalBasis: string;
  severity: 'low' | 'medium' | 'high';
  createdAt: string;
  relevantFindings: any[];
}

interface ResponseTemplatesProps {
  documentId: number;
  analysisResults?: any;
}

const categoryLabels = {
  illegal_fees: 'Illegal Fees',
  deposit_dispute: 'Deposit Disputes',
  repairs_maintenance: 'Repairs & Maintenance',
  rent_increase: 'Rent Increases',
  harassment_privacy: 'Harassment & Privacy',
  eviction_notice: 'Eviction Notices',
  utilities_charges: 'Utility Charges',
  contract_terms: 'Contract Terms'
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'medium':
      return 'bg-slate-100 text-slate-800 border-slate-200';
    case 'low':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case 'high':
      return <AlertTriangle className="h-4 w-4" />;
    case 'medium':
      return <AlertCircle className="h-4 w-4" />;
    default:
      return <Shield className="h-4 w-4" />;
  }
};

export default function ResponseTemplates({ documentId, analysisResults }: ResponseTemplatesProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<ResponseTemplate | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTemplate, setGeneratedTemplate] = useState<GeneratedTemplate | null>(null);
  const [hasPaymentError, setHasPaymentError] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [formData, setFormData] = useState({
    landlordName: '',
    propertyAddress: '',
    tenantName: ''
  });

  // Fetch all response templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['/api/response-templates'],
    queryFn: async (): Promise<ResponseTemplate[]> => {
      const response = await fetch('/api/response-templates');
      if (!response.ok) throw new Error('Failed to fetch templates');
      return response.json();
    },
  });

  // Fetch generated templates for this document
  const { data: generatedTemplates = [], refetch: refetchGenerated } = useQuery({
    queryKey: ['/api/documents', documentId, 'templates'],
    queryFn: async (): Promise<GeneratedTemplate[]> => {
      const response = await fetch(`/api/documents/${documentId}/templates`);
      if (!response.ok) throw new Error('Failed to fetch generated templates');
      return response.json();
    },
  });

  // Filter templates by category
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  // Get unique categories
  const categories = Array.from(new Set(templates.map(t => t.category)));

  const handleGenerateTemplate = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);
    try {
      const response = await fetch(`/api/documents/${documentId}/generate-template`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplate.id,
          landlordName: formData.landlordName,
          propertyAddress: formData.propertyAddress,
          tenantName: formData.tenantName
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 403 && errorData.requiresPayment) {
          setHasPaymentError(true);
          toast({
            title: "Payment Required",
            description: "Response templates are only available after purchasing a complete analysis.",
            variant: "destructive",
          });
          return;
        }
        
        if (response.status === 429 && errorData.rateLimited) {
          setRateLimited(true);
          toast({
            title: "Rate Limit Reached",
            description: "You've reached the template generation limit for this document.",
            variant: "destructive",
          });
          return;
        }
        
        throw new Error(errorData.message || 'Failed to generate template');
      }

      const result = await response.json();
      if (result.success) {
        setGeneratedTemplate(result.template);
        refetchGenerated();
        toast({
          title: "Template Generated",
          description: "Your personalized response template has been created successfully.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate template. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, title: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to Clipboard",
      description: `${title} has been copied to your clipboard.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Shield className="h-6 w-6 text-green-600" />
          <Badge className="bg-green-100 text-green-800 border-green-200">
            FREE with Analysis
          </Badge>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Landlord Response Templates</h2>
        <p className="text-gray-600">
          Pre-written, legally sound email templates to help you communicate effectively with your landlord.
        </p>
        <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-3 max-w-2xl mx-auto">
          <strong>Included FREE</strong> with your analysis purchase! Generate personalized templates based on your specific tenancy issues.
        </p>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Templates</TabsTrigger>
          <TabsTrigger value="generated">Generated Templates ({generatedTemplates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className="mb-2"
            >
              All Categories
            </Button>
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="mb-2"
              >
                {categoryLabels[category as keyof typeof categoryLabels] || category}
              </Button>
            ))}
          </div>

          {/* Templates Grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3, 4, 5, 6].map(i => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-gray-200 rounded"></div>
                      <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTemplates.map((template: ResponseTemplate) => (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg leading-tight">{template.title}</CardTitle>
                      <Badge 
                        variant="outline" 
                        className={`ml-2 flex items-center gap-1 ${getSeverityColor(template.severity)}`}
                      >
                        {getSeverityIcon(template.severity)}
                        {template.severity.charAt(0).toUpperCase() + template.severity.slice(1)}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-3">
                      <div className="text-xs text-gray-600">
                        <strong>Legal Basis:</strong> {template.legalBasis}
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            className="w-full" 
                            onClick={() => setSelectedTemplate(template)}
                          >
                            <Mail className="h-4 w-4 mr-2" />
                            Generate Response
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Generate: {template.title}
                            </DialogTitle>
                            <DialogDescription>
                              Personalize this template with your specific details. The template will be customized based on your document analysis.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 py-4">
                            {/* Form Section */}
                            <div className="space-y-4">
                              <h3 className="font-semibold">Personalization Details</h3>
                              
                              <div className="space-y-2">
                                <Label htmlFor="landlordName">Landlord/Agent Name</Label>
                                <Input
                                  id="landlordName"
                                  placeholder="e.g., John Smith or ABC Property Management"
                                  value={formData.landlordName}
                                  onChange={(e) => setFormData(prev => ({ ...prev, landlordName: e.target.value }))}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="propertyAddress">Property Address</Label>
                                <Input
                                  id="propertyAddress"
                                  placeholder="e.g., 123 Main Street, London SW1A 1AA"
                                  value={formData.propertyAddress}
                                  onChange={(e) => setFormData(prev => ({ ...prev, propertyAddress: e.target.value }))}
                                />
                              </div>

                              <div className="space-y-2">
                                <Label htmlFor="tenantName">Your Name</Label>
                                <Input
                                  id="tenantName"
                                  placeholder="Your full name"
                                  value={formData.tenantName}
                                  onChange={(e) => setFormData(prev => ({ ...prev, tenantName: e.target.value }))}
                                />
                              </div>

                              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <h4 className="font-medium text-blue-900 mb-2">Legal Basis</h4>
                                <p className="text-sm text-blue-800">{template.legalBasis}</p>
                              </div>
                            </div>

                            {/* Preview Section */}
                            <div className="space-y-4">
                              <h3 className="font-semibold">Template Preview</h3>
                              <ScrollArea className="h-64 border rounded-lg p-3">
                                <pre className="whitespace-pre-wrap text-sm font-mono">
                                  {template.templateContent}
                                </pre>
                              </ScrollArea>
                            </div>
                          </div>

                          <DialogFooter>
                            <Button
                              onClick={handleGenerateTemplate}
                              disabled={isGenerating}
                              className="min-w-32"
                            >
                              {isGenerating ? (
                                <>Generating...</>
                              ) : (
                                <>
                                  <FileText className="h-4 w-4 mr-2" />
                                  Generate Template
                                </>
                              )}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="generated" className="space-y-4">
          {generatedTemplates.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Generated Templates</h3>
                <p className="text-gray-600 text-center max-w-md">
                  You haven't generated any personalized templates yet. Browse the templates above and generate responses based on your analysis results.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {generatedTemplates.map((template: GeneratedTemplate) => (
                <Card key={template.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {getSeverityIcon(template.severity)}
                          {template.title}
                        </CardTitle>
                        <CardDescription>
                          Generated on {new Date(template.createdAt).toLocaleDateString('en-GB')}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className={getSeverityColor(template.severity)}>
                        {categoryLabels[template.category as keyof typeof categoryLabels] || template.category}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {template.relevantFindings.length > 0 && (
                        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                          <h4 className="font-medium text-slate-900 mb-2">Based on Analysis Findings:</h4>
                          <ul className="text-sm text-slate-800 space-y-1">
                            {template.relevantFindings.slice(0, 3).map((finding: any, idx: number) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                                {finding.title || finding.text || finding.content}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      <ScrollArea className="h-48 border rounded-lg p-4">
                        <pre className="whitespace-pre-wrap text-sm">
                          {template.content}
                        </pre>
                      </ScrollArea>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => copyToClipboard(template.content, template.title)}
                          className="flex-1"
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          Copy Template
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Generated Template Display */}
      {generatedTemplate && (
        <Dialog open={!!generatedTemplate} onOpenChange={() => setGeneratedTemplate(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Template Generated Successfully
              </DialogTitle>
              <DialogDescription>
                Your personalized response template is ready to use.
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-96 border rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm">
                {generatedTemplate.content}
              </pre>
            </ScrollArea>

            <DialogFooter>
              <Button
                onClick={() => copyToClipboard(generatedTemplate.content, generatedTemplate.title)}
                className="min-w-32"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}