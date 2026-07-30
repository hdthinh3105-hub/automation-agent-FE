export interface UserSummary {
  id: string;
  email: string;
  role: 'ADMIN' | 'AGENT' | 'VIEWER';
}

export interface TicketListItem {
  id: string;
  customerId: string;
  customerEmail: string;
  channel: string;
  subject: string;
  status: string;
  category: string | null;
  priority: string | null;
  assignedAgentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TicketMessageItem {
  id: string;
  sender: string;
  content: string;
  createdAt: string;
}

export interface TicketTimelineEntry {
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  reason: string | null;
  changedAt: string;
}

export interface TicketDetail extends TicketListItem {
  confidenceScore: number | null;
  isSpam: boolean;
  missingInfoFlags: string[];
  resolvedAt: string | null;
  messages: TicketMessageItem[];
  timeline: TicketTimelineEntry[];
}

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface OverviewStats {
  totalTickets: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  autoResolveRate: number;
  escalationRate: number;
}

export interface TrendPoint {
  date: string;
  totalTickets: number;
  autoResolvedCount: number;
  escalatedCount: number;
  avgConfidence: number | null;
}

export interface AiPerformanceStats {
  avgConfidence: number | null;
  autoResolveRate: number;
  escalationRate: number;
}

export const TICKET_STATUSES = [
  'NEW',
  'CLASSIFIED',
  'WAITING_CUSTOMER',
  'ANSWERED',
  'ESCALATED',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
] as const;

export const PRIORITY_LEVELS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;