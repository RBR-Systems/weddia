import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/api/apiClient";
import { ADMIN_QUERY_PARAM } from "@/shared/constants/api.constants";
import type { TeamMember, MemberEvent, TeamMemberFormValues, MemberEventFormValues } from "../models/team.models";

interface ApiMember {
  memberId: number;
  organizationId?: number | null;
  userId?: number | null;
  roleId?: number | null;
  status?: string | null;
  permissions?: string | null;
  joinedAt?: string | null;
  invitedAt?: string | null;
}

interface ApiMemberEvent {
  memberId: number;
  eventId: number;
  status?: string | null;
}

function mapMember(m: ApiMember): TeamMember {
  return {
    member_id: m.memberId,
    organization_id: m.organizationId,
    user_id: m.userId,
    role_id: m.roleId,
    status: m.status,
    permissions: m.permissions,
    joined_at: m.joinedAt,
    invited_at: m.invitedAt,
  };
}

function mapMemberEvent(me: ApiMemberEvent): MemberEvent {
  return {
    member_id: me.memberId,
    event_id: me.eventId,
    status: me.status,
  };
}

export async function fetchMembers(): Promise<TeamMember[]> {
  const data = await apiGet<ApiMember[]>("/api/organizationalteammembers");
  return data.map(mapMember);
}

export async function fetchMembersByOrg(orgId: number): Promise<TeamMember[]> {
  const data = await apiGet<ApiMember[]>(`/api/organizationalteammembers/organization/${orgId}`);
  return data.map(mapMember);
}

export async function createMember(values: TeamMemberFormValues): Promise<TeamMember> {
  const data = await apiPost<ApiMember>("/api/organizationalteammembers", {
    organizationId: values.organization_id,
    userId: values.user_id,
    roleId: values.role_id ?? null,
    status: values.status,
    permissions: values.permissions ?? null,
    joinedAt: null,
  });
  return mapMember(data);
}

export async function updateMember(id: number, values: Partial<TeamMemberFormValues>): Promise<void> {
  await apiPut(`/api/organizationalteammembers/${id}`, {
    organizationId: values.organization_id ?? null,
    userId: values.user_id ?? null,
    roleId: values.role_id ?? null,
    status: values.status ?? null,
    permissions: values.permissions ?? null,
    joinedAt: null,
  });
}

export async function deleteMember(id: number): Promise<void> {
  await apiDelete(`/api/organizationalteammembers/${id}`);
}

export async function fetchMemberEvents(): Promise<MemberEvent[]> {
  const data = await apiGet<ApiMemberEvent[]>("/api/organizationalmemberevents");
  return data.map(mapMemberEvent);
}

export async function createMemberEvent(values: MemberEventFormValues): Promise<MemberEvent> {
  const data = await apiPost<ApiMemberEvent>(`/api/organizationalmemberevents?${ADMIN_QUERY_PARAM}`, {
    memberId: values.member_id,
    eventId: values.event_id,
    status: values.status,
  });
  return mapMemberEvent(data);
}

export async function deleteMemberEvent(memberId: number, eventId: number): Promise<void> {
  await apiDelete(`/api/organizationalmemberevents/${memberId}/${eventId}`);
}
