import { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MessageSquare, Loader2, AlertCircle, X, CheckCircle } from 'lucide-react';
import apiClient from '@/lib/axios';
import { AlertDialog } from '@/components/ui/alert-dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QAPair {
  _id: string;
  question: string;
  answer: string;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export function QAManager() {
  const [qaPairs, setQaPairs] = useState<QAPair[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQA, setEditingQA] = useState<QAPair | null>(null);
  const [formData, setFormData] = useState({ question: '', answer: '' });
  const [submitting, setSubmitting] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; qa: QAPair | null }>({
    open: false,
    qa: null,
  });

  useEffect(() => {
    fetchQAPairs();
  }, [pagination.page]);

  const fetchQAPairs = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.get(`/qa?page=${pagination.page}&limit=${pagination.limit}`);
      if (response.data.status === 'success') {
        setQaPairs(response.data.data.qaPairs);
        setPagination(response.data.pagination);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch Q&A pairs');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingQA(null);
    setFormData({ question: '', answer: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (qa: QAPair) => {
    setEditingQA(qa);
    setFormData({ question: qa.question, answer: qa.answer });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQA(null);
    setFormData({ question: '', answer: '' });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question.trim() || !formData.answer.trim()) {
      setError('Both question and answer are required');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      if (editingQA) {
        // Update existing Q&A
        await apiClient.put(`/qa/${editingQA._id}`, formData);
        setSuccess('Q&A pair updated successfully!');
      } else {
        // Create new Q&A
        await apiClient.post('/qa', formData);
        setSuccess('Q&A pair created successfully!');
      }
      
      closeModal();
      fetchQAPairs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save Q&A pair');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (qa: QAPair) => {
    setDeleteDialog({ open: true, qa });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.qa) return;

    try {
      await apiClient.delete(`/api/qa/${deleteDialog.qa._id}`);
      setSuccess('Q&A pair deleted successfully!');
      fetchQAPairs();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete Q&A pair');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Q&A Pairs ({pagination.total})</h2>
          <p className="text-sm text-muted-foreground mt-1">Manage predefined questions and answers</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Q&A
        </button>
      </div>

      {/* Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-500/20 bg-green-500/10">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-600">{success}</AlertDescription>
        </Alert>
      )}

      {/* Q&A List */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : qaPairs.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No Q&A pairs created yet</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-primary hover:underline"
            >
              Create your first Q&A pair
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {qaPairs.map((qa) => (
              <div key={qa._id} className="p-6 hover:bg-muted/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-2">
                    <div>
                      <span className="text-xs font-medium text-primary uppercase">Question</span>
                      <p className="text-sm font-medium text-foreground mt-1">{qa.question}</p>
                    </div>
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">Answer</span>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{qa.answer}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                      <span>Created: {formatDate(qa.createdAt)}</span>
                      {qa.updatedAt !== qa.createdAt && (
                        <span>Updated: {formatDate(qa.updatedAt)}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(qa)}
                      className="p-2 rounded-lg text-primary hover:bg-primary/10 transition-colors"
                      aria-label="Edit Q&A"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(qa)}
                      className="p-2 rounded-lg text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Delete Q&A"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page - 1 })}
            disabled={pagination.page === 1}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-muted-foreground">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPagination({ ...pagination, page: pagination.page + 1 })}
            disabled={pagination.page === pagination.pages}
            className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h3 className="text-lg font-semibold text-card-foreground">
                {editingQA ? 'Edit Q&A Pair' : 'Create New Q&A Pair'}
              </h3>
              <button
                onClick={closeModal}
                className="p-2 rounded-lg hover:bg-secondary transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <label htmlFor="question" className="text-sm font-medium text-card-foreground block">
                  Question
                </label>
                <input
                  id="question"
                  type="text"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                  placeholder="Enter the question"
                  className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="answer" className="text-sm font-medium text-card-foreground block">
                  Answer
                </label>
                <textarea
                  id="answer"
                  value={formData.answer}
                  onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                  required
                  placeholder="Enter the answer"
                  rows={6}
                  className="w-full px-4 py-3 rounded-lg bg-input border border-border focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-colors text-foreground placeholder:text-muted-foreground resize-none"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-3 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {editingQA ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingQA ? 'Update Q&A' : 'Create Q&A'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, qa: null })}
        title="Delete Q&A Pair"
        description={`Are you sure you want to delete this Q&A pair?\n\nQuestion: "${deleteDialog.qa?.question}"\n\nThis action cannot be undone.`}
        onConfirm={confirmDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
}
