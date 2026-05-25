import { apiGet, apiPost, apiPut, apiDelete } from "@/shared/api/apiClient";
import { ADMIN_QUERY_PARAM } from "@/shared/constants/api.constants";
import type { Organization, OrgUser, OrgRole, OrgFormValues, UserFormValues } from "../models/organizations.models";

interface ApiOrg {
  organizationId: number;
  name: string;
  description?: string | null;
  ownerId: number;
  status: string;
}

interface ApiUser {
  userId: number;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  mobilePhone?: string | null;
  phone?: string | null;
  isActive: boolean;
  userType: string;
}

interface ApiRole {
  roleId: number;
  roleName: string;
  description?: string | null;
}

function mapOrg(o: ApiOrg): Organization {
  return {
    organization_id: o.organizationId,
    name: o.name,
    description: o.description,
    owner_id: o.ownerId,
    status: o.status,
  };
}

function mapUser(u: ApiUser): OrgUser {
  return {
    user_id: u.userId,
    email: u.email,
    first_name: u.firstName,
    last_name: u.lastName,
    mobile_phone: u.mobilePhone,
    phone: u.phone,
    is_active: u.isActive,
    user_type: u.userType ?? "member",
  };
}

function mapRole(r: ApiRole): OrgRole {
  return {
    role_id: r.roleId,
    role_name: r.roleName,
    description: r.description,
  };
}

export async function fetchOrganizations(): Promise<Organization[]> {
  const data = await apiGet<ApiOrg[]>("/api/organizations");
  return data.map(mapOrg);
}

export async function createOrganization(values: OrgFormValues): Promise<Organization> {
  const data = await apiPost<ApiOrg>(`/api/organizations?${ADMIN_QUERY_PARAM}`, {
    name: values.name,
    description: values.description ?? null,
    ownerId: values.owner_id,
    status: values.status,
  });
  return mapOrg(data);
}

export async function updateOrganization(id: number, values: OrgFormValues): Promise<void> {
  await apiPut(`/api/organizations/${id}?${ADMIN_QUERY_PARAM}`, {
    name: values.name,
    description: values.description ?? null,
    ownerId: values.owner_id,
    status: values.status,
  });
}

export async function deleteOrganization(id: number): Promise<void> {
  await apiDelete(`/api/organizations/${id}`);
}

export async function fetchUsers(): Promise<OrgUser[]> {
  const data = await apiGet<ApiUser[]>("/api/users");
  return data.map(mapUser);
}

export async function createUser(values: UserFormValues): Promise<OrgUser> {
  const data = await apiPost<ApiUser>("/api/users", {
    email: values.email,
    firstName: values.first_name ?? null,
    lastName: values.last_name ?? null,
    mobilePhone: values.mobile_phone ?? null,
    password: values.password,
  });
  return mapUser(data);
}

export async function fetchRoles(): Promise<OrgRole[]> {
  const data = await apiGet<ApiRole[]>("/api/roles");
  return data.map(mapRole);
}
