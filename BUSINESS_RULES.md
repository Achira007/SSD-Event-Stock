# SSD Event Stock — Business Rules

## 1. Roles and Permissions

- Roles: `Admin` and `Staff`.
- Admin can manage users, add/edit/delete equipment when allowed, adjust inventory quantities, create/edit/complete events, borrow/return equipment, return repaired equipment to available stock, and view all history.
- Staff can view inventory/equipment/events, borrow, return, view/filter history, and use their profile.
- Staff cannot add equipment or create/edit events.
- Borrowing never requires Admin approval.
- Authentication uses Google. Sessions persist until logout or expiry.

## 2. Events

- Only one event can be active/current at a time.
- Only Admin can create or edit events.
- Finished events become `เสร็จสิ้น`.
- Completed events remain viewable and in history.
- Admin may complete an event while equipment is still outstanding, but the system must show a warning first.
- Completing an event does not automatically alter or delete outstanding borrow records.

## 3. Equipment

Each equipment record has:
- Name
- Image
- Total quantity
- Available quantity (`พร้อมใช้งาน`)
- In-use quantity (`ใช้งานอยู่`)
- Damaged quantity (`ชำรุด`)

There is no equipment category, QR code, barcode, or `รอซ่อม` status.

Normal inventory invariant:

`Total = Available + In-use + Damaged`

No quantity may be negative.

## 4. Equipment Management

- Only Admin can add equipment.
- Admin provides the equipment image and initial quantity.
- Admin can increase quantity.
- Admin can directly adjust total quantity.
- Admin can decrease total quantity only with a reason.
- A decrease cannot make Total lower than current In-use.
- A decrease must not create negative Available or Damaged quantities.
- Quantity adjustments must be recorded in History.
- Admin may delete equipment only when it has no active/outstanding borrow records.

When increasing total quantity, the increase becomes Available stock.

## 5. Borrowing

- Admin and Staff can borrow.
- Equipment can be borrowed from Inventory, Equipment Detail, or Event Detail.
- Borrow is recorded immediately after the final confirmation; no extra confirmation dialog.
- Borrow purpose has exactly two choices:
  - `งานปัจจุบัน` — linked to the current event.
  - `การใช้งานทั่วไป` — not linked to an event and requires a description of what it is being used for.
- Maximum borrow quantity equals current Available quantity.
- If user enters more than Available, reject the action and show the maximum. Never silently change the entered number.
- If Available is 0, the Borrow button remains visible; opening it shows that no equipment is available and confirmation is impossible.

When borrowing N:
- `Available -= N`
- `In-use += N`
- Total and Damaged do not change.

## 6. Shared Team Workflow

- Borrow/return records are shared team records.
- The person returning equipment does not need to be the original borrower.
- Any authorized Admin or Staff can return an outstanding borrow record.
- Every transaction records the authenticated user who performed it.

Example:

Staff A borrows 50 → Staff B returns 30 → Staff C returns 20.

All returns belong to the same borrow record.

## 7. Returning

- Admin and Staff can return from Inventory, Equipment Detail, or Event Detail.
- A return must reference an outstanding borrow record.
- Return is recorded immediately after the final confirmation; no extra confirmation dialog.
- A borrow record can be returned in multiple transactions.
- `Outstanding = Original Borrowed Quantity - Total Returned Quantity`
- A return cannot exceed Outstanding. If 20 remain and user enters 25, reject and show maximum 20. Do not silently change 25 to 20.

For normal returned quantity N:
- `Available += N`
- `In-use -= N`
- Total and Damaged do not change.

## 8. Incomplete Returns

The system calculates missing quantity automatically; users do not choose whether the return is complete.

If Borrowed 50 and Returned 48:

`Missing = 2`

The system asks for exactly one reason:
- `ชำรุด`
- `อื่นๆ`

If `ชำรุด`:
- The entire missing quantity is classified as Damaged.
- User does not enter a separate damaged quantity.
- `Damaged += Missing`
- `In-use -= Missing`

If `อื่นๆ`:
- The entire missing quantity is classified as Other.
- A note is required.
- The system does not silently classify it as Available or Damaged.

## 9. Complete Returns

When:

`Total Returned Quantity = Original Borrowed Quantity`

The borrow record becomes `คืนครบ`.

After that:
- It cannot be returned again.
- It remains viewable.
- It remains in History.
- It is no longer counted as In-use.

## 10. Repairing Damaged Equipment

- There is no repair queue and no `รอซ่อม`.
- Only Admin can return repaired damaged equipment to service.
- Admin specifies the repaired quantity.
- Repaired quantity cannot exceed current Damaged quantity.
- `Available += repaired quantity`
- `Damaged -= repaired quantity`
- Total does not change.

Example:

Total 100 / Available 80 / In-use 15 / Damaged 5

Repair 3

→ Total 100 / Available 83 / In-use 15 / Damaged 2

## 11. History and Corrections

History includes at least:
- Borrow transactions
- Return transactions
- Equipment quantity adjustments

Staff can view all relevant history and filter it.
Admin can view all history.

Original borrow/return records must not be edited or deleted to correct mistakes.

Corrections must use a new adjustment/correction transaction so original history remains intact.

## 12. Data Integrity

The system must prevent:
- Negative inventory.
- Borrowing more than Available.
- Returning more than Outstanding.
- Returning an already fully returned borrow record.
- Repairing more than current Damaged quantity.
- Reducing Total below current In-use.
- Invalid inventory calculations.

Inventory transactions must be atomic so concurrent users cannot create invalid quantities.

Example:

If only one unit is Available and two users attempt to borrow it simultaneously, only one borrow can succeed.

## 13. UX Rules Driven by Business Logic

- Never ask the user to manually choose whether a return is complete.
- Calculate completion from quantities.
- Do not let users manually edit calculated Available/In-use/Damaged quantities.
- Error messages must explain the actual limit or reason an action is blocked.
- Borrow/return logic must be consistent whether started from Inventory, Equipment Detail, or Event Detail.

## 14. Out of Scope

- QR codes
- Barcodes
- Equipment categories
- Repair queue
- `รอซ่อม`
- Mandatory Admin approval for borrowing
- Multiple simultaneous active events
- Exclusive return rights for the original borrower

## Version

Business Rules version: 1.0
