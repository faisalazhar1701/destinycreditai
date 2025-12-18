'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Dashboard() {
  const [hasAccepted, setHasAccepted] = useState(false);
  const [formData, setFormData] = useState({
    userName: '',
    userAddress: '',
    creditorName: '',
    accountNumber: '',
    disputeReason: '',
    bureau: 'Experian',
    letterType: 'dispute'
  });
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [generatedLetter, setGeneratedLetter] = useState<string>('');
  const [editedLetter, setEditedLetter] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [followupLetters, setFollowupLetters] = useState<string[]>([]);
  const [workflows, setWorkflows] = useState<any[]>([]);
  const [workflowsLoaded, setWorkflowsLoaded] = useState(false);
  const [creditLetters, setCreditLetters] = useState<any[]>([]);
  const [uploadedDocuments, setUploadedDocuments] = useState<any[]>([]);
  const [selectedDocuments, setSelectedDocuments] = useState<string[]>([]);
  const [user, setUser] = useState<any>(null);
  const [selectedFollowUpDay, setSelectedFollowUpDay] = useState<number>(30);
  const [isUploading, setIsUploading] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const router = useRouter();

  const isFormValid = formData.userName && formData.creditorName && formData.accountNumber && formData.bureau && formData.disputeReason;

  useEffect(() => {
    // Fetch authenticated user
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            setFormData(prev => ({
              ...prev,
              userName: data.user.name || prev.userName,
            }));
          } else {
            // Middleware should handle this, but checking just in case
            router.push('/login');
          }
        }
      } catch (err) {
        console.error('Failed to fetch user', err);
      }
    };
    fetchUser();
  }, [router]);

  const fetchWorkflows = async () => {
    try {
      const response = await fetch('/api/workflows');

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setWorkflows(result.data.filter((w: any) => w.enabled === true));
          setWorkflowsLoaded(true);
          setError('');
        } else {
          setError('Failed to load workflows: ' + (result.error || 'Unknown error'));
          setWorkflowsLoaded(true);
        }
      } else {
        const errorData = await response.json();
        setError('Failed to load workflows: ' + (errorData.error || 'Unknown error'));
        setWorkflowsLoaded(true);
      }
    } catch (error) {
      console.error('Network error fetching workflows:', error);
      setError('Network error loading workflows. Please check your connection.');
      setWorkflowsLoaded(true);
    }
  };

  const fetchCreditLetters = async () => {
    try {
      const response = await fetch('/api/credit-letters');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setCreditLetters(result.data);
        }
      } else {
        console.error('Failed to fetch credit letters');
      }
    } catch (error) {
      console.error('Failed to fetch credit letters:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) {
      alert('⚠️ Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/generate-letter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: formData.userName,
          userAddress: formData.userAddress,
          creditorName: formData.creditorName,
          accountNumber: formData.accountNumber,
          disputeReason: formData.disputeReason,
          bureau: formData.bureau,
          letterType: formData.letterType,
          documentIds: selectedDocuments.length > 0 ? selectedDocuments : undefined
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setGeneratedLetter(result.data.letter);
          setEditedLetter(result.data.letter);
          setSelectedLetter('generated');
          setError('');
          await fetchCreditLetters();
          alert('✅ Letter generated successfully!');
        } else {
          const errorMsg = result.error || 'Failed to generate letter';
          setError(errorMsg);
          alert('❌ Generation failed: ' + errorMsg);
        }
      } else {
        let errorMsg = 'Failed to generate letter';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (jsonErr) {
          console.error('Failed to parse error response as JSON:', jsonErr);
          errorMsg = `Server error (${response.status}). Please contact support if this persists.`;
        }
        setError(errorMsg);
        alert('❌ Generation failed: ' + errorMsg);
      }
    } catch (error) {
      console.error('Network or Generation error:', error);
      const errorMsg = 'Network error. This could be due to a timeout or connection issue. Please try again or check your internet.';
      setError(errorMsg);
      alert('❌ ' + errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const generateFollowUp = async () => {
    if (creditLetters.length === 0) {
      alert('⚠️ Please generate an initial letter first.');
      return;
    }

    setIsGenerating(true);
    try {
      const latestLetter = creditLetters[0];
      const response = await fetch('/api/generate-followup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userName: user?.name || latestLetter.user?.name || 'Valued User',
          creditorName: latestLetter.creditorName,
          originalLetterId: latestLetter.id,
          day: selectedFollowUpDay,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setFollowupLetters(prev => [...prev, data.data.letter]);
          alert('✅ Follow-up letter generated successfully!');
        } else {
          alert('❌ Failed to generate follow-up: ' + (data.error || 'Unknown error'));
        }
      } else {
        let errorMsg = 'Failed to generate follow-up';
        try {
          const errorData = await response.json();
          errorMsg = errorData.error || errorMsg;
        } catch (jsonErr) {
          console.error('Failed to parse follow-up error response as JSON:', jsonErr);
          errorMsg = `Server error (${response.status}) while generating follow-up.`;
        }
        alert('❌ ' + errorMsg);
      }
    } catch (error) {
      console.error('Network error during follow-up generation:', error);
      alert('❌ Network error generating follow-up letter. Please check your connection or try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    const formDataObj = new FormData();
    formDataObj.append('file', file);
    formDataObj.append('fileType', file.type);

    setIsUploading(true);
    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataObj,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          alert('✅ Document uploaded successfully!');
          fetchUploadedDocuments();
        } else {
          alert('❌ Upload failed: ' + (result.error || 'Unknown error'));
        }
      } else {
        alert('❌ Upload failed');
      }
    } catch (err) {
      alert('❌ Network error during upload');
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const getLetterTemplate = (type: string) => {
    if (type === 'generated') {
      return {
        title: 'AI Generated Dispute Letter',
        content: generatedLetter
      };
    }

    const templates = {
      day15: {
        title: 'Day 15 Follow-Up Letter Template',
        content: `[Date]

[Credit Bureau Name]
[Address]

Re: Educational Example - Follow-Up Inquiry
Account: [Account Number]

Dear Sir/Madam,

Educational example: This letter may serve as a follow-up to a dispute request if submitted on [Date]. The FCRA provides information about investigation timeframes that may apply to disputed items.

If inaccurate information was disputed, I am requesting an update on the investigation status regarding the above-referenced account.

Educational example: Responses may be provided within timeframes established by federal regulations.

Sincerely,
[Your Name]

EDUCATIONAL DISCLAIMER: This template is for educational purposes only. No legal advice is provided. No guaranteed outcomes are implied. User must verify all information before use. Please consult with qualified professionals for legal matters.`
      },
      day30: {
        title: 'Day 30 Follow-Up Letter Template',
        content: `[Date]

[Credit Bureau Name]
[Address]

Re: Educational Example - Second Follow-Up Inquiry
Account: [Account Number]

Dear Sir/Madam,

Educational example: If a dispute was previously submitted on [Date] and a follow-up sent on [Date], the FCRA provides general information about investigation timeframes.

If no response has been received regarding dispute status, this may be an appropriate time to request an update on the investigation of the above-referenced account.

Educational example: Written confirmation of investigation results may be requested if applicable.

Sincerely,
[Your Name]

EDUCATIONAL DISCLAIMER: This template is for educational purposes only. No legal advice is provided. No guaranteed outcomes are implied. User must verify all information before use. Please consult with qualified professionals for legal matters.`
      },
      day45: {
        title: 'Day 45 Follow-Up Letter Template',
        content: `[Date]

[Credit Bureau Name]
[Address]

Re: Educational Example - Final Follow-Up Inquiry
Account: [Account Number]

Dear Sir/Madam,

Educational example: If a dispute was submitted on [Date] and previous follow-up correspondence sent on [Date] and [Date], the FCRA provides information about investigation timeframes.

If applicable, written confirmation may be requested regarding:
1. Current status of dispute investigation (if inaccurate information was reported)
2. Results of investigation (if completed)
3. Actions taken regarding disputed item (if any)

Educational example: This information may be provided in writing if requested.

Sincerely,
[Your Name]

EDUCATIONAL DISCLAIMER: This template is for educational purposes only. No legal advice is provided. No guaranteed outcomes are implied. User must verify all information before use. Please consult with qualified professionals for legal matters.`
      }
    };
    return templates[type as keyof typeof templates];
  };

  const getWorkflowContent = (type: string, workflowList: any[] = []) => {
    // First check if it's a database workflow
    const normalizedType = type.toLowerCase().replace(/[\s-_]+/g, '');
    const dbWorkflow = workflowList?.find(w => {
      const normalizedName = w.name.toLowerCase().replace(/[\s-_]+/g, '');
      return normalizedName === normalizedType;
    });

    if (dbWorkflow && dbWorkflow.steps?.steps) {
      return {
        title: dbWorkflow.name,
        description: 'Database-driven educational workflow',
        steps: dbWorkflow.steps.steps.map((step: string, index: number) => ({
          title: `Step ${index + 1}`,
          content: step
        }))
      };
    }

    // New workflow definitions
    const newWorkflows = {
      creditdispute: {
        title: 'Credit Dispute Process',
        description: 'Step-by-step guidance for disputing inaccurate credit report items',
        steps: [
          {
            title: 'Step 1: Obtain Credit Reports',
            content: 'Educational example: Get your free annual credit reports from all three bureaus to identify potentially inaccurate items.'
          },
          {
            title: 'Step 2: Identify Inaccuracies',
            content: 'Educational example: Review reports for items that may be inaccurate, incomplete, or unverifiable.'
          },
          {
            title: 'Step 3: Generate Dispute Letter',
            content: 'Educational example: Use our AI tool to create a professional dispute letter if information appears incorrect.'
          },
          {
            title: 'Step 4: Submit and Track',
            content: 'Educational example: Send via certified mail and track the 30-day investigation timeline.'
          }
        ]
      },
      followupletter: {
        title: 'Follow-up Letter Process',
        description: 'Generate follow-up letters for pending disputes',
        steps: [
          {
            title: 'Step 1: Review Timeline',
            content: 'Educational example: Check if 30+ days have passed since your initial dispute submission.'
          },
          {
            title: 'Step 2: Generate Follow-up',
            content: 'Educational example: Use our AI tool to create appropriate follow-up correspondence.'
          },
          {
            title: 'Step 3: Document Progress',
            content: 'Educational example: Maintain records of all correspondence and responses received.'
          }
        ]
      },
      metro2education: {
        title: 'Metro 2 Education Module',
        description: 'Learn about Metro 2 credit reporting standards',
        steps: [
          {
            title: 'Understanding Metro 2',
            content: 'Educational example: Metro 2 is the standard format for reporting consumer credit information to credit bureaus.'
          },
          {
            title: 'Data Fields',
            content: 'Educational example: Learn about account status, payment history, and balance reporting requirements.'
          },
          {
            title: 'Compliance Issues',
            content: 'Educational example: Understand how reporting inconsistencies may indicate potential inaccuracies.'
          }
        ]
      },
      aichatguidance: {
        title: 'AI Chat Guidance',
        description: 'Get AI-powered guidance for credit questions',
        steps: [
          {
            title: 'Ask Questions',
            content: 'Educational example: Use our AI chat to get educational information about credit topics.'
          },
          {
            title: 'Review Responses',
            content: 'Educational example: All AI responses are for educational purposes only and not legal advice.'
          },
          {
            title: 'Take Action',
            content: 'Educational example: Use the information to make informed decisions about your credit journey.'
          }
        ]
      },
      crediteducation: {
        title: 'Credit Education Resources',
        description: 'Comprehensive credit education resources',
        steps: [
          {
            title: 'Credit Basics',
            content: 'Educational example: Learn fundamental concepts about credit scores, reports, and factors that influence them.'
          },
          {
            title: 'Dispute Process',
            content: 'Educational example: Understand your rights under the FCRA and how the dispute process works.'
          },
          {
            title: 'Best Practices',
            content: 'Educational example: Learn strategies for maintaining good credit and monitoring your reports.'
          }
        ]
      }
    };

    if (newWorkflows[type as keyof typeof newWorkflows]) {
      return newWorkflows[type as keyof typeof newWorkflows];
    }

    // Fallback to original workflows
    const workflows = {
      collection: {
        title: 'How to Dispute a Collection',
        description: 'Educational workflow for understanding collection dispute processes',
        steps: [
          {
            title: 'Step 1: Pull Credit Reports',
            content: 'Educational example: Obtain copies of your credit reports from all three bureaus to review collection accounts. This helps you understand what information is being reported.'
          },
          {
            title: 'Step 2: Generate Dispute Letter',
            content: 'Educational example: If you find inaccurate information, you may prepare a dispute letter requesting verification of the collection account details.'
          },
          {
            title: 'Step 3: Send Certified Mail',
            content: 'Educational example: Send your dispute letter via certified mail to maintain records of correspondence. This provides documentation of your communication.'
          },
          {
            title: 'Step 4: Track Response',
            content: 'Educational example: Credit bureaus typically have 30 days to investigate disputes under the FCRA. Monitor for responses and updated credit reports.'
          }
        ]
      },
      chargeoff: {
        title: 'How to Handle a Charge-Off',
        description: 'Educational information about charge-off accounts and verification processes',
        steps: [
          {
            title: 'Step 1: Pull Credit Reports',
            content: 'Educational example: Review your credit reports to understand how charge-off accounts are being reported across all three bureaus.'
          },
          {
            title: 'Step 2: Generate Dispute Letter',
            content: 'Educational example: If charge-off information appears inaccurate or incomplete, you may request verification of the account details and reporting.'
          },
          {
            title: 'Step 3: Send Certified Mail',
            content: 'Educational example: Submit your verification request via certified mail to document your correspondence with credit bureaus.'
          },
          {
            title: 'Step 4: Track Response',
            content: 'Educational example: Monitor for bureau responses within the FCRA timeframe and review any updates to your credit reports.'
          }
        ]
      },
      latepayments: {
        title: 'How to Manage Late Payments',
        description: 'Educational steps for understanding late payment reporting and verification',
        steps: [
          {
            title: 'Step 1: Pull Credit Reports',
            content: 'Educational example: Examine your credit reports to identify late payment entries and verify their accuracy against your records.'
          },
          {
            title: 'Step 2: Generate Dispute Letter',
            content: 'Educational example: If late payment information appears inaccurate, you may request verification of the payment history and dates reported.'
          },
          {
            title: 'Step 3: Send Certified Mail',
            content: 'Educational example: Send verification requests via certified mail to maintain documentation of your dispute communications.'
          },
          {
            title: 'Step 4: Track Response',
            content: 'Educational example: Follow up on bureau investigations and review updated credit reports for any changes to late payment reporting.'
          }
        ]
      },
      repossession: {
        title: 'How to Review Repossessions',
        description: 'Educational guidance on repossession reporting and verification processes',
        steps: [
          {
            title: 'Step 1: Pull Credit Reports',
            content: 'Educational example: Review how repossession accounts are reported on your credit reports and verify the accuracy of dates and amounts.'
          },
          {
            title: 'Step 2: Generate Dispute Letter',
            content: 'Educational example: If repossession information appears inaccurate or incomplete, you may request verification of the account details.'
          },
          {
            title: 'Step 3: Send Certified Mail',
            content: 'Educational example: Submit verification requests via certified mail to document your correspondence regarding repossession reporting.'
          },
          {
            title: 'Step 4: Track Response',
            content: 'Educational example: Monitor bureau responses and review updated credit reports for any corrections to repossession information.'
          }
        ]
      },
      bankruptcy: {
        title: 'Bankruptcy Education Only',
        description: 'Educational information about bankruptcy reporting and verification processes',
        steps: [
          {
            title: 'Step 1: Pull Credit Reports',
            content: 'Educational example: Review how bankruptcy information is reported on your credit reports, including discharge dates and included accounts.'
          },
          {
            title: 'Step 2: Generate Dispute Letter',
            content: 'Educational example: If bankruptcy information appears inaccurate, you may request verification of the bankruptcy details and associated accounts.'
          },
          {
            title: 'Step 3: Send Certified Mail',
            content: 'Educational example: Send verification requests via certified mail to maintain records of your bankruptcy-related correspondence.'
          },
          {
            title: 'Step 4: Track Response',
            content: 'Educational example: Follow FCRA timelines for bureau responses and review updated reports for accuracy of bankruptcy information.'
          }
        ]
      }
    };
    return workflows[type as keyof typeof workflows];
  };

  const fetchUploadedDocuments = async () => {
    try {
      const response = await fetch('/api/upload');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setUploadedDocuments(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch uploaded documents:', error);
    }
  };
  const fetchResources = async () => {
    try {
      const response = await fetch('/api/admin/resources');
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setResources(result.data.filter((r: any) => r.visible === true));
        }
      }
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    }
  };

  useEffect(() => {
    const accepted = localStorage.getItem('disclaimerAccepted');
    if (!accepted) {
      router.push('/disclaimer');
    } else {
      setHasAccepted(true);
    }
    fetchWorkflows();
    fetchCreditLetters();
    fetchUploadedDocuments();
    fetchResources();
  }, [router]);

  if (!hasAccepted) {
    return null;
  }

  return (
    <div className="py-8 bg-pure-white min-h-screen">
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <div className="w-24"></div> {/* Spacer for symmetry */}
          <div className="flex items-center">
            <div className="w-8 h-8 bg-primary-green rounded-lg flex items-center justify-center mr-3">
              <span className="text-pure-white font-bold text-sm">DC</span>
            </div>
            <h1 className="text-4xl font-bold text-primary-black tracking-tight leading-relaxed">
              Dashboard
            </h1>
          </div>
          <div className="w-24 flex justify-end">
            <Link href="/dashboard/settings" className="p-2 hover:bg-gray-100 rounded-full transition-colors title='Settings'">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </Link>
          </div>
        </div>
        <p className="text-gray-600 text-center leading-relaxed">
          AI-powered credit education and dispute tools
        </p>
        <div className="w-24 h-0.5 bg-primary-green mx-auto mt-4 rounded-full"></div>
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
          <p className="text-yellow-800 text-sm text-center font-medium leading-relaxed">
            <strong>Educational Platform:</strong> All tools provide educational information only. No legal advice or guaranteed outcomes. Users manually control all actions and decisions.
          </p>
        </div>
      </div>

      <div className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-pure-white p-8 rounded-xl shadow-lg border border-gray-200 md:col-span-3 hover:shadow-xl transition-all duration-300">
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-primary-green/10 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-primary-black tracking-tight">
                    AI Letter Generator
                  </h2>
                  <div className="w-16 h-0.5 bg-primary-green mt-1 rounded-full"></div>
                </div>
              </div>
              <p className="text-gray-600 leading-relaxed">
                Generate customized dispute letters with AI assistance
              </p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-primary-black font-medium mb-3 tracking-tight">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={formData.userName}
                    onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                    className="w-full p-4 bg-pure-white text-primary-black rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-20 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-black font-medium mb-3 tracking-tight">
                    Your Address
                  </label>
                  <input
                    type="text"
                    value={formData.userAddress}
                    onChange={(e) => setFormData({ ...formData, userAddress: e.target.value })}
                    className="w-full p-4 bg-pure-white text-primary-black rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-20 transition-all"
                    required
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-primary-black font-medium mb-3 tracking-tight">
                    Letter Type
                  </label>
                  <select
                    value={formData.letterType}
                    onChange={(e) => setFormData({ ...formData, letterType: e.target.value })}
                    className="w-full p-4 bg-pure-white text-primary-black rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-20 transition-all"
                    required
                  >
                    <option value="dispute">Dispute Letter</option>
                    <option value="validation">Validation Letter</option>
                    <option value="goodwill">Goodwill Letter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-primary-black font-medium mb-3 tracking-tight">
                    Credit Bureau
                  </label>
                  <select
                    value={formData.bureau}
                    onChange={(e) => setFormData({ ...formData, bureau: e.target.value })}
                    className="w-full p-4 bg-pure-white text-primary-black rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-20 transition-all"
                    required
                  >
                    <option value="Experian">Experian</option>
                    <option value="Equifax">Equifax</option>
                    <option value="TransUnion">TransUnion</option>
                  </select>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-primary-black font-medium mb-3 tracking-tight">
                    Creditor Name
                  </label>
                  <input
                    type="text"
                    value={formData.creditorName}
                    onChange={(e) => setFormData({ ...formData, creditorName: e.target.value })}
                    className="w-full p-4 bg-pure-white text-primary-black rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-20 transition-all"
                    required
                  />
                </div>
                <div>
                  <label className="block text-primary-black font-medium mb-3 tracking-tight">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={formData.accountNumber}
                    onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    className="w-full p-4 bg-pure-white text-primary-black rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-20 transition-all"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-primary-black font-medium mb-3 tracking-tight">
                  Dispute Reason
                </label>
                <textarea
                  value={formData.disputeReason}
                  onChange={(e) => setFormData({ ...formData, disputeReason: e.target.value })}
                  rows={4}
                  className="w-full p-4 bg-pure-white text-primary-black rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-20 transition-all leading-relaxed"
                  required
                />
              </div>
              {uploadedDocuments.length > 0 && (
                <div>
                  <label className="block text-primary-black font-medium mb-3 tracking-tight">
                    Reference Uploaded Documents (Optional)
                  </label>
                  <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                    Select uploaded documents (credit reports, statements, etc.) to help AI identify missing or inconsistent information
                  </p>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 rounded-lg p-4">
                    {uploadedDocuments.map((doc) => (
                      <label key={doc.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedDocuments([...selectedDocuments, doc.id]);
                            } else {
                              setSelectedDocuments(selectedDocuments.filter(id => id !== doc.id));
                            }
                          }}
                          className="w-4 h-4 text-primary-green border-gray-300 rounded focus:ring-primary-green"
                        />
                        <span className="text-sm text-primary-black">
                          {doc.filename} ({doc.fileType})
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    <strong>Error:</strong> {error}
                  </p>
                </div>
              )}
              <div className="pt-6 border-t border-border-gray">
                <button
                  type="submit"
                  disabled={!isFormValid || isGenerating}
                  className={`px-8 py-4 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 tracking-tight ${isFormValid && !isGenerating
                    ? 'bg-primary-green hover:bg-green-700 text-white cursor-pointer shadow-lg hover:shadow-xl'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed opacity-60'
                    }`}
                >
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    {isGenerating ? 'Generating...' : 'Generate Letter'}
                  </span>
                </button>
              </div>
            </form>
          </div>

        </div>

        <div className="flex items-center my-12">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
          <div className="px-4 text-gray-500 text-sm font-medium">Core Features</div>
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gray-300 to-transparent"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-pure-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300 md:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-primary-green/10 rounded-lg flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-primary-black tracking-tight">
                  Guided Workflows
                </h2>
                <div className="w-16 h-0.5 bg-primary-green mt-1 rounded-full"></div>
              </div>
            </div>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Step-by-step educational workflows for credit dispute processes
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {error && (
                <div className="col-span-full bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 text-sm">{error}</p>
                </div>
              )}

              {!workflowsLoaded && (
                <div className="col-span-full text-center py-8">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                </div>
              )}

              {/* Database Workflows */}
              {workflows && workflows.length > 0 ? (
                workflows.map((workflow) => (
                  <div key={workflow.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                    <h3 className="font-bold text-primary-black mb-3 tracking-tight">{workflow.name}</h3>
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
                      {workflow.steps?.steps ? `${workflow.steps.steps.length} steps` : 'Educational workflow'}
                    </p>
                    <button
                      onClick={() => setSelectedWorkflow(workflow.name.toLowerCase().replace(/[\s-_]+/g, ''))}
                      className="w-full bg-primary-green hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors tracking-tight"
                    >
                      Start Workflow
                    </button>
                  </div>
                ))) : (
                workflowsLoaded && <div className="col-span-full text-gray-500 text-center">No workflows found. Admin should add workflows.</div>
              )}
            </div>
          </div>


        </div>


      </div>

      <div className="bg-pure-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-primary-green/10 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-black tracking-tight">
                Resources Center
              </h2>
              <div className="w-16 h-0.5 bg-primary-green mt-1 rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Educational resources and helpful links for credit education
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Database Resources */}
          {resources.map((resource) => (
            <div key={resource.id} className="bg-gray-50 p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-primary-black tracking-tight">{resource.title}</h3>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px] font-bold uppercase">
                  {resource.type || 'RESOURCES'}
                </span>
              </div>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                {resource.description || `${resource.title} - Educational resource`}
              </p>
              <a href={resource.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-primary-green hover:text-green-700 text-sm font-semibold transition-colors">
                Visit Resource
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          ))}

          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <h3 className="font-bold text-primary-black mb-3 tracking-tight">Upload Documents</h3>
            <p className="text-gray-600 text-sm mb-3 leading-relaxed">
              Upload credit reports and documents for AI analysis
            </p>
            <div className="mt-4">
              <label className="block w-full cursor-pointer">
                <span className="sr-only">Choose file</span>
                <div className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  {isUploading ? 'Uploading...' : 'Upload PDF/Image'}
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={handleUpload}
                  accept=".pdf,image/*"
                  disabled={isUploading}
                />
              </label>
              <p className="text-xs text-gray-500 mt-2 italic">
                Supported formats: PDF, JPG, PNG
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-pure-white p-8 rounded-xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-300">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-10 h-10 bg-primary-green/10 rounded-lg flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-primary-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-primary-black tracking-tight">
                Follow-Up Letters
              </h2>
              <div className="w-16 h-0.5 bg-primary-green mt-1 rounded-full"></div>
            </div>
          </div>
          <p className="text-gray-600 leading-relaxed">
            Generate AI-powered follow-up letters for existing disputes
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-primary-black mb-4 tracking-tight">Generated Letters</h3>
            <div className="space-y-3 mb-4">
              {creditLetters.length > 0 ? (
                creditLetters.slice(0, 3).map((letter) => (
                  <div key={letter.id} className="p-3 bg-gray-50 rounded">
                    <div className="text-sm font-medium text-primary-black">
                      {letter.letterType} - {letter.bureau}
                    </div>
                    <div className="text-xs text-gray-500">
                      {letter.creditorName} - {new Date(letter.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-gray-500 text-sm">No letters generated yet</div>
              )}
            </div>
            <div className="space-y-2">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Follow-up Stage:</label>
                <div className="flex space-x-2">
                  {[15, 30, 45].map((day) => (
                    <button
                      key={day}
                      onClick={() => setSelectedFollowUpDay(day)}
                      className={`px-3 py-1 rounded text-sm border transition-colors ${selectedFollowUpDay === day
                        ? 'bg-primary-green text-white border-primary-green'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                      {day} Days
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={generateFollowUp}
                disabled={creditLetters.length === 0 || isGenerating}
                className="w-full bg-primary-green hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors tracking-tight disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {isGenerating ? 'Generating...' : `Generate ${selectedFollowUpDay}-Day Follow-up`}
              </button>
              <div className="text-xs text-gray-500 text-center">
                Or use templates on the right →
              </div>
            </div>
          </div>

          <div className="border border-gray-200 rounded-lg p-6">
            <h3 className="font-semibold text-primary-black mb-4 tracking-tight">Follow-up Templates</h3>
            <div className="space-y-3 mb-4">
              <div className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100" onClick={() => setSelectedLetter('day15')}>
                <div className="text-sm font-medium text-primary-black">Day 15 Follow-Up</div>
                <div className="text-xs text-gray-500">First follow-up template</div>
              </div>
              <div className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100" onClick={() => setSelectedLetter('day30')}>
                <div className="text-sm font-medium text-primary-black">Day 30 Follow-Up</div>
                <div className="text-xs text-gray-500">Second follow-up template</div>
              </div>
              <div className="p-3 bg-gray-50 rounded cursor-pointer hover:bg-gray-100" onClick={() => setSelectedLetter('day45')}>
                <div className="text-sm font-medium text-primary-black">Day 45 Follow-Up</div>
                <div className="text-xs text-gray-500">Final follow-up template</div>
              </div>
              {followupLetters.length > 0 && (
                <div className="border-t pt-3 mt-3">
                  <div className="text-xs text-gray-500 mb-2">Generated Follow-ups:</div>
                  {followupLetters.map((letter, index) => (
                    <div key={index} className="p-2 bg-blue-50 rounded mb-2">
                      <div className="text-sm font-medium text-primary-black">
                        Follow-up Letter #{index + 1}
                      </div>
                      <div className="text-xs text-gray-500">
                        Generated today
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>


      {
        selectedLetter && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && setSelectedLetter(null)}
          >
            <div className="bg-pure-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border-gray">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg sm:text-2xl font-bold text-primary-black truncate mr-4">
                    {selectedLetter ? getLetterTemplate(selectedLetter)?.title : ''}
                  </h3>
                  <button
                    onClick={() => {
                      setSelectedLetter(null);
                      setIsEditing(false);
                      setEditedLetter('');
                    }}
                    className="bg-green-600 text-white hover:bg-green-700 rounded-full w-8 h-8 flex items-center justify-center text-xl flex-shrink-0"
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh] sm:max-h-[60vh]">
                <div className="bg-light-gray p-4 sm:p-6 rounded-lg border border-gray-200">
                  {selectedLetter === 'generated' && isEditing ? (
                    <textarea
                      value={editedLetter}
                      onChange={(e) => setEditedLetter(e.target.value)}
                      className="w-full h-64 sm:h-96 p-3 sm:p-4 bg-pure-white text-primary-black rounded-lg border border-gray-300 focus:border-primary-green focus:ring-2 focus:ring-primary-green focus:ring-opacity-20 transition-all font-mono text-xs sm:text-sm"
                      style={{ lineHeight: '1.7' }}
                    />
                  ) : (
                    <pre className="text-primary-black whitespace-pre-wrap font-sans text-xs sm:text-sm" style={{ lineHeight: '1.7' }}>
                      {selectedLetter === 'generated' ? editedLetter : (selectedLetter ? getLetterTemplate(selectedLetter)?.content : '')}
                    </pre>
                  )}
                </div>
              </div>
              <div className="p-4 sm:p-6 border-t border-border-gray bg-light-gray">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {selectedLetter === 'generated' && (
                      <button
                        onClick={() => setIsEditing(!isEditing)}
                        className="bg-blue-600 hover:bg-blue-700 text-white hover:text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                      >
                        {isEditing ? 'Save Changes' : 'Edit Letter'}
                      </button>
                    )}
                    <button
                      onClick={() => navigator.clipboard.writeText(selectedLetter === 'generated' ? editedLetter : (selectedLetter ? getLetterTemplate(selectedLetter)?.content || '' : ''))}
                      className="bg-primary-green hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Copy Text
                    </button>
                    <button
                      onClick={() => {
                        const content = selectedLetter === 'generated' ? editedLetter : (selectedLetter ? getLetterTemplate(selectedLetter)?.content || '' : '');
                        const blob = new Blob([content], { type: 'text/plain' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `dispute-letter-${Date.now()}.txt`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="bg-purple-600 hover:bg-purple-700 text-white hover:text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Download TXT
                    </button>
                    <button
                      onClick={async () => {
                        const { jsPDF } = await import('jspdf');
                        const content = selectedLetter === 'generated' ? editedLetter : (selectedLetter ? getLetterTemplate(selectedLetter)?.content || '' : '');
                        const pdf = new jsPDF();
                        const lines = pdf.splitTextToSize(content, 180);
                        pdf.text(lines, 15, 20);
                        pdf.text('EDUCATIONAL DISCLAIMER: This letter is for educational purposes only. User must verify all information before use. No legal advice or guaranteed outcomes provided.', 15, pdf.internal.pageSize.height - 30, { maxWidth: 180 });
                        pdf.save(`dispute-letter-${Date.now()}.pdf`);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white hover:text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Download PDF
                    </button>
                    <button
                      onClick={() => {
                        setSelectedLetter(null);
                        setIsEditing(false);
                        setEditedLetter('');
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white hover:text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm"
                    >
                      Close
                    </button>
                  </div>
                  <div className="border-t border-gray-300 pt-4">
                    <p className="text-gray-600 text-xs sm:text-sm">
                      <strong>Educational Disclaimer:</strong> This letter is provided for educational purposes only. User must verify all information before use. No legal advice or guaranteed outcomes are provided.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }

      {
        selectedWorkflow && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 sm:p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && setSelectedWorkflow(null)}
          >
            <div className="bg-pure-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border-gray">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-lg sm:text-2xl font-bold text-primary-black">
                      {selectedWorkflow ? getWorkflowContent(selectedWorkflow, workflows)?.title : ''}
                    </h3>
                    <p className="text-gray-600 text-sm mt-2">
                      {selectedWorkflow ? getWorkflowContent(selectedWorkflow, workflows)?.description : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedWorkflow(null)}
                    className="bg-green-600 text-white hover:bg-green-700 rounded-full w-8 h-8 flex items-center justify-center text-xl flex-shrink-0 ml-4"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-6">
                  {selectedWorkflow && getWorkflowContent(selectedWorkflow, workflows)?.steps?.map(
                    (step: any, index: number) => (
                      <div
                        key={index}
                        className="bg-light-gray p-4 sm:p-6 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start">
                          <div className="w-8 h-8 bg-primary-green rounded-full flex items-center justify-center mr-4 flex-shrink-0">
                            <span className="text-white font-bold">{index + 1}</span>
                          </div>

                          <div className="flex-1">
                            <h4 className="font-bold text-primary-black mb-2 tracking-tight">{step.title}</h4>
                            <p className="text-gray-600 leading-relaxed text-sm sm:text-base">
                              {step.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-6 border-t border-border-gray bg-light-gray">
                <div className="flex flex-col space-y-4">
                  <div className="flex justify-center">
                    <button
                      onClick={() => setSelectedWorkflow(null)}
                      className="bg-primary-green hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                    >
                      Close Workflow
                    </button>
                  </div>
                  <div className="border-t border-gray-300 pt-4">
                    <p className="text-gray-600 text-xs sm:text-sm text-center">
                      <strong>Educational Disclaimer:</strong> This workflow is for educational purposes only. No legal advice or guaranteed outcomes are provided. Consult qualified professionals for legal matters.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div >
  );
}