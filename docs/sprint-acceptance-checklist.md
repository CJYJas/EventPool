# Sprint Acceptance Checklist — EventPool

**Sprint:** Sprint 1 (Gantt weeks 5–6)
**Jira:** EPM-63 — Verify sprint acceptance checklist
**Prepared by:** WEI XIN — QA Engineer (M9)
**Date:** 20 November 2026
**Build:** `main` @ `44e9c3e`
**Companion documents:** [`BUGS.md`](BUGS.md) · [`test-strategy.md`](test-strategy.md)

---

## Purpose

A sprint is not accepted because work was pushed. It is accepted when each committed item can be shown to behave as specified, with evidence that another person could check.

This checklist states, item by item, what "accepted" means for Sprint 1, what was actually observed, and what remains unproven. Where an item could not be executed, it is marked `Blocked` rather than left blank — an untested item must never look like a passing one.

**Result codes**

| Code | Meaning |
| --- | --- |
| `Pass` | Observed behaviour matches the specification; evidence recorded |
| `Fail` | Observed behaviour differs from the specification; defect raised |
| `Blocked` | Could not be executed because a precondition is missing; defect or dependency recorded |
| `Not run` | In scope but not yet attempted |

---

## Verdict

> **NOT ACCEPTED.**
>
> Two of the three `Must` flows in this sprint cannot be demonstrated: the borrowing workflow has no backend (BUG-001, Critical), and the marketplace cannot be opened without an account (BUG-003, Major). Five defects are open, none fixed.
>
> Sprint 1 can be accepted when the conditions in Section 5 are met.

---

## 1. Preconditions

These are not features. They are the conditions that make any verification possible, so they are checked first. At the time of writing three of them failed; a second round on 20 November cleared P1 and P2 and left P4 and P5 open.

| # | Precondition | Needed by | Result | Evidence |
| --- | --- | --- | --- | --- |
| P1 | A running instance reachable by QA — deployed URL or a QA-owned local environment | All testing | **Pass (local only)** | No deployed URL still (`README.md`: "to be added by M7/M8"). QA assembled a local stack on 20 Nov: frontend :3000 → proxy → backend :5001 → project `eventpool-78758`. Evidence: `test-execution-record.md`. |
| P2 | A Firebase service-account key so the backend can start | Backend, any authenticated page | **Pass** | Key received from M7 on 20 Nov, placed at `backend/serviceAccountKey.json` (git-ignored). Backend started and authenticated against Firestore successfully. |
| P3 | At least one club test account and one admin test account, with credentials | All authenticated pages | **Partial** | 12 Firebase Auth accounts exist and a club account was verified end to end. **Admin credentials are still not available**, so admin and sustainability pages remain unverified. |
| P4 | Seed data in known states: 2 clubs, 5 resources at different quantities | Borrowing and stock assertions | **Fail** | 11 club records, but only **1 resource visible** to the test account; no overdue record. Five seed resources were promised and are still missing (DR-04). |
| P5 | Frontend and backend configured to talk to each other | Any API call | **Fail** | BUG-002 confirmed live: `npm run dev` starts the backend on 5000 while the proxy targets 5001. The executed round required `PORT=5001` as a manual override. |
| P6 | Definition of Done agreed: "Done = built, tested by M9, screenshot saved to `evidence/`" | Acceptance itself | **Pass** | `README.md`, Workflow section. |

---

## 2. Functional scope

Sprint 1 committed the following. Each row is one acceptance item.

### 2.1 M1 — Resource Marketplace (M5: FE-02, FE-03)

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| A1 | A visitor can open the marketplace without signing in | FR1.1 (Must) | **Fail** | BUG-003 — `/marketplace` is guarded as `authenticated` |
| A2 | Keyword search returns matching listings | FR1.1 (Must) | **Blocked** | Requires sign-in and a running API |
| A3 | A keyword with no match shows an empty state, not an error | FR1.1 | **Blocked** | As A2 |
| A4 | Category, availability, owning-club and location filters combine correctly | FR1.1 (Must) | **Blocked** | As A2 |
| A5 | The availability badge matches the stored quantity | FR1.2 (Must) | **Blocked** | As A2; also depends on the DR-02 status definition |
| A6 | The resource detail page shows owner club, available quantity, condition and status | FR1.2 (Must) | **Blocked** | As A2 |
| A7 | Results render within 3 seconds | NFR1 | **Not run** | Needs a running instance |

### 2.2 M2 — Resource Management (M6: add/edit forms; M7: BE-02, BE-03)

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| B1 | A club representative can create a listing with name, category, quantity, condition and location | FR2.1 (Must) | **Blocked** | Requires sign-in and `POST /api/resources` |
| B2 | Creating a listing with quantity 0 or a negative number is rejected with a clear message | FR2.1 | **Blocked** | As B1; the validation exists in `resourceController.js` but is unverified against the UI |
| B3 | An image upload accepts JPEG/PNG under 5 MB and rejects anything else with `415` / `413` | FR2.1 (Must) | **Blocked** | Requires backend with Storage configured (BUG: falls back to local disk on Spark plan) |
| B4 | A listing can be archived, and an archived listing disappears from the marketplace | FR2.1 (Must) | **Blocked** | As B1 |
| B5 | Archiving a resource with active borrowings is refused (`409 RESOURCE_HAS_ACTIVE_BORROWINGS`) | FR2.1 | **Blocked** | Cannot be constructed without seed data (P4) |
| B6 | The owner can mark an item temporarily unavailable | FR2.2 (Must) | **Blocked** | As B1 |

### 2.3 M3 — Borrowing Request (M5: FE-03 form; M8: workflow)

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| C1 | A club representative can submit a request with resource, quantity, event, purpose and dates | FR3.1 (Must) | **Fail** | BUG-001 — `POST /api/borrowing-requests` does not exist; the call returns 404 |
| C2 | Requesting more units than are available is rejected before submission | FR3.2 (Must) | **Blocked** | Client-side check exists in `validateBorrowForm`; no server-side confirmation possible |
| C3 | A return date earlier than the pickup date is rejected | FR3.2 (Must) | **Blocked** | Client-side check exists; unverified in the browser |
| C4 | The owner can approve a request, and the quantity moves from available to reserved | FR3.3 (Must) | **Fail** | BUG-001 — no endpoint. The UI appears to work because `AppContext` mutates React state only; a refresh restores the seed values |
| C5 | The owner can reject a request, and the available quantity is unchanged | FR3.3 (Must) | **Fail** | As C4 |
| C6 | The borrower can cancel a request, and any reserved quantity is released | FR3.4 (Must) | **Fail** | As C4 |
| C7 | The borrower can see request history and current status | FR3.4 (Must) | **Fail** | `GET /api/borrowing-requests` does not exist |
| C8 | An overdue borrowing is flagged without overwriting the base status | FR3.5 (Must) | **Blocked** | Requires a seeded past-due record (P4) |

### 2.4 M4 — Club Profiles (M6, M7: BE-04)

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| D1 | The public club directory lists active clubs | FR4.1 (Must) | **Not run** | Public page, but needs a running instance |
| D2 | A club detail page shows club info, current listings and history | FR4.1 (Must) | **Blocked** | Requires sign-in for the listings portion |
| D3 | A representative can edit only their own club and receives `403` on another club | FR4.2 (Must), NFR4 | **Blocked** | Requires two test accounts (P3) |
| D4 | An admin can edit any club | FR4.2 | **Blocked** | Requires an admin account (P3) |

### 2.5 Administration (M5: FE-04; M7: BE-05)

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| E1 | An admin can create a club account, which atomically creates the auth user and the Firestore record | — | **Blocked** | Requires admin account and running backend |
| E2 | Creating a club with a duplicate email is refused with `409 EMAIL_ALREADY_EXISTS` | — | **Blocked** | As E1 |
| E3 | Deactivating a club disables its login | Account deactivation | **Blocked** | Requires a club account to deactivate |
| E4 | The admin dashboard totals match the underlying collections | — | **Blocked** | As E1 |

### 2.6 M6 — Sustainability dashboard

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| F1 | Completed sharing transactions and total reused quantity are displayed | FR6.1 (Must) | **Not run** | Public page; needs a running instance |
| F2 | Every metric is labelled as an estimate with its assumptions stated | FR6.3 (Must) | **Not run** | As F1 |

---

## 3. Non-functional scope

| # | Criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| N1 | Available quantity never drops below zero | NFR5 | **Not verified** | Cannot be asserted while inventory lives only in React state (BUG-001) |
| N2 | Simultaneous approvals cannot overbook a single unit | NFR6 | **Not verified** | The backend transaction described in the API contract is unreachable — no borrowing endpoint exists |
| N3 | A failed inventory update rolls back cleanly | NFR8 | **Not verified** | As N2 |
| N4 | A signed-out user cannot reach role-restricted pages | NFR4 | **Pass (by inspection)** | `src/context/viewAccess.ts` guards every non-public view; `checkViewAccess` returns `login_required` or `forbidden` |
| N5 | The layout remains usable on a mobile viewport | NFR3 | **Not run** | Needs a running instance |

---

## 4. Summary

| Result | Count |
| --- | --- |
| Pass | 2 |
| Fail | 8 |
| Blocked | 19 |
| Not run | 5 |
| **Total** | **34** |

Of the 34 acceptance items, **2 could be passed**, and one of those was verified by reading code rather than by using the product.

### Round 2 update — 20 November, after a runnable environment was assembled

The table above was computed from static review, before any environment existed. A second round executed 17 cases against a live stack (`test-execution-record.md`):

| Result | Count | Note |
| --- | --- | --- |
| Pass | 12 | Authentication (3), authorisation (3), resource reading (5), health (1) |
| Fail | 4 | All four are the missing borrowing endpoints — one defect, BUG-001 |
| Observation | 1 | Keyword `banner` returns nothing because no Banner record exists |

This moves the picture from *"the product is untestable"* to *"the product is partly testable, and the untestable part is now proven missing rather than merely suspected."* The verdict does not change, and it is now stronger: the Critical defect has been reproduced against a running server instead of inferred from source code.

### Round 3 — 20 November, browser click-through by QA

A human click-through of the same build added three defects that the API round could not see, and confirmed one that had only been inferred:

| Defect | Severity | Effect on this checklist |
| --- | --- | --- |
| BUG-003 | Major | A1 confirmed in the browser — the visitor sees the sign-in card, not the catalogue |
| BUG-006 | Major | M4 items (D1–D3) **fail in practice**: My Club shows an empty state for a valid club account, so no lending-side flow is reachable on a fresh sign-in |
| BUG-008 | Major | Landing page advertises four resources and an impact dashboard that the live catalogue does not contain |
| BUG-007 | Minor | The borrowing form hides its own validation message, which is why the testers believed "submit does nothing" before reaching BUG-001 |

The read path (list, detail, search, filters, empty states) is presentable, and the disabled-account message is clear enough that a user knows to ask an administrator rather than retry the password. The write path fails twice over: the endpoint is missing **and** the interface conceals it. Section 5 item 1 therefore needs one addition — the form must surface server errors where the user is looking, or the next tester will report the same "nothing happens" and stop.

Evidence for all of the above: `evidence/screenshots/sprint-1/` (16 screenshots, indexed in `INDEX.md`), captured by QA during the click-through.

---

## 5. What must happen before Sprint 1 can be accepted

Ordered by what unblocks the most items.

| # | Condition | Owner | Unblocks |
| --- | --- | --- | --- |
| 1 | Implement the six borrowing endpoints (create, list, approve, reject, borrow, cancel), and make the UI call them instead of mutating local state | M7 / M8 | C1–C7, N1–N3 → 10 items |
| 2 | ~~Give QA a way in: either a deployed URL or a service-account key plus two test accounts~~ — **partly resolved 20 Nov**: key and a club account supplied, local stack running. Still missing: deployed URL, admin credentials | M7 / M1 | 19 blocked items → 12 now executed |
| 3 | Load seed data: 2 clubs, 5 resources in different quantities, 1 overdue record | M8 / M1 | P4, A5, C8, D3 → 4 items |
| 4 | Align the API port so the frontend reaches the backend | M5 | P5, BUG-002 |
| 5 | Decide whether the catalogue is public; if yes, open the read endpoints and the route guard | M1 | A1–A6 → 6 items |
| 6 | Re-run this checklist and record evidence under `evidence/screenshots/sprint-1/` | M9 | Acceptance itself |

Items 1 and 2 are the blockers. Until they are resolved, no amount of clicking produces a trustworthy result, and the honest position is that Sprint 1 is **not testable**, not that it is **broken** — the difference matters when the final report is written.

---

## 6. Sign-off

| Role | Name | Decision | Date |
| --- | --- | --- | --- |
| QA Engineer (M9) | WEI XIN | **Not accepted** — 17 API cases (12 pass, 4 fail) plus 14 browser steps (9 pass, 5 fail); 8 defects open, evidence filed | 20 Nov 2026 |
| Project Manager (M1) | Ng Yue Qhi | | |
| Backend Lead (M7) | Jasmine Chin | | |
