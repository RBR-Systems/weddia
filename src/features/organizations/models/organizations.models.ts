export type Organization = {
  organization_id: number;
  name: string;
  description?: string | null;
  owner_id: number;
  status: string;
};

export type OrgUser = {
  user_id: number;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  mobile_phone?: string | null;
  phone?: string | null;
  is_active: boolean;
  user_type: string;
};

export type OrgRole = {
  role_id: number;
  role_name: string;
  description?: string | null;
};

export type OrgFormValues = {
  name: string;
  description?: string;
  owner_id: number;
  status: string;
};

export type UserFormValues = {
  email: string;
  first_name?: string;
  last_name?: string;
  mobile_phone?: string;
  password: string;
};
