'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import AdminAuth from '../../components/AdminAuth';

interface User {
  id: string;
  name?: string;
  email: string;
  role: string;
  active: boolean;
  lastLogin?: string;
  createdAt: string;
  _count?: { letters: number; followUps: number };
}

interface CreditLetter {
  id: string;
  userId: string;
  bureau: string;
  creditorName: string;
  letterType: string;
  content: string;
  createdAt: string;
  user?: { name?: string; email: string };
}

interface FollowUpLetter {
  id: string;
  userId: string;
  day: number;
  content: string;
  createdAt: string;
  user?: { name?: string; email: string };
}

interface Workflow {
  id: string;
  name: string;
  steps: any;
  enabled: boolean;
  createdAt: string;
}

interface AIPrompt {
  id: string;
  type: string;
  content: string;
  enabled: boolean;
}



interface Disclaimer {
  id: string;
  type: string;
  content: string;
  enabled: boolean;
}

interface ResourceLink {
  id: string;
  title: string;
  url: string;
  type?: string;
  description?: string;
  visible: boolean;
}

interface UploadedFile {
  id: string;
  filename: string;
  filepath: string;
  fileType: string;
  createdAt: string;
  user?: { name?: string; email: string };
}

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState('users');
  const [users, setUsers] = useState<User[]>([]);
  const [letters, setLetters] = useState<CreditLetter[]>([]);
  const [followUps, setFollowUps] = useState<FollowUpLetter[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [aiPrompts, setAiPrompts] = useState<AIPrompt[]>([]);

  const [disclaimers, setDisclaimers] = useState<Disclaimer[]>([]);
  const [resources, setResources] = useState<ResourceLink[]>([]);
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [activeSection]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      switch (activeSection) {
        case 'users':
          const usersRes = await fetch('/api/admin/users');
          if (usersRes.ok) {
            const result = await usersRes.json();
            setUsers(result.success ? result.data : result);
          }
          break;
        case 'letters':
          const lettersRes = await fetch('/api/credit-letters');
          if (lettersRes.ok) {
            const result = await lettersRes.json();
            setLetters(result.success ? result.data : result);
          }
          break;
        case 'followups':
          const followUpsRes = await fetch('/api/followup-letters');
          if (followUpsRes.ok) {
            const result = await followUpsRes.json();
            setFollowUps(result.success ? result.data : result);
          }
          break;
        case 'workflows':
          const workflowsRes = await fetch('/api/workflows');
          if (workflowsRes.ok) {
            const result = await workflowsRes.json();
            setWorkflows(result.success ? result.data : result);
          }
          break;
        case 'ai-prompts':
          const promptsRes = await fetch('/api/admin/ai-prompts');
          if (promptsRes.ok) {
            const result = await promptsRes.json();
            setAiPrompts(result.success ? result.data : result);
          }
          break;

        case 'disclaimers':
          const disclaimersRes = await fetch('/api/admin/disclaimers');
          if (disclaimersRes.ok) {
            const result = await disclaimersRes.json();
            setDisclaimers(result.success ? result.data : result);
          }
          break;
        case 'resources':
          const resourcesRes = await fetch('/api/admin/resources');
          if (resourcesRes.ok) {
            const result = await resourcesRes.json();
            setResources(result.success ? result.data.filter((r: any) => r.type !== 'VIDEO' && r.type !== 'GUIDANCE') : result.filter((r: any) => r.type !== 'VIDEO' && r.type !== 'GUIDANCE'));
          }
          break;
        case 'credit-videos':
          const creditVideosRes = await fetch('/api/admin/resources');
          if (creditVideosRes.ok) {
            const result = await creditVideosRes.json();
            // Store in resources state for now, but UI will filter
            setResources(result.success ? result.data.filter((r: any) => r.type === 'VIDEO') : result.filter((r: any) => r.type === 'VIDEO'));
          }
          break;
        case 'guidance-video':
          const guidanceVideoRes = await fetch('/api/admin/resources');
          if (guidanceVideoRes.ok) {
            const result = await guidanceVideoRes.json();
            setResources(result.success ? result.data.filter((r: any) => r.type === 'GUIDANCE') : result.filter((r: any) => r.type === 'GUIDANCE'));
          }
          break;
        case 'uploads':
          const uploadsRes = await fetch('/api/admin/uploads');
          if (uploadsRes.ok) {
            const result = await uploadsRes.json();
            setUploads(result.success ? result.data : result);
          }
          break;
      }
    } catch (err) {
      setError('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecord = async (id: string, type: string, itemName?: string) => {
    const userInput = prompt(`⚠️ DELETE CONFIRMATION\\n\\nType 'DELETE' to confirm deletion of ${itemName || 'this item'}:`);
    if (userInput !== 'DELETE') return;

    setLoading(true);
    try {
      const endpoint = type === 'users' ? `/api/admin/users/${id}` :
        type === 'letters' ? `/api/credit-letters/${id}` :
          type === 'followups' ? `/api/followup-letters/${id}` :
            type === 'workflows' ? `/api/workflows/${id}` :
              type === 'uploads' ? `/api/admin/uploads/${id}` :
                (activeSection === 'credit-videos' || activeSection === 'guidance-video') ? `/api/admin/resources/${id}` :
                  `/api/admin/${type}/${id}`;


      const response = await fetch(endpoint, { method: 'DELETE' });
      const responseData = await response.json();

      if (response.ok) {
        const success = responseData.success !== false;
        if (success) {
          await fetchData();
          alert('✅ Record deleted successfully!');
        } else {
          alert('❌ Delete failed: ' + (responseData.error || 'Unknown error'));
        }
      } else {
        alert('❌ Delete failed: ' + (responseData.error || 'Unknown error'));
      }
    } catch (err) {
      alert('❌ Network error during deletion');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, type: string, currentStatus: boolean, field = 'enabled') => {
    setLoading(true);
    try {
      const apiType = (type === 'credit-videos' || type === 'guidance-video') ? 'resources' : type;
      const endpoint = type === 'users' ? `/api/users/${id}` : `/api/admin/${apiType}/${id}`;
      const body = type === 'users' ? { active: !currentStatus } : { [field]: !currentStatus };

      const response = await fetch(endpoint, {
        method: type === 'users' ? 'PUT' : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const responseData = await response.json();
        const success = responseData.success !== false;
        if (success) {
          await fetchData();
          alert('✅ Status updated successfully!');
        } else {
          alert('❌ Failed to update status: ' + (responseData.error || 'Unknown error'));
        }
      } else {
        alert('❌ Failed to update status');
      }
    } catch (err) {
      alert('❌ Network error');
    } finally {
      setLoading(false);
    }
  };

  const saveRecord = async (type: string, data: any) => {
    setLoading(true);
    try {
      if (type === 'uploads') {
        if (!data.file) {
          alert('Please select a file to upload');
          setLoading(false);
          return;
        }

        const formDataObj = new FormData();
        formDataObj.append('file', data.file);
        formDataObj.append('fileType', data.fileType);

        const response = await fetch('/api/admin/uploads', {
          method: 'POST',
          body: formDataObj,
        });

        const result = await response.json();
        if (!response.ok || result.success === false) {
          throw new Error(result.error || 'Upload failed');
        }

        setEditingItem(null);
        await fetchData();
        alert('✅ Record saved successfully!');
        return;
      }

      const method = data.id ? 'PUT' : 'POST';
      const endpoint = type === 'users' ?
        (data.id ? `/api/admin/users/${data.id}` : '/api/admin/users') :
        type === 'workflows' ?
          (data.id ? `/api/workflows/${data.id}` : '/api/workflows') :
          type === 'letters' ?
            (data.id ? `/api/credit-letters/${data.id}` : '/api/credit-letters') :
            type === 'followups' ?
              (data.id ? `/api/followup-letters/${data.id}` : '/api/followup-letters') :
              ((type === 'credit-videos' || type === 'guidance-video') ?
                (data.id ? `/api/admin/resources/${data.id}` : '/api/admin/resources') :
                (data.id ? `/api/admin/${type}/${data.id}` : `/api/admin/${type}`));



      const response = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const responseData = await response.json();

      if (response.ok && responseData.success === true) {
        setEditingItem(null);
        await fetchData();
        alert('✅ Record saved successfully!');
      } else {
        alert('❌ Save failed: ' + (responseData.error || 'Unknown error'));
      }
    } catch (err) {
      alert('❌ Network error during save');
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    { id: 'users', name: '👥 Users' },
    { id: 'letters', name: '📄 Credit Letters' },
    { id: 'followups', name: '📮 Follow-Up Letters' },
    { id: 'workflows', name: '🔄 Workflows' },
    { id: 'ai-prompts', name: '🤖 AI Prompts' },
    { id: 'disclaimers', name: '⚖️ Disclaimers' },
    { id: 'resources', name: '🔗 Resource Links' },
    { id: 'credit-videos', name: '🎥 Credit Videos' },
    { id: 'guidance-video', name: '📺 Guidance Video' },
    { id: 'uploads', name: '📁 Uploaded Files' },
    { id: 'activity', name: '📈 System Activity' },
  ];

  return (
    <AdminAuth>
      <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 bg-white min-h-screen">
        <div className="mb-12">
          <div className="flex items-center justify-center mb-4">
            <Image
              src="/logo.jpg"
              alt="Destiny Credit AI"
              width={140}
              height={50}
              priority
            />
          </div>
          <div className="flex items-center justify-between mb-6">
            <div className="w-32"></div> {/* Spacer */}
            <div className="flex items-center">
              <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-4xl font-bold text-black tracking-tight">
                Admin Control Panel
              </h1>
            </div>
            <div className="w-32 flex justify-end">
              <button
                onClick={async () => {
                  await fetch('/api/auth/logout', { method: 'POST' });
                  window.location.href = '/login';
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                style={{ color: 'white' }}
              >
                Logout
              </button>
            </div>
          </div>
          <p className="text-gray-600 text-center">
            Complete platform administration and control
          </p>
          <div className="w-24 h-0.5 bg-green-600 mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <nav className="flex flex-wrap gap-4 justify-center">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`px-6 py-3 rounded-lg font-bold text-sm whitespace-nowrap transition-all border-none ${activeSection === section.id
                  ? 'bg-green-700 text-white shadow-lg scale-105'
                  : 'bg-green-600 text-white hover:bg-green-700 hover:shadow-md'
                  }`}
                style={{ color: 'white', fontWeight: 'bold' }}
              >
                <span className="text-white" style={{ color: 'white' }}>{section.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200">
          <div className="flex justify-between items-center mb-6">
            <div className="bg-green-600 px-6 py-3 rounded-lg shadow-lg text-white">
              <h2 className="text-2xl font-bold text-white tracking-tight">
                <span className="text-white">{sections.find(s => s.id === activeSection)?.name}</span>
              </h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setEditingItem({ type: activeSection, data: {} })}
                className="admin-green-btn px-4 py-2 rounded text-white"
              >
                <span className="text-white">➕ Add New</span>
              </button>
              <button
                onClick={fetchData}
                disabled={loading}
                className="bg-blue-600 text-white hover:bg-blue-700 font-medium px-4 py-2 rounded disabled:bg-gray-400"
              >
                {loading ? '🔄 Loading...' : '🔄 Refresh'}
              </button>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <p className="mt-2 text-gray-600">Loading...</p>
            </div>
          ) : (
            <>
              {/* Users Section */}
              {activeSection === 'users' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Activity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{user.name || 'No Name'}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.role === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${user.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {user.active ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user._count ? `${user._count.letters} letters, ${user._count.followUps} follow-ups` : 'No activity'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleStatus(user.id, 'users', user.active, 'active')}
                              className={`mr-2 px-2 py-1 text-xs rounded ${user.active ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}
                            >
                              {user.active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => setEditingItem({ type: 'users', data: user })}
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded mr-4"
                            >
                              <span className="text-white">Edit</span>
                            </button>
                            <button
                              onClick={() => deleteRecord(user.id, 'users', user.email)}
                              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded"
                            >
                              <span className="text-white">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Credit Letters Section */}
              {activeSection === 'letters' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bureau</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creditor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {letters.map((letter) => (
                        <tr key={letter.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {letter.user?.email || 'Unknown User'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{letter.bureau}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{letter.creditorName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{letter.letterType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(letter.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setEditingItem({ type: 'letters', data: letter })}
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded mr-2"
                            >
                              <span className="text-white">Edit</span>
                            </button>
                            <button
                              onClick={() => deleteRecord(letter.id, 'letters', `${letter.creditorName} letter`)}
                              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded"
                            >
                              <span className="text-white">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Follow-Up Letters Section */}
              {activeSection === 'followups' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Day</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Content Preview</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {followUps.map((followUp) => (
                        <tr key={followUp.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {followUp.user?.email || 'Unknown User'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Day {followUp.day}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {followUp.content.substring(0, 50)}...
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(followUp.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => setEditingItem({ type: 'followups', data: followUp })}
                              className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded mr-2"
                            >
                              <span className="text-white">Edit</span>
                            </button>
                            <button
                              onClick={() => deleteRecord(followUp.id, 'followups', `Day ${followUp.day} follow-up`)}
                              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded"
                            >
                              <span className="text-white">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Workflows Section */}
              {activeSection === 'workflows' && (
                <div className="space-y-4">
                  {workflows.map((workflow) => (
                    <div key={workflow.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{workflow.name}</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${workflow.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {workflow.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleStatus(workflow.id, 'workflows', workflow.enabled)}
                            className={`px-3 py-1 rounded text-sm font-medium ${workflow.enabled
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'admin-green-btn text-white'
                              }`}
                          >
                            <span className={workflow.enabled ? '' : 'text-white'}>{workflow.enabled ? 'Disable' : 'Enable'}</span>
                          </button>
                          <button
                            onClick={() => setEditingItem({ type: 'workflows', data: workflow })}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded"
                          >
                            <span className="text-white">Edit</span>
                          </button>
                          <button
                            onClick={() => deleteRecord(workflow.id, 'workflows', workflow.name)}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded"
                          >
                            <span className="text-white">Delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-700">
                          {workflow.steps?.steps ? workflow.steps.steps.length + ' steps' : 'No steps defined'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'ai-prompts' && (
                <div className="space-y-4">
                  {aiPrompts.map((prompt) => (
                    <div key={prompt.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 capitalize">{prompt.type} Prompt</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${prompt.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {prompt.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleStatus(prompt.id, 'ai-prompts', prompt.enabled)}
                            className={`px-3 py-1 rounded text-sm font-medium ${prompt.enabled
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'admin-green-btn text-white'
                              }`}
                          >
                            <span className={prompt.enabled ? '' : 'text-white'}>{prompt.enabled ? 'Disable' : 'Enable'}</span>
                          </button>
                          <button
                            onClick={() => setEditingItem({ type: 'ai-prompts', data: prompt })}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded"
                          >
                            <span className="text-white">Edit</span>
                          </button>
                          <button
                            onClick={() => deleteRecord(prompt.id, 'ai-prompts', `${prompt.type} prompt`)}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded"
                          >
                            <span className="text-white">Delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap">{prompt.content.substring(0, 200)}...</pre>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Disclaimers Section */}
              {activeSection === 'disclaimers' && (
                <div className="space-y-4">
                  {disclaimers.map((disclaimer) => (
                    <div key={disclaimer.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 capitalize">{disclaimer.type} Disclaimer</h3>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${disclaimer.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                            {disclaimer.enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleStatus(disclaimer.id, 'disclaimers', disclaimer.enabled)}
                            className={`px-3 py-1 rounded text-sm font-medium ${disclaimer.enabled
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'admin-green-btn text-white'
                              }`}
                          >
                            <span className={disclaimer.enabled ? '' : 'text-white'}>{disclaimer.enabled ? 'Disable' : 'Enable'}</span>
                          </button>
                          <button
                            onClick={() => setEditingItem({ type: 'disclaimers', data: disclaimer })}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded"
                          >
                            <span className="text-white">Edit</span>
                          </button>
                          <button
                            onClick={() => deleteRecord(disclaimer.id, 'disclaimers', `${disclaimer.type} disclaimer`)}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded"
                          >
                            <span className="text-white">Delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <p className="text-sm text-gray-700">{disclaimer.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Resources, Credit Videos, and Guidance Video Sections */}
              {(activeSection === 'resources' || activeSection === 'credit-videos' || activeSection === 'guidance-video') && (
                <div className="space-y-4">
                  {resources.map((resource) => (
                    <div key={resource.id} className="border border-gray-200 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">{resource.title}</h3>
                          <div className="flex gap-2 items-center mt-1">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${resource.visible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                              {resource.visible ? 'Visible' : 'Hidden'}
                            </span>
                            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                              {resource.type}
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => toggleStatus(resource.id, 'resources', resource.visible, 'visible')}
                            className={`px-3 py-1 rounded text-sm font-medium ${resource.visible
                              ? 'bg-red-100 text-red-800 hover:bg-red-200'
                              : 'admin-green-btn text-white'
                              }`}
                          >
                            <span className={resource.visible ? '' : 'text-white'}>{resource.visible ? 'Hide' : 'Show'}</span>
                          </button>
                          <button
                            onClick={() => setEditingItem({ type: activeSection, data: resource })}
                            className="bg-green-600 hover:bg-green-700 text-white font-semibold px-3 py-1 rounded"
                          >
                            <span className="text-white">Edit</span>
                          </button>
                          <button
                            onClick={() => deleteRecord(resource.id, 'resources', resource.title)}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded"
                          >
                            <span className="text-white">Delete</span>
                          </button>
                        </div>
                      </div>
                      <div className="bg-gray-50 p-4 rounded">
                        <a href={resource.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 text-sm break-all">
                          {resource.url}
                        </a>
                        {resource.description && (
                          <p className="text-sm text-gray-500 mt-2">{resource.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeSection === 'activity' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                      <h4 className="text-blue-800 font-semibold mb-1">Total Users</h4>
                      <p className="text-2xl font-bold text-blue-900">{users.length}</p>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                      <h4 className="text-green-800 font-semibold mb-1">Letters Generated</h4>
                      <p className="text-2xl font-bold text-green-900">{letters.length}</p>
                    </div>
                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                      <h4 className="text-purple-800 font-semibold mb-1">Follow-ups</h4>
                      <p className="text-2xl font-bold text-purple-900">{followUps.length}</p>
                    </div>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">Recent System Activity</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {[...users, ...letters, ...followUps]
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 10)
                        .map((item, idx) => (
                          <div key={idx} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-4 ${'email' in item ? 'bg-blue-500' : 'day' in item ? 'bg-purple-500' : 'bg-green-500'
                                }`}></div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">
                                  {'email' in item ? `New user registered: ${item.email}` :
                                    'day' in item ? `Follow-up letter generated (Day ${item.day})` :
                                      `Credit letter generated for ${item.bureau}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {new Date(item.createdAt).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-medium text-gray-400">SUCCESS</span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Uploads Section */}
              {activeSection === 'uploads' && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Filename</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Uploaded By</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {uploads.map((upload) => (
                        <tr key={upload.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <a href={upload.filepath} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800">
                              {upload.filename}
                            </a>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{upload.fileType}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {upload.user?.email || 'Unknown User'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(upload.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => deleteRecord(upload.id, 'uploads', upload.filename)}
                              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-3 py-1 rounded"
                            >
                              <span className="text-white">Delete</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Edit Modal */}
        {editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-md max-h-96 overflow-y-auto">
              <h3 className="text-lg font-semibold mb-4 text-black">
                {editingItem.data.id ? 'Edit' : 'Add'} {editingItem.type.replace('-', ' ')}
              </h3>
              <EditForm
                type={editingItem.type}
                data={editingItem.data}
                onSave={saveRecord}
                onCancel={() => setEditingItem(null)}
              />
            </div>
          </div>
        )}
      </div>
    </AdminAuth>
  );
}

function EditForm({ type, data, onSave, onCancel }: any) {
  // Initialize formData with proper defaults for video types
  const getInitialFormData = () => {
    const baseData = { ...data };

    // Set default type for video sections if not already set
    if (!baseData.type) {
      if (type === 'credit-videos') {
        baseData.type = 'VIDEO';
      } else if (type === 'guidance-video') {
        baseData.type = 'GUIDANCE';
      } else if (type === 'resources') {
        baseData.type = 'EXTERNAL';
      }
    }

    return baseData;
  };

  const [formData, setFormData] = useState(getInitialFormData());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (type === 'workflows' && formData.steps) {
      if (typeof formData.steps === 'string') {
        try {
          JSON.parse(formData.steps);
        } catch (e) {
          alert('❌ Invalid JSON in steps field. Please fix the JSON format.');
          return;
        }
      }
    }

    onSave(type, formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {type === 'users' && (
        <>
          <input
            type="text"
            placeholder="Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <input
            type="text"
            placeholder="Username"
            value={formData.username || ''}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email || ''}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={formData.password || ''}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full p-2 border rounded"
            required={!formData.id}
          />
          <select
            value={formData.role || 'USER'}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="USER">User</option>
            <option value="ADMIN">Admin</option>
          </select>
        </>
      )}

      {type === 'ai-prompts' && (
        <>
          <input
            type="text"
            list="letter-types"
            placeholder="Letter Type (e.g. collection, inquiry)"
            value={formData.type || ''}
            onChange={(e) => setFormData({ ...formData, type: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
            className="w-full p-2 border rounded"
            required
          />
          <datalist id="letter-types">
            <option value="system">System</option>
            <option value="dispute">Dispute Letter</option>
            <option value="validation">Validation Letter</option>
            <option value="goodwill">Goodwill Letter</option>
            <option value="collection">Collection Letter</option>
            <option value="charge-off">Charge-Off Letter</option>
            <option value="bankruptcy">Bankruptcy Letter</option>
            <option value="inquiry">Inquiry Letter</option>
            <option value="late-payment">Late Payment Letter</option>
            <option value="repossession">Repossession Letter</option>
            <option value="cfpb-complaint">CFPB Complaint Letter</option>
            <option value="follow-up">Follow-Up Letter</option>
            <option value="cease-and-desist">Cease and Desist Letter</option>
            <option value="pay-for-delete">Pay for Delete Letter</option>
            <option value="identity-theft">Identity Theft Letter</option>
            <option value="mixed-file">Mixed File Letter</option>
          </datalist>
          <textarea
            placeholder="Prompt content"
            value={formData.content || ''}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-2 border rounded h-32"
            required
          />
        </>
      )}



      {type === 'disclaimers' && (
        <>
          <select
            value={formData.type || 'onboarding'}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-2 border rounded"
            required
          >
            <option value="onboarding">Onboarding</option>
            <option value="letters">Letters</option>
            <option value="footer">Footer</option>
          </select>
          <textarea
            placeholder="Content"
            value={formData.content || ''}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-2 border rounded h-32"
            required
          />
        </>
      )}

      {(type === 'resources' || type === 'credit-videos' || type === 'guidance-video') && (
        <>
          <input
            type="text"
            placeholder="Title"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="url"
            placeholder="URL (YouTube / Loom link)"
            value={formData.url || ''}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <select
            value={formData.type || (type === 'credit-videos' ? 'VIDEO' : type === 'guidance-video' ? 'GUIDANCE' : 'EXTERNAL')}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="EXTERNAL">External Link</option>
            <option value="VIDEO">Video</option>
            <option value="GUIDANCE">Guidance Video</option>
            <option value="COMMUNITY">Community</option>
          </select>
          <textarea
            placeholder="Description"
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full p-2 border rounded h-20"
          />
        </>
      )}

      {type === 'workflows' && (
        <>
          <input
            type="text"
            placeholder="Workflow Name"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <textarea
            placeholder="Steps (JSON format: {&quot;steps&quot;: [&quot;Step 1&quot;, &quot;Step 2&quot;]})"
            value={typeof formData.steps === 'string' ? formData.steps : JSON.stringify(formData.steps || { steps: [] }, null, 2)}
            onChange={(e) => {
              setFormData({ ...formData, steps: e.target.value });
            }}
            className="w-full p-2 border rounded h-32"
            required
          />
        </>
      )}

      {type === 'letters' && (
        <>
          <select
            value={formData.bureau || 'Experian'}
            onChange={(e) => setFormData({ ...formData, bureau: e.target.value })}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Bureau *</option>
            <option value="Experian">Experian</option>
            <option value="Equifax">Equifax</option>
            <option value="TransUnion">TransUnion</option>
          </select>
          <input
            type="text"
            placeholder="Creditor Name *"
            value={formData.creditorName || ''}
            onChange={(e) => setFormData({ ...formData, creditorName: e.target.value })}
            className="w-full p-2 border rounded"
            required
          />
          <select
            value={formData.letterType || 'dispute'}
            onChange={(e) => setFormData({ ...formData, letterType: e.target.value })}
            className="w-full p-2 border rounded"
            required
          >
            <option value="">Select Letter Type *</option>
            <option value="dispute">Dispute</option>
            <option value="validation">Validation</option>
            <option value="goodwill">Goodwill</option>
            <option value="collection">Collection</option>
            <option value="charge-off">Charge-Off</option>
            <option value="bankruptcy">Bankruptcy</option>
            <option value="inquiry">Inquiry</option>
            <option value="late-payment">Late Payment</option>
            <option value="repossession">Repossession</option>
            <option value="cfpb-complaint">CFPB Complaint</option>
            <option value="cease-and-desist">Cease and Desist</option>
            <option value="pay-for-delete">Pay for Delete</option>
            <option value="identity-theft">Identity Theft</option>
            <option value="mixed-file">Mixed File</option>
          </select>
          <input
            type="text"
            placeholder="Account Number"
            value={formData.accountNumber || ''}
            onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Content *"
            value={formData.content || ''}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-2 border rounded h-32"
            required
          />
        </>
      )}

      {type === 'followups' && (
        <>
          <select
            value={formData.day || 15}
            onChange={(e) => setFormData({ ...formData, day: parseInt(e.target.value) })}
            className="w-full p-2 border rounded"
            required
          >
            <option value={15}>Day 15</option>
            <option value={30}>Day 30</option>
            <option value={45}>Day 45</option>
          </select>
          <input
            type="text"
            placeholder="Title"
            value={formData.title || ''}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full p-2 border rounded"
          />
          <textarea
            placeholder="Content"
            value={formData.content || ''}
            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            className="w-full p-2 border rounded h-32"
            required
          />
        </>
      )}

      {type === 'uploads' && (
        <>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.png,.jpg"
            onChange={(e) =>
              setFormData({ ...formData, file: e.target.files?.[0] })
            }
            className="w-full p-2 border rounded"
            required
          />

          <select
            value={formData.fileType || 'document'}
            onChange={(e) =>
              setFormData({ ...formData, fileType: e.target.value })
            }
            className="w-full p-2 border rounded"
          >
            <option value="document">Document</option>
            <option value="guide">Guide</option>
            <option value="video">Video</option>
          </select>
        </>
      )}

      <div className="flex gap-2">
        <button type="submit" className="admin-green-btn px-4 py-2 rounded text-white">
          <span className="text-white">Save</span>
        </button>
        <button type="button" onClick={onCancel} className="bg-gray-500 text-white px-4 py-2 rounded font-medium">
          Cancel
        </button>
      </div>
    </form>
  );
}