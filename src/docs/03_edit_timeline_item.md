# Feature 03: Edit Timeline Item

## Overview
Allow wedding planners to modify existing timeline items.

## User Story
As a wedding planner, I want to edit timeline activities so that I can update times, details, or fix mistakes.

## Requirements

### Functional Requirements
1. Click timeline item to view details
2. Click "Edit" button to open edit form
3. Form pre-filled with existing data
4. Save updates to database
5. Update timeline display immediately
6. Track who made changes and when

### API Endpoint
```
PUT /api/timeline-items/:id

Request Body:
{
  "title": "Updated Wedding Ceremony",
  "type": "ceremony",
  "start_time": "2026-06-15T17:30:00Z",
  "end_time": "2026-06-15T18:30:00Z",
  "setup_time": "2026-06-15T17:00:00Z",
  "location_name": "Main Hall",
  "location_address": "123 Venue St",
  "description": "Updated description",
  "notes": "New notes",
  "guests_description": "All guests"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "timeline_item_id": "uuid",
    "event_id": "uuid",
    // ... all fields with updates
    "updated_at": "2026-02-02T15:00:00Z",
    "updated_by": "current-user-uuid"
  }
}
```

## UI Components

### Edit Button
```jsx
<TimelineItemCard onClick={expandItem}>
  {expanded && (
    <ItemActions>
      <EditButton onClick={openEditForm}>
        <EditIcon />
        Edit
      </EditButton>
    </ItemActions>
  )}
</TimelineItemCard>
```

### Edit Form (Reuse Add Form)
```jsx
<Modal
  isOpen={isEditFormOpen}
  onClose={closeEditForm}
  title="Edit Timeline Item"
>
  <TimelineItemForm
    mode="edit"
    initialData={selectedItem}
    onSubmit={handleUpdate}
    onCancel={closeEditForm}
  />
</Modal>
```

## Business Logic

### Load Existing Data
```javascript
function openEditForm(item) {
  setFormData({
    timeline_item_id: item.timeline_item_id,
    title: item.title,
    type: item.type,
    start_time: item.start_time,
    end_time: item.end_time,
    setup_time: item.setup_time || '',
    location_name: item.location_name || '',
    location_address: item.location_address || '',
    description: item.description || '',
    notes: item.notes || '',
    guests_description: item.guests_description || ''
  });
  setIsEditFormOpen(true);
}
```

### Handle Update
```javascript
async function handleUpdate(e) {
  e.preventDefault();
  
  const validationErrors = validateForm(formData);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    const response = await fetch(`/api/timeline-items/${formData.timeline_item_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update timeline item');
    }
    
    const result = await response.json();
    
    // Update timeline list
    updateTimelineItem(result.data);
    
    showSuccessToast('Timeline item updated successfully');
    closeEditForm();
    
  } catch (error) {
    showErrorToast('Unable to update timeline item. Please try again.');
    console.error('Update error:', error);
  } finally {
    setIsSubmitting(false);
  }
}
```

### Detect Changes
```javascript
function hasChanges(original, current) {
  const fields = [
    'title', 'type', 'start_time', 'end_time', 'setup_time',
    'location_name', 'location_address', 'description', 'notes', 'guests_description'
  ];
  
  return fields.some(field => original[field] !== current[field]);
}

// Warn if closing with unsaved changes
function handleClose() {
  if (hasChanges(originalData, formData)) {
    const confirm = window.confirm('You have unsaved changes. Discard them?');
    if (!confirm) return;
  }
  closeEditForm();
}
```

## Inline Quick Edit

### Inline Time Edit
```jsx
<TimeDisplay onClick={() => setEditingTime(true)}>
  {editingTime ? (
    <InlineTimePicker
      value={item.start_time}
      onSave={handleQuickTimeUpdate}
      onCancel={() => setEditingTime(false)}
    />
  ) : (
    <Time>{formatTime(item.start_time)}</Time>
  )}
</TimeDisplay>
```

### Quick Update Function
```javascript
async function handleQuickTimeUpdate(itemId, field, newValue) {
  try {
    await fetch(`/api/timeline-items/${itemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: newValue })
    });
    
    updateTimelineItem(itemId, { [field]: newValue });
    showSuccessToast('Time updated');
    
  } catch (error) {
    showErrorToast('Failed to update time');
  }
}
```

## Validation

### Same as Add Item
- Required fields: title, type, start_time, end_time
- end_time must be after start_time
- setup_time must be before start_time (if provided)
- Title max 200 characters

### Additional Validation
```javascript
// Warn if time change creates conflicts
if (timeChanged) {
  const conflicts = await checkTimeConflicts(formData);
  if (conflicts.length > 0) {
    showWarning('This time change creates conflicts with other activities');
  }
}
```

## Cascading Updates Option

### Ask About Cascade
```jsx
{timeChanged && hasFollowingItems && (
  <CascadeOption>
    <Checkbox
      checked={cascadeChanges}
      onChange={(e) => setCascadeChanges(e.target.checked)}
    />
    <Label>
      Shift all following activities by {timeDifference} minutes
    </Label>
  </CascadeOption>
)}
```

### Apply Cascade
```javascript
async function handleUpdateWithCascade(formData, cascade) {
  if (cascade) {
    const timeDiff = calculateTimeDifference(
      originalItem.start_time,
      formData.start_time
    );
    
    await bulkUpdateTimes(itemId, timeDiff);
  } else {
    await updateSingleItem(formData);
  }
}
```

## Change History (Optional)

### Show Last Updated
```jsx
<ItemMeta>
  <LastUpdated>
    Last updated {formatRelativeTime(item.updated_at)}
    {item.updated_by && ` by ${getUserName(item.updated_by)}`}
  </LastUpdated>
</ItemMeta>
```

## Accessibility

### Focus Management
```javascript
// When opening edit form, focus first input
useEffect(() => {
  if (isEditFormOpen) {
    titleInputRef.current?.focus();
  }
}, [isEditFormOpen]);
```

### Keyboard Shortcuts
- Ctrl/Cmd + S: Save changes
- Escape: Cancel editing

## Testing

### Unit Tests
```javascript
test('loads existing data into form', () => {
  const item = { title: 'Test', type: 'ceremony', /* ... */ };
  openEditForm(item);
  expect(formData.title).toBe('Test');
});

test('detects unsaved changes', () => {
  const original = { title: 'Original' };
  const current = { title: 'Modified' };
  expect(hasChanges(original, current)).toBe(true);
});
```

### Integration Tests
```javascript
test('updates timeline item via API', async () => {
  const updates = { title: 'New Title' };
  const result = await updateTimelineItem(itemId, updates);
  expect(result.data.title).toBe('New Title');
  expect(result.data.updated_at).toBeDefined();
});
```

## Acceptance Criteria

- [ ] Edit button appears when item is expanded
- [ ] Form opens with existing data pre-filled
- [ ] All fields can be modified
- [ ] Validation works same as add form
- [ ] Save button updates item in database
- [ ] Timeline refreshes with updated data
- [ ] Success message appears
- [ ] Form closes after save
- [ ] Cancel discards changes
- [ ] Warns if closing with unsaved changes
- [ ] Shows who last updated and when
- [ ] Inline time editing works (if implemented)
- [ ] Option to cascade time changes to following items
