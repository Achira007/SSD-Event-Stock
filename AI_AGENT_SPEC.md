# SSD Event Stock — AI Agent Specification

## 1. Role

You are the AI development agent responsible for implementing the SSD Event Stock web application.

Your job is to turn the project's approved specification into a working application.

You are not the product owner.

You must not invent, simplify, remove, or change business requirements on your own.

---

## 2. Source of Truth

Before writing code, read these documents in this order:

1. `PROJECT_SPEC.md`
2. `BUSINESS_RULES.md`
3. `DATA_MODEL.md`
4. `APP_FLOW.md`

These documents are the project's source of truth.

When documents overlap, preserve the more specific rule from the project documents.

If a requirement is genuinely ambiguous or contradictory and cannot be resolved from the documents, stop and ask the user.

Do not silently invent a business rule.

---

## 3. Project Goal

Build a responsive Web application for SSD Event Stock.

The application must work well on:

- Mobile
- Desktop

The application manages:

- Equipment inventory.
- Current events/jobs.
- Equipment borrowing.
- Equipment returns.
- Shared team workflows.
- Inventory status.
- History.
- User profiles.
- Admin management.

---

## 4. Authentication

Use Google authentication.

Requirements:

- Users sign in with their Google account.
- The application remembers the authenticated session.
- Users should not have to repeatedly sign in when a valid session exists.
- User profile information comes from the authenticated Google account.
- Users have an application role:
  - `ADMIN`
  - `STAFF`

Protect all authenticated application routes.

Protect Admin-only actions with role checks.

Never rely only on frontend UI hiding for authorization. Server/backend authorization must also enforce permissions.

---

## 5. Roles

### Staff can

- View Dashboard.
- View equipment inventory.
- View Equipment Detail.
- Borrow equipment.
- Return equipment.
- View Events.
- View Event Detail.
- View History.
- View Profile.
- Logout.

### Admin can additionally

- Add equipment.
- Manage equipment inventory.
- Create events.
- Edit events.
- Complete events.
- Return repaired equipment to service.
- Perform other Admin-only management actions defined by the project documents.

### Critical rule

Borrowing does NOT require Admin approval.

Do not add an approval workflow.

---

## 6. Equipment Model

Each equipment record has:

- Name.
- Image.
- Total quantity.
- Available quantity.
- In-use quantity.
- Unavailable quantity.

The three main inventory statuses are:

- `พร้อมใช้งาน`
- `ใช้งานอยู่`
- `ไม่พร้อมใช้งาน`

`ชำรุด` is a reason for being unavailable, not a fourth main status.

`อื่นๆ` can also be a reason for being unavailable when the return flow requires it.

Maintain:

```text
total_quantity
=
available_quantity
+
in_use_quantity
+
unavailable_quantity
```

No inventory quantity may become negative.

Do not add:

- Equipment categories.
- QR codes.
- Barcodes.
- `รอซ่อม`.

---

## 7. Dashboard

Follow the approved UI direction:

- Remove Quick Access.
- Move Activity upward.
- Use compact equipment cards, approximately 90px high.
- The entire equipment card is clickable/tappable.
- Tapping/clicking an equipment card opens Equipment Detail.
- Use status badges rather than progress bars.

Do not add a new Dashboard feature merely because it seems useful.

---

## 8. Equipment Management

Only Admin can add equipment.

Adding equipment includes:

- Equipment name.
- Equipment image.
- Initial quantity.

The user provides the equipment image during the Add Equipment flow.

Equipment quantity changes must follow the Business Rules and Data Model.

Inventory changes must be recorded in History.

Do not create a user-facing category selector.

---

## 9. Current Event

The system supports one current/active event at a time.

Only Admin can:

- Create an event.
- Edit an event.
- Complete an event.

Completed events remain viewable.

If outstanding equipment exists when Admin tries to complete an event, show the required warning.

Do not automatically close or delete outstanding borrow records when an event is completed.

---

## 10. Borrow Flow

Borrowing can start from:

- Inventory.
- Equipment Detail.
- Event Detail.

The system must use the same business logic regardless of entry point.

### Purpose choices

There are exactly two choices:

1. `งานปัจจุบัน (ชื่องาน)`
2. `การใช้งานทั่วไป`

If the user selects `งานปัจจุบัน`:

- Link the borrow to the current event.
- Do not ask for an additional general-use description.

If the user selects `การใช้งานทั่วไป`:

- Ask for a description.
- The description is required.
- The borrow is not linked to an event.

### Quantity

The user cannot borrow more than Available.

If the requested quantity exceeds Available:

- Reject the operation.
- Show the actual maximum.
- Do not silently reduce the entered quantity.

If Available is zero:

- The Borrow action may remain visible.
- The user must be told that no equipment is currently available.
- The borrow cannot be confirmed.

### Successful borrow

For N borrowed:

```text
available_quantity -= N
in_use_quantity += N
```

Create an immutable borrow transaction.

No approval step.

---

## 11. Shared Team Returns

The person who returns equipment does not have to be the person who originally borrowed it.

Example:

```text
Staff A borrows 50
Staff B returns 30
Staff C returns 20
```

All actions must remain linked to the same borrow record.

Every transaction records the authenticated user who performed it.

Do not implement exclusive return ownership.

---

## 12. Return Flow

Returning can start from:

- Inventory.
- Equipment Detail.
- Event Detail.

The return must reference an outstanding borrow record.

The UI must show enough information for the user to understand:

- Original borrowed quantity.
- Previously resolved/returned quantity.
- Current outstanding quantity.
- Quantity being returned.

The user enters the physical quantity being returned.

Do NOT ask the user to manually select:

- `คืนครบ`
- `คืนไม่ครบ`

The system calculates completion from quantities.

If the entered quantity exceeds the current outstanding quantity:

- Reject the operation.
- Show the actual maximum.
- Do not silently change the entered value.

---

## 13. Incomplete Return

Example:

```text
Borrowed = 50
Physically returned = 48
Missing = 2
```

The system calculates the missing quantity.

If equipment is not fully resolved, ask for exactly one reason:

- `ชำรุด`
- `อื่นๆ`

### If `ชำรุด`

The missing quantity becomes:

```text
ไม่พร้อมใช้งาน
```

with reason `ชำรุด`.

The user does not enter a separate damaged quantity.

### If `อื่นๆ`

The missing quantity becomes:

```text
ไม่พร้อมใช้งาน
```

with reason `อื่นๆ`.

A note is required.

Do not let the user arbitrarily choose another inventory status.

---

## 14. Complete Return

A borrow is complete when:

```text
total resolved quantity
=
original borrowed quantity
```

Then:

```text
status = COMPLETED
```

UI label:

`คืนครบ`

A completed borrow:

- Cannot receive another return.
- Remains visible.
- Remains in History.

---

## 15. Inventory Effects

For a normal physical return of N:

```text
available_quantity += N
in_use_quantity -= N
```

For N missing/unavailable:

```text
in_use_quantity -= N
unavailable_quantity += N
```

Total quantity does not change during borrow/return.

---

## 16. Repair Flow

There is no repair queue and no `รอซ่อม` status.

Only Admin can return repaired unavailable equipment to service.

For repaired quantity N:

```text
unavailable_quantity -= N
available_quantity += N
```

Total remains unchanged.

N cannot exceed the relevant unavailable quantity.

The repair action must be recorded in History.

Do not automatically move every unavailable item back to Available. Only an explicit authorized repair-return action can do this.

---

## 17. History

History must preserve the original transaction trail.

History includes:

- Borrow transactions.
- Return transactions.
- Inventory adjustments.

Every transaction records:

- Who performed it.
- When it happened.
- Related equipment.
- Relevant transaction details.

Do not edit or delete original transactions to correct mistakes.

Use a new appropriate transaction/adjustment for corrections.

---

## 18. Data Integrity

The implementation must enforce:

- No negative inventory.
- No borrowing above Available.
- No returning above Outstanding.
- No return on a completed borrow.
- No repair above the relevant unavailable quantity.
- No stock removal that violates inventory invariants.
- Only one active event.
- Valid purpose/event relationships.
- Required notes for `OTHER`.
- Correct role permissions.

The inventory invariant must always hold:

```text
total_quantity
=
available_quantity
+
in_use_quantity
+
unavailable_quantity
```

---

## 19. Concurrency

Inventory-changing operations must be atomic.

Example:

```text
Available = 1

Staff A borrows 1
Staff B borrows 1
```

Only one operation can succeed.

The second must fail cleanly.

Use appropriate database transactions, locking, or conditional updates.

Prevent:

- Double borrowing.
- Negative quantities.
- Double returning.
- Over-returning.
- Conflicting inventory adjustments.

---

## 20. UI / UX Requirements

The UI should follow the approved design direction from the project's UI work.

Core requirements:

- Mobile-first usability.
- Desktop responsive layout.
- Compact equipment cards.
- Approximately 90px equipment card height.
- Entire card is clickable.
- Status badges.
- No progress bars for equipment status.
- No Quick Access on Dashboard.
- Activity positioned higher.
- Borrow/Return available directly from Inventory and Event Detail.
- Equipment Detail supports direct Borrow/Return.
- Return uses the approved bottom-sheet/dialog interaction.
- The UI must clearly distinguish:
  - `พร้อมใช้งาน`
  - `ใช้งานอยู่`
  - `ไม่พร้อมใช้งาน`

Do not introduce QR/barcode scanning.

---

## 21. Navigation

Core destinations:

```text
Dashboard
คลังอุปกรณ์
Events
History
Profile
```

Core flows:

```text
Login
  ↓
Dashboard

Dashboard
  ↓
คลังอุปกรณ์
  ↓
Equipment Detail
  ↓
Borrow / Return

Events
  ↓
Event Detail
  ↓
Borrow / Return

History
  ↓
Transaction details

Profile
  ↓
Account information / Logout
```

---

## 22. Development Rules

Before implementing a feature:

1. Check `PROJECT_SPEC.md`.
2. Check `BUSINESS_RULES.md`.
3. Check `DATA_MODEL.md`.
4. Check `APP_FLOW.md`.

Do not implement based only on assumptions from the task description.

When implementing a business action, ensure the UI, API/backend, and database all enforce the same rule.

Do not trust frontend validation alone.

---

## 23. No Unapproved Features

Do not add these unless the user explicitly approves them:

- QR codes.
- Barcodes.
- Equipment categories.
- Repair queue.
- `รอซ่อม`.
- Borrow approval workflow.
- Multiple active/current events.
- Exclusive return rights.
- Manual `คืนครบ/คืนไม่ครบ` selection.
- New inventory statuses.
- New business workflows.
- Unrequested notification systems.
- Unrequested analytics/reporting systems.

Avoid "helpful" feature creep.

---

## 24. Handling Ambiguity

If the existing documents do not specify an implementation detail, distinguish between:

### Technical decision

You may choose a reasonable technical implementation without asking, provided it does not change business behavior.

Examples:
- ORM choice.
- Component structure.
- Internal service structure.
- API naming.
- Database indexing strategy.

### Business decision

Ask the user before deciding.

Examples:
- A new status.
- A new workflow.
- A new permission.
- A new approval step.
- A different meaning for an existing status.
- A change to how inventory quantities behave.

Never turn a business ambiguity into an invented feature.

---

## 25. Implementation Order

Recommended development sequence:

### Phase 1 — Foundation

- Project setup.
- Environment configuration.
- Database connection.
- Authentication.
- User/role model.
- Protected routes.

### Phase 2 — Equipment

- Equipment database model.
- Inventory.
- Equipment Detail.
- Admin Add Equipment.
- Quantity/inventory rules.

### Phase 3 — Events

- Event model.
- Event List.
- Event Detail.
- Current-event rules.
- Admin event management.

### Phase 4 — Borrow / Return

- Borrow records.
- Return records.
- Borrow UI.
- Return UI.
- Partial returns.
- Incomplete return reasons.
- Shared team returns.
- Inventory transaction logic.

### Phase 5 — History / Profile

- History.
- Filters/views required by the project.
- Profile.
- Logout.

### Phase 6 — Hardening

- Authorization checks.
- Transaction atomicity.
- Concurrency protection.
- Validation.
- Error states.
- Mobile responsiveness.
- Desktop responsiveness.
- Testing.

---

## 26. Testing Requirements

Before considering the application complete, test at minimum:

### Authentication

- Google login.
- Persistent session.
- Logout.
- Unauthorized access.

### Permissions

- Staff cannot perform Admin-only actions.
- Admin can perform Admin-only actions.
- Borrowing does not require approval.

### Inventory

- Add equipment.
- Borrow available quantity.
- Attempt to borrow too much.
- Attempt to borrow when Available = 0.
- Return equipment.
- Partial return.
- Multiple users returning the same borrow.
- Return above outstanding quantity.
- Complete return.
- Damaged/unavailable return.
- Other/unavailable return with required note.
- Repair return.
- Stock adjustment.

### Events

- Only one active event.
- Current-event borrowing.
- General borrowing.
- Event completion warning when outstanding equipment exists.
- Completed event remains viewable.

### Concurrency

- Two users attempting to borrow the same final available units.
- Two users attempting conflicting returns.
- Inventory never becomes negative.

### Responsive UI

Test both:

- Mobile.
- Desktop.

---

## 27. Definition of Done

The application is ready only when:

- The core requirements in all four project documents are implemented.
- Authentication works.
- Roles and permissions are enforced.
- Inventory calculations are correct.
- Borrowing works without approval.
- Returns can be performed by any authorized team member.
- Partial/multiple returns work.
- Incomplete returns correctly create `ไม่พร้อมใช้งาน` quantities and reasons.
- `อื่นๆ` requires a note.
- Completed returns are detected automatically.
- Events work according to the one-current-event rule.
- History preserves transactions.
- Admin-only actions are protected.
- Concurrent inventory operations are safe.
- Mobile and Desktop layouts work.
- No unapproved feature has been introduced.

---

## 28. Final Agent Instruction

Build the product described by the project documents.

Do not redesign the business logic.

Do not add features because they seem useful.

Do not remove features because they seem unnecessary.

Do not silently resolve business ambiguity.

When the implementation requires a business decision that is not specified, ask the user.

When only a technical implementation choice is required, choose a sensible implementation and continue.

The goal is a simple, reliable SSD Event Stock Web application that follows the approved requirements exactly.

## Version

AI Agent Specification version: 1.0
