# Updated Safaro Project Plan 2025

> “Perfect - now that I know the new libraries you've introduced (Zod, React Hook Form, TanStack Table), I can update your Safaro Project Plan so it reflects your current architecture and best practices.”  
> “Safaro is an internal safety observation platform supporting: Ticket submission; Approver workflow; Delegation; Lessons Learned; Dashboards; LocalStorage drafts.”

*(Source: Safaro_Project_Plan.pdf)*

---

## SAFARO PROJECT PLAN - 2025 UPDATED EDITION

(Reflecting Zod, React Hook Form, TanStack Table, and all revised requirements)  
This version integrates:

- Zod for schema validation
- React Hook Form for form handling
- TanStack Table for filtering, sorting, and search
- Updated visibility rules
- Updated workflows
- Updated database model
- Updated UX patterns
- Updated Next.js App Router architecture

Everything below is aligned with the content in your uploaded document, including the role model, visibility rules, company structure, and workflow logic.

---

### 1. Project Overview

Safaro is an internal safety observation platform supporting:

- Ticket submission
- Approver workflow
- Delegation
- Lessons Learned
- Dashboards
- LocalStorage drafts
- Clean ticket list UX with advanced filtering/search
- Multi-company support

The system is:

- Simple
- Secure
- Scalable
- Internal-only
- Multi-company
- Built with modern React tooling

---

### 2. Updated Tech Stack (2025)

#### Frontend

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form (forms)
- Zod (validation)
- TanStack Table (sorting, filtering, search)
- TanStack Query (optional, if you want caching)

#### Backend

- Auth.js
- PostgreSQL
- Prisma ORM

#### Other

- Local file storage (`/public/uploads/...`)
- Chart.js or Recharts for dashboards

---

### 3. User Roles (Final Model)

(Matches your uploaded document)

#### USER

- Submit tickets
- Edit tickets sent back for correction
- View approved tickets from ANY company
- Like & comment on approved tickets
- View their own tickets (any status)

#### APPROVER

- Everything a USER can do
- Approve / reject / request correction
- View tickets assigned to them
- View their own tickets
- View approved tickets globally
- Create Lessons Learned
- Receive delegated approval rights

#### ADMIN

- Everything an APPROVER can do
- Manage users
- Assign approvers
- Manage companies
- View all tickets from all companies

---

### 4. Company Structure (Final)

- Companies stored in a Company table
- Admin selects company from a DB-driven dropdown
- Users belong to exactly one company
- Unlimited companies
- No schema migrations needed

---

### 5. Ticket Visibility Rules (Final)

**USER sees:**

- Their own tickets
- Approved tickets from ANY company

**APPROVER sees:**

- Their own tickets
- Tickets assigned to them
- Approved tickets from ANY company

**ADMIN sees:**

- All tickets from all companies

---

### 6. Ticket Workflow (Final)

**Statuses (enum):**

- PendingApproval
- NeedsCorrection
- Resubmitted
- Approved
- Rejected

**Flow:**

1. USER submits  
2. APPROVER reviews  
3. Approve / Reject / NeedsCorrection  
4. USER resubmits  
5. APPROVER reviews again

**Approver assignment:**

- On submission or resubmission
- If approver has active delegation → assign to delegate
- Otherwise → assign to approver

---

### 7. Delegation (Final)

- One delegate at a time
- Time-based or open-ended
- No delegation chains
- Delegation only affects new submissions
- Tickets stay with delegate even after expiration

---

### 8. Lessons Learned (Final)

- Only after ticket is Approved
- Created by APPROVER or ADMIN
- Visible on Ticket Details
- Ticket List shows an icon if a lesson exists

---

### 9. LocalStorage Drafts

- Auto-save
- Auto-restore
- Clear on submit
- "Discard Draft" button

---

### 10. Ticket List UX (Updated for TanStack Table)

Each row shows:

- Status icon
- Category tag (enum: ACT / COND / NM / POS)
- Lesson Learned indicator
- Photo indicator
- Delegation indicator
- Likes (approved only)
- Comments (approved only)
- User name
- Approver name
- Created date

**Now powered by TanStack Table:**

- Column sorting
- Column filtering
- Global search
- Pagination
- Debounced search input
- Server-side or client-side modes

---

### 11. Database Schema (Final Version)

(Matches your uploaded document)

**Company**

- id
- name
- created_at

**User**

- id
- name
- email
- password
- role (enum: USER, APPROVER, ADMIN)
- companyId
- approverId
- created_at

**ApproverDelegation**

- id
- approverId
- delegateId
- start_date
- end_date

**Ticket**

- id
- companyId
- userId
- approverId
- title
- description
- category (enum)
- status (enum)
- created_at
- updated_at

**TicketImage**

- id
- ticketId
- file_path

**TicketLike**

- id
- ticketId
- userId

**TicketComment**

- id
- ticketId
- userId
- comment
- created_at

**LessonLearned**

- id
- ticketId
- companyId
- summary
- root_cause
- corrective_action
- preventive_action
- key_takeaways
- created_by
- created_at

---

### 12. File Storage

Local storage path pattern:

