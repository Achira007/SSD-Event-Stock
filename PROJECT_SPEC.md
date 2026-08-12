# SSD Event Stock — Project Specification

## 1. Project Overview

SSD Event Stock is an internal web application for managing event equipment inventory.

The system is designed for a company that frequently uses, lends, and returns event equipment such as tables, chairs, and other equipment.

Primary goals:
- Make borrowing and returning fast and simple.
- Keep inventory quantities accurate.
- Avoid unnecessary approval steps.
- Provide a shared view of current events, equipment, and history.

## 2. Project Scope

- Internal company use only.
- Responsive Web Application.
- Mobile + Desktop.
- Thai is the primary user-facing language.
- No QR Code.
- No Barcode.
- No equipment categories.
- No separate `รอซ่อม` status.

## 3. Branding

Brand: SSD

Product: Event Stock

Application name: SSD Event Stock

Displayed branding:
SSD
Event Stock

## 4. Users and Roles

### Admin

Admin can:
- Manage users.
- Add and edit equipment.
- Delete equipment when allowed by system rules.
- Adjust equipment quantities.
- Create, edit, and complete events.
- Borrow and return equipment.
- Return repaired equipment to available stock.
- View all history.

### Staff

Staff can:
- View inventory.
- View equipment details.
- Borrow equipment.
- Return equipment.
- View events and event details.
- View history.
- View and use their profile.

Staff cannot add equipment or create/edit events.

## 5. Authentication

Users sign in with Google using their Google account/email.

The application uses a persistent authentication session.

After successful sign-in:
- Users should not need to sign in again every time they reopen the website.
- The session remains active until the user signs out or the authentication system expires it.
- A logout function must be available.

User profile information should use the authenticated Google account/profile where appropriate.

## 6. Events

Only one event can be active/current at a time.

Event lifecycle:
- Current / Active
- `เสร็จสิ้น`

Only Admin can create and edit events.

When an event is finished, its status becomes `เสร็จสิ้น`.

Completed events remain available for viewing and history.

Admin may complete an event while equipment is still outstanding, but the system must show a warning before completion.

## 7. Equipment

Each equipment record includes at minimum:
- Equipment name.
- Equipment image.
- Total quantity.
- Available quantity.
- In-use quantity.
- Damaged quantity.

Admin uploads the equipment image when adding equipment.

Only Admin can add equipment.

Equipment status badges:
- `พร้อมใช้งาน`
- `ใช้งานอยู่`
- `ชำรุด`

Status quantities are calculated from inventory/transaction data. Users should not manually edit calculated status quantities.

## 8. Inventory Management

Admin can:
- Add new equipment.
- Edit equipment information.
- Increase equipment quantity.
- Directly adjust total quantity.
- Decrease total quantity when a reason is provided.
- Return repaired damaged equipment to available stock.

A decrease must not reduce total quantity below the quantity currently in use.

When damaged equipment is repaired:
- Admin specifies how many repaired units are returning.
- Available quantity increases by that amount.
- Damaged quantity decreases by that amount.
- Total quantity does not increase.

## 9. Borrowing

Equipment can be borrowed from:
- Inventory.
- Equipment Detail.
- Event Detail.

Both Admin and Staff can borrow. Borrowing requires no Admin approval.

Borrow purpose:
- `งานปัจจุบัน` — the current event.
- `การใช้งานทั่วไป` — general usage.

When `การใช้งานทั่วไป` is selected, the user must describe what the equipment is being used for.

The maximum borrow quantity is the current available quantity.

If available quantity is 30, the user may enter at most 30. The system must not silently change an entered quantity. An excessive quantity must be rejected with the maximum allowed quantity shown.

If available quantity is 0:
- The borrow button remains visible.
- The borrow flow can be opened.
- The system shows that no equipment is available.
- The borrow cannot be confirmed.

A confirmed borrow is recorded immediately without an additional confirmation dialog.

## 10. Returning

Equipment can be returned from:
- Inventory.
- Equipment Detail.
- Event Detail.

Both Admin and Staff can return equipment.

Return permission is not restricted to the original borrower. Team members can return equipment for one another.

A single borrow record can be returned in multiple transactions.

Example:
- Borrow 50.
- Return 30.
- 20 remain outstanding.
- Return the remaining 20 later.

Outstanding quantity is calculated as original borrowed quantity minus accumulated returned quantity.

A return cannot exceed the outstanding quantity. If 20 remain, entering 25 must be rejected and the system must state that the maximum return is 20.

When the returned quantity equals the outstanding quantity:
- The borrow record becomes `คืนครบ`.
- No further return can be made.
- The record remains available for viewing and history.
- It is no longer counted as in-use equipment.

If a return is incomplete, the system asks for the reason for the missing quantity:
- `ชำรุด`
- `อื่นๆ`

If `ชำรุด` is selected, the entire missing quantity is classified as damaged.

If `อื่นๆ` is selected, the entire missing quantity is classified as other and a note is required.

The user does not manually choose whether the return is complete; the system determines it from quantities.

A confirmed return is recorded immediately without an additional confirmation dialog.

## 11. Shared Team Workflow

Borrow and return transactions are shared team records.

The person performing a return does not need to be the person who performed the borrow.

The system records the authenticated user who performed each transaction for history/audit purposes.

Example:
- Staff A borrows 50 chairs.
- Staff B returns 30.
- Staff C returns 20.
- All actions belong to the same borrow record.

## 12. History

History includes at minimum:
- Borrow transactions.
- Return transactions.
- Equipment quantity adjustments.

Staff can view all relevant history and use filters.

Admin can view all history.

Completed borrow records remain viewable after they are fully returned.

Recorded borrow/return history must not be edited or deleted directly.

If a correction is required, use a new adjustment/correction transaction instead of modifying the original historical record.

## 13. UI / UX Principles

Priorities:
- Fast workflows.
- Clear status visibility.
- Minimal unnecessary steps.
- Mobile usability.
- Consistency between Inventory and Event workflows.
- Clear Thai labels.

Inventory uses colored status badges rather than progress bars.

Equipment cards should be compact and easy to scan.

Clicking/tapping an equipment card opens Equipment Detail.

Borrow and return actions should be available from both Inventory and Event contexts.

## 14. Core Modules

- Login
- Dashboard
- คลังอุปกรณ์
- รายละเอียดอุปกรณ์
- เพิ่มอุปกรณ์
- Popup เบิก
- Event List
- Event Detail
- Popup คืน
- History
- Profile

## 15. Platform

Responsive Web Application:
- Mobile
- Desktop

Mobile is especially important because warehouse staff use the system while physically working with equipment.

## 16. Out of Scope

- QR Code.
- Barcode.
- Equipment categories.
- Separate `รอซ่อม` status.
- Mandatory Admin approval for borrowing.
- Multiple active events at the same time.

## 17. Version

Specification version: 1.0
