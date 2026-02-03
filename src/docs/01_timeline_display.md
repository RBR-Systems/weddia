# Feature 01: Timeline Display

## Overview
Display all timeline items for an event in chronological order with clear visual hierarchy and status indicators.

## User Story
As a wedding planner, I want to see all activities for the event in chronological order so that I can understand the flow of the day at a glance.

## Requirements

### Functional Requirements
1. Display all timeline items ordered by `start_time` (earliest first)
2. Show time range for each item (start_time to end_time)
3. Display calculated duration
4. Show activity type with color coding
5. Display location name
6. Show current status
7. Support vertical scrolling for long timelines

### Non-Functional Requirements
- Load timeline in <2 seconds
- Support up to 200 timeline items
- Mobile responsive design
- Accessible to screen readers

## Data Requirements

### API Endpoint
```
GET /api/events/:eventId/timeline-items

Response:
{
  "success": true,
  "data": [
    {
      "timeline_item_id": "uuid",
      "event_id": "uuid",
      "title": "Wedding Ceremony",
      "type": "ceremony",
      "location_name": "Garden Pavilion",
      "location_address": "123 Venue St",
      "description": "Traditional ceremony",
      "notes": "Check microphone",
      "guests_description": "Bride, Groom, Wedding Party",
      "start_time": "2026-06-15T17:00:00Z",
      "end_time": "2026-06-15T18:00:00Z",
      "setup_time": "2026-06-15T16:30:00Z",
      "status": "pending",
      "created_at": "2026-02-01T10:00:00Z",
      "updated_at": "2026-02-01T10:00:00Z",
      "created_by": "uuid",
      "updated_by": "uuid"
    }
  ]
}
```

### Data Transformations
- Calculate duration: `end_time - start_time`
- Format times for display: "5:00 PM" or "17:00" based on user preference
- Calculate setup duration: `start_time - setup_time`

## UI Components

### Timeline Container
```jsx
<TimelineContainer>
  <TimelineHeader>
    <h2>Event Timeline</h2>
    <TimelineStats />
    <ActionButtons />
  </TimelineHeader>
  <TimelineList>
    {items.map(item => (
      <TimelineItem key={item.timeline_item_id} item={item} />
    ))}
  </TimelineList>
</TimelineContainer>
```

### Timeline Item Card
```jsx
<TimelineItemCard status={item.status} type={item.type}>
  {item.setup_time && (
    <SetupTimeBlock>
      <TimeLabel>{formatTime(item.setup_time)}</TimeLabel>
      <SetupLabel>Setup</SetupLabel>
    </SetupTimeBlock>
  )}
  
  <MainTimeBlock>
    <TimeRange>
      <StartTime>{formatTime(item.start_time)}</StartTime>
      <Separator>—</Separator>
      <EndTime>{formatTime(item.end_time)}</EndTime>
    </TimeRange>
    
    <ItemContent>
      <ItemHeader>
        <TypeBadge type={item.type}>{item.type}</TypeBadge>
        <ItemTitle>{item.title}</ItemTitle>
      </ItemHeader>
      
      <ItemDetails>
        {item.location_name && (
          <Location>📍 {item.location_name}</Location>
        )}
        <Duration>⏱ {calculateDuration(item)}</Duration>
      </ItemDetails>
      
      <StatusIndicator status={item.status} />
    </ItemContent>
  </MainTimeBlock>
</TimelineItemCard>
```

## Visual Design

### Color Coding by Type
```javascript
const typeColors = {
  ceremony: '#D4AF37',        // Gold
  reception: '#4A90E2',       // Blue
  photos: '#9B59B6',          // Purple
  vendor_arrival: '#95A5A6',  // Gray
  vendor_setup: '#BDC3C7',    // Light Gray
  vendor_breakdown: '#7F8C8D',// Dark Gray
  entertainment: '#E74C3C',   // Red
  meal_service: '#27AE60',    // Green
  speeches: '#F39C12',        // Orange
  special_moment: '#E91E63',  // Pink
  transition: '#34495E',      // Dark Blue
  setup: '#95A5A6',          // Gray
  breakdown: '#7F8C8D',      // Dark Gray
  guest_activity: '#3498DB'   // Light Blue
};
```

### Status Indicators
```javascript
const statusStyles = {
  pending: {
    icon: '⏳',
    color: '#95A5A6',
    backgroundColor: '#ECF0F1'
  },
  in_progress: {
    icon: '▶️',
    color: '#3498DB',
    backgroundColor: '#EBF5FB'
  },
  completed: {
    icon: '✅',
    color: '#27AE60',
    backgroundColor: '#E8F8F5',
    opacity: 0.7  // Slightly faded
  },
  delayed: {
    icon: '⚠️',
    color: '#E67E22',
    backgroundColor: '#FEF5E7'
  },
  cancelled: {
    icon: '❌',
    color: '#E74C3C',
    backgroundColor: '#FADBD8',
    textDecoration: 'line-through'
  }
};
```

### Layout Specifications
- **Item Card**: Full width, 16px padding
- **Time Column**: 80px fixed width, aligned left
- **Content Area**: Flex 1, 16px left padding
- **Type Badge**: 8px padding, 4px border radius
- **Spacing**: 16px between items
- **Setup Block**: 50% opacity, 8px top padding

## Interaction Patterns

### Click to Expand
- Click anywhere on item card to expand details
- Expanded view shows: description, notes, guests_description, location_address
- Click again to collapse
- Only one item expanded at a time

### Hover Effects
- Item card: Slight shadow increase
- Cursor: Pointer to indicate clickable
- Background: Lighten by 5%

### Loading State
```jsx
<TimelineList>
  {loading && (
    <LoadingState>
      <Spinner />
      <p>Loading timeline...</p>
    </LoadingState>
  )}
</TimelineList>
```

### Empty State
```jsx
{items.length === 0 && (
  <EmptyState>
    <EmptyIcon>📅</EmptyIcon>
    <h3>No timeline items yet</h3>
    <p>Add your first activity to get started</p>
    <AddItemButton />
  </EmptyState>
)}
```

## Business Logic

### Duration Calculation
```javascript
function calculateDuration(item) {
  const start = new Date(item.start_time);
  const end = new Date(item.end_time);
  const diffMs = end - start;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 60) {
    return `${diffMins} min`;
  }
  
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (mins === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return `${hours}h ${mins}m`;
}
```

### Time Formatting
```javascript
function formatTime(timestamp, use24Hour = false) {
  const date = new Date(timestamp);
  
  if (use24Hour) {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  }
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}
```

### Sorting
```javascript
function sortTimelineItems(items) {
  return [...items].sort((a, b) => {
    const timeA = new Date(a.start_time);
    const timeB = new Date(b.start_time);
    return timeA - timeB;
  });
}
```

## Error Handling

### API Errors
```javascript
try {
  const response = await fetch(`/api/events/${eventId}/timeline-items`);
  if (!response.ok) {
    throw new Error('Failed to load timeline');
  }
  const data = await response.json();
  setItems(data.data);
} catch (error) {
  showErrorToast('Unable to load timeline. Please refresh the page.');
  console.error('Timeline load error:', error);
}
```

### Invalid Data
- Missing required fields: Skip item, log warning
- Invalid timestamps: Show "Invalid time"
- Null values: Use fallback defaults

## Accessibility

### ARIA Labels
```jsx
<TimelineList 
  role="list" 
  aria-label="Event timeline"
>
  <TimelineItemCard
    role="listitem"
    aria-label={`${item.title}, ${formatTime(item.start_time)} to ${formatTime(item.end_time)}`}
    tabIndex={0}
  >
```

### Keyboard Navigation
- Tab: Move between timeline items
- Enter/Space: Expand/collapse item details
- Arrow keys: Navigate between items

### Screen Reader Support
- Announce time, title, type, location
- Status changes announced
- Loading states announced

## Mobile Responsive Design

### Breakpoints
- Desktop: > 768px
- Tablet: 481px - 768px  
- Mobile: ≤ 480px

### Mobile Adjustments
- Stack time and content vertically
- Reduce padding to 12px
- Smaller font sizes (title: 16px, details: 14px)
- Full-width cards with 8px margin
- Touch targets minimum 44px

### Mobile Layout
```
┌─────────────────────────┐
│ 5:00 PM                 │
│ [Setup: 4:30 PM]       │
│                         │
│ 💒 Wedding Ceremony    │
│ 📍 Garden Pavilion     │
│ ⏱ 1 hour               │
│ Status: ⏳ Pending     │
└─────────────────────────┘
```

## Performance Optimization

### Virtualization
- For timelines with >50 items, implement virtual scrolling
- Render only visible items + buffer
- Use `react-window` or `react-virtualized`

### Memoization
```javascript
const TimelineItem = React.memo(({ item }) => {
  // Component code
}, (prevProps, nextProps) => {
  return prevProps.item.timeline_item_id === nextProps.item.timeline_item_id
    && prevProps.item.updated_at === nextProps.item.updated_at;
});
```

### Lazy Loading
- Load initial 20 items
- Load more on scroll
- Show loading indicator at bottom

## Testing

### Unit Tests
```javascript
describe('Timeline Display', () => {
  test('sorts items by start_time', () => {
    const items = [item3pm, item1pm, item5pm];
    const sorted = sortTimelineItems(items);
    expect(sorted[0]).toBe(item1pm);
  });
  
  test('calculates duration correctly', () => {
    const item = {
      start_time: '2026-06-15T17:00:00Z',
      end_time: '2026-06-15T18:30:00Z'
    };
    expect(calculateDuration(item)).toBe('1h 30m');
  });
  
  test('formats time in 12-hour format', () => {
    const time = '2026-06-15T17:00:00Z';
    expect(formatTime(time)).toBe('5:00 PM');
  });
});
```

### Integration Tests
```javascript
describe('Timeline API Integration', () => {
  test('loads timeline items for event', async () => {
    const items = await fetchTimelineItems(eventId);
    expect(items).toBeArrayOfSize(24);
    expect(items[0]).toHaveProperty('timeline_item_id');
  });
});
```

### E2E Tests
```javascript
describe('Timeline Display E2E', () => {
  test('displays timeline items in order', async () => {
    await page.goto('/events/123/timeline');
    const items = await page.$$('.timeline-item');
    expect(items.length).toBeGreaterThan(0);
    
    const firstTime = await items[0].$eval('.start-time', el => el.textContent);
    const secondTime = await items[1].$eval('.start-time', el => el.textContent);
    expect(parseTime(firstTime)).toBeLessThan(parseTime(secondTime));
  });
});
```

## Acceptance Criteria

- [ ] Timeline items display in chronological order
- [ ] Each item shows time range, title, type, location, duration, status
- [ ] Setup time displays when present
- [ ] Type badge shows with correct color
- [ ] Status indicator shows with correct icon/color
- [ ] Completed items appear slightly faded
- [ ] Click to expand shows full details
- [ ] Empty state shows when no items exist
- [ ] Loading state shows while fetching data
- [ ] Mobile responsive layout works on all screen sizes
- [ ] Accessible via keyboard
- [ ] Screen reader announces item details
- [ ] Timeline loads in under 2 seconds

## Implementation Notes

### State Management
```javascript
const [timelineItems, setTimelineItems] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [expandedItemId, setExpandedItemId] = useState(null);

useEffect(() => {
  loadTimelineItems();
}, [eventId]);

async function loadTimelineItems() {
  setLoading(true);
  try {
    const items = await fetchTimelineItems(eventId);
    setTimelineItems(sortTimelineItems(items));
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
}
```

### CSS Structure
```css
.timeline-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
}

.timeline-item {
  display: flex;
  margin-bottom: 16px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  transition: box-shadow 0.2s;
  cursor: pointer;
}

.timeline-item:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.15);
}

.timeline-item.completed {
  opacity: 0.7;
}

.setup-time {
  opacity: 0.5;
  border-left: 3px dashed #95A5A6;
  padding: 8px 16px;
}

.main-time {
  border-left: 3px solid;
  padding: 16px;
}
```

## Dependencies
- date-fns: Time formatting and calculations
- React: Component framework
- CSS-in-JS or styled-components: Styling
