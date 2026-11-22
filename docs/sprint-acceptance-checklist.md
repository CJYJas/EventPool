# Sprint Acceptance Checklist — EventPool

**Current sprint:** Sprint 2 — Complete Prototype Integration
**Milestone:** W7, 20–27 November 2026
**Prepared by:** WEI XIN — QA Engineer (M9)
**Last updated:** 22 November 2026  
**Build reviewed:** Current local workspace

## Purpose

This checklist records the current prototype state at W7. It separates
confirmed implementation, confirmed defects and items that still require
end-to-end verification.

## Result codes

| Code | Meaning |
| --- | --- |
| Pass | Confirmed through code and/or live execution |
| Fail | A required behaviour does not work or contradicts the current requirement |
| Partial | Part of the flow works, but the complete result is not verified |
| Blocked | A prerequisite or clean test environment is missing |
| Not run | In scope but no execution evidence is recorded |

## Overall verdict

> **SPRINT 2 NOT ACCEPTED YET**
>
> The application builds and the backend has a borrowing lifecycle, but the
> complete UI-to-Firestore workflow is not integrated and the shared Firebase
> project contains test records and duplicate clubs.

## 1. Environment and build preconditions

| # | Precondition | Owner | Result | Evidence |
| --- | --- | --- | --- | --- |
| P1 | Frontend runs locally | M5 | **Pass** | Vite served the application successfully |
| P2 | Backend runs locally | M7 | **Pass** | `/api/health` returned `200` |
| P3 | Frontend proxy reaches backend | M5/M7 | **Pass** | `/api` is configured to port `5000` and proxy calls succeeded |
| P4 | TypeScript compiles | M5 | **Pass** | `npm run lint` passes |
| P5 | Production bundle builds | M5 | **Pass** | `npm run build` passes |
| P6 | Firebase configuration is available | M7 | **Pass** | Authentication and API calls connect to the configured project |
| P7 | Disposable or clean UAT dataset exists | M7/M9 | **Fail** | Test resources and duplicate clubs are present |
| P8 | One deployed demo URL exists | M7/M9 | **Not run** | No deployed prototype URL was confirmed |
| P9 | Admin and representative test accounts are controlled | M7/M9 | **Partial** | Some accounts work; demo credentials and data are not controlled |

## 2. Authentication and access

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| A1 | Valid club login establishes the signed-in club context | Authentication | **Pass** | Firebase login/profile flow has been verified |
| A2 | Wrong password returns a readable error | Authentication | **Pass** | `INVALID_LOGIN_CREDENTIALS` maps to an invalid-credentials message |
| A3 | Disabled club account is rejected | Authentication | **Pass** | Backend returns `ACCOUNT_DISABLED`; UI displays the disabled-account message |
| A4 | Expired or invalid tokens are rejected | Security | **Pass** | Protected API requests use authentication middleware and return `401` |
| A5 | Signed-out users cannot open club or admin views | NFR4 | **Pass** | `checkViewAccess` and route guards reject unauthenticated views |
| A6 | Firebase configuration fails clearly when missing | Configuration | **Pass** | `loginWithFirebaseAuth` reports missing `VITE_FIREBASE_WEB_API_KEY` |

## 3. Marketplace and resource catalogue

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| B1 | Signed-in visitor sees Marketplace resources | FR1.1 | **Pass** | Live `/api/resources` response renders resource cards |
| B2 | Keyword search matches resource names and descriptions | FR1.1 | **Pass** | Search service calls `/api/resources/search` |
| B3 | Empty search returns a readable empty state | FR1.1 | **Pass** | No-match UI is present and has been exercised |
| B4 | Category, status, club and location filters work | FR1.1 | **Pass** | Filter values are sent to the live API |
| B5 | Resource detail shows live owner, quantity, condition and status | FR1.2 | **Partial** | API mapping exists; owner/detail data needs final UAT |
| B6 | Signed-out visitor can browse Marketplace | FR1.1/FR1.2 | **Fail** | Route guard and read endpoints are authenticated |
| B7 | Listing status is consistent with quantities | FR1.2/NFR5 | **Partial** | Backend status helper exists; final UI regression is required |
| B8 | Pagination reports live totals correctly | FR1.1 | **Pass** | Marketplace uses backend pagination and 8-item page size |

## 4. Club and My Club

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| C1 | Public club directory reads live clubs | FR4.1 | **Partial** | Club API exists; live fixture pollution affects expected results |
| C2 | Club detail shows accurate live information | FR4.1 | **Partial** | Mapping exists but final UAT is required |
| C3 | My Club opens for the authenticated club | FR4.1 | **Fail** | Club cache does not reliably populate from sign-in |
| C4 | Representative can edit only their own club | FR4.2/NFR4 | **Partial** | Backend permission guards exist; UI end-to-end verification is required |
| C5 | Incoming/outgoing borrowing records show live status | M4 | **Fail** | UI still relies heavily on local fixture/request state |
| C6 | Club resource management updates persisted data | FR2.1/FR2.2 | **Partial** | Backend CRUD exists; UI/API regression needs a clean dataset |

## 5. Borrowing lifecycle

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| D1 | Borrower submits a Pending request | FR3.1 | **Pass** | `POST /api/borrowing-requests` and frontend submission service exist |
| D2 | Requested quantity is validated against availability | FR3.2 | **Partial** | Frontend and backend validations exist; UI persistence needs final UAT |
| D3 | Owner approves and quantity becomes Reserved | FR3.3 | **Partial** | Backend endpoint exists; current frontend action only mutates local state |
| D4 | Owner rejects and stock remains unchanged | FR3.3 | **Partial** | Backend endpoint exists; frontend integration is not API-backed |
| D5 | Owner marks pickup and quantity becomes Borrowed | FR3.3 | **Partial** | Backend `/borrow` endpoint exists; frontend action is local fixture state |
| D6 | Borrower submits return and status becomes Return Pending | FR3.4 | **Partial** | Backend `/return` endpoint exists; frontend action is local fixture state |
| D7 | Owner verifies reusable/damaged/missing quantities | FR3.4 | **Partial** | Backend `/complete` endpoint exists; frontend action is local fixture state |
| D8 | Verified completion restores usable stock and reduces lost stock | FR3.4/NFR5 | **Partial** | Backend transaction logic exists and test cases cover it; UI verification is incomplete |
| D9 | Rejected/cancelled requests end in history without incorrect stock movement | FR3.4 | **Partial** | Backend reject exists; cancellation and its stock restoration need UI/API verification |
| D10 | Request history and current status persist after refresh | FR3.4 | **Fail** | Request workflow UI is not fully API-backed |
| D11 | Full sequence follows `Pending → Approved → Borrowed → Return Pending → Completed` | State machine | **Partial** | Backend routes support it; UI integration is not complete |
| D12 | Pickup overdue and return overdue indicators remain separate from the base status | FR3.5 | **Partial** | Backend provides overdue flags; UI/seed verification is incomplete |

## 6. Inventory and concurrency

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| E1 | `total = available + reserved + borrowed` is maintained | NFR5 | **Partial** | Backend and test suite implement this invariant |
| E2 | Inventory never becomes negative | NFR5 | **Partial** | Backend validates quantities in state-transition transactions |
| E3 | Simultaneous approvals cannot overbook stock | NFR6 | **Not run** | Transaction logic exists but concurrency test evidence is missing |
| E4 | Failed transitions leave stock unchanged | NFR8 | **Not run** | Firestore transactions exist; UI/API failure regression is incomplete |
| E5 | Damage/missing quantities are calculated correctly | FR3.4 | **Partial** | Backend requires original quantity to equal reusable + damaged + missing |

## 7. Landing page and sustainability

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| F1 | Landing catalogue matches live available resources | FR6.1 | **Fail** | Landing uses fixture cards while Marketplace reads API data |
| F2 | Impact metrics come from transaction records | FR6.1/FR6.2 | **Fail** | Dashboard/landing values are fixture-backed or fixed |
| F3 | Estimates are clearly labelled with assumptions | FR6.3 | **Not run** | Sustainability model/assumptions require verification |
| F4 | Completed sharing cycles are shown after real completion | FR6.1 | **Partial** | Sustainability UI filters completed fixture requests |

## 8. Data quality and security

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| G1 | Test resources do not appear in UAT or demo | Data quality | **Fail** | `TEST_BORROWING_*` records are visible |
| G2 | Club owner dropdown has no duplicate test clubs | Data quality | **Fail** | Multiple timestamped Debate Union records are possible |
| G3 | Repository does not contain password-bearing fixture credentials | Security | **Fail** | `seedData.ts` contains password fields |
| G4 | Environment values are not embedded as frontend fallback values | Configuration | **Pass** | Frontend now reads `VITE_FIREBASE_WEB_API_KEY` and warns if missing |
| G5 | Firebase credentials and keys are reviewed before deployment | Security | **Partial** | Service-account file exists locally; committed/configured copies require review |
| G6 | Role-restricted APIs return `401`/`403` correctly | NFR4 | **Pass** | Authentication and role middleware are present |

## 9. UI and evidence

| # | Acceptance criterion | Requirement | Result | Evidence |
| --- | --- | --- | --- | --- |
| H1 | Loading, success and error states are readable | UX | **Partial** | Marketplace and borrow form have states; lifecycle errors require API integration |
| H2 | Borrow validation directs the user to invalid fields | UX | **Fail** | Alert remains above the submit area |
| H3 | Desktop layout is usable | NFR3 | **Partial** | Screenshots and visual reviews exist |
| H4 | Mobile layout is usable | NFR3 | **Not run** | No final mobile UAT evidence is recorded |
| H5 | Defect fixes are linked to Jira and screenshots | QA process | **Partial** | `BUGS.md` exists; final Sprint 2 evidence must be updated |
| H6 | Required 5–8-minute human video evidence is progressing | Briefing | **Not run** | Weekly authentic footage and all-member participation still require collection |

## Summary

| Result | Count |
| --- | ---: |
| Pass | 20 |
| Partial | 25 |
| Fail | 11 |
| Not run | 6 |
| **Total** | **62** |

These totals describe current evidence, not a claim that untested items are
complete.

## Critical W7 conditions

1. Clean test and duplicate records from the Firebase UAT environment.
2. Make My Club resolve the authenticated club account from the API.
3. Replace all borrowing lifecycle local-state mutations with API calls.
4. Add live request loading and refresh after status transitions.
5. Align landing-page data and impact metrics with live or clearly identified demo data.
6. Run the complete lifecycle test and inventory invariant through the UI.
7. Run UAT with at least one requester representative and one owner representative.
8. Capture screenshots for pass/fail states and save them under `evidence/screenshots/sprint-2/`.

## Sign-off

| Role | Decision | Date |
| --- | --- | --- |
| QA Engineer (M9) | **Not accepted — critical UI/backend integration and data-cleanliness issues remain** | 22 Nov 2026 |
| Project Manager (M1) | Pending | |
| Backend Lead (M7) | Pending | |
| Frontend Lead (M5) | Pending | |
