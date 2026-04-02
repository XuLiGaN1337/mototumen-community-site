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

  const getFilteredRequests = () => {
    if (selectedFilter === 'all') {
      return requests;
    }
    return requests.filter(r => r.organization_type === selectedFilter);
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

  const filteredRequests = getFilteredRequests();

  return (
    <div className="space-y-4">
      <ModerationFilters
        selectedFilter={selectedFilter}
        onFilterChange={setSelectedFilter}
        getPendingCount={getPendingCount}
      />

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Icon name="Inbox" className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Нет заявок для отображения</p>
          </CardContent>
        </Card>
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