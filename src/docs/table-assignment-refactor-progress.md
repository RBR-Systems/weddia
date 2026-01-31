## Batch 6 Progress
- [x] ZoomControls.tsx → ZoomControls.tsx (migrated: zoom controls component, real code)
- [x] ZoomControls.module.css → ZoomControls.module.css (migrated: essential styles)
- [x] TableAssignmentPage.tsx → TableAssignmentPage/index.tsx (migrated: main page, real code)
- [x] table-assignment-page.module.css → TableAssignmentPage.module.css (migrated: essential styles)
- [x] GuestList.module.css → GuestList.module.css (migrated: essential styles)

## Next Batch Plan (Batch 7)
**Proposed files to migrate next:**
1. SeatingAIChat/index.tsx → features/ai-chat/components/SeatingAIChat/index.tsx
2. MessageList.tsx → features/ai-chat/components/SeatingAIChat/MessageList.tsx
3. MessageItem.tsx → features/ai-chat/components/SeatingAIChat/MessageItem.tsx
4. ChatInput.tsx → features/ai-chat/components/SeatingAIChat/ChatInput.tsx
5. huggingfaceService.ts → features/ai-chat/services/huggingfaceService.ts
# Table Assignment Refactor Progress

This document tracks the incremental migration of the table assignment feature to the new modular structure as outlined in Refactor.md.

## Migration Steps

- Move and refactor code in small batches (max 5 files per run)
- After each batch, update this file with what was moved/refactored and what is next
- Follow the structure and best practices from Refactor.md

---

## Completed

- Directory structure scaffolded (see previous run)

## In Progress (Batch 1)

**Files to move/refactor in this batch:**
1. TableAssignmentPage.tsx → features/seating/components/TableAssignmentPage/index.tsx
2. table-assignment-page.module.css → features/seating/components/TableAssignmentPage/TableAssignmentPage.module.css
3. TableCanvas.tsx (extract from TableAssignmentPage) → features/seating/components/TableCanvas/TableCanvas.tsx
4. TableTile.tsx (extract from TableAssignmentPage) → features/seating/components/TableCanvas/TableTile.tsx
5. TableCanvas.module.css (extract relevant styles) → features/seating/components/TableCanvas/TableCanvas.module.css




**Next batch:**

---

- [x] seatingService.ts → seatingService.ts (migrated: business logic)
- [x] assignmentService.ts → assignmentService.ts (migrated: assignment management)
- [x] tableHelpers.ts → tableHelpers.ts (migrated: core table utils)
- [x] guestHelpers.ts → guestHelpers.ts (migrated: core guest utils)
- [x] coordinateHelpers.ts → coordinateHelpers.ts (migrated: core coordinate utils)
- [x] models.ts → models.ts (migrated: domain types)
- [x] ui.ts → ui.ts (migrated: UI types)
- [x] SeatingAIChat/index.tsx → index.tsx (placeholder/migration note added)
- [x] MessageList.tsx → MessageList.tsx (placeholder/migration note added)
- [x] MessageItem.tsx → MessageItem.tsx (placeholder/migration note added)
- [x] ChatInput.tsx → ChatInput.tsx (placeholder/migration note added)
- [x] SeatingAIChat.module.css → SeatingAIChat.module.css (partial, migration note added)
- [x] huggingfaceService.ts → huggingfaceService.ts (placeholder/migration note added)
- [x] types/index.ts → index.ts (placeholder/migration note added)

---

## Batch 3 Progress
- [x] SidePanel.tsx → SidePanel.tsx (placeholder/migration note added)
- [x] SidePanel.module.css → SidePanel.module.css (partial, migration note added)
- [x] ZoomControls.tsx → ZoomControls.tsx (placeholder/migration note added)
- [x] useSeatingState.ts → useSeatingState.ts (placeholder/migration note added)
- [x] useDragAndDrop.ts → useDragAndDrop.ts (placeholder/migration note added)
- [x] useGuestFiltering.ts → useGuestFiltering.ts (placeholder/migration note added)
- [x] useZoomControls.ts → useZoomControls.ts (placeholder/migration note added)

---


## Batch 5 Progress
- [x] useZoomControls.ts → useZoomControls.ts (migrated: zoom controls hook, real code)
- [x] useDragAndDrop.ts → useDragAndDrop.ts (migrated: drag-and-drop hook, real code)
- [x] GuestList.tsx → GuestList.tsx (migrated: guest list UI, real code)
- [x] GuestListItem.tsx → GuestListItem.tsx (migrated: guest row UI, real code)
- [x] UnassignedDropZone.tsx → UnassignedDropZone.tsx (migrated: unassign drop zone, real code)

## Next Batch Plan (Batch 6)
**Proposed files to migrate next:**
1. TableCanvas.tsx → features/seating/components/TableCanvas/TableCanvas.tsx
2. TableTile.tsx → features/seating/components/TableCanvas/TableTile.tsx
3. TableCanvas.module.css → features/seating/components/TableCanvas/TableCanvas.module.css
4. SidePanel.tsx → features/seating/components/SidePanel/SidePanel.tsx
5. SidePanel.module.css → features/seating/components/SidePanel/SidePanel.module.css

---

## Batch 1 Progress
- [x] TableAssignmentPage.tsx → index.tsx (placeholder/migration note added)
- [x] table-assignment-page.module.css → TableAssignmentPage.module.css (partial, migration note added)
- [x] TableCanvas.tsx → TableCanvas.tsx (placeholder/migration note added)
- [x] TableTile.tsx → TableTile.tsx (placeholder/migration note added)
- [x] TableCanvas.module.css → TableCanvas.module.css (partial, migration note added)

Update this file after each batch is completed.
