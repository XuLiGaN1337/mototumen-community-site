import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Icon from "@/components/ui/icon";
import { useAuth } from "@/contexts/AuthContext";
import { ModerationFilters } from "./moderation/ModerationFilters";
import { OrganizationRequestCard } from "./moderation/OrganizationRequestCard";
import { RequestsTable } from "./moderation/RequestsTable";
import { RequestDetailsModal } from "./moderation/RequestDetailsModal";

interface OrganizationRequest {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  organization_name: string;
  organization_type: 'shop' | 'service' | 'school';
  description: string;
  address: string;
  phone: string;
  email: string;
  website?: string;
  working_hours?: string;
  additional_info?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  review_comment?: string;
}

interface AdminModerationProps {
  pendingItems: any[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const ADMIN_API = 'https://functions.poehali.dev/f34bd996-f5f2-4c81-8b7b-fb5621187a7f';

export const AdminModeration: React.FC<AdminModerationProps> = ({ 
  pendingItems, 
  onApprove, 
  onReject 
}) => {
  const { token, user } = useAuth();
  const [requests, setRequests] = useState<OrganizationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [selectedRequest, setSelectedRequest] = useState<OrganizationRequest | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState<number | null>(null);

  const isCEO = user?.role === 'ceo';

  useEffect(() => {
    if (!isCEO || !token) {
      setLoading(false);
      return;
    }
    
    loadRequests();
  }, [isCEO, token]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${ADMIN_API}?action=organization-requests`, {
        headers: { 'X-Auth-Token': token || '' }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to load organization requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!selectedRequest) return;
    
    setActionLoading(true);
    try {
      const response = await fetch(`${ADMIN_API}?action=organization-request`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          status: 'approved'
        })
      });

      if (response.ok) {
        await loadRequests();
        setShowModal(false);
        setSelectedRequest(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при одобрении заявки');
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
      alert('Не удалось одобрить заявку');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!selectedRequest) return;
    
    const comment = prompt('Причина отклонения (необязательно):');
    
    setActionLoading(true);
    try {
      const response = await fetch(`${ADMIN_API}?action=organization-request`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({
          request_id: selectedRequest.id,
          status: 'rejected',
          review_comment: comment || ''
        })
      });

      if (response.ok) {
        await loadRequests();
        setShowModal(false);
        setSelectedRequest(null);
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при отклонении заявки');
      }
    } catch (error) {
      console.error('Failed to reject request:', error);
      alert('Не удалось отклонить заявку');
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveRequest = async (requestId: number) => {
    if (!isCEO) return;
    
    if (!confirm('Переместить заявку в архив?')) return;
    
    setArchiveLoading(requestId);
    try {
      const response = await fetch(`${ADMIN_API}?action=organization-request`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Auth-Token': token || ''
        },
        body: JSON.stringify({
          request_id: requestId,
          status: 'archived'
        })
      });

      if (response.ok) {
        await loadRequests();
      } else {
        const data = await response.json();
        alert(data.error || 'Ошибка при архивации заявки');
      }
    } catch (error) {
      console.error('Failed to archive request:', error);
      alert('Не удалось архивировать заявку');
    } finally {
      setArchiveLoading(null);
    }
  };

  const handleViewDetails = (request: OrganizationRequest) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const getPendingCount = (type: string) => {
    if (type === 'all') {
      return requests.filter(r => r.status === 'pending').length;
    }
    return requests.filter(r => r.status === 'pending' && r.organization_type === type).length;
  };

  const [showArchive, setShowArchive] = useState(false);

  const getFilteredRequests = () => {
    const pool = showArchive
      ? requests.filter(r => r.status === 'archived')
      : requests.filter(r => r.status !== 'archived');
    if (selectedFilter === 'all') return pool;
    return pool.filter(r => r.organization_type === selectedFilter);
  };

  const handleUnarchiveRequest = async (requestId: number) => {
    setArchiveLoading(requestId);
    try {
      const response = await fetch(`${ADMIN_API}?action=organization-request`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'X-Auth-Token': token || '' },
        body: JSON.stringify({ request_id: requestId, status: 'pending' }),
      });
      if (response.ok) {
        await loadRequests();
      }
    } catch (error) {
      console.error('Failed to unarchive:', error);
    } finally {
      setArchiveLoading(null);
    }
  };

  if (!isCEO) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Icon name="Lock" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-400">Только CEO имеет доступ к модерации организаций</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#004488] mx-auto mb-4"></div>
          <p className="text-gray-400">Загрузка заявок...</p>
        </CardContent>
      </Card>
    );
  }

  const archivedCount = requests.filter(r => r.status === 'archived').length;
  const filteredRequests = getFilteredRequests();

  return (
    <div className="space-y-4">
      {/* Шапка с фильтрами и кнопкой Архива */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex-1">
          <ModerationFilters
            selectedFilter={selectedFilter}
            onFilterChange={setSelectedFilter}
            getPendingCount={getPendingCount}
          />
        </div>
        <button
          onClick={() => setShowArchive(!showArchive)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all flex-shrink-0 ${
            showArchive
              ? 'bg-zinc-700 border-zinc-500 text-white'
              : 'border-zinc-700 text-gray-400 hover:text-white hover:border-zinc-500'
          }`}
        >
          <Icon name="Archive" className="h-4 w-4" />
          Архив {archivedCount > 0 && <span className="bg-zinc-600 text-xs px-1.5 py-0.5 rounded-full">{archivedCount}</span>}
        </button>
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name={showArchive ? 'Archive' : 'Inbox'} className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">{showArchive ? 'Архив пуст' : 'Нет заявок для отображения'}</p>
          </CardContent>
        </Card>
      ) : showArchive ? (
        /* Архивные заявки — упрощённый список с кнопкой восстановления */
        <div className="space-y-2">
          {filteredRequests.map((req) => (
            <Card key={req.id}>
              <CardContent className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{req.organization_name}</p>
                  <p className="text-xs text-muted-foreground">{req.user_name} · {req.organization_type} · {new Date((req.created_at.endsWith('Z') ? req.created_at : req.created_at + 'Z')).toLocaleDateString('ru-RU')}</p>
                  {req.review_comment && <p className="text-xs text-muted-foreground mt-1 italic">«{req.review_comment}»</p>}
                </div>
                <button
                  onClick={() => handleUnarchiveRequest(req.id)}
                  disabled={archiveLoading === req.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-600 text-xs text-gray-300 hover:text-white hover:border-zinc-400 transition-all flex-shrink-0 disabled:opacity-50"
                >
                  {archiveLoading === req.id ? <Icon name="Loader2" className="h-3.5 w-3.5 animate-spin" /> : <Icon name="RotateCcw" className="h-3.5 w-3.5" />}
                  Восстановить
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <RequestsTable
              requests={filteredRequests}
              onViewDetails={handleViewDetails}
              onArchive={handleArchiveRequest}
              archiveLoading={archiveLoading}
              isCEO={isCEO}
            />
          </div>

          <div className="md:hidden space-y-4">
            {filteredRequests.map((request) => (
              <OrganizationRequestCard
                key={request.id}
                request={request}
                onViewDetails={handleViewDetails}
                onArchive={handleArchiveRequest}
                archiveLoading={archiveLoading === request.id}
                isCEO={isCEO}
              />
            ))}
          </div>
        </>
      )}

      {showModal && selectedRequest && (
        <RequestDetailsModal
          request={selectedRequest}
          onClose={() => {
            setShowModal(false);
            setSelectedRequest(null);
          }}
          onApprove={handleApproveRequest}
          onReject={handleRejectRequest}
          actionLoading={actionLoading}
        />
      )}
    </div>
  );
};