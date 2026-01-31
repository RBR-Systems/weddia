# Comprehensive Refactoring Plan

## Wedding Seating Application

---

## Executive Summary

This refactoring plan addresses architectural, organizational, and code quality improvements for a React-based wedding seating management application. The current codebase has **~1200 lines** in a single component file, mixed concerns, and opportunities for better separation of business logic.

**Goals:**

1. Improve maintainability and testability
2. Separate concerns (UI, business logic, data)
3. Enhance type safety
4. Optimize performance
5. Improve developer experience

---

## Phase 1: Project Structure & Organization

### 1.1 Directory Restructure

**Current Structure:**

```
/
├── TableAssignmentPage.tsx (1200+ lines)
├── SeatingAIChat.tsx
├── PannableScrollContainer.tsx
├── huggingface_service.ts
└── CSS modules
```

**Proposed Structure:**

```
src/
├── features/
│   ├── seating/
│   │   ├── components/
│   │   │   ├── TableAssignmentPage/
│   │   │   │   ├── index.tsx (100-150 lines)
│   │   │   │   ├── TableAssignmentPage.module.css
│   │   │   │   └── types.ts
│   │   │   ├── TableCanvas/
│   │   │   │   ├── TableCanvas.tsx
│   │   │   │   ├── TableTile.tsx
│   │   │   │   ├── TableCanvas.module.css
│   │   │   │   └── hooks/
│   │   │   │       ├── useTableDrag.ts
│   │   │   │       └── useTableDropZone.ts
│   │   │   ├── GuestList/
│   │   │   │   ├── GuestList.tsx
│   │   │   │   ├── GuestListItem.tsx
│   │   │   │   ├── DraggableGuestRow.tsx
│   │   │   │   ├── UnassignedDropZone.tsx
│   │   │   │   └── GuestList.module.css
│   │   │   ├── TableDetails/
│   │   │   │   ├── TableDetailsPanel.tsx
│   │   │   │   └── TableDetailsPanel.module.css
│   │   │   ├── SidePanel/
│   │   │   │   ├── SidePanel.tsx
│   │   │   │   └── SidePanel.module.css
│   │   │   └── ZoomControls/
│   │   │       └── ZoomControls.tsx
│   │   ├── hooks/
│   │   │   ├── useSeatingState.ts (main state management)
│   │   │   ├── useGuestFiltering.ts
│   │   │   ├── useTableAssignments.ts
│   │   │   ├── useDragAndDrop.ts
│   │   │   ├── useZoomControls.ts
│   │   │   └── useCoordinateConversion.ts
│   │   ├── services/
│   │   │   ├── seatingService.ts (business logic)
│   │   │   ├── assignmentService.ts
│   │   │   └── validationService.ts
│   │   ├── utils/
│   │   │   ├── tableHelpers.ts
│   │   │   ├── guestHelpers.ts
│   │   │   ├── coordinateHelpers.ts
│   │   │   └── dragHelpers.ts
│   │   └── types/
│   │       ├── models.ts (domain types)
│   │       └── ui.ts (UI-specific types)
│   │
│   └── ai-chat/
│       ├── components/
│       │   ├── SeatingAIChat/
│       │   │   ├── index.tsx
│       │   │   ├── MessageList.tsx
│       │   │   ├── MessageItem.tsx
│       │   │   ├── ChatInput.tsx
│       │   │   └── SeatingAIChat.module.css
│       ├── hooks/
│       │   ├── useAIChat.ts
│       │   └── useAIAssignments.ts
│       ├── services/
│       │   ├── huggingfaceService.ts
│       │   └── promptBuilder.ts
│       └── types/
│           └── index.ts
│
├── shared/
│   ├── components/
│   │   ├── PannableContainer/
│   │   │   ├── index.tsx
│   │   │   ├── usePannable.ts
│   │   │   └── types.ts
│   │   └── FloatingPanel/
│   │       └── FloatingPanel.tsx
│   ├── hooks/
│   │   ├── useLocalStorage.ts
│   │   └── useDebounce.ts
│   └── utils/
│       ├── formatting.ts
│       └── validation.ts
│
└── data/
    └── tables-data.json
```

**Benefits:**

- Clear feature boundaries
- Co-located related code
- Easier to find and modify specific functionality
- Better testability

---

## Phase 2: Type System Improvements

### 2.1 Create Domain Models

**File: `features/seating/types/models.ts`**

```typescript
// Core domain types with strict validation
export interface Guest {
  readonly guest_id: string;
  readonly event_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
  relation_id: string;
  plus_one: boolean;
  rsvp_status: RSVPStatus;
  party_size: number;
  dietary_restrictions?: string | null;
  accessibility_needs?: string | null;
  notes?: string | null;
}

export enum RSVPStatus {
  PENDING = "pending",
  CONFIRMED = "confirmed",
  DECLINED = "declined",
}

export interface Table {
  readonly table_id: string;
  readonly layout_id: string;
  total_number: number;
  shape: TableShape;
  x_grid: number;
  y_grid: number;
  x_m?: number;
  y_m?: number;
  width_m?: number;
  height_m?: number;
}

export enum TableShape {
  ROUND = "round",
  RECTANGULAR = "rectangular",
  SQUARE = "square",
}

export interface TableAssignment {
  readonly table_id: string;
  readonly guest_id: string;
  seat_number: number;
}

export interface Relation {
  readonly relation_id: string;
  name: string;
  description?: string | null;
}

export interface TableLayout {
  readonly layout_id: string;
  readonly event_id: string;
  x_grid_size: number;
  y_grid_size: number;
  name: string;
  description?: string | null;
  is_active: boolean;
}

// Computed/derived types
export interface TableWithAssignments extends Table {
  assignments: ReadonlyArray<TableAssignment>;
  occupancy: number;
  availableSeats: number;
}

export interface GuestWithRelation extends Guest {
  relation: Relation;
  isAssigned: boolean;
  assignedTableId?: string;
}
```

### 2.2 Create UI-Specific Types

**File: `features/seating/types/ui.ts`**

```typescript
export type DragId = `guest:${string}` | `table:${string}` | "unassigned";

export interface DragData {
  type: "guest" | "table";
  id: string;
  guestId?: string;
}

export type SideView = "guests" | "table";

export interface Position {
  x: number;
  y: number;
}

export interface Dimensions {
  width: number;
  height: number;
}

export interface ViewportState {
  zoom: number;
  metersToPixels: number;
  canvasWidth: number;
  canvasHeight: number;
}

export interface FilterState {
  searchQuery: string;
  relationId?: string;
}
```

---

## Phase 3: Extract Business Logic

### 3.1 Seating Service

**File: `features/seating/services/seatingService.ts`**

```typescript
import type { Guest, Table, TableAssignment } from "../types/models";

export class SeatingService {
  /**
   * Calculate optimal seat assignment for a guest
   */
  static getNextAvailableSeat(
    table: Table,
    existingAssignments: TableAssignment[],
  ): number | null {
    const usedSeats = new Set(
      existingAssignments
        .filter((a) => a.table_id === table.table_id)
        .map((a) => a.seat_number),
    );

    for (let seat = 1; seat <= table.total_number; seat++) {
      if (!usedSeats.has(seat)) {
        return seat;
      }
    }

    return null;
  }

  /**
   * Check if a table can accommodate a guest
   */
  static canAccommodateGuest(
    table: Table,
    guest: Guest,
    existingAssignments: TableAssignment[],
  ): boolean {
    const currentOccupancy = existingAssignments.filter(
      (a) => a.table_id === table.table_id,
    ).length;

    return currentOccupancy + guest.party_size <= table.total_number;
  }

  /**
   * Get table occupancy statistics
   */
  static getTableOccupancy(
    tableId: string,
    assignments: TableAssignment[],
    guests: Map<string, Guest>,
  ): {
    count: number;
    capacity: number;
    percentage: number;
  } {
    const tableAssignments = assignments.filter((a) => a.table_id === tableId);
    const count = tableAssignments.reduce((sum, assignment) => {
      const guest = guests.get(assignment.guest_id);
      return sum + (guest?.party_size ?? 1);
    }, 0);

    // Will need capacity from table
    return { count, capacity: 0, percentage: 0 };
  }

  /**
   * Validate an assignment
   */
  static validateAssignment(
    guest: Guest,
    table: Table,
    existingAssignments: TableAssignment[],
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.canAccommodateGuest(table, guest, existingAssignments)) {
      errors.push("Table does not have enough capacity");
    }

    // Check for duplicate assignments
    const alreadyAssigned = existingAssignments.some(
      (a) => a.guest_id === guest.guest_id,
    );
    if (alreadyAssigned) {
      errors.push("Guest is already assigned to a table");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
```

### 3.2 Assignment Service

**File: `features/seating/services/assignmentService.ts`**

```typescript
import type { TableAssignment, Guest } from "../types/models";

export class AssignmentService {
  /**
   * Create a new assignment
   */
  static createAssignment(
    guestId: string,
    tableId: string,
    seatNumber: number,
  ): TableAssignment {
    return {
      guest_id: guestId,
      table_id: tableId,
      seat_number: seatNumber,
    };
  }

  /**
   * Remove guest from all tables
   */
  static removeGuestAssignments(
    guestId: string,
    assignments: TableAssignment[],
  ): TableAssignment[] {
    return assignments.filter((a) => a.guest_id !== guestId);
  }

  /**
   * Move guest between tables
   */
  static moveGuest(
    guestId: string,
    fromTableId: string,
    toTableId: string,
    newSeatNumber: number,
    assignments: TableAssignment[],
  ): TableAssignment[] {
    const withoutGuest = this.removeGuestAssignments(guestId, assignments);
    const newAssignment = this.createAssignment(
      guestId,
      toTableId,
      newSeatNumber,
    );

    return [...withoutGuest, newAssignment];
  }

  /**
   * Batch apply AI assignments
   */
  static applyAIAssignments(
    aiAssignments: Array<{ guestId: string; tableId: string }>,
    currentAssignments: TableAssignment[],
    tables: Map<string, Table>,
  ): TableAssignment[] {
    // Implementation for batch assignment application
    return currentAssignments;
  }

  /**
   * Get assignments by table
   */
  static groupByTable(
    assignments: TableAssignment[],
  ): Map<string, TableAssignment[]> {
    const grouped = new Map<string, TableAssignment[]>();

    assignments.forEach((assignment) => {
      const existing = grouped.get(assignment.table_id) ?? [];
      grouped.set(assignment.table_id, [...existing, assignment]);
    });

    return grouped;
  }
}
```

---

## Phase 4: Custom Hooks Extraction

### 4.1 Main State Hook

**File: `features/seating/hooks/useSeatingState.ts`**

```typescript
import { useState, useMemo } from "react";
import type { Guest, Table, TableAssignment, Relation } from "../types/models";

export interface SeatingState {
  guests: Guest[];
  tables: Table[];
  assignments: TableAssignment[];
  relations: Relation[];
  layouts: TableLayout[];
  activeLayoutId: string | null;
}

export function useSeatingState(initialData: Partial<SeatingState> = {}) {
  const [guests] = useState<Guest[]>(initialData.guests ?? []);
  const [tables] = useState<Table[]>(initialData.tables ?? []);
  const [assignments, setAssignments] = useState<TableAssignment[]>(
    initialData.assignments ?? [],
  );
  const [relations] = useState<Relation[]>(initialData.relations ?? []);
  const [activeLayoutId, setActiveLayoutId] = useState<string | null>(
    initialData.activeLayoutId ?? null,
  );

  // Computed maps for O(1) lookups
  const guestsById = useMemo(() => {
    return new Map(guests.map((g) => [g.guest_id, g]));
  }, [guests]);

  const tablesById = useMemo(() => {
    return new Map(tables.map((t) => [t.table_id, t]));
  }, [tables]);

  const relationsById = useMemo(() => {
    return new Map(relations.map((r) => [r.relation_id, r]));
  }, [relations]);

  const assignedGuestIds = useMemo(() => {
    return new Set(assignments.map((a) => a.guest_id));
  }, [assignments]);

  const assignmentsByTable = useMemo(() => {
    return AssignmentService.groupByTable(assignments);
  }, [assignments]);

  const activeTables = useMemo(() => {
    return tables.filter((t) => t.layout_id === activeLayoutId);
  }, [tables, activeLayoutId]);

  return {
    // State
    guests,
    tables,
    assignments,
    relations,
    activeLayoutId,

    // Setters
    setAssignments,
    setActiveLayoutId,

    // Computed
    guestsById,
    tablesById,
    relationsById,
    assignedGuestIds,
    assignmentsByTable,
    activeTables,
  };
}
```

### 4.2 Drag and Drop Hook

**File: `features/seating/hooks/useDragAndDrop.ts`**

```typescript
import { useState, useCallback } from "react";
import { useSensors, useSensor, PointerSensor } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { DragId } from "../types/ui";

export function useDragAndDrop(
  onGuestMove: (guestId: string, targetTableId: string | null) => void,
) {
  const [dragOverlayContent, setDragOverlayContent] = useState<string | null>(
    null,
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const guestId = parseGuestIdFromDragId(event.active.id);
    if (guestId) {
      // Set overlay content from guest data
      const guestName = event.active.data.current?.guestName;
      setDragOverlayContent(guestName ?? guestId);
    }
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setDragOverlayContent(null);

      const guestId = parseGuestIdFromDragId(event.active.id);
      if (!guestId) return;

      const overId = event.over?.id;
      if (!overId) return;

      if (overId === "unassigned") {
        onGuestMove(guestId, null);
        return;
      }

      const targetTableId = parseTableIdFromDragId(overId);
      if (targetTableId) {
        onGuestMove(guestId, targetTableId);
      }
    },
    [onGuestMove],
  );

  return {
    sensors,
    dragOverlayContent,
    handleDragStart,
    handleDragEnd,
  };
}

// Helper functions
function parseGuestIdFromDragId(id: unknown): string | null {
  if (typeof id !== "string") return null;
  if (!id.startsWith("guest:")) return null;
  return id.slice("guest:".length) || null;
}

function parseTableIdFromDragId(id: unknown): string | null {
  if (typeof id !== "string") return null;
  if (!id.startsWith("table:")) return null;
  return id.slice("table:".length) || null;
}
```

### 4.3 Guest Filtering Hook

**File: `features/seating/hooks/useGuestFiltering.ts`**

```typescript
import { useState, useMemo } from "react";
import type { Guest } from "../types/models";
import { fullName } from "../utils/guestHelpers";

export function useGuestFiltering(guests: Guest[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [relationFilter, setRelationFilter] = useState<string | undefined>();

  const filteredGuests = useMemo(() => {
    return guests.filter((guest) => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const name = fullName(guest).toLowerCase();
        const email = (guest.email ?? "").toLowerCase();

        if (!name.includes(query) && !email.includes(query)) {
          return false;
        }
      }

      // Relation filter
      if (relationFilter && guest.relation_id !== relationFilter) {
        return false;
      }

      return true;
    });
  }, [guests, searchQuery, relationFilter]);

  return {
    searchQuery,
    setSearchQuery,
    relationFilter,
    setRelationFilter,
    filteredGuests,
  };
}
```

### 4.4 Zoom Controls Hook

**File: `features/seating/hooks/useZoomControls.ts`**

```typescript
import { useState, useCallback } from "react";

const INITIAL_METERS_TO_PIXELS = 80;
const ZOOM_STEP = 1.2;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3.0;

export function useZoomControls(initialZoom = INITIAL_METERS_TO_PIXELS) {
  const [metersToPixels, setMetersToPixels] = useState(initialZoom);

  const zoomIn = useCallback(() => {
    setMetersToPixels((prev) => {
      const newZoom = prev * ZOOM_STEP;
      return Math.min(newZoom, initialZoom * MAX_ZOOM);
    });
  }, [initialZoom]);

  const zoomOut = useCallback(() => {
    setMetersToPixels((prev) => {
      const newZoom = prev / ZOOM_STEP;
      return Math.max(newZoom, initialZoom * MIN_ZOOM);
    });
  }, [initialZoom]);

  const resetZoom = useCallback(() => {
    setMetersToPixels(initialZoom);
  }, [initialZoom]);

  const zoomLevel = metersToPixels / initialZoom;

  return {
    metersToPixels,
    zoomLevel,
    zoomIn,
    zoomOut,
    resetZoom,
  };
}
```

---

## Phase 5: Component Breakdown

### 5.1 Extract TableCanvas Component

**File: `features/seating/components/TableCanvas/TableCanvas.tsx`**

```typescript
import React, { memo } from 'react';
import { TableTile } from './TableTile';
import type { Table, TableAssignment, Guest } from '../../types/models';

interface TableCanvasProps {
  tables: Table[];
  assignmentsByTable: Map<string, TableAssignment[]>;
  guestsById: Map<string, Guest>;
  metersToPixels: number;
  selectedTableId: string | null;
  onSelectTable: (tableId: string) => void;
  onTableMove?: (tableId: string, x: number, y: number) => void;
  canvasWidth: number;
  canvasHeight: number;
}

export const TableCanvas = memo(function TableCanvas({
  tables,
  assignmentsByTable,
  guestsById,
  metersToPixels,
  selectedTableId,
  onSelectTable,
  onTableMove,
  canvasWidth,
  canvasHeight,
}: TableCanvasProps) {
  return (
    <div
      style={{
        position: 'relative',
        width: canvasWidth,
        height: canvasHeight,
        minWidth: '100%',
        minHeight: '100%',
      }}
    >
      {tables.map(table => (
        <TableTile
          key={table.table_id}
          table={table}
          assignments={assignmentsByTable.get(table.table_id) ?? []}
          guestsById={guestsById}
          metersToPixels={metersToPixels}
          isSelected={selectedTableId === table.table_id}
          onSelect={onSelectTable}
          onMove={onTableMove}
        />
      ))}
    </div>
  );
});
```

### 5.2 Extract GuestList Component

**File: `features/seating/components/GuestList/GuestList.tsx`**

```typescript
import React, { memo } from 'react';
import { List, Input, Select } from 'antd';
import { GuestListItem } from './GuestListItem';
import { UnassignedDropZone } from './UnassignedDropZone';
import type { Guest, Relation } from '../../types/models';
import type { FilterState } from '../../types/ui';

interface GuestListProps {
  guests: Guest[];
  assignedGuestIds: Set<string>;
  relationsById: Map<string, Relation>;
  filterState: FilterState;
  onFilterChange: (state: Partial<FilterState>) => void;
  relationOptions: Array<{ label: string; value: string }>;
}

export const GuestList = memo(function GuestList({
  guests,
  assignedGuestIds,
  relationsById,
  filterState,
  onFilterChange,
  relationOptions,
}: GuestListProps) {
  return (
    <div>
      <UnassignedDropZone />

      <div style={{ padding: 12 }}>
        <Input.Search
          value={filterState.searchQuery}
          onChange={e =>
            onFilterChange({ searchQuery: e.target.value })
          }
          placeholder="Search guests..."
          allowClear
          style={{ marginBottom: 8 }}
        />

        <Select
          value={filterState.relationId}
          onChange={relationId => onFilterChange({ relationId })}
          placeholder="Filter by relation"
          allowClear
          options={relationOptions}
          style={{ width: '100%' }}
        />
      </div>

      <List
        dataSource={guests}
        renderItem={guest => (
          <GuestListItem
            key={guest.guest_id}
            guest={guest}
            relation={relationsById.get(guest.relation_id)}
            isAssigned={assignedGuestIds.has(guest.guest_id)}
          />
        )}
      />
    </div>
  );
});
```

### 5.3 Simplify Main Component

**File: `features/seating/components/TableAssignmentPage/index.tsx`**

```typescript
'use client';
import React, { useState } from 'react';
import { DndContext } from '@dnd-kit/core';
import { Card, Typography } from 'antd';
import { useSeatingState } from '../../hooks/useSeatingState';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useGuestFiltering } from '../../hooks/useGuestFiltering';
import { useZoomControls } from '../../hooks/useZoomControls';
import { TableCanvas } from '../TableCanvas/TableCanvas';
import { GuestList } from '../GuestList/GuestList';
import { SidePanel } from '../SidePanel/SidePanel';
import { ZoomControls } from '../ZoomControls/ZoomControls';
import { SeatingService } from '../../services/seatingService';
import { AssignmentService } from '../../services/assignmentService';
import styles from './TableAssignmentPage.module.css';

export default function TableAssignmentPage() {
  // State management
  const seatingState = useSeatingState(/* load from data */);
  const filterState = useGuestFiltering(seatingState.guests);
  const zoomControls = useZoomControls();

  // UI state
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [sidePanelOpen, setSidePanelOpen] = useState(true);
  const [sideView, setSideView] = useState<'guests' | 'table'>('guests');

  // Drag and drop
  const handleGuestMove = (guestId: string, targetTableId: string | null) => {
    // Business logic using services
    const guest = seatingState.guestsById.get(guestId);
    if (!guest) return;

    if (targetTableId === null) {
      // Unassign
      const newAssignments = AssignmentService.removeGuestAssignments(
        guestId,
        seatingState.assignments
      );
      seatingState.setAssignments(newAssignments);
      return;
    }

    const table = seatingState.tablesById.get(targetTableId);
    if (!table) return;

    const seatNumber = SeatingService.getNextAvailableSeat(
      table,
      seatingState.assignments
    );

    if (seatNumber === null) {
      message.error('Table is full');
      return;
    }

    const validation = SeatingService.validateAssignment(
      guest,
      table,
      seatingState.assignments
    );

    if (!validation.valid) {
      message.error(validation.errors.join(', '));
      return;
    }

    // Apply assignment
    const withoutGuest = AssignmentService.removeGuestAssignments(
      guestId,
      seatingState.assignments
    );
    const newAssignment = AssignmentService.createAssignment(
      guestId,
      targetTableId,
      seatNumber
    );

    seatingState.setAssignments([...withoutGuest, newAssignment]);
  };

  const dragAndDrop = useDragAndDrop(handleGuestMove);

  return (
    <DndContext
      sensors={dragAndDrop.sensors}
      onDragStart={dragAndDrop.handleDragStart}
      onDragEnd={dragAndDrop.handleDragEnd}
      collisionDetection={pointerWithin}
    >
      <div className={styles.page}>
        <Typography.Title level={2}>Table Assignments</Typography.Title>

        <div className={styles.contentGrid}>
          <Card>
            <ZoomControls
              onZoomIn={zoomControls.zoomIn}
              onZoomOut={zoomControls.zoomOut}
              onReset={zoomControls.resetZoom}
              zoomLevel={zoomControls.zoomLevel}
            />

            <TableCanvas
              tables={seatingState.activeTables}
              assignmentsByTable={seatingState.assignmentsByTable}
              guestsById={seatingState.guestsById}
              metersToPixels={zoomControls.metersToPixels}
              selectedTableId={selectedTableId}
              onSelectTable={setSelectedTableId}
              canvasWidth={800}
              canvasHeight={600}
            />
          </Card>

          {sidePanelOpen && (
            <SidePanel
              view={sideView}
              onViewChange={setSideView}
              selectedTableId={selectedTableId}
              guestListProps={{
                guests: filterState.filteredGuests,
                assignedGuestIds: seatingState.assignedGuestIds,
                relationsById: seatingState.relationsById,
                filterState: {
                  searchQuery: filterState.searchQuery,
                  relationId: filterState.relationFilter,
                },
                onFilterChange: state => {
                  if ('searchQuery' in state)
                    filterState.setSearchQuery(state.searchQuery!);
                  if ('relationId' in state)
                    filterState.setRelationFilter(state.relationId);
                },
                relationOptions: [],
              }}
            />
          )}
        </div>
      </div>
    </DndContext>
  );
}
```

---

## Phase 6: Utility Functions

### 6.1 Table Helpers

**File: `features/seating/utils/tableHelpers.ts`**

```typescript
import type { Table, TableShape } from "../types/models";

export function getTableLabel(tableId: string): string {
  // "table-01" -> "Table 1"
  const match = tableId.match(/table-(\d+)/i);
  if (match) {
    return `Table ${parseInt(match[1], 10)}`;
  }
  return tableId;
}

export function getTableShapeClass(shape: TableShape): string {
  switch (shape) {
    case TableShape.ROUND:
      return "tableRound";
    case TableShape.SQUARE:
      return "tableSquare";
    case TableShape.RECTANGULAR:
      return "tableRectangular";
    default:
      return "tableSquare";
  }
}

export function calculateTableDimensions(
  table: Table,
  metersToPixels: number,
): { width: number; height: number } {
  const defaultSize = 120; // pixels

  if (table.width_m && table.height_m) {
    return {
      width: table.width_m * metersToPixels,
      height: table.height_m * metersToPixels,
    };
  }

  // Fallback to shape-based defaults
  switch (table.shape) {
    case TableShape.ROUND:
      return { width: defaultSize, height: defaultSize };
    case TableShape.SQUARE:
      return { width: defaultSize, height: defaultSize };
    case TableShape.RECTANGULAR:
      return { width: defaultSize * 1.5, height: defaultSize * 0.83 };
    default:
      return { width: defaultSize, height: defaultSize };
  }
}
```

### 6.2 Guest Helpers

**File: `features/seating/utils/guestHelpers.ts`**

```typescript
import type { Guest } from "../types/models";

export function fullName(
  guest: Pick<Guest, "first_name" | "last_name">,
): string {
  return `${guest.first_name} ${guest.last_name}`.trim();
}

export function getGuestDisplayName(guest: Guest): string {
  const name = fullName(guest);
  return guest.plus_one ? `${name} +1` : name;
}

export function sortGuestsByName(guests: Guest[]): Guest[] {
  return [...guests].sort((a, b) => {
    const nameA = fullName(a).toLowerCase();
    const nameB = fullName(b).toLowerCase();
    return nameA.localeCompare(nameB);
  });
}

export function groupGuestsByRelation(guests: Guest[]): Map<string, Guest[]> {
  const grouped = new Map<string, Guest[]>();

  guests.forEach((guest) => {
    const existing = grouped.get(guest.relation_id) ?? [];
    grouped.set(guest.relation_id, [...existing, guest]);
  });

  return grouped;
}
```

### 6.3 Coordinate Helpers

**File: `features/seating/utils/coordinateHelpers.ts`**

```typescript
const SNAP_METERS = 0.25;

export function metersToPixels(meters: number, scale: number): number {
  return meters * scale;
}

export function pixelsToMeters(pixels: number, scale: number): number {
  return pixels / scale;
}

export function snapToGrid(
  value: number,
  gridSize: number = SNAP_METERS,
): number {
  return Math.round(value / gridSize) * gridSize;
}

export function calculateCanvasDimensions(
  venueWidthMeters: number,
  venueHeightMeters: number,
  metersToPixelsScale: number,
  squareCanvas: boolean = false,
): { width: number; height: number } {
  const width = metersToPixels(venueWidthMeters, metersToPixelsScale);
  const height = metersToPixels(venueHeightMeters, metersToPixelsScale);

  if (squareCanvas) {
    const size = Math.max(width, height);
    return { width: size, height: size };
  }

  return { width, height };
}
```

---

## Phase 7: Performance Optimizations

### 7.1 Memoization Strategy

```typescript
// Component memoization
export const TableTile = memo(TableTile, (prev, next) => {
  return (
    prev.table.table_id === next.table.table_id &&
    prev.isSelected === next.isSelected &&
    prev.assignments.length === next.assignments.length &&
    prev.metersToPixels === next.metersToPixels
  );
});

// useMemo for expensive computations
const sortedGuests = useMemo(
  () => sortGuestsByName(filteredGuests),
  [filteredGuests],
);

// useCallback for event handlers
const handleTableSelect = useCallback((tableId: string) => {
  setSelectedTableId(tableId);
}, []);
```

### 7.2 Virtual Scrolling for Large Lists

```typescript
import { FixedSizeList as List } from 'react-window';

function GuestListVirtualized({ guests }: { guests: Guest[] }) {
  const Row = ({ index, style }: { index: number; style: CSSProperties }) => (
    <div style={style}>
      <GuestListItem guest={guests[index]} />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={guests.length}
      itemSize={80}
      width="100%"
    >
      {Row}
    </List>
  );
}
```

---

## Phase 8: Testing Strategy

### 8.1 Unit Tests

```typescript
// seatingService.test.ts
describe("SeatingService", () => {
  describe("getNextAvailableSeat", () => {
    it("should return seat 1 for empty table", () => {
      const table = createMockTable({ total_number: 8 });
      const seat = SeatingService.getNextAvailableSeat(table, []);
      expect(seat).toBe(1);
    });

    it("should return null when table is full", () => {
      const table = createMockTable({ total_number: 2 });
      const assignments = [
        { table_id: table.table_id, guest_id: "1", seat_number: 1 },
        { table_id: table.table_id, guest_id: "2", seat_number: 2 },
      ];
      const seat = SeatingService.getNextAvailableSeat(table, assignments);
      expect(seat).toBeNull();
    });

    it("should skip occupied seats", () => {
      const table = createMockTable({ total_number: 4 });
      const assignments = [
        { table_id: table.table_id, guest_id: "1", seat_number: 1 },
        { table_id: table.table_id, guest_id: "2", seat_number: 3 },
      ];
      const seat = SeatingService.getNextAvailableSeat(table, assignments);
      expect(seat).toBe(2);
    });
  });
});
```

### 8.2 Integration Tests

```typescript
// TableAssignmentPage.test.tsx
describe('TableAssignmentPage', () => {
  it('should assign guest to table on drag and drop', async () => {
    const { getByTestId, getByText } = render(<TableAssignmentPage />);

    const guest = getByTestId('guest-1');
    const table = getByTestId('table-1');

    await dragAndDrop(guest, table);

    expect(getByText('1/8')).toBeInTheDocument(); // occupancy updated
  });
});
```

---

## Phase 9: AI Chat Refactoring

### 9.1 Extract Message Components

**File: `features/ai-chat/components/SeatingAIChat/MessageList.tsx`**

```typescript
import React from 'react';
import { MessageItem } from './MessageItem';
import type { Message } from '../../types';

interface MessageListProps {
  messages: Message[];
  onApplyAssignments: (messageId: string, assignments: any[]) => void;
  appliedMessageId: string | null;
}

export function MessageList({
  messages,
  onApplyAssignments,
  appliedMessageId,
}: MessageListProps) {
  return (
    <div className={styles.messageList}>
      {messages.map(message => (
        <MessageItem
          key={message.id}
          message={message}
          onApply={onApplyAssignments}
          isApplied={appliedMessageId === message.id}
        />
      ))}
    </div>
  );
}
```

### 9.2 Improve AI Service

**File: `features/ai-chat/services/huggingfaceService.ts`**

```typescript
export class HuggingFaceService {
  private static readonly API_URL = "/api/hf";
  private static readonly MODEL = "mistralai/Mistral-7B-Instruct-v0.2";

  static async getSeatingRecommendation(
    request: SeatingRequest,
  ): Promise<SeatingResponse> {
    try {
      const prompt = PromptBuilder.buildSeatingPrompt(request);
      const response = await this.fetchCompletion(prompt);
      return this.parseResponse(response);
    } catch (error) {
      console.error("AI recommendation error:", error);
      throw new AIServiceError("Failed to get seating recommendation", error);
    }
  }

  private static async fetchCompletion(prompt: string): Promise<unknown> {
    const response = await fetch(this.API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      throw new APIError(response.status, await response.text());
    }

    return response.json();
  }

  private static parseResponse(data: unknown): SeatingResponse {
    // Robust parsing logic
    const text = this.extractText(data);
    const json = this.extractJSON(text);
    return this.validateResponse(json);
  }
}
```

---

## Phase 10: Configuration & Constants

### 10.1 Configuration File

**File: `features/seating/config/constants.ts`**

```typescript
export const VENUE_CONFIG = {
  DEFAULT_WIDTH_METERS: 10,
  DEFAULT_HEIGHT_METERS: 6,
} as const;

export const ZOOM_CONFIG = {
  INITIAL_METERS_TO_PIXELS: 80,
  ZOOM_STEP: 1.2,
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 3.0,
} as const;

export const GRID_CONFIG = {
  SNAP_METERS: 0.25,
  GRID_SIZE_PX: 20,
} as const;

export const TABLE_DEFAULTS = {
  ROUND: { width: 120, height: 120 },
  SQUARE: { width: 120, height: 120 },
  RECTANGULAR: { width: 180, height: 100 },
} as const;

export const DRAG_CONFIG = {
  ACTIVATION_DISTANCE: 8,
} as const;
```

---

## Phase 11: Error Handling

### 11.1 Custom Error Classes

**File: `shared/errors/index.ts`**

```typescript
export class SeatingError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "SeatingError";
  }
}

export class ValidationError extends SeatingError {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super(message, "VALIDATION_ERROR");
    this.name = "ValidationError";
  }
}

export class CapacityError extends SeatingError {
  constructor(
    message: string,
    public readonly tableId: string,
    public readonly required: number,
    public readonly available: number,
  ) {
    super(message, "CAPACITY_ERROR");
    this.name = "CapacityError";
  }
}

export class AIServiceError extends SeatingError {
  constructor(
    message: string,
    public readonly cause?: unknown,
  ) {
    super(message, "AI_SERVICE_ERROR");
    this.name = "AIServiceError";
  }
}
```

---

## Phase 12: Migration Plan

### Step-by-Step Migration

**Week 1: Setup & Types**

1. Create new directory structure
2. Define all TypeScript types
3. Set up shared utilities

**Week 2: Extract Services** 4. Create SeatingService with tests 5. Create AssignmentService with tests 6. Extract utility functions

**Week 3: Extract Hooks** 7. Create useSeatingState 8. Create useDragAndDrop 9. Create useGuestFiltering 10. Create useZoomControls

**Week 4: Component Breakdown** 11. Extract TableCanvas component 12. Extract TableTile component 13. Extract GuestList component 14. Extract SidePanel component

**Week 5: Refactor Main Component** 15. Simplify TableAssignmentPage using new hooks/services 16. Wire everything together 17. Test thoroughly

**Week 6: AI Chat** 18. Refactor SeatingAIChat 19. Extract message components 20. Improve AI service

**Week 7: Polish & Testing** 21. Add comprehensive tests 22. Performance optimization 23. Documentation 24. Code review

---

## Benefits Summary

### Maintainability

- **Before:** 1200-line monolith
- **After:** ~30 focused files, each <200 lines

### Testability

- **Before:** Hard to test, tightly coupled
- **After:** Pure functions, isolated components, easy mocking

### Type Safety

- **Before:** Loose typing, string literals
- **After:** Strict types, enums, readonly properties

### Performance

- **Before:** Re-renders on every state change
- **After:** Memoized components, optimized selectors

### Developer Experience

- **Before:** Hard to find code, long file scrolling
- **After:** Clear organization, co-located concerns

---

## Additional Recommendations

### 1. State Management

Consider using Zustand or Redux Toolkit for complex state:

```typescript
// features/seating/store/seatingStore.ts
import create from "zustand";

interface SeatingStore {
  guests: Guest[];
  tables: Table[];
  assignments: TableAssignment[];
  addAssignment: (assignment: TableAssignment) => void;
  removeAssignment: (guestId: string) => void;
}

export const useSeatingStore = create<SeatingStore>((set) => ({
  guests: [],
  tables: [],
  assignments: [],
  addAssignment: (assignment) =>
    set((state) => ({
      assignments: [...state.assignments, assignment],
    })),
  removeAssignment: (guestId) =>
    set((state) => ({
      assignments: state.assignments.filter((a) => a.guest_id !== guestId),
    })),
}));
```

### 2. Data Persistence

Add localStorage/API persistence:

```typescript
// hooks/usePersistedState.ts
function usePersistedSeating() {
  const [state, setState] = useState(() => {
    const saved = localStorage.getItem("seating-state");
    return saved ? JSON.parse(saved) : initialState;
  });

  useEffect(() => {
    localStorage.setItem("seating-state", JSON.stringify(state));
  }, [state]);

  return [state, setState];
}
```

### 3. Add Logging

```typescript
// utils/logger.ts
export const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service
  },
};
```

### 4. Add Analytics

```typescript
// utils/analytics.ts
export const trackEvent = (event: string, properties?: Record<string, any>) => {
  // Send to analytics service
  console.log("Event:", event, properties);
};

// Usage
trackEvent("guest_assigned", {
  guestId: guest.guest_id,
  tableId: table.table_id,
});
```

---

## Conclusion

This refactoring plan transforms a monolithic 1200-line component into a well-organized, maintainable, and testable codebase. The modular structure makes it easier to add features, fix bugs, and onboard new developers.

**Estimated effort:** 6-8 weeks for complete migration
**Risk level:** Medium (requires careful testing during migration)
**ROI:** High (significantly improved code quality and developer productivity)
