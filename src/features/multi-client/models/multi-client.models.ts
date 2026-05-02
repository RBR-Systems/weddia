export type ClientStatus = 'on_track' | 'at_risk' | 'over_budget' | 'completed';

export interface ClientBudget {
  id: string;
  clientName: string;
  partnerName?: string;
  weddingDate: string;
  totalBudget: number;
  totalSpent: number;
  status: ClientStatus;
  lastUpdated: string;
  expenseCount?: number;
}

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
