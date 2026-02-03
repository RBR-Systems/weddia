# Feature 02: Add Timeline Item

## Overview
Allow wedding planners to create new timeline items by filling out a form with event details.

## User Story
As a wedding planner, I want to add new activities to the timeline so that I can build out the complete event schedule.

## Requirements

### Functional Requirements
1. Open add item form via button click
2. Collect required fields: title, type, start_time, end_time
3. Collect optional fields: setup_time, location, description, notes, guests
4. Validate input data
5. Save to database
6. Update timeline display immediately
7. Show success/error feedback

### Non-Functional Requirements
- Form submission completes in <500ms
- Clear validation errors
- Auto-save to prevent data loss (optional)
- Mobile-friendly form inputs

## Data Requirements

### API Endpoint
```
POST /api/events/:eventId/timeline-items

Request Body:
{
  "title": "Wedding Ceremony",
  "type": "ceremony",
  "start_time": "2026-06-15T17:00:00Z",
  "end_time": "2026-06-15T18:00:00Z",
  "setup_time": "2026-06-15T16:30:00Z",  // optional
  "location_name": "Garden Pavilion",     // optional
  "location_address": "123 Venue St",     // optional
  "description": "Traditional ceremony",  // optional
  "notes": "Check microphone",           // optional
  "guests_description": "Bride & Groom"  // optional
}

Response (201 Created):
{
  "success": true,
  "data": {
    "timeline_item_id": "uuid",
    "event_id": "uuid",
    "title": "Wedding Ceremony",
    "type": "ceremony",
    "start_time": "2026-06-15T17:00:00Z",
    "end_time": "2026-06-15T18:00:00Z",
    "setup_time": "2026-06-15T16:30:00Z",
    "location_name": "Garden Pavilion",
    "location_address": "123 Venue St",
    "description": "Traditional ceremony",
    "notes": "Check microphone",
    "guests_description": "Bride & Groom",
    "status": "pending",
    "created_at": "2026-02-02T14:30:00Z",
    "updated_at": "2026-02-02T14:30:00Z",
    "created_by": "current-user-uuid",
    "updated_by": "current-user-uuid"
  }
}

Error Response (400 Bad Request):
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "title": "Title is required",
    "end_time": "End time must be after start time"
  }
}
```

## UI Components

### Add Button
```jsx
<AddItemButton 
  onClick={openAddForm}
  aria-label="Add timeline item"
>
  <PlusIcon />
  Add Activity
</AddItemButton>
```

### Add Item Form Modal
```jsx
<Modal
  isOpen={isAddFormOpen}
  onClose={closeAddForm}
  title="Add Timeline Item"
  size="large"
>
  <AddItemForm
    onSubmit={handleSubmit}
    onCancel={closeAddForm}
  />
</Modal>
```

### Form Structure
```jsx
<Form onSubmit={handleSubmit}>
  {/* Required Section */}
  <FormSection>
    <SectionTitle>Activity Details *</SectionTitle>
    
    <FormField>
      <Label htmlFor="title">Activity Title *</Label>
      <Input
        id="title"
        name="title"
        value={formData.title}
        onChange={handleChange}
        placeholder="e.g., Wedding Ceremony"
        required
        maxLength={200}
      />
      {errors.title && <ErrorText>{errors.title}</ErrorText>}
    </FormField>
    
    <FormField>
      <Label htmlFor="type">Activity Type *</Label>
      <Select
        id="type"
        name="type"
        value={formData.type}
        onChange={handleChange}
        required
      >
        <option value="">Select type...</option>
        <option value="ceremony">Ceremony</option>
        <option value="reception">Reception</option>
        <option value="photos">Photos</option>
        <option value="vendor_arrival">Vendor Arrival</option>
        <option value="vendor_setup">Vendor Setup</option>
        <option value="vendor_breakdown">Vendor Breakdown</option>
        <option value="entertainment">Entertainment</option>
        <option value="meal_service">Meal Service</option>
        <option value="speeches">Speeches</option>
        <option value="special_moment">Special Moment</option>
        <option value="transition">Transition</option>
        <option value="setup">Setup</option>
        <option value="breakdown">Breakdown</option>
        <option value="guest_activity">Guest Activity</option>
      </Select>
      {errors.type && <ErrorText>{errors.type}</ErrorText>}
    </FormField>
  </FormSection>
  
  {/* Time Section */}
  <FormSection>
    <SectionTitle>Schedule *</SectionTitle>
    
    <TimeRow>
      <FormField>
        <Label htmlFor="start_time">Start Time *</Label>
        <DateTimePicker
          id="start_time"
          name="start_time"
          value={formData.start_time}
          onChange={handleChange}
          required
        />
        {errors.start_time && <ErrorText>{errors.start_time}</ErrorText>}
      </FormField>
      
      <FormField>
        <Label htmlFor="end_time">End Time *</Label>
        <DateTimePicker
          id="end_time"
          name="end_time"
          value={formData.end_time}
          onChange={handleChange}
          required
        />
        {errors.end_time && <ErrorText>{errors.end_time}</ErrorText>}
      </FormField>
    </TimeRow>
    
    <DurationDisplay>
      Duration: {calculateDuration(formData.start_time, formData.end_time)}
    </DurationDisplay>
    
    <FormField>
      <Label htmlFor="setup_time">Setup Time (optional)</Label>
      <DateTimePicker
        id="setup_time"
        name="setup_time"
        value={formData.setup_time}
        onChange={handleChange}
      />
      <HelpText>
        When setup/preparation should begin before the activity starts
      </HelpText>
      {errors.setup_time && <ErrorText>{errors.setup_time}</ErrorText>}
    </FormField>
  </FormSection>
  
  {/* Location Section */}
  <FormSection>
    <SectionTitle>Location (optional)</SectionTitle>
    
    <FormField>
      <Label htmlFor="location_name">Location Name</Label>
      <Input
        id="location_name"
        name="location_name"
        value={formData.location_name}
        onChange={handleChange}
        placeholder="e.g., Garden Pavilion"
      />
    </FormField>
    
    <FormField>
      <Label htmlFor="location_address">Location Address</Label>
      <Input
        id="location_address"
        name="location_address"
        value={formData.location_address}
        onChange={handleChange}
        placeholder="e.g., 123 Venue Street"
      />
    </FormField>
  </FormSection>
  
  {/* Details Section */}
  <FormSection>
    <SectionTitle>Additional Details (optional)</SectionTitle>
    
    <FormField>
      <Label htmlFor="guests_description">Who's Involved</Label>
      <Input
        id="guests_description"
        name="guests_description"
        value={formData.guests_description}
        onChange={handleChange}
        placeholder="e.g., Bride & Groom + Wedding Party"
      />
      <HelpText>Describe who will participate in this activity</HelpText>
    </FormField>
    
    <FormField>
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        name="description"
        value={formData.description}
        onChange={handleChange}
        placeholder="Describe the activity"
        rows={3}
      />
    </FormField>
    
    <FormField>
      <Label htmlFor="notes">Notes & Special Instructions</Label>
      <Textarea
        id="notes"
        name="notes"
        value={formData.notes}
        onChange={handleChange}
        placeholder="Any important reminders or instructions"
        rows={3}
      />
    </FormField>
  </FormSection>
  
  {/* Action Buttons */}
  <FormActions>
    <CancelButton type="button" onClick={onCancel}>
      Cancel
    </CancelButton>
    <SubmitButton type="submit" disabled={isSubmitting}>
      {isSubmitting ? 'Adding...' : 'Add Activity'}
    </SubmitButton>
  </FormActions>
</Form>
```

## Validation Rules

### Client-Side Validation
```javascript
function validateForm(formData) {
  const errors = {};
  
  // Required fields
  if (!formData.title?.trim()) {
    errors.title = 'Activity title is required';
  } else if (formData.title.length > 200) {
    errors.title = 'Title must be 200 characters or less';
  }
  
  if (!formData.type) {
    errors.type = 'Activity type is required';
  }
  
  if (!formData.start_time) {
    errors.start_time = 'Start time is required';
  }
  
  if (!formData.end_time) {
    errors.end_time = 'End time is required';
  }
  
  // Time logic validation
  if (formData.start_time && formData.end_time) {
    const start = new Date(formData.start_time);
    const end = new Date(formData.end_time);
    
    if (end <= start) {
      errors.end_time = 'End time must be after start time';
    }
    
    // Check for unreasonably long activities (>12 hours)
    const durationHours = (end - start) / (1000 * 60 * 60);
    if (durationHours > 12) {
      errors.end_time = 'Activity duration seems unusually long. Please verify times.';
    }
  }
  
  if (formData.setup_time && formData.start_time) {
    const setup = new Date(formData.setup_time);
    const start = new Date(formData.start_time);
    
    if (setup >= start) {
      errors.setup_time = 'Setup time must be before start time';
    }
  }
  
  return errors;
}
```

### Server-Side Validation
```javascript
// Backend validation (Node.js example)
function validateTimelineItem(data) {
  const errors = {};
  
  // Required fields
  if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
    errors.title = 'Title is required';
  }
  
  if (!data.type || !VALID_TYPES.includes(data.type)) {
    errors.type = 'Invalid activity type';
  }
  
  if (!data.start_time || !isValidDate(data.start_time)) {
    errors.start_time = 'Valid start time is required';
  }
  
  if (!data.end_time || !isValidDate(data.end_time)) {
    errors.end_time = 'Valid end time is required';
  }
  
  // Time validation
  if (data.start_time && data.end_time) {
    if (new Date(data.end_time) <= new Date(data.start_time)) {
      errors.end_time = 'End time must be after start time';
    }
  }
  
  if (data.setup_time) {
    if (!isValidDate(data.setup_time)) {
      errors.setup_time = 'Invalid setup time';
    } else if (new Date(data.setup_time) >= new Date(data.start_time)) {
      errors.setup_time = 'Setup time must be before start time';
    }
  }
  
  return errors;
}
```

## Business Logic

### Form State Management
```javascript
const [formData, setFormData] = useState({
  title: '',
  type: '',
  start_time: '',
  end_time: '',
  setup_time: '',
  location_name: '',
  location_address: '',
  description: '',
  notes: '',
  guests_description: ''
});

const [errors, setErrors] = useState({});
const [isSubmitting, setIsSubmitting] = useState(false);

function handleChange(e) {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
  
  // Clear error for this field when user starts typing
  if (errors[name]) {
    setErrors(prev => ({
      ...prev,
      [name]: undefined
    }));
  }
}
```

### Form Submission
```javascript
async function handleSubmit(e) {
  e.preventDefault();
  
  // Validate
  const validationErrors = validateForm(formData);
  if (Object.keys(validationErrors).length > 0) {
    setErrors(validationErrors);
    return;
  }
  
  setIsSubmitting(true);
  
  try {
    const response = await fetch(`/api/events/${eventId}/timeline-items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(formData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      if (errorData.details) {
        setErrors(errorData.details);
      } else {
        throw new Error(errorData.error || 'Failed to add timeline item');
      }
      return;
    }
    
    const result = await response.json();
    
    // Update timeline list with new item
    addTimelineItem(result.data);
    
    // Show success message
    showSuccessToast('Timeline item added successfully');
    
    // Close form
    closeAddForm();
    
    // Reset form for next use
    resetForm();
    
  } catch (error) {
    showErrorToast('Unable to add timeline item. Please try again.');
    console.error('Add item error:', error);
  } finally {
    setIsSubmitting(false);
  }
}
```

### Smart Defaults
```javascript
// When opening the form, pre-fill with smart defaults
function openAddForm() {
  const now = new Date();
  const eventDate = getEventDate(); // Get from event data
  
  // Set default start time to next hour on event date
  const defaultStart = new Date(eventDate);
  defaultStart.setHours(now.getHours() + 1, 0, 0, 0);
  
  // Default end time 1 hour after start
  const defaultEnd = new Date(defaultStart);
  defaultEnd.setHours(defaultStart.getHours() + 1);
  
  setFormData({
    title: '',
    type: '',
    start_time: defaultStart.toISOString(),
    end_time: defaultEnd.toISOString(),
    setup_time: '',
    location_name: '',
    location_address: '',
    description: '',
    notes: '',
    guests_description: ''
  });
  
  setIsAddFormOpen(true);
}
```

### Time Conflict Check (Optional Warning)
```javascript
async function checkTimeConflicts(newItem) {
  const conflicts = timelineItems.filter(item => {
    // Check for overlapping times at same location
    if (item.location_name !== newItem.location_name) {
      return false;
    }
    
    const itemStart = new Date(item.start_time);
    const itemEnd = new Date(item.end_time);
    const newStart = new Date(newItem.start_time);
    const newEnd = new Date(newItem.end_time);
    
    // Check overlap
    return (newStart < itemEnd && newEnd > itemStart);
  });
  
  if (conflicts.length > 0) {
    const proceed = await showConfirmDialog(
      'Time Conflict Detected',
      `This activity overlaps with "${conflicts[0].title}" at the same location. Continue anyway?`
    );
    return proceed;
  }
  
  return true;
}
```

## UI/UX Details

### Form Layout
- **Desktop**: Two-column layout for time fields
- **Mobile**: Single column, stacked fields
- **Modal**: Center of screen, max-width 600px
- **Scrollable**: Content scrolls if longer than viewport

### Input Components

#### DateTimePicker
```jsx
<DateTimePicker
  value={value}
  onChange={onChange}
  minDate={eventStartDate}
  maxDate={eventEndDate}
  dateFormat="MMMM d, yyyy"
  timeFormat="h:mm aa"
  showTimeSelect
  timeIntervals={15}  // 15-minute increments
/>
```

#### Type Selector with Icons
```jsx
<TypeSelect>
  <option value="ceremony">💒 Ceremony</option>
  <option value="reception">🎉 Reception</option>
  <option value="photos">📸 Photos</option>
  <option value="meal_service">🍽️ Meal Service</option>
  <option value="speeches">🎤 Speeches</option>
  <option value="special_moment">💖 Special Moment</option>
  {/* ... more options */}
</TypeSelect>
```

### Loading States
```jsx
<SubmitButton disabled={isSubmitting}>
  {isSubmitting && <Spinner size="small" />}
  {isSubmitting ? 'Adding Activity...' : 'Add Activity'}
</SubmitButton>
```

### Success Feedback
```jsx
// Toast notification
showSuccessToast({
  message: 'Wedding Ceremony added to timeline',
  duration: 3000,
  action: {
    label: 'View',
    onClick: () => scrollToItem(newItemId)
  }
});
```

## Accessibility

### Form Accessibility
```jsx
<Form 
  onSubmit={handleSubmit}
  aria-labelledby="form-title"
  noValidate  // Use custom validation
>
  <h2 id="form-title">Add Timeline Item</h2>
  
  <FormField>
    <Label htmlFor="title">
      Activity Title
      <RequiredIndicator aria-label="required">*</RequiredIndicator>
    </Label>
    <Input
      id="title"
      name="title"
      required
      aria-required="true"
      aria-invalid={!!errors.title}
      aria-describedby={errors.title ? "title-error" : undefined}
    />
    {errors.title && (
      <ErrorText id="title-error" role="alert">
        {errors.title}
      </ErrorText>
    )}
  </FormField>
</Form>
```

### Keyboard Navigation
- Tab through all fields
- Enter to submit (when in input field)
- Escape to close modal
- Focus management: First field gets focus when modal opens

### Screen Reader Announcements
- Form errors announced when validation fails
- Success message announced when item added
- Loading state announced during submission

## Error Handling

### Network Errors
```javascript
try {
  const response = await createTimelineItem(formData);
} catch (error) {
  if (error.name === 'NetworkError') {
    showErrorToast('Network error. Please check your connection and try again.');
  } else if (error.status === 401) {
    redirectToLogin();
  } else if (error.status === 403) {
    showErrorToast('You don\'t have permission to add timeline items.');
  } else {
    showErrorToast('An unexpected error occurred. Please try again.');
  }
}
```

### Field-Level Errors
```jsx
{errors.title && (
  <FieldError>
    <ErrorIcon />
    {errors.title}
  </FieldError>
)}
```

### Form-Level Errors
```jsx
{generalError && (
  <FormError role="alert">
    <AlertIcon />
    <div>
      <strong>Unable to add timeline item</strong>
      <p>{generalError}</p>
    </div>
  </FormError>
)}
```

## Testing

### Unit Tests
```javascript
describe('Add Timeline Item Form', () => {
  test('validates required fields', () => {
    const errors = validateForm({});
    expect(errors.title).toBeDefined();
    expect(errors.type).toBeDefined();
    expect(errors.start_time).toBeDefined();
    expect(errors.end_time).toBeDefined();
  });
  
  test('validates end time after start time', () => {
    const errors = validateForm({
      start_time: '2026-06-15T18:00:00Z',
      end_time: '2026-06-15T17:00:00Z'
    });
    expect(errors.end_time).toContain('after start time');
  });
  
  test('validates setup time before start time', () => {
    const errors = validateForm({
      start_time: '2026-06-15T17:00:00Z',
      setup_time: '2026-06-15T17:30:00Z'
    });
    expect(errors.setup_time).toContain('before start time');
  });
});
```

### Integration Tests
```javascript
describe('Add Timeline Item API', () => {
  test('creates timeline item successfully', async () => {
    const newItem = {
      title: 'Test Ceremony',
      type: 'ceremony',
      start_time: '2026-06-15T17:00:00Z',
      end_time: '2026-06-15T18:00:00Z'
    };
    
    const response = await createTimelineItem(eventId, newItem);
    expect(response.data).toHaveProperty('timeline_item_id');
    expect(response.data.title).toBe('Test Ceremony');
  });
});
```

### E2E Tests
```javascript
describe('Add Timeline Item E2E', () => {
  test('adds new timeline item through UI', async () => {
    await page.goto('/events/123/timeline');
    await page.click('[data-testid="add-item-button"]');
    
    await page.fill('#title', 'Wedding Ceremony');
    await page.selectOption('#type', 'ceremony');
    await page.fill('#start_time', '2026-06-15T17:00');
    await page.fill('#end_time', '2026-06-15T18:00');
    
    await page.click('[data-testid="submit-button"]');
    
    await page.waitForSelector('.timeline-item:has-text("Wedding Ceremony")');
    const items = await page.$$('.timeline-item');
    expect(items.length).toBeGreaterThan(0);
  });
});
```

## Acceptance Criteria

- [ ] Add Activity button is prominently displayed
- [ ] Click button opens modal with form
- [ ] All required fields have asterisks
- [ ] Type dropdown shows all activity types with icons
- [ ] Date/time pickers work correctly
- [ ] Duration auto-calculates and displays
- [ ] Setup time is optional
- [ ] Validation shows clear error messages
- [ ] Cannot submit with invalid data
- [ ] Server errors display appropriately
- [ ] Success toast appears on successful creation
- [ ] New item appears in timeline immediately
- [ ] Form closes after successful submission
- [ ] Cancel button closes form without saving
- [ ] Form is accessible via keyboard
- [ ] Works on mobile devices
- [ ] Loading state shows during submission

## Implementation Notes

### Optimistic UI Update
```javascript
async function handleSubmit(formData) {
  // Generate temporary ID
  const tempId = `temp-${Date.now()}`;
  const optimisticItem = {
    timeline_item_id: tempId,
    ...formData,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  
  // Add to UI immediately
  addTimelineItem(optimisticItem);
  closeForm();
  
  try {
    // Save to server
    const savedItem = await createTimelineItem(formData);
    
    // Replace temp item with real one
    updateTimelineItem(tempId, savedItem);
    
  } catch (error) {
    // Remove temp item on error
    removeTimelineItem(tempId);
    showErrorToast('Failed to add timeline item');
    reopenForm(formData); // Restore form data
  }
}
```

## Dependencies
- React Hook Form or Formik: Form management
- date-fns: Date manipulation
- react-datepicker: DateTime picker component
- Yup or Zod: Schema validation
