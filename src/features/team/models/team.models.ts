export type TeamMember = {
  member_id: number;
  organization_id?: number | null;
  user_id?: number | null;
  role_id?: number | null;
  status?: string | null;
  permissions?: string | null;
  joined_at?: string | null;
  invited_at?: string | null;
};

export type MemberEvent = {
  member_id: number;
  event_id: number;
  status?: string | null;
};

export type TeamMemberFormValues = {
  organization_id: number;
  user_id: number;
  role_id?: number;
  status: string;
  permissions?: string;
};

export type MemberEventFormValues = {
  member_id: number;
  event_id: number;
  status: string;
};
