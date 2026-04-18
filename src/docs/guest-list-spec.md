# Guest List — Feature Specification

**Wedding Planner App · v1.0**

---

## 1. Overview

The Guest List feature allows couples to manage all wedding invitees in one place. It covers invitation tracking, RSVP status management, special requirements logging, and bulk guest import. The Table Seating Planner is a separate feature that consumes data from this module.

---

## 2. Database Schema

### GUESTS

| Column                 | Type      | Constraints   | Description                                      |
| ---------------------- | --------- | ------------- | ------------------------------------------------ |
| `guest_id`             | UUID      | PK            | Unique identifier                                |
| `event_id`             | UUID      | FK → Events   | Wedding event reference                          |
| `first_name`           | string    | NOT NULL      | Guest first name                                 |
| `last_name`            | string    | NOT NULL      | Guest last name                                  |
| `relation_id`          | UUID      | FK → RELATION | Group/relation reference                         |
| `email`                | string    |               | Contact email                                    |
| `phone`                | string    |               | Contact phone (with country code)                |
| `plus_one`             | UUID      | FK → GUESTS   | Self-referencing plus-one link                   |
| `rsvp_status`          | enum      | NOT NULL      | `pending`, `attending`, `not_attending`, `maybe` |
| `party_size`           | number    | DEFAULT 1     | Confirmed seats including guest                  |
| `dietary_restrictions` | string    |               | e.g. Vegan, Gluten-free, Nut allergy             |
| `accesability_needs`   | string    |               | e.g. Wheelchair access, Hearing impaired         |
| `notes`                | string    |               | Internal notes for planners                      |
| `invited_at`           | timestamp |               | Date invitation was sent                         |
| `rsvp_at`              | timestamp |               | Date RSVP was received                           |
| `created_at`           | timestamp | AUTO          |                                                  |
| `updated_at`           | timestamp | AUTO          |                                                  |
| `created_by`           | UUID      | FK → Users    |                                                  |
| `updated_by`           | UUID      | FK → Users    |                                                  |

### TABLE_ASSIGNMENTS _(managed by Seating Planner feature)_

| Column        | Type      | Constraints | Description |
| ------------- | --------- | ----------- | ----------- |
| `table_id`    | UUID      | PK          |             |
| `guest_id`    | UUID      | FK → GUESTS |             |
| `seat_number` | number    |             |             |
| `created_at`  | timestamp | AUTO        |             |
| `updated_at`  | timestamp | AUTO        |             |
| `created_by`  | UUID      | FK → Users  |             |
| `updated_by`  | UUID      | FK → Users  |             |

### RELATION

| Column        | Type   | Constraints | Description                             |
| ------------- | ------ | ----------- | --------------------------------------- |
| `relation_id` | UUID   | PK          |                                         |
| `name`        | string | NOT NULL    | e.g. "Bride's Family", "Mutual Friends" |
| `description` | string |             | Optional context                        |

---

## 3. Components

### 3.1 Stats Bar

Displays a real-time summary across the top of the guest list.

| Stat            | Calculation                                         |
| --------------- | --------------------------------------------------- |
| Attending       | Count of guests where `rsvp_status = attending`     |
| Pending         | Count of guests where `rsvp_status = pending`       |
| Maybe           | Count of guests where `rsvp_status = maybe`         |
| Declined        | Count of guests where `rsvp_status = not_attending` |
| Total Guests    | All records in `GUESTS` for the event               |
| Confirmed Seats | Sum of `party_size` where `rsvp_status = attending` |

---

### 3.2 Filters & Search

| Control        | Type           | Filters on                                            |
| -------------- | -------------- | ----------------------------------------------------- |
| Search input   | Text           | `first_name`, `last_name`, `email` (case-insensitive) |
| Group dropdown | Select         | `relation_id`                                         |
| Status tabs    | Toggle buttons | `rsvp_status`                                         |

All filters are applied simultaneously (AND logic).

---

### 3.3 Guest Table

Columns displayed:

- **Guest** — Full name. If `plus_one` is set, shows the linked guest's name as a sub-row.
- **Group** — Color-coded dot + relation name from RELATION table.
- **RSVP Status** — Color-coded badge per status.
- **Party** — `party_size` value; shows `—` if 0.
- **Dietary / Needs** — Color-tagged pills for `dietary_restrictions` and `accesability_needs`.
- **Contact** — `email` and `phone`.
- **Send RSVP** — Email and WhatsApp action buttons.

Clicking any row opens the **Guest Detail Modal**.

---

### 3.4 Guest Detail Modal

A slide-up modal showing the full guest record, organized in sections:

- **Header** — Full name, RSVP badge, relation group, plus-one link (if any).
- **Contact Information** — Email, phone.
- **Event Details** — Party size, `invited_at`, `rsvp_at`.
- **Special Requirements** — Dietary restrictions, accessibility needs.
- **Notes** — Freeform internal notes (only rendered if non-empty).
- **Actions** — Send via Email, Send via WhatsApp.

---

### 3.5 Send RSVP Actions

Both buttons are available in the guest table row and in the Guest Detail Modal.

#### Email

- Opens the device's default mail client via `mailto:`.
- Pre-fills: recipient (`email`), subject line, and a personalized body addressed to `first_name`.
- Template is customizable per event.

#### WhatsApp

- Opens WhatsApp via `https://wa.me/{phone}`.
- Pre-fills a personalized invitation message addressed to `first_name`.
- Phone number must include country code (e.g. `521XXXXXXXXXX` for Mexico).

> **Note:** These are one-click shortcuts that open external apps. They do not track delivery or read receipts. A future iteration could integrate a messaging API (e.g. Twilio, WhatsApp Business API) for tracked sends.

---

### 3.6 Bulk Import (CSV Upload)

Accessed via the **Import CSV** button in the header.

#### Flow

1. User opens the import modal.
2. User drags & drops a `.csv` file or clicks to browse.
3. File is parsed client-side. Columns are mapped automatically.
4. A preview table shows all detected guests (name, email, party size).
5. User confirms import. All guests are added with `rsvp_status = pending`.

#### Accepted CSV Columns

| CSV Column             | Maps to                | Also accepts           |
| ---------------------- | ---------------------- | ---------------------- |
| `first_name`           | `first_name`           | `firstname`, `nombre`  |
| `last_name`            | `last_name`            | `lastname`, `apellido` |
| `email`                | `email`                |                        |
| `phone`                | `phone`                | `telefono`             |
| `party_size`           | `party_size`           | `party`                |
| `dietary_restrictions` | `dietary_restrictions` | `dietary`              |
| `accesability_needs`   | `accesability_needs`   | `accessibility`        |
| `notes`                | `notes`                | `notas`                |

#### Defaults on Import

- `rsvp_status` → `pending`
- `relation_id` → `r3` (Mutual Friends) — editable after import
- `invited_at` → today's date
- `party_size` → `1` if not provided or unparseable

#### Validations

- File must be `.csv`.
- At minimum, `first_name` must be present for a row to be accepted.
- Rows with no `first_name` are silently skipped.
- If no valid rows are found, an error message is shown.

#### Template Download

A pre-formatted `.csv` template is available for download from within the modal.

---

## 4. RSVP Status Reference

| Status          | Label         | Description                      |
| --------------- | ------------- | -------------------------------- |
| `pending`       | Pending       | Invitation sent, no response yet |
| `attending`     | Attending     | Guest confirmed attendance       |
| `not_attending` | Not Attending | Guest declined                   |
| `maybe`         | Maybe         | Guest is uncertain               |

---

## 5. Business Rules

- A guest can only have one `plus_one` link, which must reference another guest in the same event.
- `party_size` should reflect total headcount for that guest record (guest + plus one = 2, for example).
- When `rsvp_status = not_attending`, `party_size` should be set to `0`.
- `rsvp_at` is set automatically when `rsvp_status` changes from `pending` to any other value.
- Deleting a guest that is referenced as someone else's `plus_one` should null that reference first.
- The Table Seating Planner reads `guest_id` from this module — guests must exist here before they can be assigned to a table.

---
