import type { BudgetDataAPI, GetBudgetResponse } from "../types/api.types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "";

export class BudgetService {
  /**
   * Fetch budget data for a specific event
   * In development, loads from local JSON file
   * In production, calls the backend API
   */
  static async getBudgetData(eventId: string): Promise<BudgetDataAPI> {
    try {
      // For development: load from local JSON
      if (!API_BASE_URL || process.env.NODE_ENV === "development") {
        const response = await fetch("/data/budget-sample.json");
        if (!response.ok) {
          throw new Error("Failed to load budget data");
        }
        const data = await response.json();
        return data as BudgetDataAPI;
      }

      // For production: call backend API
      const response = await fetch(`${API_BASE_URL}/api/budgets/${eventId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          // Add authentication headers here
          // 'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch budget: ${response.statusText}`);
      }

      const result: GetBudgetResponse = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to load budget data");
      }

      return result.data;
    } catch (error) {
      console.error("Error fetching budget data:", error);
      throw error;
    }
  }

  /**
   * Create a new expense
   */
  static async createExpense(eventId: string, expenseData: any): Promise<void> {
    if (!API_BASE_URL) {
      console.log("Development mode: Expense would be created", expenseData);
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/budgets/${eventId}/expenses`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to create expense");
    }
  }

  /**
   * Update an existing expense
   */
  static async updateExpense(
    eventId: string,
    expenseId: string,
    updates: any,
  ): Promise<void> {
    if (!API_BASE_URL) {
      console.log("Development mode: Expense would be updated", {
        expenseId,
        updates,
      });
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/budgets/${eventId}/expenses/${expenseId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to update expense");
    }
  }

  /**
   * Delete an expense
   */
  static async deleteExpense(
    eventId: string,
    expenseId: string,
  ): Promise<void> {
    if (!API_BASE_URL) {
      console.log("Development mode: Expense would be deleted", expenseId);
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/budgets/${eventId}/expenses/${expenseId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to delete expense");
    }
  }

  /**
   * Create a new category
   */
  static async createCategory(
    eventId: string,
    categoryData: any,
  ): Promise<void> {
    if (!API_BASE_URL) {
      console.log("Development mode: Category would be created", categoryData);
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/budgets/${eventId}/categories`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(categoryData),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to create category");
    }
  }

  /**
   * Update category allocation
   */
  static async updateCategory(
    eventId: string,
    categoryId: string,
    updates: any,
  ): Promise<void> {
    if (!API_BASE_URL) {
      console.log("Development mode: Category would be updated", {
        categoryId,
        updates,
      });
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/budgets/${eventId}/categories/${categoryId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      },
    );

    if (!response.ok) {
      throw new Error("Failed to update category");
    }
  }

  /**
   * Delete a category
   */
  static async deleteCategory(
    eventId: string,
    categoryId: string,
  ): Promise<void> {
    if (!API_BASE_URL) {
      console.log("Development mode: Category would be deleted", categoryId);
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/api/budgets/${eventId}/categories/${categoryId}`,
      {
        method: "DELETE",
      },
    );

    if (!response.ok) {
      throw new Error("Failed to delete category");
    }
  }

  /**
   * Update overall budget
   */
  static async updateBudget(eventId: string, updates: any): Promise<void> {
    if (!API_BASE_URL) {
      console.log("Development mode: Budget would be updated", updates);
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/budgets/${eventId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error("Failed to update budget");
    }
  }

  /**
   * Get vendors for an event
   */
  static async getVendors(eventId: string): Promise<any[]> {
    if (!API_BASE_URL) {
      // Load from the same JSON file
      const response = await fetch("/data/budget-sample.json");
      const data = await response.json();
      return data.vendors || [];
    }

    const response = await fetch(
      `${API_BASE_URL}/api/budgets/${eventId}/vendors`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch vendors");
    }
    return response.json();
  }

  /**
   * Get analytics data
   */
  static async getAnalytics(eventId: string): Promise<any> {
    if (!API_BASE_URL) {
      // Load from the same JSON file
      const response = await fetch("/data/budget-sample.json");
      const data = await response.json();
      return data.analytics || {};
    }

    const response = await fetch(
      `${API_BASE_URL}/api/budgets/${eventId}/analytics`,
    );
    if (!response.ok) {
      throw new Error("Failed to fetch analytics");
    }
    return response.json();
  }
}
