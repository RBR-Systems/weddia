# Feature 04: Delete Timeline Item

## Overview
Allow wedding planners to remove timeline items that are no longer needed.

## User Story
As a wedding planner, I want to delete timeline activities so that I can remove cancelled or incorrect items from the schedule.

## Requirements

### Functional Requirements
1. Delete button on each timeline item
2. Confirmation dialog before deletion
3. Show impact of deletion (time gaps)
4. Option to cascade time adjustments
5. Remove from database
6. Update timeline display immediately

### API Endpoint
```
DELETE /api/timeline-items/:id

Response (200 OK):
{
  "success": true,
  "message": "Timeline item deleted successfully"
}

Error Response (404):
{
  "success": false,
  "error": "Timeline item not found"
}
```

## UI Components

### Delete Button
```jsx
<TimelineItemCard>
  {expanded && (
    <ItemActions>
      <DeleteButton 
        onClick={() => handleDelete(item.timeline_item_id)}
        aria-label="Delete timeline item"
      >
        <TrashIcon />
        Delete
      </DeleteButton>
    </ItemActions>
  )}
</TimelineItemCard>
```

### Confirmation Dialog
```jsx
<ConfirmDialog
  isOpen={showDeleteConfirm}
  title="Delete Timeline Item?"
  onConfirm={confirmDelete}
  onCancel={cancelDelete}
  confirmText="Delete"
  cancelText="Cancel"
  confirmVariant="danger"
>
  <DeleteMessage>
    <ItemPreview>
      <strong>{itemToDelete.title}</strong>
      <div>{formatTimeRange(itemToDelete)}</div>
    </ItemPreview>
    
    {hasTimeGap && (
      <GapWarning>
        <WarningIcon />
        <p>
          This will create a {gapDuration} gap between:
        </p>
        <ul>
          <li>{previousItem.title} (ends {formatTime(previousItem.end_time)})</li>
          <li>{nextItem.title} (starts {formatTime(nextItem.start_time)})</li>
        </ul>
      </GapWarning>
    )}
    
    {canCascade && (
      <CascadeOption>
        <Checkbox
          checked={shouldCascade}
          onChange={(e) => setShouldCascade(e.target.checked)}
        />
        <label>
          Shift {nextItem.title} and all following activities earlier to close the gap
        </label>
      </CascadeOption>
    )}
  </DeleteMessage>
</ConfirmDialog>
```

## Business Logic

### Delete Flow
```javascript
const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
const [itemToDelete, setItemToDelete] = useState(null);
const [shouldCascade, setShouldCascade] = useState(false);

function handleDelete(itemId) {
  const item = timelineItems.find(i => i.timeline_item_id === itemId);
  setItemToDelete(item);
  setShowDeleteConfirm(true);
}

async function confirmDelete() {
  try {
    // Delete from database
    const response = await fetch(`/api/timeline-items/${itemToDelete.timeline_item_id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete timeline item');
    }
    
    // If cascading, adjust following items
    if (shouldCascade) {
      await cascadeTimeAdjustment(itemToDelete);
    }
    
    // Remove from UI
    removeTimelineItem(itemToDelete.timeline_item_id);
    
    showSuccessToast(`"${itemToDelete.title}" deleted successfully`);
    
  } catch (error) {
    showErrorToast('Unable to delete timeline item. Please try again.');
    console.error('Delete error:', error);
  } finally {
    setShowDeleteConfirm(false);
    setItemToDelete(null);
    setShouldCascade(false);
  }
}

function cancelDelete() {
  setShowDeleteConfirm(false);
  setItemToDelete(null);
  setShouldCascade(false);
}
```

### Detect Time Gap
```javascript
function analyzeDeleteImpact(itemToDelete) {
  const sortedItems = sortTimelineItems(timelineItems);
  const index = sortedItems.findIndex(i => i.timeline_item_id === itemToDelete.timeline_item_id);
  
  if (index === -1) return { hasGap: false };
  
  const previousItem = sortedItems[index - 1];
  const nextItem = sortedItems[index + 1];
  
  if (!previousItem || !nextItem) {
    return { hasGap: false };
  }
  
  const gapStart = new Date(previousItem.end_time);
  const gapEnd = new Date(nextItem.start_time);
  const gapMs = gapEnd - gapStart - (new Date(itemToDelete.end_time) - new Date(itemToDelete.start_time));
  
  if (gapMs > 0) {
    return {
      hasGap: true,
      gapDuration: formatDuration(gapMs),
      previousItem,
      nextItem,
      canCascade: true
    };
  }
  
  return { hasGap: false };
}
```

### Cascade Adjustment After Delete
```javascript
async function cascadeTimeAdjustment(deletedItem) {
  const sortedItems = sortTimelineItems(timelineItems);
  const index = sortedItems.findIndex(i => i.timeline_item_id === deletedItem.timeline_item_id);
  
  if (index === -1) return;
  
  const itemsToUpdate = sortedItems.slice(index + 1);
  
  // Calculate time shift needed
  const deletedDuration = new Date(deletedItem.end_time) - new Date(deletedItem.start_time);
  const timeShiftMs = -deletedDuration; // Negative to shift earlier
  
  // Update all following items
  const updates = itemsToUpdate.map(item => ({
    timeline_item_id: item.timeline_item_id,
    start_time: new Date(new Date(item.start_time).getTime() + timeShiftMs).toISOString(),
    end_time: new Date(new Date(item.end_time).getTime() + timeShiftMs).toISOString(),
    setup_time: item.setup_time 
      ? new Date(new Date(item.setup_time).getTime() + timeShiftMs).toISOString()
      : null
  }));
  
  await bulkUpdateTimelineItems(updates);
}
```

## Soft Delete Option (Alternative)

### Mark as Cancelled Instead
```javascript
async function softDelete(itemId) {
  await fetch(`/api/timeline-items/${itemId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'cancelled' })
  });
  
  updateTimelineItem(itemId, { status: 'cancelled' });
}
```

### Filter Out Cancelled
```javascript
const activeItems = timelineItems.filter(item => item.status !== 'cancelled');
```

## Bulk Delete

### Select Multiple Items
```jsx
<TimelineItem>
  <Checkbox
    checked={selectedItems.includes(item.timeline_item_id)}
    onChange={() => toggleSelection(item.timeline_item_id)}
  />
  {/* ... rest of item */}
</TimelineItem>

{selectedItems.length > 0 && (
  <BulkActions>
    <span>{selectedItems.length} selected</span>
    <DeleteButton onClick={bulkDelete}>
      Delete Selected
    </DeleteButton>
  </BulkActions>
)}
```

### Bulk Delete Confirmation
```jsx
<ConfirmDialog>
  <p>Delete {selectedItems.length} timeline items?</p>
  <ul>
    {selectedItems.map(id => (
      <li key={id}>{getItemTitle(id)}</li>
    ))}
  </ul>
</ConfirmDialog>
```

## Undo Delete (Optional)

### Store Deleted Item Temporarily
```javascript
const [deletedItems, setDeletedItems] = useState([]);

async function deleteWithUndo(item) {
  // Store item for undo
  setDeletedItems(prev => [...prev, item]);
  
  // Remove from UI
  removeTimelineItem(item.timeline_item_id);
  
  // Show undo toast
  showToast({
    message: `"${item.title}" deleted`,
    duration: 5000,
    action: {
      label: 'Undo',
      onClick: () => undoDelete(item)
    }
  });
  
  // Actually delete after 5 seconds if not undone
  setTimeout(() => {
    permanentlyDelete(item.timeline_item_id);
  }, 5000);
}

function undoDelete(item) {
  // Restore to UI
  addTimelineItem(item);
  
  // Remove from deleted queue
  setDeletedItems(prev => prev.filter(i => i.timeline_item_id !== item.timeline_item_id));
  
  showSuccessToast('Delete undone');
}
```

## Error Handling

### Item Not Found
```javascript
if (response.status === 404) {
  showErrorToast('Timeline item not found. It may have already been deleted.');
  removeTimelineItem(itemId); // Remove from UI anyway
}
```

### Dependency Check
```javascript
// If item is referenced by other features (e.g., vendor assignments)
if (response.status === 409) { // Conflict
  const error = await response.json();
  showErrorDialog({
    title: 'Cannot Delete',
    message: error.message,
    details: 'This activity is referenced by vendor assignments. Remove those first.'
  });
}
```

## Accessibility

### Confirmation Dialog Focus
```javascript
useEffect(() => {
  if (showDeleteConfirm) {
    // Focus the cancel button (safer default)
    cancelButtonRef.current?.focus();
  }
}, [showDeleteConfirm]);
```

### Keyboard Shortcuts
```jsx
<ConfirmDialog
  onKeyDown={(e) => {
    if (e.key === 'Enter') {
      confirmDelete();
    } else if (e.key === 'Escape') {
      cancelDelete();
    }
  }}
>
```

### Screen Reader Announcements
```jsx
<div role="alert" aria-live="assertive">
  {deleteSuccess && `${itemToDelete.title} deleted successfully`}
</div>
```

## Testing

### Unit Tests
```javascript
describe('Delete Timeline Item', () => {
  test('detects time gap after deletion', () => {
    const items = [item1pm, item2pm, item3pm];
    const impact = analyzeDeleteImpact(item2pm);
    expect(impact.hasGap).toBe(true);
  });
  
  test('calculates cascade adjustment correctly', () => {
    const deletedItem = {
      start_time: '2026-06-15T14:00:00Z',
      end_time: '2026-06-15T15:00:00Z'
    };
    const nextItem = {
      start_time: '2026-06-15T15:00:00Z'
    };
    
    const adjusted = calculateCascadeAdjustment(deletedItem, nextItem);
    expect(adjusted.start_time).toBe('2026-06-15T14:00:00Z');
  });
});
```

### Integration Tests
```javascript
test('deletes timeline item via API', async () => {
  const response = await deleteTimelineItem(itemId);
  expect(response.success).toBe(true);
  
  // Verify it's gone
  const items = await fetchTimelineItems(eventId);
  expect(items.find(i => i.timeline_item_id === itemId)).toBeUndefined();
});
```

### E2E Tests
```javascript
test('deletes item with confirmation', async () => {
  await page.goto('/events/123/timeline');
  
  // Click delete on first item
  await page.click('.timeline-item:first-child .delete-button');
  
  // Confirm dialog appears
  expect(await page.isVisible('[role="dialog"]')).toBe(true);
  
  // Confirm deletion
  await page.click('button:has-text("Delete")');
  
  // Item removed from list
  const itemsBefore = await page.$$('.timeline-item');
  await page.waitForTimeout(500);
  const itemsAfter = await page.$$('.timeline-item');
  expect(itemsAfter.length).toBe(itemsBefore.length - 1);
});
```

## Acceptance Criteria

- [ ] Delete button appears on each timeline item
- [ ] Click delete shows confirmation dialog
- [ ] Dialog shows item details (title, time)
- [ ] Dialog shows time gap warning if applicable
- [ ] Option to cascade time adjustments appears when relevant
- [ ] Confirm button deletes item from database
- [ ] Timeline updates immediately after deletion
- [ ] Success message appears
- [ ] Cancel button closes dialog without deleting
- [ ] Bulk delete works for multiple items
- [ ] Undo option available (optional)
- [ ] Cannot delete last item in timeline (optional rule)
- [ ] Keyboard navigation works in dialog
- [ ] Screen reader announces deletion

## Implementation Notes

### Optimistic UI Delete
```javascript
async function optimisticDelete(itemId) {
  // Remove from UI immediately
  const originalItems = [...timelineItems];
  removeTimelineItem(itemId);
  
  try {
    // Delete from server
    await deleteTimelineItem(itemId);
    showSuccessToast('Item deleted');
    
  } catch (error) {
    // Restore on error
    setTimelineItems(originalItems);
    showErrorToast('Failed to delete. Please try again.');
  }
}
```

### Prevent Accidental Deletion
```javascript
// Require typing confirmation for important items
if (item.type === 'ceremony' || item.type === 'reception') {
  showDialog({
    title: 'Delete Important Activity?',
    message: `Type "${item.title}" to confirm deletion:`,
    requireTextConfirmation: item.title
  });
}
```
