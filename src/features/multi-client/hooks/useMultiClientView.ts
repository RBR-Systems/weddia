'use client';
import { useMemo, useState } from 'react';
import { useEvent } from '@/shared/contexts/EventContext';
import { EventStatus } from '@/features/events-list/models/enums/eventList.models';
import type { ClientBudget, ClientStatus, UseMultiClientViewResult } from '../models/multi-client.models';

function deriveStatus(eventStatus: EventStatus, budget: number, spent: number): ClientStatus {
  if (eventStatus === EventStatus.COMPLETED || eventStatus === EventStatus.CANCELED) return 'completed';
  if (budget <= 0) return 'on_track';
  const pct = spent / budget;
  if (pct >= 1) return 'over_budget';
  if (pct >= 0.8) return 'at_risk';
  return 'on_track';
}

export const useMultiClientView = (): UseMultiClientViewResult => {
  const { state: { events: { allEvents } } } = useEvent();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const clients: ClientBudget[] = useMemo(
    () =>
      allEvents.map((event) => {
        const budget = event.budget ?? 0;
        const spent = event.spent ?? 0;
        return {
          id: String(event.id ?? event.eventName),
          clientName: event.clients || event.eventName,
          weddingDate: event.date,
          totalBudget: budget,
          totalSpent: spent,
          status: deriveStatus(event.status, budget, spent),
          lastUpdated: new Date().toISOString(),
        };
      }),
    [allEvents],
  );

  const filteredClients = useMemo(
    () =>
      clients.filter((client) => {
        const matchesSearch = client.clientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || client.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [clients, searchTerm, statusFilter],
  );

  const totalManagedBudget = useMemo(() => clients.reduce((sum, c) => sum + c.totalBudget, 0), [clients]);
  const activeClientsCount = useMemo(() => clients.filter((c) => c.status !== 'completed').length, [clients]);
  const atRiskClientsCount = useMemo(
    () => clients.filter((c) => c.status === 'at_risk' || c.status === 'over_budget').length,
    [clients],
  );

  return {
    clients,
    filteredClients,
    totalManagedBudget,
    activeClientsCount,
    atRiskClientsCount,
    searchTerm,
    statusFilter,
    setSearchTerm,
    setStatusFilter,
  };
};
