# Feature 11: Filters & Search

## Overview
Filter and search timeline items.

## Requirements
1. Search by title, location, description, notes
2. Filter by type
3. Filter by status
4. "Hide Completed" toggle
5. Clear filters button

## UI Components
```jsx
<FilterBar>
  <SearchBox
    placeholder="Search timeline..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
  />
  
  <TypeFilter>
    <Select multiple onChange={handleTypeFilter}>
      {types.map(type => (
        <option value={type}>{type}</option>
      ))}
    </Select>
  </TypeFilter>
  
  <StatusFilter>
    {statuses.map(status => (
      <FilterChip
        active={activeStatuses.includes(status)}
        onClick={() => toggleStatus(status)}
      >
        {status}
      </FilterChip>
    ))}
  </StatusFilter>
  
  <Toggle
    checked={hideCompleted}
    onChange={() => setHideCompleted(!hideCompleted)}
  >
    Hide Completed
  </Toggle>
</FilterBar>
```

## Filter Logic
```javascript
function filterItems(items, filters) {
  return items.filter(item => {
    // Search filter
    if (filters.search) {
      const searchText = filters.search.toLowerCase();
      const matches = 
        item.title.toLowerCase().includes(searchText) ||
        item.location_name?.toLowerCase().includes(searchText) ||
        item.description?.toLowerCase().includes(searchText) ||
        item.notes?.toLowerCase().includes(searchText);
      
      if (!matches) return false;
    }
    
    // Type filter
    if (filters.types.length > 0 && !filters.types.includes(item.type)) {
      return false;
    }
    
    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) {
      return false;
    }
    
    // Hide completed
    if (filters.hideCompleted && item.status === 'completed') {
      return false;
    }
    
    return true;
  });
}
```

## Acceptance Criteria
- [ ] Search filters in real-time
- [ ] Can filter by multiple types
- [ ] Can filter by status
- [ ] Hide completed toggle works
- [ ] Shows filtered count
- [ ] Clear filters button resets all
