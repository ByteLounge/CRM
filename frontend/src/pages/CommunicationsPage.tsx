import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowRight,
  Bot,
  Check,
  Clock,
  Info,
  Mail,
  Plus,
  Send,
  Sparkles,
  User,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CommunicationStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Dialog } from '../components/ui/Dialog';
import { Input } from '../components/ui/Input';
import { Skeleton } from '../components/ui/Skeleton';
import { api } from '../services/api';
import { CommunicationPurpose } from '../types/crm';

export const CommunicationsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId') || '';

  const queryClient = useQueryClient();
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showWorkflowGuide, setShowWorkflowGuide] = useState(false);

  // Composer Form State
  const [targetCustomerId, setTargetCustomerId] = useState(preselectedCustomerId);
  const [purpose, setPurpose] = useState<CommunicationPurpose>('thank_you');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [saveStatus, setSaveStatus] = useState<'draft' | 'pending_approval'>('pending_approval');
  const [generatedByAi, setGeneratedByAi] = useState(false);

  useEffect(() => {
    if (preselectedCustomerId) {
      setTargetCustomerId(preselectedCustomerId);
      setIsComposerOpen(true);
    }
  }, [preselectedCustomerId]);

  const { data: commsData, isLoading } = useQuery({
    queryKey: ['communicationsList', statusFilter],
    queryFn: () => api.communications.list({ status: statusFilter || undefined }),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customersDropdown'],
    queryFn: () => api.customers.list({ limit: 50 }),
  });

  // FlowAI Draft Generation Mutation
  const aiGenerateMutation = useMutation({
    mutationFn: (data: { customerId: string; purpose: string }) =>
      api.ai.generateCommunication(data),
    onSuccess: (data) => {
      setSubject(data.subject);
      setMessage(data.message);
      setGeneratedByAi(true);
    },
  });

  // Create Communication Mutation
  const createMutation = useMutation({
    mutationFn: () =>
      api.communications.create({
        customerId: targetCustomerId,
        purpose,
        subject,
        message,
        status: saveStatus,
        generatedByAi,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationsList'] });
      setIsComposerOpen(false);
      resetForm();
    },
  });

  // Status Update Mutation (Approve / Mark Sent)
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      api.communications.updateStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communicationsList'] });
    },
  });

  const resetForm = () => {
    setSubject('');
    setMessage('');
    setGeneratedByAi(false);
    setSaveStatus('pending_approval');
  };

  const statuses = [
    { label: 'All', value: '' },
    { label: 'Pending Approval', value: 'pending_approval' },
    { label: 'Drafts', value: 'draft' },
    { label: 'Approved', value: 'approved' },
    { label: 'Sent', value: 'sent' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Communications Hub
            <span className="text-xs font-normal text-muted-foreground">
              ({commsData?.communications.length ?? 0} messages)
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Human-in-the-loop review workflow. Inspect and verify customer contact before dispatch.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setShowWorkflowGuide(!showWorkflowGuide)}
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 font-medium mr-1"
          >
            <Info className="w-3.5 h-3.5" />
            {showWorkflowGuide ? 'Hide guide' : 'How does approval work?'}
          </button>
          <Button onClick={() => setIsComposerOpen(true)} size="sm" className="text-xs h-9">
            <Plus className="w-4 h-4 mr-1.5" />
            Compose Message
          </Button>
        </div>
      </div>

      {/* Beginner Workflow Guide */}
      {showWorkflowGuide && (
        <div className="p-4 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 text-xs space-y-2 animate-in fade-in">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
            Human-in-the-Loop Safe Communication Process:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1 text-[11px]">
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <span className="font-bold text-foreground">1. Draft</span>
              <p className="text-muted-foreground mt-0.5">Composed manually or generated by FlowAI.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <span className="font-bold text-amber-700 dark:text-amber-400">2. Pending Approval</span>
              <p className="text-muted-foreground mt-0.5">Submitted for a human operator to review.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <span className="font-bold text-indigo-700 dark:text-indigo-400">3. Approved</span>
              <p className="text-muted-foreground mt-0.5">Verified by operator, ready for dispatch.</p>
            </div>
            <div className="p-2.5 rounded-lg bg-card border border-border/60">
              <span className="font-bold text-emerald-700 dark:text-emerald-400">4. Sent</span>
              <p className="text-muted-foreground mt-0.5">Transmitted to the customer via email/SMS.</p>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {statuses.map((st) => (
          <button
            key={st.label}
            onClick={() => setStatusFilter(st.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
              statusFilter === st.value
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-card text-muted-foreground hover:bg-muted border border-border/80'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Communications Feed */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full rounded-xl" />
              ))}
            </div>
          ) : !commsData || commsData.communications.length === 0 ? (
            <div className="p-12 text-center">
              <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
              <h4 className="text-sm font-semibold text-foreground">No communications found</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Create a personalized communication draft or run the FlowAI Retention Agent to start engaging buyers.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {commsData.communications.map((comm) => (
                <div key={comm.id} className="p-4 sm:p-6 hover:bg-muted/10 transition-colors space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CommunicationStatusBadge status={comm.status} />
                      <h4 className="font-semibold text-foreground text-sm">{comm.subject}</h4>
                      {comm.generated_by_ai && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          <Sparkles className="w-3 h-3" /> FlowAI Assisted
                        </span>
                      )}
                    </div>

                    {/* Action buttons depending on status */}
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      {comm.status === 'pending_approval' && (
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => updateStatusMutation.mutate({ id: comm.id, status: 'approved' })}
                          isLoading={updateStatusMutation.isPending}
                          className="text-xs h-7"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" />
                          Approve Draft
                        </Button>
                      )}

                      {comm.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => updateStatusMutation.mutate({ id: comm.id, status: 'pending_approval' })}
                          isLoading={updateStatusMutation.isPending}
                          className="text-xs h-7"
                        >
                          Submit for Approval
                        </Button>
                      )}

                      {comm.status === 'approved' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateStatusMutation.mutate({ id: comm.id, status: 'sent' })}
                          isLoading={updateStatusMutation.isPending}
                          className="text-xs h-7 text-emerald-600 border-emerald-300 dark:border-emerald-700"
                        >
                          <Send className="w-3.5 h-3.5 mr-1" />
                          Mark as Sent
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Body text */}
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 text-xs text-foreground whitespace-pre-wrap leading-relaxed font-sans">
                    {comm.message}
                  </div>

                  {/* Footer metadata */}
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground pt-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-foreground">
                        <User className="w-3.5 h-3.5 text-muted-foreground" />
                        {comm.customer
                          ? `${comm.customer.first_name} ${comm.customer.last_name}`
                          : 'Target Customer'}
                      </span>
                      <span>•</span>
                      <span>Purpose: <span className="text-foreground capitalize">{comm.purpose.replace('_', ' ')}</span></span>
                      <span>•</span>
                      <span>Channel: <span className="text-foreground uppercase">{comm.channel}</span></span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{new Date(comm.created_at).toLocaleDateString()}</span>
                      {comm.approved_by && (
                        <span>• Approved by {comm.approved_by}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Composer Modal */}
      <Dialog
        isOpen={isComposerOpen}
        onClose={() => setIsComposerOpen(false)}
        title="Compose Customer Communication"
        description="Draft and verify communication before dispatch. Operator review required."
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {/* Target Customer Dropdown */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Recipient Customer</label>
            <select
              className="w-full p-2.5 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
              value={targetCustomerId}
              onChange={(e) => setTargetCustomerId(e.target.value)}
            >
              <option value="">Select a customer...</option>
              {customersData?.customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.first_name} {c.last_name} — {c.email} ({c.segment})
                </option>
              ))}
            </select>
          </div>

          {/* Purpose & FlowAI Generator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground">Communication Purpose</label>
              <select
                className="w-full p-2.5 rounded-lg border border-input bg-background text-foreground text-xs focus:outline-none focus:ring-2 focus:ring-ring"
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as CommunicationPurpose)}
              >
                <option value="thank_you">Thank-You Message</option>
                <option value="order_followup">Order Follow-Up</option>
                <option value="customer_reengagement">Customer Re-engagement</option>
                <option value="support_response">Support Response</option>
                <option value="general">General Outreach</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                variant="outline"
                className="w-full text-xs h-[38px] border-indigo-300 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50"
                disabled={!targetCustomerId}
                isLoading={aiGenerateMutation.isPending}
                onClick={() => {
                  if (targetCustomerId) {
                    aiGenerateMutation.mutate({ customerId: targetCustomerId, purpose });
                  }
                }}
              >
                <Bot className="w-4 h-4 mr-1.5 text-indigo-500" />
                FlowAI Draft Generator
              </Button>
            </div>
          </div>

          {/* Subject Line */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Subject Line</label>
            <Input
              placeholder="e.g. Thank you for your recent purchase!"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          {/* Message Body */}
          <div className="space-y-1.5">
            <label className="font-semibold text-foreground">Message Body</label>
            <textarea
              className="w-full p-3 rounded-lg border border-input bg-background text-foreground text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring font-sans"
              rows={5}
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Workflow Status selector */}
          <div className="space-y-1.5 pt-1">
            <label className="font-semibold text-foreground">Save Lifecycle Status</label>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="saveStatus"
                  value="pending_approval"
                  checked={saveStatus === 'pending_approval'}
                  onChange={() => setSaveStatus('pending_approval')}
                />
                <span>Submit for Approval (Recommended)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="saveStatus"
                  value="draft"
                  checked={saveStatus === 'draft'}
                  onChange={() => setSaveStatus('draft')}
                />
                <span>Save as Draft</span>
              </label>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-2 pt-4 border-t border-border/80">
            <Button variant="ghost" onClick={() => setIsComposerOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              isLoading={createMutation.isPending}
              disabled={!targetCustomerId || !subject.trim() || !message.trim()}
            >
              Save Communication Record
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
