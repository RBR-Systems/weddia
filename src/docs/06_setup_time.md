# Feature 06: Setup Time Management

## Overview
Display and manage setup/preparation time before activities begin.

## User Story
As a wedding planner, I want to track setup time for activities so that I know when preparation must start.

## Requirements
1. Optional setup_time field for each timeline item
2. Display setup time as separate visual block before main activity
3. Calculate setup duration
4. Alert when setup time approaches
5. Edit setup time independently

## UI Components

### Setup Time Display
```jsx
{item.setup_time && (
  <SetupTimeBlock>
    <TimeLabel>{formatTime(item.setup_time)}</TimeLabel>
    <SetupIcon>🔧</SetupIcon>
    <SetupLabel>Setup: {calculateSetupDuration(item)}</SetupLabel>
  </SetupTimeBlock>
)}

<MainActivityBlock>
  {/* Regular activity display */}
</MainActivityBlock>
```

### Visual Design
```css
.setup-time-block {
  background: rgba(149, 165, 166, 0.1);
  border-left: 3px dashed #95A5A6;
  padding: 8px 16px;
  opacity: 0.7;
  font-size: 14px;
}
```

## Business Logic

### Calculate Setup Duration
```javascript
function calculateSetupDuration(item) {
  if (!item.setup_time) return null;
  
  const setup = new Date(item.setup_time);
  const start = new Date(item.start_time);
  const durationMs = start - setup;
  
  return formatDuration(durationMs); // e.g., "30 min"
}
```

### Setup Time Alerts
```javascript
function checkSetupAlerts() {
  const now = new Date();
  
  timelineItems.forEach(item => {
    if (!item.setup_time) return;
    
    const setupTime = new Date(item.setup_time);
    const minutesUntilSetup = (setupTime - now) / 60000;
    
    // Alert 15 minutes before setup time
    if (minutesUntilSetup > 0 && minutesUntilSetup <= 15) {
      showNotification({
        title: 'Setup Time Approaching',
        message: `Setup for "${item.title}" begins in ${Math.round(minutesUntilSetup)} minutes`,
        type: 'info'
      });
    }
    
    // Alert when setup time has passed
    if (minutesUntilSetup < 0 && minutesUntilSetup > -5 && item.status === 'pending') {
      showNotification({
        title: 'Setup Time!',
        message: `Setup for "${item.title}" should have started`,
        type: 'warning'
      });
    }
  });
}
```

### Smart Setup Time Suggestions
```javascript
function suggestSetupTime(activityType) {
  const suggestions = {
    ceremony: 30, // 30 minutes
    reception: 60, // 1 hour
    photos: 15,
    meal_service: 45,
    special_moment: 10,
    vendor_setup: 30
  };
  
  return suggestions[activityType] || 15; // Default 15 min
}

// In add/edit form
function handleTypeChange(newType) {
  setFormData(prev => ({
    ...prev,
    type: newType,
    // Auto-suggest setup time if not set
    setup_time: !prev.setup_time && prev.start_time
      ? calculateSetupTime(prev.start_time, suggestSetupTime(newType))
      : prev.setup_time
  }));
}

function calculateSetupTime(startTime, minutesBefore) {
  const start = new Date(startTime);
  const setup = new Date(start.getTime() - (minutesBefore * 60000));
  return setup.toISOString();
}
```

## Validation

### Setup Time Rules
```javascript
function validateSetupTime(setupTime, startTime) {
  if (!setupTime) return null; // Optional field
  
  const setup = new Date(setupTime);
  const start = new Date(startTime);
  
  if (setup >= start) {
    return 'Setup time must be before start time';
  }
  
  const hoursBefore = (start - setup) / (1000 * 60 * 60);
  if (hoursBefore > 12) {
    return 'Setup time seems too early (more than 12 hours before). Please verify.';
  }
  
  return null;
}
```

## Acceptance Criteria
- [ ] Setup time field in add/edit forms
- [ ] Setup time displays as lighter block before activity
- [ ] Setup duration calculates correctly
- [ ] Setup time validation works
- [ ] Alerts show when setup time approaches
- [ ] Can edit setup time independently
- [ ] Optional field - items can have no setup time
- [ ] Visual distinction between setup and main activity
