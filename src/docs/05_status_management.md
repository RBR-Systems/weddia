# Feature 05: Status Management & Mark Complete

## Overview
Track the progress of timeline items throughout the event day by updating their status.

## User Story
As a wedding planner, I want to mark activities as complete and update their status so that I can track event progress in real-time.

## Requirements

### Functional Requirements
1. Display current status for each item
2. Quick checkbox to mark complete
3. Status dropdown to change status
4. Visual indicators for each status
5. Progress tracking across all items
6. Filter timeline by status

### Status Values
```javascript
const STATUS_OPTIONS = {
  pending: {
    value: 'pending',
    label: 'Pending',
    icon: '⏳',
    color: '#95A5A6',
    description: 'Not yet started'
  },
  in_progress: {
    value: 'in_progress',
    label: 'In Progress',
    icon: '▶️',
    color: '#3498DB',
    description: 'Currently happening'
  },
  completed: {
    value: 'completed',
    label: 'Completed',
    icon: '✅',
    color: '#27AE60',
    description: 'Finished successfully'
  },
  delayed: {
    value: 'delayed',
    label: 'Delayed',
    icon: '⚠️',
    color: '#E67E22',
    description: 'Running behind schedule'
  },
  cancelled: {
    value: 'cancelled',
    label: 'Cancelled',
    icon: '❌',
    color: '#E74C3C',
    description: 'Will not happen'
  }
};
```

## API Endpoints

### Update Status
```
PATCH /api/timeline-items/:id/status

Request Body:
{
  "status": "completed"
}

Response (200 OK):
{
  "success": true,
  "data": {
    "timeline_item_id": "uuid",
    "status": "completed",
    "updated_at": "2026-02-02T16:00:00Z",
    "updated_by": "uuid"
  }
}
```

### Get Progress Summary
```
GET /api/events/:eventId/timeline-items/progress

Response (200 OK):
{
  "success": true,
  "data": {
    "total": 24,
    "pending": 15,
    "in_progress": 2,
    "completed": 6,
    "delayed": 1,
    "cancelled": 0,
    "completion_percentage": 25
  }
}
```

## UI Components

### Status Indicator
```jsx
<StatusBadge status={item.status}>
  <StatusIcon>{STATUS_OPTIONS[item.status].icon}</StatusIcon>
  <StatusLabel>{STATUS_OPTIONS[item.status].label}</StatusLabel>
</StatusBadge>
```

### Quick Complete Checkbox
```jsx
<TimelineItem>
  <CompleteCheckbox
    checked={item.status === 'completed'}
    onChange={() => toggleComplete(item.timeline_item_id)}
    disabled={item.status === 'cancelled'}
    aria-label={`Mark ${item.title} as complete`}
  />
  <ItemContent>
    {/* ... item details */}
  </ItemContent>
</TimelineItem>
```

### Status Dropdown
```jsx
<StatusSelect
  value={item.status}
  onChange={(e) => updateStatus(item.timeline_item_id, e.target.value)}
>
  {Object.values(STATUS_OPTIONS).map(status => (
    <option key={status.value} value={status.value}>
      {status.icon} {status.label}
    </option>
  ))}
</StatusSelect>
```

### Progress Bar
```jsx
<ProgressBar>
  <ProgressHeader>
    <h3>Event Progress</h3>
    <ProgressStats>
      {completedCount} of {totalCount} completed ({completionPercentage}%)
    </ProgressStats>
  </ProgressHeader>
  
  <ProgressTrack>
    <ProgressFill 
      style={{ width: `${completionPercentage}%` }}
      aria-valuenow={completionPercentage}
      aria-valuemin="0"
      aria-valuemax="100"
    />
  </ProgressTrack>
  
  <ProgressBreakdown>
    <StatusCount status="completed">
      ✅ {completedCount} Complete
    </StatusCount>
    <StatusCount status="in_progress">
      ▶️ {inProgressCount} In Progress
    </StatusCount>
    <StatusCount status="pending">
      ⏳ {pendingCount} Pending
    </StatusCount>
    {delayedCount > 0 && (
      <StatusCount status="delayed">
        ⚠️ {delayedCount} Delayed
      </StatusCount>
    )}
  </ProgressBreakdown>
</ProgressBar>
```

## Business Logic

### Toggle Complete
```javascript
async function toggleComplete(itemId) {
  const item = timelineItems.find(i => i.timeline_item_id === itemId);
  const newStatus = item.status === 'completed' ? 'pending' : 'completed';
  
  await updateItemStatus(itemId, newStatus);
}
```

### Update Status
```javascript
async function updateItemStatus(itemId, newStatus) {
  // Optimistic update
  const originalItems = [...timelineItems];
  updateTimelineItem(itemId, { status: newStatus });
  
  try {
    const response = await fetch(`/api/timeline-items/${itemId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ status: newStatus })
    });
    
    if (!response.ok) {
      throw new Error('Failed to update status');
    }
    
    const result = await response.json();
    updateTimelineItem(itemId, result.data);
    
    // Optional: Show toast for important status changes
    if (newStatus === 'completed') {
      showSuccessToast(`✅ "${item.title}" completed`);
    } else if (newStatus === 'delayed') {
      showWarningToast(`⚠️ "${item.title}" marked as delayed`);
    }
    
  } catch (error) {
    // Revert on error
    setTimelineItems(originalItems);
    showErrorToast('Failed to update status');
    console.error('Status update error:', error);
  }
}
```

### Calculate Progress
```javascript
function calculateProgress(items) {
  const total = items.length;
  const statusCounts = items.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  
  const completed = statusCounts.completed || 0;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    completed,
    pending: statusCounts.pending || 0,
    in_progress: statusCounts.in_progress || 0,
    delayed: statusCounts.delayed || 0,
    cancelled: statusCounts.cancelled || 0,
    percentage
  };
}
```

### Auto-Status Based on Time (Optional)
```javascript
function autoUpdateStatusBasedOnTime() {
  const now = new Date();
  
  timelineItems.forEach(item => {
    const start = new Date(item.start_time);
    const end = new Date(item.end_time);
    
    // Auto-mark as in_progress if current time is within activity window
    if (now >= start && now < end && item.status === 'pending') {
      updateItemStatus(item.timeline_item_id, 'in_progress');
    }
    
    // Optional: Auto-complete if past end time
    // (Only enable if requested by user)
    if (now >= end && item.status === 'in_progress') {
      // showNotification to prompt manual completion
    }
  });
}

// Run every minute
useEffect(() => {
  const interval = setInterval(autoUpdateStatusBasedOnTime, 60000);
  return () => clearInterval(interval);
}, [timelineItems]);
```

## Visual Styling

### Status-Based Styling
```css
.timeline-item {
  transition: opacity 0.3s;
}

.timeline-item[data-status="completed"] {
  opacity: 0.7;
}

.timeline-item[data-status="completed"] .item-title {
  color: #27AE60;
}

.timeline-item[data-status="delayed"] {
  border-left: 3px solid #E67E22;
}

.timeline-item[data-status="cancelled"] {
  opacity: 0.5;
  text-decoration: line-through;
}

.timeline-item[data-status="in_progress"] {
  border-left: 3px solid #3498DB;
  box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 500;
}

.status-badge[data-status="completed"] {
  background: #E8F8F5;
  color: #27AE60;
}

.status-badge[data-status="in_progress"] {
  background: #EBF5FB;
  color: #3498DB;
}

.status-badge[data-status="delayed"] {
  background: #FEF5E7;
  color: #E67E22;
}

.status-badge[data-status="cancelled"] {
  background: #FADBD8;
  color: #E74C3C;
}

.status-badge[data-status="pending"] {
  background: #ECF0F1;
  color: #95A5A6;
}
```

## Filter by Status

### Status Filter UI
```jsx
<FilterBar>
  <FilterLabel>Show:</FilterLabel>
  <FilterChips>
    <FilterChip
      active={activeFilter === 'all'}
      onClick={() => setActiveFilter('all')}
    >
      All ({totalCount})
    </FilterChip>
    <FilterChip
      active={activeFilter === 'pending'}
      onClick={() => setActiveFilter('pending')}
    >
      ⏳ Pending ({pendingCount})
    </FilterChip>
    <FilterChip
      active={activeFilter === 'in_progress'}
      onClick={() => setActiveFilter('in_progress')}
    >
      ▶️ In Progress ({inProgressCount})
    </FilterChip>
    <FilterChip
      active={activeFilter === 'completed'}
      onClick={() => setActiveFilter('completed')}
    >
      ✅ Completed ({completedCount})
    </FilterChip>
    {delayedCount > 0 && (
      <FilterChip
        active={activeFilter === 'delayed'}
        onClick={() => setActiveFilter('delayed')}
      >
        ⚠️ Delayed ({delayedCount})
      </FilterChip>
    )}
  </FilterChips>
  
  <ToggleButton onClick={() => setHideCompleted(!hideCompleted)}>
    {hideCompleted ? 'Show' : 'Hide'} Completed
  </ToggleButton>
</FilterBar>
```

### Filter Logic
```javascript
function getFilteredItems(items, filter, hideCompleted) {
  let filtered = items;
  
  if (filter !== 'all') {
    filtered = filtered.filter(item => item.status === filter);
  }
  
  if (hideCompleted) {
    filtered = filtered.filter(item => item.status !== 'completed');
  }
  
  return filtered;
}
```

## Bulk Status Update

### Select Multiple & Update
```jsx
{selectedItems.length > 0 && (
  <BulkActions>
    <span>{selectedItems.length} selected</span>
    <StatusSelect
      onChange={(e) => bulkUpdateStatus(selectedItems, e.target.value)}
    >
      <option value="">Change status...</option>
      {Object.values(STATUS_OPTIONS).map(status => (
        <option key={status.value} value={status.value}>
          {status.icon} {status.label}
        </option>
      ))}
    </StatusSelect>
  </BulkActions>
)}
```

### Bulk Update Function
```javascript
async function bulkUpdateStatus(itemIds, newStatus) {
  try {
    await Promise.all(
      itemIds.map(id => updateItemStatus(id, newStatus))
    );
    
    showSuccessToast(`${itemIds.length} items updated to ${newStatus}`);
    setSelectedItems([]);
    
  } catch (error) {
    showErrorToast('Failed to update some items');
  }
}
```

## Keyboard Shortcuts

### Quick Status Changes
```javascript
function handleKeyPress(e, itemId) {
  // C = Complete
  if (e.key === 'c' || e.key === 'C') {
    updateItemStatus(itemId, 'completed');
  }
  
  // P = Pending
  if (e.key === 'p' || e.key === 'P') {
    updateItemStatus(itemId, 'pending');
  }
  
  // D = Delayed
  if (e.key === 'd' || e.key === 'D') {
    updateItemStatus(itemId, 'delayed');
  }
  
  // Space = Toggle complete
  if (e.key === ' ') {
    e.preventDefault();
    toggleComplete(itemId);
  }
}
```

## Status History (Optional)

### Track Status Changes
```javascript
// Store status change history
const statusHistory = [
  {
    timeline_item_id: 'uuid',
    old_status: 'pending',
    new_status: 'in_progress',
    changed_at: '2026-02-02T14:00:00Z',
    changed_by: 'uuid'
  }
];

// Show history in item details
<StatusHistory>
  <h4>Status History</h4>
  {item.statusHistory.map(change => (
    <HistoryEntry key={change.changed_at}>
      {STATUS_OPTIONS[change.old_status].icon} → {STATUS_OPTIONS[change.new_status].icon}
      {' '}
      {formatRelativeTime(change.changed_at)}
      {' by '}
      {getUserName(change.changed_by)}
    </HistoryEntry>
  ))}
</StatusHistory>
```

## Testing

### Unit Tests
```javascript
describe('Status Management', () => {
  test('toggles between pending and completed', () => {
    const item = { status: 'pending' };
    const newStatus = item.status === 'completed' ? 'pending' : 'completed';
    expect(newStatus).toBe('completed');
  });
  
  test('calculates progress correctly', () => {
    const items = [
      { status: 'completed' },
      { status: 'completed' },
      { status: 'pending' },
      { status: 'in_progress' }
    ];
    
    const progress = calculateProgress(items);
    expect(progress.completed).toBe(2);
    expect(progress.percentage).toBe(50);
  });
  
  test('filters items by status', () => {
    const items = [
      { status: 'completed' },
      { status: 'pending' },
      { status: 'completed' }
    ];
    
    const filtered = getFilteredItems(items, 'completed', false);
    expect(filtered.length).toBe(2);
  });
});
```

### Integration Tests
```javascript
test('updates item status via API', async () => {
  const response = await updateItemStatus(itemId, 'completed');
  expect(response.data.status).toBe('completed');
  expect(response.data.updated_at).toBeDefined();
});
```

## Acceptance Criteria

- [ ] Status badge displays for each item
- [ ] Checkbox to quickly mark complete
- [ ] Status dropdown allows changing status
- [ ] Status colors match design system
- [ ] Completed items appear slightly faded
- [ ] Progress bar shows completion percentage
- [ ] Progress stats show count by status
- [ ] Filter by status works correctly
- [ ] "Hide Completed" toggle works
- [ ] Bulk status update works
- [ ] Status updates save to database
- [ ] Optimistic UI updates immediately
- [ ] Errors revert changes
- [ ] Keyboard shortcuts work
- [ ] Accessible to screen readers
- [ ] Mobile-friendly status controls
