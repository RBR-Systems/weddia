# Feature 08: Bulk Time Adjustment (Running Behind/Ahead)

## Overview
Shift multiple timeline items when the event is running behind or ahead of schedule.

## User Story
As a wedding planner, I want to adjust all following activities when running late so that the timeline stays realistic without manually editing each item.

## Requirements
1. "Adjust Timeline" button prominently displayed
2. Specify if running behind or ahead
3. Enter time adjustment in minutes
4. Choose which items to affect (all remaining or from specific item)
5. Preview changes before applying
6. Bulk update all affected items
7. Preserve activity durations

## UI Components

### Adjust Timeline Button
```jsx
<TimelineHeader>
  <AdjustButton onClick={openAdjustmentPanel}>
    <ClockIcon />
    Adjust Timeline
  </AdjustButton>
</TimelineHeader>
```

### Adjustment Panel
```jsx
<AdjustmentPanel>
  <PanelHeader>
    <h3>Adjust Timeline</h3>
    <CloseButton onClick={closePanel}>×</CloseButton>
  </PanelHeader>
  
  <PanelContent>
    <FormSection>
      <Label>Timeline is running:</Label>
      <RadioGroup>
        <Radio
          name="direction"
          value="behind"
          checked={direction === 'behind'}
          onChange={() => setDirection('behind')}
        >
          ⏱️ Behind Schedule
        </Radio>
        <Radio
          name="direction"
          value="ahead"
          checked={direction === 'ahead'}
          onChange={() => setDirection('ahead')}
        >
          ⚡ Ahead of Schedule
        </Radio>
        <Radio
          name="direction"
          value="on-time"
          checked={direction === 'on-time'}
          onChange={() => setDirection('on-time')}
        >
          ✅ On Time (reset)
        </Radio>
      </RadioGroup>
    </FormSection>
    
    <FormSection>
      <Label htmlFor="adjustment">Adjust by (minutes):</Label>
      <NumberInput
        id="adjustment"
        type="number"
        min="0"
        max="180"
        step="5"
        value={adjustmentMinutes}
        onChange={(e) => setAdjustmentMinutes(e.target.value)}
      />
      <QuickButtons>
        {[5, 10, 15, 20, 30, 45, 60].map(mins => (
          <QuickButton
            key={mins}
            onClick={() => setAdjustmentMinutes(mins)}
          >
            {mins} min
          </QuickButton>
        ))}
      </QuickButtons>
    </FormSection>
    
    <FormSection>
      <Label>Apply to:</Label>
      <Select
        value={applyFrom}
        onChange={(e) => setApplyFrom(e.target.value)}
      >
        <option value="all-remaining">All remaining activities</option>
        <option value="current">From current activity onward</option>
        <option value="next">From next activity onward</option>
        {selectedItem && (
          <option value={selectedItem.timeline_item_id}>
            From "{selectedItem.title}" onward
          </option>
        )}
      </Select>
    </FormSection>
    
    <PreviewSection>
      <PreviewHeader>
        <h4>Preview Changes</h4>
        <AffectedCount>{affectedItems.length} items will be updated</AffectedCount>
      </PreviewHeader>
      
      <PreviewList>
        {affectedItems.slice(0, 5).map(item => (
          <PreviewItem key={item.timeline_item_id}>
            <ItemTitle>{item.title}</ItemTitle>
            <TimeChange>
              <OldTime>{formatTime(item.start_time)}</OldTime>
              <Arrow>→</Arrow>
              <NewTime>{formatTime(calculateNewTime(item.start_time))}</NewTime>
            </TimeChange>
          </PreviewItem>
        ))}
        {affectedItems.length > 5 && (
          <MoreItems>...and {affectedItems.length - 5} more</MoreItems>
        )}
      </PreviewList>
    </PreviewSection>
  </PanelContent>
  
  <PanelFooter>
    <CancelButton onClick={closePanel}>Cancel</CancelButton>
    <ApplyButton 
      onClick={applyAdjustment}
      disabled={!adjustmentMinutes || isApplying}
    >
      {isApplying ? 'Applying...' : `Apply Changes`}
    </ApplyButton>
  </PanelFooter>
</AdjustmentPanel>
```

## Business Logic

### Calculate Affected Items
```javascript
function getAffectedItems(applyFrom, currentTime) {
  const sortedItems = sortTimelineItems(timelineItems);
  
  switch (applyFrom) {
    case 'all-remaining':
      // All items that haven't started yet
      return sortedItems.filter(item => 
        new Date(item.start_time) > currentTime &&
        item.status === 'pending'
      );
    
    case 'current':
      // From currently active item onward
      const currentItem = sortedItems.find(item => {
        const start = new Date(item.start_time);
        const end = new Date(item.end_time);
        return currentTime >= start && currentTime < end;
      });
      
      if (!currentItem) return [];
      
      const currentIndex = sortedItems.indexOf(currentItem);
      return sortedItems.slice(currentIndex);
    
    case 'next':
      // From next pending item onward
      const nextItem = sortedItems.find(item => 
        new Date(item.start_time) > currentTime &&
        item.status === 'pending'
      );
      
      if (!nextItem) return [];
      
      const nextIndex = sortedItems.indexOf(nextItem);
      return sortedItems.slice(nextIndex);
    
    default:
      // From specific item onward
      const selectedIndex = sortedItems.findIndex(
        item => item.timeline_item_id === applyFrom
      );
      return selectedIndex >= 0 ? sortedItems.slice(selectedIndex) : [];
  }
}
```

### Calculate New Times
```javascript
function calculateNewTime(originalTime, adjustmentMinutes, direction) {
  const time = new Date(originalTime);
  const adjustmentMs = adjustmentMinutes * 60000;
  
  if (direction === 'behind') {
    // Running late: shift times later (add minutes)
    return new Date(time.getTime() + adjustmentMs).toISOString();
  } else if (direction === 'ahead') {
    // Running early: shift times earlier (subtract minutes)
    return new Date(time.getTime() - adjustmentMs).toISOString();
  }
  
  return originalTime; // on-time = no change
}
```

### Apply Bulk Adjustment
```javascript
async function applyAdjustment() {
  if (!adjustmentMinutes || affectedItems.length === 0) return;
  
  setIsApplying(true);
  
  try {
    // Prepare bulk update payload
    const updates = affectedItems.map(item => ({
      timeline_item_id: item.timeline_item_id,
      start_time: calculateNewTime(item.start_time, adjustmentMinutes, direction),
      end_time: calculateNewTime(item.end_time, adjustmentMinutes, direction),
      setup_time: item.setup_time 
        ? calculateNewTime(item.setup_time, adjustmentMinutes, direction)
        : null
    }));
    
    // Send bulk update to API
    const response = await fetch(`/api/events/${eventId}/timeline-items/bulk-update`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ updates })
    });
    
    if (!response.ok) {
      throw new Error('Failed to apply time adjustments');
    }
    
    const result = await response.json();
    
    // Update UI with new times
    result.data.forEach(updatedItem => {
      updateTimelineItem(updatedItem.timeline_item_id, updatedItem);
    });
    
    const directionText = direction === 'behind' ? 'later' : 'earlier';
    showSuccessToast(
      `${affectedItems.length} activities shifted ${adjustmentMinutes} minutes ${directionText}`
    );
    
    closePanel();
    resetPanel();
    
  } catch (error) {
    showErrorToast('Failed to adjust timeline. Please try again.');
    console.error('Bulk adjustment error:', error);
  } finally {
    setIsApplying(false);
  }
}
```

### API Endpoint
```
PATCH /api/events/:eventId/timeline-items/bulk-update

Request Body:
{
  "updates": [
    {
      "timeline_item_id": "uuid",
      "start_time": "2026-06-15T17:20:00Z",
      "end_time": "2026-06-15T18:20:00Z",
      "setup_time": "2026-06-15T16:50:00Z"
    },
    // ... more items
  ]
}

Response (200 OK):
{
  "success": true,
  "data": [
    {
      "timeline_item_id": "uuid",
      "start_time": "2026-06-15T17:20:00Z",
      "end_time": "2026-06-15T18:20:00Z",
      "setup_time": "2026-06-15T16:50:00Z",
      "updated_at": "2026-02-02T16:30:00Z"
    },
    // ... all updated items
  ],
  "count": 12
}
```

## Quick Adjustment Presets

### Common Scenarios
```jsx
<QuickAdjustments>
  <h4>Quick Adjustments</h4>
  <PresetButton onClick={() => applyPreset('ceremony-delayed')}>
    Ceremony running 20 min late
  </PresetButton>
  <PresetButton onClick={() => applyPreset('photos-done-early')}>
    Photos finished 15 min early
  </PresetButton>
  <PresetButton onClick={() => applyPreset('major-delay')}>
    Major delay (45+ min)
  </PresetButton>
</QuickAdjustments>
```

```javascript
function applyPreset(preset) {
  const presets = {
    'ceremony-delayed': {
      direction: 'behind',
      minutes: 20,
      applyFrom: 'current'
    },
    'photos-done-early': {
      direction: 'ahead',
      minutes: 15,
      applyFrom: 'next'
    },
    'major-delay': {
      direction: 'behind',
      minutes: 45,
      applyFrom: 'all-remaining'
    }
  };
  
  const config = presets[preset];
  setDirection(config.direction);
  setAdjustmentMinutes(config.minutes);
  setApplyFrom(config.applyFrom);
}
```

## Validation & Warnings

### Check for Issues
```javascript
function validateAdjustment(affectedItems, adjustmentMinutes, direction) {
  const warnings = [];
  
  // Warn if pushing times past midnight
  const latestNewTime = affectedItems.reduce((latest, item) => {
    const newEnd = calculateNewTime(item.end_time, adjustmentMinutes, direction);
    return newEnd > latest ? newEnd : latest;
  }, '');
  
  if (latestNewTime) {
    const endTime = new Date(latestNewTime);
    if (endTime.getHours() >= 23 || endTime.getHours() < 5) {
      warnings.push('Some activities will be scheduled very late (after 11 PM)');
    }
  }
  
  // Warn if large adjustment
  if (adjustmentMinutes > 60) {
    warnings.push(`Large time shift (${adjustmentMinutes} minutes). Please verify this is correct.`);
  }
  
  return warnings;
}
```

### Show Warnings
```jsx
{warnings.length > 0 && (
  <WarningBox>
    <WarningIcon>⚠️</WarningIcon>
    <WarningList>
      {warnings.map((warning, i) => (
        <li key={i}>{warning}</li>
      ))}
    </WarningList>
  </WarningBox>
)}
```

## Undo Feature

### Store Previous State
```javascript
const [adjustmentHistory, setAdjustmentHistory] = useState([]);

async function applyAdjustment() {
  // Store current state before applying
  const snapshot = {
    timestamp: new Date().toISOString(),
    items: affectedItems.map(item => ({
      timeline_item_id: item.timeline_item_id,
      start_time: item.start_time,
      end_time: item.end_time,
      setup_time: item.setup_time
    }))
  };
  
  setAdjustmentHistory(prev => [snapshot, ...prev].slice(0, 5)); // Keep last 5
  
  // ... apply adjustment
  
  // Show undo option
  showToast({
    message: 'Timeline adjusted',
    action: {
      label: 'Undo',
      onClick: () => undoLastAdjustment()
    },
    duration: 10000
  });
}

async function undoLastAdjustment() {
  if (adjustmentHistory.length === 0) return;
  
  const lastSnapshot = adjustmentHistory[0];
  
  // Restore previous times
  await applyBulkUpdate(lastSnapshot.items);
  
  setAdjustmentHistory(prev => prev.slice(1));
  showSuccessToast('Adjustment undone');
}
```

## Accessibility
- Focus management: Focus first input when panel opens
- Keyboard: Tab through controls, Enter to apply, Escape to cancel
- Screen reader: Announce affected item count and preview

## Testing
```javascript
test('calculates affected items correctly', () => {
  const items = [item1pm, item2pm, item3pm, item4pm];
  const affected = getAffectedItems('all-remaining', new Date('2026-06-15T13:00:00Z'));
  expect(affected.length).toBe(4);
});

test('shifts times correctly when running behind', () => {
  const originalTime = '2026-06-15T17:00:00Z';
  const newTime = calculateNewTime(originalTime, 20, 'behind');
  expect(newTime).toBe('2026-06-15T17:20:00Z');
});

test('preserves duration when shifting', () => {
  const item = {
    start_time: '2026-06-15T17:00:00Z',
    end_time: '2026-06-15T18:00:00Z'
  };
  
  const newStart = calculateNewTime(item.start_time, 20, 'behind');
  const newEnd = calculateNewTime(item.end_time, 20, 'behind');
  
  const originalDuration = new Date(item.end_time) - new Date(item.start_time);
  const newDuration = new Date(newEnd) - new Date(newStart);
  
  expect(newDuration).toBe(originalDuration);
});
```

## Acceptance Criteria
- [ ] Adjust Timeline button prominently displayed
- [ ] Panel opens with clear options
- [ ] Can specify running behind/ahead/on-time
- [ ] Enter adjustment in minutes
- [ ] Quick preset buttons (5, 10, 15, 20, 30 min)
- [ ] Choose which items to affect
- [ ] Preview shows before/after times
- [ ] Shows count of affected items
- [ ] Apply button executes bulk update
- [ ] All affected items update simultaneously
- [ ] Activity durations preserved
- [ ] Success message shows
- [ ] Panel closes after apply
- [ ] Cancel discards changes
- [ ] Warnings show for edge cases
- [ ] Undo option available
