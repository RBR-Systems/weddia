# Feature 12: Bulk Operations

## Overview
Select multiple items and perform actions on them.

## Requirements
1. Checkbox on each item for selection
2. "Select All" option
3. Bulk delete
4. Bulk status change
5. Bulk type change

## UI Components
```jsx
<TimelineItem>
  <Checkbox
    checked={selectedItems.includes(item.timeline_item_id)}
    onChange={() => toggleSelection(item.timeline_item_id)}
  />
  <ItemContent>...</ItemContent>
</TimelineItem>

{selectedItems.length > 0 && (
  <BulkActionsBar>
    <span>{selectedItems.length} selected</span>
    <Button onClick={selectAll}>Select All</Button>
    <Button onClick={deselectAll}>Deselect All</Button>
    
    <Select onChange={bulkChangeStatus}>
      <option>Change status...</option>
      <option value="completed">Mark Complete</option>
      <option value="pending">Mark Pending</option>
    </Select>
    
    <Button onClick={bulkDelete} variant="danger">
      Delete Selected
    </Button>
  </BulkActionsBar>
)}
```

## Business Logic
```javascript
const [selectedItems, setSelectedItems] = useState([]);

function toggleSelection(itemId) {
  setSelectedItems(prev =>
    prev.includes(itemId)
      ? prev.filter(id => id !== itemId)
      : [...prev, itemId]
  );
}

function selectAll() {
  setSelectedItems(timelineItems.map(item => item.timeline_item_id));
}

async function bulkDelete() {
  const confirmed = await confirm(`Delete ${selectedItems.length} items?`);
  if (!confirmed) return;
  
  await Promise.all(
    selectedItems.map(id => deleteTimelineItem(id))
  );
  
  setSelectedItems([]);
  showSuccessToast(`${selectedItems.length} items deleted`);
}
```

## Acceptance Criteria
- [ ] Checkboxes appear on items
- [ ] Can select multiple items
- [ ] Select/deselect all works
- [ ] Bulk actions bar appears when items selected
- [ ] Bulk delete works with confirmation
- [ ] Bulk status change works
- [ ] Selection clears after bulk action
