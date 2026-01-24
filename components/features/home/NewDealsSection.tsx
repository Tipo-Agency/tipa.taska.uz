/**
 * NewDealsSection - секция новых сделок на главной странице
 */
import React from 'react';
import { Deal, User, Client } from '../../../types';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { ArrowRight, Briefcase } from 'lucide-react';
import { Card } from '../../ui/Card';

interface NewDealsSectionProps {
  deals: Deal[];
  clients: Client[];
  users: User[];
  onViewAll: () => void;
  maxItems?: number;
}

export const NewDealsSection: React.FC<NewDealsSectionProps> = ({
  deals,
  clients,
  users,
  onViewAll,
  onDealClick,
  maxItems = 5,
}) => {
  const newDeals = deals
    .filter(d => d && d.stage === 'new' && !d.isArchived)
    .slice(0, maxItems);

  if (newDeals.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase flex items-center gap-2">
          <Briefcase size={16} />
          Новые заявки ({deals.filter(d => d && d.stage === 'new' && !d.isArchived).length})
        </h2>
        {deals.filter(d => d && d.stage === 'new' && !d.isArchived).length > maxItems && (
          <Button variant="ghost" size="sm" icon={ArrowRight} iconPosition="right" onClick={onViewAll}>
            Все заявки
          </Button>
        )}
      </div>
      <div className="space-y-2">
        {newDeals.map((deal) => {
          const client = clients.find(c => c.id === deal.clientId);
          return (
            <Card
              key={deal.id}
              className="p-3 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onDealClick ? onDealClick(deal) : onViewAll()}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
                    {client?.name || 'Без клиента'}
                  </h3>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {deal.amount > 0 && `${deal.amount.toLocaleString()} ${deal.currency || 'UZS'}`}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
