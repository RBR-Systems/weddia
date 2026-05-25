"use client";
import { useCallback, useEffect, useState } from "react";
import type { Organization, OrgUser, OrgRole, OrgFormValues, UserFormValues } from "../models/organizations.models";
import {
  fetchOrganizations,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  fetchUsers,
  createUser,
  fetchRoles,
} from "../api/organizationsApi";

export function useOrganizations() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [users, setUsers] = useState<OrgUser[]>([]);
  const [roles, setRoles] = useState<OrgRole[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [orgsData, usersData, rolesData] = await Promise.all([
        fetchOrganizations(),
        fetchUsers(),
        fetchRoles(),
      ]);
      setOrgs(orgsData);
      setUsers(usersData);
      setRoles(rolesData);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const addOrg = useCallback(async (values: OrgFormValues): Promise<void> => {
    const created = await createOrganization(values);
    setOrgs((prev) => [...prev, created]);
  }, []);

  const editOrg = useCallback(async (id: number, values: OrgFormValues): Promise<void> => {
    await updateOrganization(id, values);
    setOrgs((prev) => prev.map((o) => (o.organization_id === id ? { ...o, ...values } : o)));
  }, []);

  const removeOrg = useCallback(async (id: number): Promise<void> => {
    await deleteOrganization(id);
    setOrgs((prev) => prev.filter((o) => o.organization_id !== id));
  }, []);

  const addUser = useCallback(async (values: UserFormValues): Promise<void> => {
    const created = await createUser(values);
    setUsers((prev) => [...prev, created]);
  }, []);

  return {
    orgs,
    users,
    roles,
    loading,
    reload: load,
    addOrg,
    editOrg,
    removeOrg,
    addUser,
  };
}
