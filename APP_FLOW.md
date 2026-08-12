# SSD Event Stock — App Flow

## 1. Purpose

This document defines the user-facing application flow for SSD Event Stock.

It describes how users move between the main screens and how the core borrow/return workflows behave.

The flow follows the agreed project requirements and business rules.

---

# 2. Platforms

The application is a Web application designed for:

- Mobile
- Desktop

Mobile interaction must be simple and touch-friendly.

The same core workflows must be available on both platforms.

---

# 3. Authentication Flow

## Login

```text
Login
  ↓
Sign in with Google
  ↓
Authenticated
  ↓
Dashboard
```

Rules:

- Authentication uses Google.
- The user's Google email/profile is used for the account.
- The session should be remembered.
- A user who is already authenticated should not be forced to log in again.
- Logout is available from Profile.

---

# 4. Main Application Navigation

The main application contains:

```text
Dashboard
คลังอุปกรณ์
Events
History
Profile
```

The exact visual navigation may adapt between mobile and desktop, but the destinations remain available according to the user's permissions.

---

# 5. Dashboard Flow

After login:

```text
Login
  ↓
Dashboard
```

Dashboard provides an overview of the current system state.

The agreed UI direction is:

- No Quick Access section.
- Activity is moved upward.
- Equipment cards are compact, approximately 90px in height.
- Clicking/tapping anywhere on an equipment card opens Equipment Detail.

---

# 6. Equipment Inventory Flow

## Inventory

```text
Dashboard
  ↓
คลังอุปกรณ์
```

The inventory displays equipment records.

Each equipment record shows the three inventory statuses:

- `พร้อมใช้งาน`
- `ใช้งานอยู่`
- `ไม่พร้อมใช้งาน`

The UI uses status badges rather than progress bars.

There is no equipment category in the inventory UI.

There are no QR codes or barcodes.

## Equipment Card

Equipment cards are compact.

The whole card is clickable/tappable.

```text
Equipment Card
  ↓
Equipment Detail
```

There is no requirement for a separate "click only on the title/image" interaction.

---

# 7. Add Equipment Flow

Only Admin can add equipment.

```text
คลังอุปกรณ์
  ↓
เพิ่มอุปกรณ์
  ↓
กรอกข้อมูลอุปกรณ์
  ↓
ใส่รูปอุปกรณ์
  ↓
กำหนดจำนวน
  ↓
บันทึก
  ↓
Equipment Detail / Inventory
```

Admin provides the equipment image when adding equipment.

Staff does not see or use the Admin-only add-equipment workflow.

---

# 8. Equipment Detail Flow

```text
คลังอุปกรณ์
  ↓
Equipment Detail
```

Equipment Detail shows:

- Equipment image.
- Equipment name.
- Current quantities.
- Status badges:
  - พร้อมใช้งาน
  - ใช้งานอยู่
  - ไม่พร้อมใช้งาน
- Relevant outstanding borrow information.
- Actions available to the current user.

The user can start borrowing or returning directly from Equipment Detail.

---

# 9. Borrow Flow

Borrowing does not require Admin approval.

Borrow can be started from:

```text
คลังอุปกรณ์
Equipment Detail
Event Detail
```

The interaction opens the Borrow UI.

## Borrow Purpose

The user chooses what the equipment is being borrowed for.

There are two choices:

### `งานปัจจุบัน`

Displays the current event name.

Example:

```text
งานปัจจุบัน (งานติดตั้งเวที)
```

This links the borrow to the current event.

### `การใช้งานทั่วไป`

Only when the user chooses this option does the system ask for a description.

Example:

```text
การใช้งานทั่วไป
รายละเอียดการใช้งาน: __________
```

The additional description is required.

The system should not ask this question when the user chooses `งานปัจจุบัน`.

---

# 10. Borrow Quantity Flow

The user enters the quantity to borrow.

Rules:

```text
Requested quantity <= Available quantity
```

If the user enters more than Available:

```text
ไม่สามารถเบิกเกินจำนวนที่พร้อมใช้งานได้
สูงสุด X ชิ้น
```

The system does not silently reduce the entered quantity.

If Available is 0:

- The Borrow action remains discoverable.
- Opening it explains that no equipment is currently available.
- The user cannot confirm the borrow.

## Successful Borrow

```text
Confirm Borrow
  ↓
Create borrow record
  ↓
Available decreases
In-use increases
  ↓
Return to the originating context
```

No Admin approval step is inserted.

---

# 11. Shared Team Borrow/Return Flow

The borrowing and returning system is shared by the team.

Example:

```text
Staff A borrows 50
      ↓
Staff B can return some/all of it
      ↓
Staff C can return the remainder
```

The original borrower does not have exclusive return rights.

Every action records the authenticated user who actually performed it.

---

# 12. Event List Flow

```text
Events
  ↓
Event List
  ↓
Select Event
  ↓
Event Detail
```

The system supports one current/active event at a time.

Events can be viewed as event records, including completed events.

---

# 13. Event Detail Flow

Event Detail displays:

- Event information.
- Event status.
- Equipment/borrow activity associated with the event.
- Relevant current/outstanding equipment usage.
- Borrow action.
- Return action.

Borrowing and returning must be possible directly from Event Detail.

This is intentionally consistent with Inventory and Equipment Detail.

---

# 14. Borrow From Event Flow

```text
Event Detail
  ↓
เบิก
  ↓
Select equipment
  ↓
Enter quantity
  ↓
Confirm
  ↓
Borrow recorded against the event
```

When borrowing from the current event, the purpose is automatically the current event context.

The user should not be forced to re-enter the event name.

---

# 15. Return Flow

Returning can be started from:

```text
คลังอุปกรณ์
Equipment Detail
Event Detail
```

The return action must use an existing outstanding borrow record.

The user does not manually choose:

- คืนครบ
- คืนไม่ครบ

Instead, the system calculates completion from the quantities.

---

# 16. Return Bottom Sheet / Dialog

The return interaction should clearly show:

- Equipment.
- Original borrowed quantity.
- Quantity already returned.
- Current outstanding quantity.
- Quantity being returned now.

The user enters the physical quantity being returned.

The maximum returnable quantity is the current outstanding quantity.

If the user enters more than the outstanding quantity, the system rejects the action and shows the maximum.

It must not silently change the entered number.

---

# 17. Incomplete Return Flow

Example:

```text
Borrowed = 50
Physical return = 48

Missing = 2
```

The system calculates:

```text
Missing = Original Borrowed - Total Resolved
```

If the return is not fully resolved, the system asks why the missing quantity is not being returned.

The user chooses exactly one:

```text
ชำรุด
อื่นๆ
```

## `ชำรุด`

The missing quantity becomes:

```text
ไม่พร้อมใช้งาน
```

with reason:

```text
ชำรุด
```

No separate damaged quantity input is required.

## `อื่นๆ`

The missing quantity becomes:

```text
ไม่พร้อมใช้งาน
```

with reason:

```text
อื่นๆ
```

A note is required.

Example:

```text
หมายเหตุ
____________________
```

The user does not choose an arbitrary inventory status.

---

# 18. Complete Return Flow

If:

```text
Total resolved quantity
=
Original borrowed quantity
```

then:

```text
Borrow status = คืนครบ
```

No additional "Are you sure it is complete?" selection is required.

The completed borrow remains visible in History.

---

# 19. Multiple Return Flow

A borrow can be returned in multiple transactions.

Example:

```text
Borrow 50
  ↓
Return 30
  ↓
Outstanding 20
  ↓
Another user returns 20
  ↓
คืนครบ
```

The second user can be different from the original borrower.

---

# 20. Inventory Effects During Borrow/Return

## Borrow N

```text
พร้อมใช้งาน -= N
ใช้งานอยู่  += N
```

## Physically return N

```text
พร้อมใช้งาน += N
ใช้งานอยู่  -= N
```

## Missing N classified as unavailable

```text
ใช้งานอยู่       -= N
ไม่พร้อมใช้งาน  += N
```

Total quantity does not change for borrowing/returning.

---

# 21. Repair Flow

There is no `รอซ่อม` status.

When unavailable equipment is repaired, an authorized Admin can return the repaired quantity to service.

```text
ไม่พร้อมใช้งาน
  ↓
Repair completed
  ↓
Admin records repair return
  ↓
ไม่พร้อมใช้งาน -= N
พร้อมใช้งาน += N
```

The repair action is recorded in History.

---

# 22. Event Completion Flow

Only Admin can complete an event.

```text
Event Detail
  ↓
Complete Event
```

If outstanding equipment exists, show a warning before completion.

The event may then be completed.

Completing an event does not automatically delete or close outstanding borrow records.

---

# 23. History Flow

```text
History
  ↓
View transactions
```

History includes relevant:

- Borrow transactions.
- Return transactions.
- Inventory adjustments.

Users can filter/view relevant history.

Each transaction shows who performed the action and when.

Original transaction records are not edited or deleted to correct mistakes.

Corrections use a new appropriate transaction/adjustment.

---

# 24. Profile Flow

```text
Profile
  ↓
View user information
```

Profile uses the authenticated Google account information.

At minimum, the user can see their account identity and role.

Logout is available from Profile.

```text
Profile
  ↓
Logout
  ↓
Login
```

---

# 25. Permission Flow

## Staff

Staff can:

```text
Login
Dashboard
View Inventory
View Equipment Detail
Borrow
Return
View Events
View Event Detail
View History
View Profile
Logout
```

Staff cannot:

```text
Add Equipment
Create Event
Edit Event
Complete Event
Perform Admin-only inventory management
```

## Admin

Admin can perform all Staff actions plus Admin-only management actions, including:

```text
Add Equipment
Manage equipment inventory
Create/Edit/Complete Event
Return repaired equipment to service
```

Borrowing itself does not require Admin approval.

---

# 26. Global UX Rules

1. The same borrow/return logic must work whether the action starts from Inventory, Equipment Detail, or Event Detail.
2. The user must not manually decide whether a return is complete.
3. Quantities are calculated from transaction data.
4. Users cannot silently exceed available/outstanding quantities.
5. Error messages must explain the actual limit.
6. Borrow/return actions must be easy to use on mobile.
7. Statuses use badges rather than progress bars.
8. Equipment cards are compact, approximately 90px high.
9. The entire equipment card is clickable/tappable.
10. Quick Access is removed from Dashboard.
11. Activity is positioned higher on Dashboard.
12. There are no QR codes or barcodes.
13. There is no equipment category UI.
14. There is no `รอซ่อม` status.

---

# 27. Core End-to-End Example

```text
Login with Google
      ↓
Dashboard
      ↓
คลังอุปกรณ์
      ↓
Equipment Detail
      ↓
เบิก
      ↓
เลือก "งานปัจจุบัน (ชื่องาน)"
      ↓
เลือกจำนวน
      ↓
ยืนยัน
      ↓
Inventory updated
      ↓
Event Detail
      ↓
ทำงาน
      ↓
คืน
      ↓
ใส่จำนวนที่คืน
      ↓
ระบบคำนวณจำนวนที่ยังขาด
      ↓
ถ้าคืนไม่ครบ
      ├── ชำรุด
      │     ↓
      │   ไม่พร้อมใช้งาน
      │
      └── อื่นๆ
            ↓
          ใส่หมายเหตุ
      ↓
บันทึก Return
      ↓
History
```

---

# 28. Implementation Boundary

This document defines the agreed application flow.

The implementation agent must:

- Follow this flow.
- Follow `PROJECT_SPEC.md`.
- Follow `BUSINESS_RULES.md`.
- Follow `DATA_MODEL.md`.
- Not introduce new business workflows without approval.
- Not add QR/barcode/category/repair-queue features.
- Not add Admin approval to borrowing.
- Not replace quantity-based return completion with a manual complete/incomplete choice.

If a requirement is genuinely ambiguous or conflicts with another project document, the Agent should stop and ask rather than inventing a new business rule.

## Version

App Flow version: 1.0
