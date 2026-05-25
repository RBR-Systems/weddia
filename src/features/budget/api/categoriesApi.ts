import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/shared/api/apiClient";
import type { CatalogCategory } from "../models/budget.models";
import type { ApiCategory } from "../models/apiRaw.models";
import { ADMIN_QUERY_PARAM } from "../constants/budget.constants";

// Re-export under the legacy name so existing consumers don't need to change
export type { CatalogCategory as BudgetCategory };

function mapCategory(c: ApiCategory): CatalogCategory {
  return {
    category_id: String(c.categoryId),
    name: c.name,
    description: c.description ?? "",
  };
}

export const CategoriesService = {
  async getAll(): Promise<CatalogCategory[]> {
    try {
      const raw = await apiGet<ApiCategory[]>("/api/categoriesexpensebudget");
      return Array.isArray(raw) ? raw.map(mapCategory) : [];
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return [];
      throw err;
    }
  },

  async create(name: string, description: string): Promise<CatalogCategory> {
    const raw = await apiPost<ApiCategory>(
      `/api/categoriesexpensebudget?${ADMIN_QUERY_PARAM}`,
      { name, description },
    );
    return mapCategory(raw);
  },

  async update(id: string, name: string, description: string): Promise<void> {
    await apiPut(`/api/categoriesexpensebudget/${id}?${ADMIN_QUERY_PARAM}`, {
      name,
      description,
    });
  },

  async remove(id: string): Promise<void> {
    await apiDelete(`/api/categoriesexpensebudget/${id}`);
  },
};

