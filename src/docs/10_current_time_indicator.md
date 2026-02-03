# Feature 10: Current Time Indicator & Auto-Scroll

## Overview
Display live "NOW" line on timeline and automatically scroll to current time.

## Requirements
1. Red line showing current time on timeline
2. Auto-scroll to current time on page load
3. "Jump to Now" button
4. Highlight currently active item
5. Update every minute

## Implementation
```javascript
function CurrentTimeIndicator() {
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute
    
    return () => clearInterval(interval);
  }, []);
  
  // Calculate position on timeline
  const position = calculateTimelinePosition(currentTime);
  
  return (
    <NowLine style={{ top: `${position}px` }}>
      <NowLabel>NOW</NowLabel>
      <NowDot />
    </NowLine>
  );
}
```

## Auto-Scroll
```javascript
useEffect(() => {
  scrollToCurrentTime();
}, []);

function scrollToCurrentTime() {
  const nowElement = document.querySelector('.now-line');
  if (nowElement) {
    nowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}
```

## Acceptance Criteria
- [ ] Red line visible at current time
- [ ] Auto-scrolls on page load
- [ ] Updates position every minute
- [ ] Jump to Now button works
- [ ] Active item highlighted
