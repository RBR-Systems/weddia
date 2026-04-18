import { apiGet, apiPost, apiPut, apiDelete, ApiError } from "@/shared/api/apiClient";

export interface BudgetCategory {
  category_id: string;
  name: string;
  description: string;
}

interface ApiCategory {
  categoryId: number;
  name: string;
  description?: string | null;
}

function mapCategory(c: ApiCategory): BudgetCategory {
  return {
    category_id: String(c.categoryId),
    name: c.name,
    description: c.description ?? "",
  };
}

export const CategoriesService = {
  async getAll(): Promise<BudgetCategory[]> {
    try {
      const raw = await apiGet<ApiCategory[]>("/api/categoriesexpensebudget");
      return Array.isArray(raw) ? raw.map(mapCategory) : [];
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) return [];
      throw err;
    }
  },

  async create(name: string, description: string): Promise<BudgetCategory> {
    const raw = await apiPost<ApiCategory>(
      "/api/categoriesexpensebudget?adminId=1",
      { name, description },
    );
    return mapCategory(raw);
  },

  async update(id: string, name: string, description: string): Promise<void> {
    await apiPut(`/api/categoriesexpensebudget/${id}?adminId=1`, {
      name,
      description,
    });
  },

  async remove(id: string): Promise<void> {
    await apiDelete(`/api/categoriesexpensebudget/${id}`);
  },
};
