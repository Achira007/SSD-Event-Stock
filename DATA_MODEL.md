# SSD Event Stock — Data Model

## 1. Purpose

This document defines the data model for SSD Event Stock.

The model must support:
- Google authentication.
- Admin and Staff roles.
- Equipment inventory.
- One active/current event.
- Borrowing without approval.
- Shared team returns.
- Partial and multiple returns.
- Incomplete returns with `ชำรุด` or `อื่นๆ`.
- Inventory adjustments.
- Returning repaired equipment to available stock.
- Immutable transaction history.

This document follows the current Project Specification and Business Rules. It does not introduce additional user-facing features.

---

## 2. Core Entities

The core entities are:

1. `users`
2. `equipment`
3. `events`
4. `borrow_records`
5. `return_records`
6. `inventory_adjustments`

Authentication/session tables may be provided by the selected authentication solution.

---

## 3. Entity Relationship Overview

```text
users
  │
  ├───────────────┐
  │               │
  ▼               ▼
borrow_records   inventory_adjustments
  │
  │ 1-to-many
  ▼
return_records

equipment
  │
  ├───────────────┐
  │               │
  ▼               ▼
borrow_records   inventory_adjustments

events
  │
  └── 1-to-many
          │
          ▼
    borrow_records
```

A borrow record belongs to one equipment record and may optionally belong to the current event.

A borrow record can have many return records.

A return record belongs to the user who actually performs the return. That user does not need to be the original borrower.

---

# 4. `users`

Represents application users.

### Fields

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `google_subject_id` | string | Unique Google account identifier |
| `email` | string | Unique |
| `display_name` | string | From Google profile |
| `avatar_url` | string | From Google profile, nullable |
| `role` | enum | `ADMIN` or `STAFF` |
| `created_at` | datetime | Required |
| `updated_at` | datetime | Required |

### Rules

- Authentication uses Google.
- The authenticated Google account identifies the user.
- Role is controlled by Admin/system configuration.
- Staff cannot promote themselves to Admin.

---

# 5. `equipment`

Represents one equipment record in the inventory.

### Fields

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | Required |
| `image_url` | string | Required |
| `total_quantity` | integer | >= 0 |
| `available_quantity` | integer | >= 0 |
| `in_use_quantity` | integer | >= 0 |
| `unavailable_quantity` | integer | >= 0 |
| `created_at` | datetime | Required |
| `updated_at` | datetime | Required |
| `deleted_at` | datetime | Nullable |

### Statuses

The inventory has three main statuses:

- `พร้อมใช้งาน`
- `ใช้งานอยู่`
- `ไม่พร้อมใช้งาน`

`ชำรุด` is NOT a main inventory status.

`ชำรุด` is a reason for an item becoming `ไม่พร้อมใช้งาน`.

Other reasons may also be stored when the business flow requires them, such as `อื่นๆ`.

### Quantity invariant

The system must maintain:

```text
total_quantity
=
available_quantity
+
in_use_quantity
+
unavailable_quantity
```

No quantity may be negative.

### Notes

- No equipment category.
- No QR code.
- No barcode.
- No `รอซ่อม` status.

---

# 6. `events`

Represents an event/job.

### Fields

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `name` | string | Required |
| `description` | text | Nullable |
| `start_at` | datetime | Required |
| `end_at` | datetime | Nullable |
| `status` | enum | `ACTIVE` or `COMPLETED` |
| `created_by` | UUID | FK → users.id |
| `created_at` | datetime | Required |
| `updated_at` | datetime | Required |
| `completed_at` | datetime | Nullable |

### Rules

- Only one event may be `ACTIVE` at a time.
- Only Admin can create/edit/complete events.
- `COMPLETED` corresponds to `เสร็จสิ้น`.
- Completing an event does not delete or automatically close outstanding borrow records.
- If outstanding equipment exists, Admin must receive a warning before completing the event.

---

# 7. `borrow_records`

Represents one borrowing transaction.

This is the parent record for potentially multiple return transactions.

### Fields

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `equipment_id` | UUID | FK → equipment.id |
| `event_id` | UUID | FK → events.id, nullable |
| `borrowed_by` | UUID | FK → users.id |
| `quantity` | integer | > 0 |
| `purpose_type` | enum | `CURRENT_EVENT` or `GENERAL` |
| `purpose_note` | text | Required for `GENERAL`, nullable for `CURRENT_EVENT` |
| `status` | enum | `OUTSTANDING` or `COMPLETED` |
| `borrowed_at` | datetime | Required |
| `completed_at` | datetime | Nullable |
| `created_at` | datetime | Required |

### Purpose rules

#### `CURRENT_EVENT`

- `purpose_type = CURRENT_EVENT`
- `event_id` must reference the current active event.
- UI label: `งานปัจจุบัน (ชื่องาน)`

#### `GENERAL`

- `purpose_type = GENERAL`
- `event_id = null`
- `purpose_note` is required.
- UI label: `การใช้งานทั่วไป`

### Quantity

The original borrowed quantity is immutable.

Outstanding quantity is derived from the borrow and its return records.

---

# 8. `return_records`

Represents one return action against a borrow record.

One borrow record can have many return records.

### Fields

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `borrow_record_id` | UUID | FK → borrow_records.id |
| `returned_by` | UUID | FK → users.id |
| `returned_quantity` | integer | >= 0 |
| `unavailable_quantity` | integer | >= 0 |
| `unavailable_reason` | enum | `DAMAGED` or `OTHER`, nullable |
| `note` | text | Required when reason = `OTHER` |
| `returned_at` | datetime | Required |
| `created_at` | datetime | Required |

### Return transaction quantity

For each return:

```text
resolved_quantity
=
returned_quantity
+
unavailable_quantity
```

`resolved_quantity` must be greater than 0 and cannot exceed the current outstanding quantity.

The user does not manually choose whether the return is complete. The system determines completion from quantities.

---

# 9. Incomplete Return

Example:

```text
Borrowed: 50
Physically returned: 48
Missing: 2
```

The system identifies:

```text
unavailable_quantity = 2
```

The user chooses one reason:

### `DAMAGED`

The missing quantity is classified as unavailable because it is damaged.

```text
unavailable_quantity = 2
unavailable_reason = DAMAGED
```

No separate damaged quantity is entered by the user.

### `OTHER`

The missing quantity is classified as unavailable for another reason.

```text
unavailable_quantity = 2
unavailable_reason = OTHER
note = required
```

The user must provide the note.

`ชำรุด` and `อื่นๆ` are reasons, not inventory statuses.

---

# 10. Complete Return

If:

```text
resolved_quantity = current_outstanding_quantity
```

then the borrow record becomes:

```text
status = COMPLETED
```

UI status:

`คืนครบ`

After completion:
- The borrow record cannot receive another return.
- It remains viewable.
- It remains in History.
- It is no longer counted as `ใช้งานอยู่`.

---

# 11. Partial Return

If:

```text
resolved_quantity < current_outstanding_quantity
```

the borrow remains:

```text
status = OUTSTANDING
```

and may be returned again later.

Example:

```text
Borrowed: 50

Return 1:
Returned: 30
Outstanding: 20

Return 2:
Returned: 20
Outstanding: 0
```

The second return may be performed by a different user.

---

# 12. Return Inventory Effects

For physically returned quantity N:

```text
available_quantity += N
in_use_quantity -= N
```

For missing/unavailable quantity N:

```text
in_use_quantity -= N
unavailable_quantity += N
```

`total_quantity` does not change.

This applies whether the unavailable reason is `DAMAGED` or `OTHER`.

The reason and note remain attached to the return record.

---

# 13. Repairing Unavailable Equipment

There is no separate `รอซ่อม` status.

Only Admin can return repaired equipment to service.

For equipment that is unavailable because it is damaged:

```text
unavailable_quantity -= N
available_quantity += N
total_quantity unchanged
```

The repaired quantity must satisfy:

```text
0 < N <= unavailable_quantity
```

The repair action must be recorded in `inventory_adjustments` with an appropriate reason/type.

Important:
- Only equipment that is actually being returned to service may be moved back to `พร้อมใช้งาน`.
- The system must not automatically turn every `ไม่พร้อมใช้งาน` item into available merely because a generic adjustment is made.

---

# 14. `inventory_adjustments`

Represents manual inventory changes and returning repaired equipment to service.

### Fields

| Field | Type | Rules |
|---|---|---|
| `id` | UUID | Primary key |
| `equipment_id` | UUID | FK → equipment.id |
| `performed_by` | UUID | FK → users.id |
| `adjustment_type` | enum | See below |
| `quantity` | integer | > 0 |
| `reason` | text | Required when applicable |
| `note` | text | Nullable |
| `created_at` | datetime | Required |

### Adjustment types

```text
ADD_STOCK
REMOVE_STOCK
REPAIR_RETURN
```

### `ADD_STOCK`

Adds new physical units:

```text
total += quantity
available += quantity
```

### `REMOVE_STOCK`

Removes physical units from inventory.

The resulting quantities must still satisfy:

```text
total = available + in_use + unavailable
```

The operation cannot reduce Total below In-use.

A reason is required.

### `REPAIR_RETURN`

Returns damaged/unavailable equipment to service:

```text
unavailable -= quantity
available += quantity
total unchanged
```

Only Admin can perform this action.

---

# 15. History

A separate mutable History table is not required for the initial system.

History can be generated from immutable transaction records:

- `borrow_records`
- `return_records`
- `inventory_adjustments`

Every transaction stores:
- User who performed it.
- Timestamp.
- Related equipment.
- Relevant transaction details.

Original transactions must not be edited or deleted to correct mistakes.

Corrections should be represented by a new appropriate adjustment/correction transaction.

---

# 16. Relationships

### Users → Borrow Records

```text
users 1 ─── N borrow_records
```

One user can create many borrow records.

### Users → Return Records

```text
users 1 ─── N return_records
```

The returning user can differ from the original borrower.

### Users → Inventory Adjustments

```text
users 1 ─── N inventory_adjustments
```

### Equipment → Borrow Records

```text
equipment 1 ─── N borrow_records
```

### Equipment → Return Records

Indirectly through `borrow_records`.

### Equipment → Inventory Adjustments

```text
equipment 1 ─── N inventory_adjustments
```

### Events → Borrow Records

```text
events 1 ─── N borrow_records
```

### Borrow Records → Return Records

```text
borrow_records 1 ─── N return_records
```

---

# 17. Required Constraints

The database/application layer must enforce:

1. User email is unique.
2. Google account identifier is unique.
3. Equipment quantities cannot be negative.
4. `total_quantity = available_quantity + in_use_quantity + unavailable_quantity`.
5. Borrow quantity must be greater than zero.
6. Return resolved quantity must be greater than zero.
7. Return resolved quantity cannot exceed current outstanding quantity.
8. A completed borrow cannot receive another return.
9. `GENERAL` borrow requires `purpose_note`.
10. `GENERAL` borrow has no `event_id`.
11. `CURRENT_EVENT` borrow must reference the current active event.
12. `OTHER` unavailable reason requires a note.
13. `DAMAGED` unavailable reason does not require a note.
14. Repair quantity cannot exceed the relevant unavailable quantity.
15. Removing stock cannot reduce Total below In-use.
16. Only one ACTIVE event can exist at a time.
17. Admin-only actions must be protected by role checks.

---

# 18. Concurrency and Atomicity

Inventory-changing operations must be atomic.

Example:

```text
Available = 1

Staff A attempts to borrow 1
Staff B attempts to borrow 1
```

Only one transaction can succeed.

The second must fail because the available quantity has already become 0.

The implementation must use appropriate database transactions, locking, or conditional updates to prevent:

- Negative Available.
- Double borrowing.
- Double returning.
- Over-returning.
- Conflicting inventory adjustments.

---

# 19. Derived Values

The following should preferably be derived rather than manually edited by users:

```text
available_quantity
in_use_quantity
unavailable_quantity
outstanding_quantity
```

If the implementation stores the inventory quantities directly for performance, every mutation must update them transactionally.

`outstanding_quantity` must be derived from the original borrow quantity and its return records.

Users must never manually edit these calculated quantities.

---

# 20. Domain Example

### Initial inventory

```text
Total: 100
Available: 80
In-use: 15
Unavailable: 5
```

### Staff A borrows 50

```text
Total: 100
Available: 30
In-use: 65
Unavailable: 5
```

### Staff B returns 48

```text
Physically returned: 48
Missing: 2
```

If the reason is `DAMAGED`:

```text
Total: 100
Available: 78
In-use: 15
Unavailable: 7
```

The borrow is resolved because:

```text
48 returned + 2 unavailable = 50 borrowed
```

The borrow status becomes:

```text
คืนครบ
```

The return record stores:
- Returned by Staff B.
- Returned quantity = 48.
- Unavailable quantity = 2.
- Reason = `DAMAGED`.

If the reason is `OTHER`, the same 2 units become `ไม่พร้อมใช้งาน`, with the required note stored on the return record.

---

# 21. Implementation Boundary

This document defines the required data and relationships.

It does not mandate:
- A specific database vendor.
- A specific ORM.
- A specific frontend framework.
- A specific backend framework.

The implementation agent may choose appropriate technologies as long as:
- All Project Specification requirements are preserved.
- All Business Rules are preserved.
- All constraints are enforced.
- No new business workflow is introduced without approval.

## Version

Data Model version: 1.1
