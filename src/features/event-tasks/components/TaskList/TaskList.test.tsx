import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TaskList from "./TaskList";
import type { Task, TaskCategory } from "../../models/task.models";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const LONG_TITLE =
  "Confirm final headcount with the caterer and cross-check against the venue capacity limits";

const mockTask: Task = {
  task_id: "task-1",
  event_id: "event-1",
  category_id: "cat-1",
  template_id: null,
  title: LONG_TITLE,
  description: "Follow up before the deadline",
  due_date: "2026-09-15T00:00:00.000Z",
  start_date: null,
  priority: "high",
  status: "pending",
  completion_percentage: 20,
  is_milestone: false,
  task_dependency_id: null,
  dependency_type: null,
  estimated_cost: 0,
  actual_cost: null,
  estimated_hours: 2,
  actual_hours: null,
  is_recurring: false,
  recurrence_pattern: null,
  parent_task_id: null,
  sort_order: 1,
  attachments: [],
  tags: [],
  visibility: "shared",
  location: null,
  notes: null,
  completed_at: null,
  archived_at: null,
  created_at: "2026-08-01T00:00:00.000Z",
  updated_at: "2026-08-01T00:00:00.000Z",
  created_by: "user-1",
  updated_by: "user-1",
  category_name: "Catering",
  category_color: "#ff9900",
  assignees: [],
  comments_count: 0,
  subtasks_count: 0,
  subtasks_completed: 0,
};

const mockCategories: TaskCategory[] = [
  { id: "cat-1", name: "Catering", color: "#ff9900", count: 1, completedCount: 0 },
];

const noop = () => {};

describe("TaskList table view", () => {
  it("shows the task title and keeps the table horizontally scrollable instead of truncating it away", async () => {
    const user = userEvent.setup();
    render(
      <TaskList
        tasks={[mockTask]}
        categories={mockCategories}
        onTaskClick={noop}
        onQuickComplete={noop}
        onNewTask={noop}
        onDeleteTasks={noop}
      />,
    );

    // Switch from the default "cards" view to "table" view.
    await user.click(screen.getByText("tasks.viewMode.table"));

    // (a) the task title is visible in the DOM.
    expect(screen.getByText(LONG_TITLE)).toBeInTheDocument();

    // (b) the title column isn't crushed to an unreadably small width — the
    // table must be configured with horizontal scroll (scroll.x) rather than
    // relying on column ellipsis alone to fit the viewport.
    const scrollContainer = document.querySelector(".ant-table-content");
    expect(scrollContainer).not.toBeNull();
    const tableWrapper = document.querySelector(".ant-table");
    expect(tableWrapper?.className).toContain("ant-table-scroll-horizontal");
  });
});
