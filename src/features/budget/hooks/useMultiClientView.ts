'use client';
import { useState, useMemo } from 'react';
import { MOCK_CLIENTS } from '../constants/planner.constants';
import type { ClientBudget } from '../models/budget.models';

const TOTAL_MANAGED_BUDGET = MOCK_CLIENTS.reduce((sum, c) => sum + c.totalBudget, 0);
const ACTIVE_CLIENTS_COUNT = MOCK_CLIENTS.filter((c) => c.status !== 'completed').length;
const AT_RISK_CLIENTS_COUNT = MOCK_CLIENTS.filter(
  (c) => c.status === 'at_risk' || c.status === 'over_budget',
).length;

export interface UseMultiClientViewResult {
  clients: ClientBudget[];
  filteredClients: ClientBudget[];
  totalManagedBudget: number;
  activeClientsCount: number;
  atRiskClientsCount: number;
  searchTerm: string;
  statusFilter: string | null;
  setSearchTerm: (term: string) => void;
  setStatusFilter: (status: string | null) => void;
}

export const useMultiClientView = (): UseMultiClientViewResult => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filteredClients = useMemo(
    () =>
      MOCK_CLIENTS.filter((client) => {
        const matchesSearch = client.clientName
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesStatus = !statusFilter || client.status === statusFilter;
        return matchesSearch && matchesStatus;
      }),
    [searchTerm, statusFilter],
  );

  return {
    clients: MOCK_CLIENTS,
    filteredClients,
    totalManagedBudget: TOTAL_MANAGED_BUDGET,
    activeClientsCount: ACTIVE_CLIENTS_COUNT,
    atRiskClientsCount: AT_RISK_CLIENTS_COUNT,
    searchTerm,
    statusFilter,
    setSearchTerm,
    setStatusFilter,
  };
};
