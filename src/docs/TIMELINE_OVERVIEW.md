# Timeline Feature - Global Overview

## Purpose
The Timeline feature provides wedding planners with a comprehensive, day-of schedule management system. It allows planners to view, manage, and adjust the event schedule in real-time, ensuring smooth execution of all wedding activities.

## Architecture

### Database Schema
```
EVENT_TIMELINE_ITEMS
├── PK: timeline_item_id (UUID)
├── FK: event_id (UUID)
├── title (string)
├── type (enum)
├── location_name (string)
├── location_address (string)
├── description (string)
├── notes (string)
├── guests_description (string)
├── start_time (timestamp)
├── end_time (timestamp)
├── setup_time (timestamp)
├── status (enum)
├── created_at (timestamp)
├── updated_at (timestamp)
├── created_by (UUID)
└── updated_by (UUID)
```

### Enums
- **type**: ceremony, reception, photos, vendor_arrival, vendor_setup, vendor_breakdown, entertainment, meal_service, speeches, special_moment, transition, setup, breakdown, guest_activity
- **status**: pending, in_progress, completed, delayed, cancelled

## Page Structure

### Tab Navigation
The Timeline feature is part of a multi-tab event management interface:
1. **Timeline** (main focus) - Schedule management
2. **Seating** - Table assignments
3. **Guests** - Guest list with check-in
4. **Vendors** - Contact information
5. **Overview** - Dashboard summary

## Timeline Tab Components

### Core Features (Build Order)

#### Phase 1 - Basic Timeline
1. Display timeline items
2. Add new item
3. Edit item
4. Delete item
5. Mark as complete
6. Status management

#### Phase 2 - Setup Time
7. Setup time display
8. Setup time management
9. Setup time alerts

#### Phase 3 - Time Adjustments
10. Individual item time editing
11. Bulk time adjustment (running behind/ahead)
12. Time conflict detection
13. Delete impact warnings

#### Phase 4 - Polish
14. Current time indicator
15. Auto-scroll to current time
16. Active item highlighting
17. Filters and search
18. Bulk operations

## Feature Files

Each feature is documented in its own file:
- `01_timeline_display.md` - Core timeline view
- `02_add_timeline_item.md` - Creating new items
- `03_edit_timeline_item.md` - Editing existing items
- `04_delete_timeline_item.md` - Removing items
- `05_status_management.md` - Status updates and completion
- `06_setup_time.md` - Setup time management
- `07_individual_time_edit.md` - Single item time adjustments
- `08_bulk_time_adjustment.md` - Running behind/ahead feature
- `09_time_conflict_detection.md` - Overlap warnings
- `10_current_time_indicator.md` - Live time tracking
- `11_filters_search.md` - Filtering and searching
- `12_bulk_operations.md` - Multi-select actions

## UI/UX Guidelines

### Visual Design
- **Timeline Layout**: Vertical chronological list
- **Time Display**: Left-aligned time markers
- **Color Coding**: Each type has distinct color
- **Status Indicators**: Clear visual states
- **Current Time**: Prominent red line indicator

### Interaction Patterns
- Click item to expand details
- Inline editing for quick changes
- Modal forms for complex edits
- Confirmation dialogs for destructive actions
- Toast notifications for success/error states

### Mobile Responsiveness
- Stack timeline items vertically
- Touch-friendly tap targets (min 44px)
- Swipe gestures for quick actions
- Collapsible details to save space

## Technical Requirements

### Frontend
- React components
- State management (React Context or Redux)
- Real-time updates
- Optimistic UI updates
- Form validation
- Date/time picker components

### Backend
- RESTful API endpoints
- CRUD operations for timeline items
- Bulk update operations
- Conflict detection logic
- Timestamp validation

### API Endpoints Needed
```
GET    /api/events/:eventId/timeline-items
POST   /api/events/:eventId/timeline-items
GET    /api/timeline-items/:id
PUT    /api/timeline-items/:id
DELETE /api/timeline-items/:id
PATCH  /api/timeline-items/bulk-update
POST   /api/timeline-items/detect-conflicts
```

## Data Validation Rules

### Time Validation
- `end_time` must be after `start_time`
- `setup_time` must be before `start_time` (if provided)
- All times must be valid timestamps
- Times must be within reasonable event window

### Required Fields
- `title` (not empty, max 200 chars)
- `type` (must be valid enum value)
- `start_time` (valid timestamp)
- `end_time` (valid timestamp)
- `event_id` (valid UUID, event must exist)

### Optional Fields
- `setup_time`
- `location_name`
- `location_address`
- `description`
- `notes`
- `guests_description`

## Error Handling

### Common Errors
- Invalid time ranges
- Time conflicts
- Missing required fields
- Event not found
- Timeline item not found
- Unauthorized access

### User Feedback
- Success toast: "Timeline item created"
- Error toast: "Unable to save changes"
- Warning dialog: "This creates a time conflict"
- Confirmation: "Delete this item?"

## Performance Considerations

### Optimization Strategies
- Lazy load timeline items (paginate if >100 items)
- Cache current event data
- Debounce search/filter inputs
- Batch bulk updates
- Index database by `event_id` and `start_time`

### Expected Load
- Typical event: 20-30 timeline items
- Large event: 50-100 timeline items
- Concurrent users: 2-5 planners per event

## Accessibility

### Requirements
- Keyboard navigation support
- Screen reader friendly labels
- ARIA attributes on interactive elements
- Focus management in modals
- Color contrast compliance (WCAG AA)
- Time format with timezone clarity

## Testing Strategy

### Unit Tests
- Time calculation functions
- Validation logic
- Conflict detection algorithm
- Bulk update calculations

### Integration Tests
- CRUD operations
- Bulk time adjustments
- Cascade updates
- Filter/search functionality

### E2E Tests
- Create complete timeline workflow
- Edit and adjust timeline
- Day-of usage simulation
- Multi-user collaboration

## Future Enhancements (Not in First Draft)

- Drag and drop reordering
- Timeline templates
- Export to PDF/Calendar
- Real-time collaboration
- Push notifications
- Weather integration
- Photo attachments
- Sub-task checklists
- Analytics and reports

## Dependencies

### Required Libraries
- Date manipulation: date-fns or moment.js
- UI components: Material-UI, Ant Design, or custom
- Form handling: React Hook Form or Formik
- API client: Axios or Fetch

### Integration Points
- Event management system (for event_id)
- User authentication (for created_by, updated_by)
- Guest list (for guests_description reference)
- Vendor list (for vendor activities)
- Table assignments (for reception activities)

## Implementation Checklist

- [ ] Set up database schema
- [ ] Create API endpoints
- [ ] Build timeline display component
- [ ] Implement CRUD operations
- [ ] Add status management
- [ ] Build setup time feature
- [ ] Create time adjustment tools
- [ ] Add conflict detection
- [ ] Implement current time indicator
- [ ] Build filters and search
- [ ] Add bulk operations
- [ ] Write tests
- [ ] Mobile responsive design
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] User acceptance testing

## Success Metrics

### Usability
- Time to create complete timeline: <10 minutes
- Time to adjust timeline: <30 seconds
- Error rate on time conflicts: <5%
- User satisfaction score: >4/5

### Performance
- Page load time: <2 seconds
- Timeline item creation: <500ms
- Bulk update: <1 second for 50 items
- Search response: <300ms

## Support and Maintenance

### Documentation Needed
- User guide for wedding planners
- API documentation
- Component documentation
- Troubleshooting guide

### Known Limitations
- No offline support in first draft
- Limited to single timezone per event
- No recurring timeline items
- Maximum 200 timeline items per event

## Questions for Product Owner

- Should setup time be required for certain activity types?
- What's the maximum event duration to support?
- Should we support multi-day events?
- Is real-time collaboration required for v1?
- What timezone handling is needed?
- Should we support custom activity types?
- What's the data retention policy?
