# Wedding Check-In Dashboard - Feature Specification

## Overview

A real-time guest management system for wedding day operations, enabling coordinators to efficiently check in guests, track arrivals, and manage special requirements at the venue entrance.

---

## Core Features

### 1. Real-Time Statistics Dashboard

**Live Metrics Display:**

- **Total Guests**: Complete guest count for the event
- **Checked In**: Current number of arrived guests with real-time updates
- **Not Yet Arrived**: Count of expected guests who haven't checked in
- **Attendance Rate**: Percentage calculation (checked in / expected attending)
- **Special Needs Count**: Number of guests requiring special accommodations

**Visual Design:**

- Color-coded cards with icon indicators
- Large, readable numbers for quick scanning
- Border accents for easy visual differentiation

---

### 2. Guest Check-In System

**Primary Check-In Flow:**

1. Coordinator searches for guest by name, phone, or table
2. Clicks "Check In" button on guest row
3. Modal opens with complete guest profile
4. Reviews critical information (dietary, accessibility, VIP status)
5. Adjusts actual party size if needed
6. Confirms check-in with timestamp

**Automated Actions on Check-In:**

- Records exact timestamp of arrival
- Updates attendance statistics in real-time
- Captures actual party size (if different from expected)
- Marks guest status as "Checked In" with visual indicators

**Undo Functionality:**

- Quick undo option for accidental check-ins
- One-click reversal of check-in status
- Clears timestamp and resets status

---

### 3. Comprehensive Guest Information Display

**Main Guest List Table Columns:**

- **Status**: Visual badge (Checked In, Expected, Maybe, Pending)
- **Guest Name**: Full name with VIP star indicator for maid of honor, best man
- **Contact Info**: Phone number for quick reference
- **Relation**: Guest category (Bride's Family, Groom's Family, Friends, etc.)
- **Table Assignment**: Table ID and seat number with map pin icon
- **Party Size**: Expected or actual count
- **Alerts**: Color-coded badges for dietary restrictions, accessibility needs, special notes
- **Check-In Time**: Timestamp of arrival (displayed as HH:MM AM/PM)
- **Actions**: Check-in or undo buttons

**Visual Status Indicators:**

- ✅ **Green Badge + Background**: Checked in guests
- 🕐 **Orange Badge**: Expected but not yet arrived
- ⭐ **Gold Star**: VIP guests (wedding party members)

---

### 4. Advanced Search and Filtering

**Search Capabilities:**

- Real-time search as you type
- Search by first name
- Search by last name
- Search by phone number
- Search by table number (e.g., "TBL-001" or "Table 1")

**Filter Options:**

- **By Status:**
  - All Statuses
  - Checked In
  - Not Yet Arrived
  - Special Needs (dietary or accessibility)
- **By Relation:**
  - All Relations
  - Bride's Family
  - Groom's Family
  - Bride's Friends
  - Groom's Friends
  - Mutual Friends
  - Colleagues

**Collapsible Filter Panel:**

- Toggle filters on/off to save screen space
- Filters combine with search (AND logic)
- Instant filtering without page reload

---

### 5. Alert System for Special Requirements

**Three Types of Alert Badges:**

**🍽️ Dietary Restrictions Badge** (Blue):

- Vegetarian
- Vegan
- Gluten-free
- Nut allergies
- Diabetic diet
- Other dietary needs

**♿ Accessibility Needs Badge** (Purple):

- Wheelchair access
- Hearing impairment
- Visual impairment
- Mobility assistance
- Other physical accommodations

**📝 Special Notes Badge** (Amber):

- General important notes
- Timing considerations
- Special requests
- Coordination requirements

**Alert Display:**

- Visible in main table for quick scanning
- Expanded details in check-in modal
- Color-coded for easy identification
- Highlighted prominently to prevent oversight

---

### 6. Check-In Modal (Detailed View)

**Information Displayed:**

- Guest full name with VIP indicator
- Relation category
- Table assignment and seat number
- Expected party size
- Contact information
- Complete dietary restrictions (with explanation)
- Complete accessibility needs (with details)
- Special notes and instructions

**Interactive Elements:**

- Adjustable actual party size input field
- Help text for guidance
- Cancel button (returns to list without changes)
- Confirm Check-In button (saves all data)

**Visual Hierarchy:**

- Critical alerts in colored information boxes
- Clear separation between different information types
- Large, readable fonts for quick scanning

---

### 7. Table Management Integration

**Table Assignment Display:**

- Shows table ID (e.g., TBL-001)
- Displays seat number
- Visual map pin icon for quick recognition
- Indicates if guest is not yet assigned a table

**Benefits:**

- Coordinators can direct guests to specific tables
- Easy identification of seating conflicts
- Quick reference for last-minute adjustments

---

### 9. Time Tracking

**Timestamp Features:**

- Records exact check-in time (HH:MM format)
- Displays in local timezone
- Shows "-" for guests not yet checked in
- Updates in real-time

**Use Cases:**

- Track arrival patterns for future events
- Identify late arrivals
- Coordinate ceremony start time
- Generate arrival reports post-event

---

### 10. Responsive Design

**Multi-Device Support:**

- Desktop computers (venue check-in desk)
- Tablets (iPad at entrance)
- Mobile phones (coordinator's personal device)
- Adaptive layout for different screen sizes

**Touch-Friendly:**

- Large clickable buttons
- Easy scrolling and navigation
- Mobile-optimized modals

---

## Data Structure Additions

To support these features, the following fields should be added to the guest data model:

```json
{
  "checked_in": false,
  "checked_in_at": null,
  "actual_party_size": null,
  "no_show": false,
  "check_in_notes": "",
  "is_vip": false
}
```

### Field Descriptions:

**checked_in** (boolean):

- Default: `false`
- Changes to `true` when guest checks in
- Used for filtering and statistics

**checked_in_at** (ISO 8601 timestamp):

- Default: `null`
- Records exact time of check-in
- Format: "2026-02-13T16:30:00Z"
- Used for time tracking and reporting

**actual_party_size** (integer):

- Default: `null`
- Records actual number of people who arrived
- May differ from expected `party_size`
- Used for final headcount and catering adjustments

**no_show** (boolean):

- Default: `false`
- Can be marked `true` after event cutoff time
- Helps distinguish between pending and confirmed no-shows
- Used for post-event reporting

**check_in_notes** (string):

- Default: empty string
- Allows coordinators to add notes during check-in
- Examples: "Arrived late", "Mentioned dietary change", "Plus-one canceled"
- Useful for event debrief

**is_vip** (boolean):

- Default: `false`
- Set to `true` for wedding party, parents, officiants
- Triggers visual VIP indicators
- Enables priority handling

---

## User Workflows

### Workflow 1: Standard Guest Check-In

1. Guest approaches check-in table
2. Coordinator asks for name
3. Coordinator searches in dashboard
4. Clicks "Check In" button
5. Reviews guest information in modal
6. Confirms party size matches expectation
7. Notes any special requirements (dietary/accessibility)
8. Clicks "Confirm Check-In"
9. Directs guest to their table (TBL-XXX)

### Workflow 2: Guest with Special Needs Check-In

1. Coordinator sees alert badges immediately
2. Opens check-in modal
3. Reviews highlighted dietary restriction (e.g., "Severe nut allergy")
4. Notifies catering staff via radio/phone
5. Reviews accessibility need (e.g., "Wheelchair access")
6. Confirms ground-floor table assignment
7. Arranges escort to table if needed
8. Completes check-in

### Workflow 3: Unexpected Plus-One

1. Guest arrives with unexpected additional person
2. Coordinator opens check-in modal
3. Adjusts "Actual Party Size" from 1 to 2
4. Adds note in system about unexpected guest
5. Confirms check-in
6. Notifies catering about headcount change
7. Arranges additional seating if necessary

### Workflow 4: Monitoring Arrival Progress

1. Coordinator periodically checks statistics dashboard
2. Notes attendance rate percentage
3. Identifies which relation groups have low arrival rates
4. Uses filters to view "Not Yet Arrived" guests
5. Filters by relation (e.g., "Groom's Family")
6. Communicates arrival status to wedding planner
7. Helps determine when to start ceremony

---

## Additional Features to Consider

### Future Enhancements:

**1. Gift Tracking:**

- `gift_received` (boolean)
- `gift_type` (string: card, package, cash, etc.)
- `gift_notes` (string)
- Integrated gift log

**2. Transportation Tracking:**

- `arrival_method` (car, shuttle, rideshare, etc.)
- Coordinates valet or parking assistance
- Tracks shuttle timing

**3. Photography Coordination:**

- `photo_booth_visited` (boolean)
- `professional_photo_taken` (boolean)
- Ensures all guests captured

**4. Notifications System:**

- Push notifications when VIPs arrive
- Alerts for guests with critical needs
- Countdown alerts for ceremony start

**5. Analytics Dashboard:**

- Arrival pattern graphs
- Peak arrival times
- Average check-in duration
- Relation group breakdown visualization

**6. Export and Reporting:**

- Generate attendance report (PDF)
- Export checked-in guest list (CSV)
- Create timeline of arrivals
- No-show summary report

**7. Multi-User Support:**

- Multiple coordinators can use simultaneously
- Role-based permissions (check-in vs. view-only)
- Activity log (who checked in which guest)
- Conflict prevention for concurrent edits

**8. Offline Mode:**

- Local storage backup
- Works without internet connection
- Syncs when connection restored
- Critical for venues with poor connectivity

**9. Table Occupancy View:**

- Visual seating chart
- Shows filled vs. empty seats per table
- Color-coded by check-in status
- Drag-and-drop seat reassignment

**10. Integration Capabilities:**

- Sync with main event management system
- Connect to catering platform
- Link to venue management software
- Export to CRM systems

---

## Technical Considerations

### Performance:

- Instant search (no lag for up to 500 guests)
- Real-time updates without page refresh
- Optimized rendering for large guest lists
- Minimal data transfer for mobile connections

### Security:

- Secure authentication for coordinators
- Role-based access control
- Data encryption in transit and at rest
- Audit trail for all check-ins

### Reliability:

- Auto-save functionality
- Backup system for check-in data
- Offline capability with sync
- Error handling and recovery

### Accessibility:

- Screen reader compatible
- Keyboard navigation support
- High contrast mode
- Large text options

---

## Success Metrics

**Operational Efficiency:**

- Average check-in time: < 30 seconds per guest
- Search speed: < 1 second
- Error rate: < 1% (wrong guest checked in)

**User Satisfaction:**

- Coordinator ease of use rating: > 4.5/5
- Guest wait time: < 2 minutes
- Special needs accommodation success rate: 100%

**Data Quality:**

- Check-in timestamp accuracy: 100%
- Actual vs. expected party size capture rate: > 95%
- Complete data entry rate: > 90%

---

## Implementation Priority

### Phase 1 (MVP):

1. Basic check-in functionality with timestamps
2. Search by name
3. Guest information display
4. Real-time statistics
5. Table assignment display

### Phase 2 (Enhanced):

1. Advanced filtering
2. Special needs alerts
3. VIP identification
4. Check-in modal with detailed view
5. Actual party size tracking

### Phase 3 (Advanced):

1. Multiple filter combinations
2. No-show management
3. Check-in notes
4. Undo functionality
5. Enhanced visual design

### Phase 4 (Future):

1. Analytics and reporting
2. Multi-user support
3. Offline mode
4. Integration capabilities
5. Mobile app version

---

## Conclusion

This check-in dashboard transforms the hectic arrival process into a smooth, organized operation. By providing coordinators with comprehensive guest information, real-time statistics, and intelligent alerts, the system ensures that every guest receives proper attention, special needs are met, and the couple can focus on enjoying their special day knowing their guests are well cared for.
