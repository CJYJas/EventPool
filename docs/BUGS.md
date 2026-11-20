# BUGS — EventPool Defect Log

**Owner:** WEI XIN — QA Engineer (M9)
**Related:** Jira `EPM-24`, `EPM-62` · Gantt tasks `4.1`, `4.2`
**Build examined:** `main` @ `44e9c3e` (20 November 2026)
**Last updated:** 20 November 2026

This file is the single record of every defect found in EventPool. A defect that is not written here does not exist for the team: it will not be fixed, it will not be counted in the final report, and it cannot be used as evidence of testing work. Every entry also gets a matching Jira issue when it blocks a sprint goal, using the same `BUG-nn` identifier.

---

## Summary

| Severity | Open | Closed |
| --- | --- | --- |
| Critical | 1 | 0 |
| Major | 4 | 0 |
| Minor | 3 | 0 |
| **Total** | **8** | **0** |

BUG-001 to BUG-005 were found by code inspection and API testing on 20 November. BUG-006 to BUG-008 were found in the browser click-through round the same evening and are the first defects in this log that a non-technical tester can reproduce without reading any code.

---

## Severity guide

| Severity | Meaning | Target fix |
| --- | --- | --- |
| **Critical** | A core flow cannot be completed at all — for example a borrowing request can never be approved, or the app crashes on login. | Same week as reported |
| **Major** | A main function returns a wrong result, but a workaround exists — for example the stock count is wrong by one but the flow still completes. | Within the current sprint |
| **Minor** | Interface, wording or cosmetic issue that does not block any task. | Before sign-off |

## Status guide

`Open` → `In Progress` → `Fixed` → `Closed`

A defect moves to `Closed` only after QA re-runs the original failing case **and** the related regression cases. A defect closed without that verification is reopened.

---

## Open defects

| ID | Title | Module | Severity | Status | Reported | Assigned |
| --- | --- | --- | --- | --- | --- | --- |
| BUG-001 | All five borrowing-request endpoints are missing from the backend | M3 | **Critical** | Open | WEI XIN | M7 / M8 |
| BUG-002 | Frontend proxy targets port 5001, backend defaults to 5000 | Infra | **Major** | Open | WEI XIN | M5 |
| BUG-003 | Marketplace requires sign-in, contradicting FR1.1 and FR1.2 | M1 | **Major** | Open | WEI XIN | M1 |
| BUG-004 | Firebase Web API key hard-coded in client source | Infra | Minor | Open | WEI XIN | M5 |
| BUG-005 | Demo seed data stores plaintext passwords | Data | Minor | Open | WEI XIN | M5 |
| BUG-006 | My Club page shows "not available yet" for a signed-in club representative | M4 | **Major** | Open | WEI XIN | M6 |
| BUG-007 | Borrow form validation message appears above the fold and the page does not scroll to it | M3 | Minor | Open | WEI XIN | M5 |
| BUG-008 | Landing page and "Our Impact" use demo fixtures, so the catalogue contradicts itself | M1 / M6 | **Major** | Open | WEI XIN | M1 / M6 |

## Closed defects

| ID | Title | Module | Severity | Fixed in | Verified by |
| --- | --- | --- | --- | --- | --- |
| — | — | — | — | — | — |

---

## BUG-001 — All five borrowing-request endpoints are missing from the backend

- **Module:** M3 Borrowing Request
- **Severity:** Critical
- **Found in:** `main` @ `44e9c3e`, 20 November 2026
- **Jira issue:** EPM-62
- **Reported by:** WEI XIN · **Assigned to:** Jasmine Chin (M7), Backend Developer (M8)
- **Status:** Open
- **Found by:** code inspection, then **confirmed against the running server** on 20 November 2026

**Preconditions**
The frontend is running and the user is signed in as a club representative.

**Steps to reproduce**
1. Open **Marketplace** and select any resource that belongs to another club.
2. Click **Request to borrow** and fill in the form (event, quantity, purpose, dates).
3. Submit.

**Expected result**
A new request is created with status `Pending`, and it appears under the owner's incoming requests.

**Actual result**
The request cannot be created. `POST /api/borrowing-requests` is not registered on the server, so the call falls through to the catch-all handler and returns `404 ROUTE_NOT_FOUND`. The UI surfaces this as a red banner at the top of the form: "Borrowing requests are not available on the server yet. Please try again later." The right-hand summary panel still shows `Status after submission: Pending`, which is hard-coded text, not a server response.

**Evidence**

*Manual reproduction by a non-technical tester (20 Nov 2026, 20:15, signed in as `club_b_1795151812329@eventpool.test`):* form completed with event `FSKTM Charity night (2026-11-27)`, quantity 2, purpose stated, dates 21 Nov → 1 Dec, submit pressed. Screenshot `evidence/screenshots/sprint-1/ui-07b-borrow-submit-error.png`; the filled form beforehand is `ui-07c-borrow-form-filled.png`. Nothing is written — a refresh removes the "pending" request entirely.

**Evidence**

*Live reproduction (20 Nov 2026, backend :5001, signed in as `club_b_1795151812329@eventpool.test`):*

| Request | Response |
| --- | --- |
| `GET /api/borrowing-requests` | `404 {"message":"Route not found: GET /api/borrowing-requests","error":{"code":"NOT_FOUND"}}` |
| `POST /api/borrowing-requests` | `404 Route not found: POST /api/borrowing-requests` |
| `PATCH /api/borrowing-requests/REQ001/approve` | `404 Route not found: PATCH /api/borrowing-requests/REQ001/approve` |
| `PATCH /api/borrowing-requests/REQ001/reject` | `404 Route not found: PATCH /api/borrowing-requests/REQ001/reject` |

By contrast every other route group answered correctly on the same run (`GET /api/resources` → `200`, `GET /api/resources/RES001` → `200`, `PATCH /api/admin/dashboard` with a club token → `403`), which isolates the failure to this route group rather than to the server or the token.

*Code inspection:*
- `backend/src/server.js` registers exactly five route groups: `/api/auth`, `/api/admin`, `/api/clubs`, `/api/events`, `/api/resources`. There is no `/api/borrowing-requests`.
- `backend/src/controllers/` contains `authController`, `adminController`, `clubController`, `eventController`, `resourceController`, `imageController` — no borrowing controller.
- `src/services/borrowing.ts` lines 135–139 carry the team's own admission: *"POST /api/borrowing-requests is not implemented in backend/ yet"*.
- `src/services/api.ts` nevertheless defines `fetchBorrowRequestsApi`, `approveBorrowRequestApi`, `rejectBorrowRequestApi`, `markBorrowedApi` and `cancelBorrowRequestApi`, all pointing at endpoints that do not exist.

**Notes / suspected cause**

Two separate problems share this root cause, and the second one is what makes the defect dangerous:

1. **The endpoints are absent.** Create, list, approve, reject, borrow and cancel are all missing.
2. **The UI silently simulates the missing backend.** `AppContext.tsx` mutates `availableUnits` and `reservedUnits` in React state only (lines 654–655, 696–697, 718, 778) and never calls the API layer. An approver therefore sees the request accepted and the stock count change — but nothing is written to Firestore, and a page refresh restores the seed data. A reviewer testing by clicking will conclude the flow works.

This is why the defect is rated Critical rather than Major: FR3.1–FR3.4 are all `Must` requirements, and there is currently no evidence that any of them works end to end.

---

## BUG-002 — Frontend proxy targets port 5001, backend defaults to 5000

- **Module:** Infrastructure / local development
- **Severity:** Major
- **Found in:** `main` @ `44e9c3e`, 20 November 2026
- **Jira issue:** EPM-62
- **Reported by:** WEI XIN · **Assigned to:** Frontend Lead (M5)
- **Status:** Open
- **Found by:** code inspection; reproducible locally in under two minutes

**Preconditions**
A clean clone of the repository, dependencies installed.

**Steps to reproduce**
1. Run `cd backend && npm install && npm run dev`. The server logs `[EventPool API] Server running on port 5000`.
2. In a second terminal, run `npm run dev` at the repository root.
3. Open `http://localhost:3000` and try to sign in.

**Expected result**
Requests to `/api/*` from the frontend reach the Express server.

**Actual result**
The Vite proxy forwards `/api` to `http://localhost:5001`, where nothing is listening. Every API call fails with `NETWORK_ERROR` ("Cannot reach the EventPool server"), including sign-in, which needs `/api/auth/profile` after the Firebase token exchange.

**Evidence**
- `vite.config.ts`, `server.proxy`: `'/api': { target: 'http://localhost:5001' }`
- `backend/src/server.js` line 20: `const PORT = process.env.PORT || 5000;`
- `backend/package.json`: `"dev": "node --watch src/server.js"` — the script sets no `PORT`, so `npm run dev` always lands on 5000.
- `backend/.env.example`: `PORT=5000`
- `README.md`: "start backend server on http://localhost:5000/api"
- **Confirmed live on 20 November 2026:** the full 17-case run documented in `test-execution-record.md` was only possible after starting the backend with `PORT=5001 node src/server.js`. With the documented command the proxy target has no listener and every `/api/*` call returns `NETWORK_ERROR`.

**Notes / suspected cause**

Four places in the repository name the port, and three say 5000 while the proxy says 5001. Anyone following the README gets a frontend that cannot reach any API and will assume the backend is broken. Fix by pointing the proxy at 5000, or by setting `PORT=5001` in `.env` **and** updating the README and `.env.example` to match.

---

## BUG-003 — Marketplace requires sign-in, contradicting FR1.1 and FR1.2

- **Module:** M1 Resource Marketplace
- **Severity:** Major
- **Found in:** `main` @ `44e9c3e`, 20 November 2026
- **Jira issue:** EPM-62
- **Reported by:** WEI XIN · **Assigned to:** Ng Yue Qhi (M1) — product decision needed
- **Status:** Open
- **Found by:** code inspection; reproducible locally

**Preconditions**
No signed-in session (first visit, or after signing out).

**Steps to reproduce**
1. Open `http://localhost:3000`.
2. Click **Marketplace** in the navigation.

**Expected result**
Per FR1.1 ("Search and filter resources by name, category, availability, and location", priority `Must`) and FR1.2 ("Display resource details, owner club, available quantity, condition, and status", priority `Must`), a visitor should be able to browse and search the catalogue; only requesting a loan should require an account.

**Actual result**
The visitor is redirected to the sign-in view and sees no resources at all.

**Evidence**
- `src/context/viewAccess.ts`: `marketplace: 'authenticated'`, `resource_detail: 'authenticated'`, with the comment "The resource and club APIs require a signed-in account".
- `README.md` lists `/marketplace` and `/marketplace/:resourceId` among the public routes, which implies the current restriction was not the intended design.
- `UI-02-marketplace-login-wall.png` — confirmed in the browser on 20 November: clicking **Marketplace** while signed out swaps the catalogue for the sign-in card and a "Please log in to continue" toast.
- `UI-10-after-signout-marketplace.jpg` — reproduced a second time on a clean session immediately after signing out, which rules out a stale token or a stale tab as the cause.

**Notes / suspected cause**

The constraint originates in the backend — `GET /api/resources` sits behind the `authenticate` middleware — and the frontend then mirrored it into a route guard. Two consequences:

1. A first-time club representative opening the product sees nothing and has no reason to register.
2. UAT participants cannot be given a link to "have a look" before creating an account, which will distort the week 11 usability session.

Either open the read endpoints (`GET /api/resources`, `GET /api/resources/search`, `GET /api/resources/:id`, `GET /api/clubs`) to anonymous callers, or record the decision that the catalogue is members-only and amend FR1.1/FR1.2 so the requirement and the product agree.

---

## BUG-004 — Firebase Web API key hard-coded in client source

- **Module:** Infrastructure / configuration
- **Severity:** Minor
- **Found in:** `main` @ `44e9c3e`, 20 November 2026
- **Jira issue:** none
- **Reported by:** WEI XIN · **Assigned to:** Frontend Lead (M5)
- **Status:** Open
- **Found by:** code inspection

**Preconditions**
Read access to the repository.

**Steps to reproduce**
1. Open `src/services/api.ts`.
2. Read lines 7–9.
3. Alternatively open `backend/.env.example`.

**Expected result**
Environment-specific values are supplied at build time through `.env` and never committed.

**Actual result**
`AIzaSyCuxj4pY_b0wDq298coBMXtVm-FdDrLRuQ` is written as a literal fallback in the client source, and the same value is committed in `backend/.env.example`.

**Evidence**
- `src/services/api.ts`: `const FIREBASE_WEB_API_KEY = import.meta.env?.VITE_FIREBASE_WEB_API_KEY || 'AIzaSy...'`
- `backend/.env.example`: `FIREBASE_WEB_API_KEY=AIzaSy...`

**Notes / suspected cause**

A Firebase **web** API key is not a secret — it is designed to ship in the browser — so this is not a credential leak in the strict sense. The problem is configuration hygiene: the fallback means the app silently uses one project's key when the environment variable is missing, which is exactly the kind of mistake that points a demo build at the production project. Remove the literal, fail loudly when the variable is absent, and keep `.env.example` to placeholder text. Commit `11640e1` ("remove secret") suggests the team has already hit this once.

---

## BUG-005 — Demo seed data stores plaintext passwords

- **Module:** Data / demonstration fixtures
- **Severity:** Minor
- **Found in:** `main` @ `44e9c3e`, 20 November 2026
- **Jira issue:** none
- **Reported by:** WEI XIN · **Assigned to:** Frontend Lead (M5)
- **Status:** Open
- **Found by:** code inspection

**Preconditions**
Read access to the repository.

**Steps to reproduce**
1. Open `src/data/seedData.ts`.
2. Inspect any entry in `INITIAL_CLUBS`, for example `club-pekom`.

**Expected result**
Demo fixtures should not carry password fields, because the application authenticates through Firebase Authentication and never reads them.

**Actual result**
Every club record in `INITIAL_CLUBS` includes `password: 'password123'` — eight occurrences.

**Evidence**
- `src/data/seedData.ts`: `representativeEmail: 'alice@um.edu.my'`, `password: 'password123'`, repeated for `club-pekom`, `club-ptum`, `club-arts`, `club-drama`, `club-media`, `club-debate`, `club-eng`, `club-mktg`.

**Notes / suspected cause**

The field is vestigial — it is never read by the sign-in flow — but it invites a presenter to read a password off the screen during a demo, and it teaches the team that passwords belong in source. Remove the field from the fixtures. If demo accounts are needed, create them in Firebase Authentication and document the credentials somewhere other than the repository.

---

## BUG-006 — My Club shows "Club workspace not available yet" for a signed-in club representative

- **Module:** M4 Club Profiles / My Club workspace
- **Severity:** Major
- **Found in:** `main` @ `44e9c3e`, 20 November 2026
- **Jira issue:** EPM-63
- **Reported by:** WEI XIN · **Assigned to:** M6 (Club Profile owner)
- **Status:** Open
- **Found by:** browser click-through

**Preconditions**
Signed in with an active club account — `club_b_1795151812329@eventpool.test` (club *Debate Union 1795151812329*, club id `r4ZmV7tS8YEb19xt4TiP`). The account is a valid `club` account: `GET /api/auth/profile` returns `success: true` with that `clubId`.

**Steps to reproduce**
1. Open `http://localhost:3000` and sign in with the account above.
2. In the navigation bar, click **My Club**.
3. Do not open any resource detail page before step 2.

**Expected result**
The club workspace opens for the signed-in representative: club name, its resources, incoming and outgoing requests, and the three sub-tabs Operations / Events / Club Profile.

**Actual result**
The page renders the empty state "Club workspace not available yet — You are signed in, but no club data is linked to this account. Please contact UM Admin." The navigation bar in the same session shows the correct club ("Debate Union 1795151812329"), so the session is not the problem.

**Evidence**
- `UI-03-myclub-empty.png` — My Club tab, empty state, while the top-right menu shows the club name.
- `GET /api/auth/profile` → `{"accountType":"club","clubId":"r4ZmV7tS8YEb19xt4TiP","clubName":"Debate Union 1795151812329"}`.
- `src/pages/borrower/MyClubPage.tsx` line ~65: `const club = getClubById(currentUser?.clubId || 'club-pekom');`
- Comparison that isolates the cause: the M6 design screenshots in `evidence/screenshots/sprint-1/m6-my-club.png` show the same page working — but the signed-in user there is **Alice Tan · PEKOM Representative**, a demo fixture whose club id (`club-pekom`) exists in `seedData.ts`. The page works for the demo account and fails for every real account.
- `UI-08-after-refresh-undefined.jpg` — second symptom of the same missing lookup: the home page signed-in card reads `undefined · undefined`, because `HomePage.tsx` line ~315 renders `${userClub?.acronym} · ${userClub?.name}` from the same fixture-backed lookup.

**Notes / suspected cause**

`getClubById` reads a map built from `state.clubs` (demo fixtures with ids such as `club-pekom`) plus `remoteClubs`. `remoteClubs` is only populated by `cacheRemoteData`, and the only two callers are the resource-detail hook (`fetchClubById(resource.clubId)`) and the admin club list. Nothing fetches the signed-in club at sign-in time, so the backend club id `r4ZmV7tS8YEb19xt4TiP` has no entry in the map and the page falls into the empty branch.

Two consequences worth recording:

- **The page works only for the demo account.** Every screenshot the M6 team produced shows `Alice Tan` signed in, which is a fixture. This is the general shape of the problem across the project: the product was built and demonstrated against fixture users, so the backend-bound path was never walked end to end. Sprints can pass review this way and still fail on first real sign-in.
- **A second symptom, same cause.** The home page signed-in card renders `undefined · undefined` for the same reason: `HomePage.tsx` line ~315 prints `${userClub?.acronym} · ${userClub?.name}` and `userClub` is resolved from the fixture map. One fix (fetch and cache the signed-in club) removes both.
- **Workaround that proves the cause.** Open any resource owned by the same club, then return to My Club — the page now renders, because that visit cached the club. Any other club's resource does not help, which is why the tester saw the empty state after browsing a resource owned by ABC Society.
- **Severity.** M4 is a `Must` module and every lending-side flow (approve, reject, mark borrowed, verify return) lives inside this page. A club representative who signs in fresh cannot reach any of it, so the defect is Major rather than Minor. It does not reach Critical only because the data is intact and a workaround exists.

Suggested fix: fetch the club for `currentUser.clubId` on sign-in (or on mount of My Club) using the existing `fetchClubById` service and pass it through `cacheRemoteData`, the same way the resource-detail hook already does.

---

## BUG-007 — Borrow form validation message appears above the fold and the page does not scroll to it

- **Module:** M3 Borrowing Request — form validation
- **Severity:** Minor
- **Found in:** `main` @ `44e9c3e`, 20 November 2026
- **Jira issue:** none
- **Reported by:** WEI XIN · **Assigned to:** Frontend Lead (M5)
- **Status:** Open
- **Found by:** browser click-through

**Preconditions**
Signed in, on the borrowing request form for any resource, with at least one required field empty (no event selected, or Purpose blank).

**Steps to reproduce**
1. Open Marketplace → any resource → **Request to borrow**.
2. Leave *Purpose of borrowing* empty and select no club event.
3. Scroll to the bottom of the form and click **Submit Request**.

**Expected result**
The form refuses to submit and shows the reason where the user is looking — for example the invalid field is focused and scrolled into view, or the summary message is repeated next to the submit button.

**Actual result**
Nothing visible happens. The form does not submit, no field is focused, and the page does not scroll. The message `Please fix the highlighted fields before submitting.` is rendered in an inline alert at the **top** of the form (`BorrowFormPage.tsx` line 277), roughly one screen above the button the user just pressed. The user's reasonable conclusion is that the button is broken.

**Evidence**
- `UI-07a-submit-no-response.png` — same screen before and after clicking Submit, taken from the bottom of the form.
- `BorrowFormPage.tsx` lines 212–217: on validation failure the handler sets the field errors and returns; `window.scrollTo` is only called on the success path (line 222).

**Notes / suspected cause**

The defect is invisible during a demo driven from the top of the page, which is exactly how it will be demonstrated. It also has a second-order effect on testing: a tester who does not scroll up will log "submit is dead" and stop, and the real defect behind the form (BUG-001) is never reached. Fix by scrolling the alert into view (`alertRef.current?.scrollIntoView()`) and moving focus to the first invalid field on failure.

---

## BUG-008 — Landing page and "Our Impact" figures come from demo fixtures, so the catalogue contradicts itself

- **Module:** M1 Resource Marketplace / M6 Sustainability Dashboard
- **Severity:** Major
- **Found in:** `main` @ `44e9c3e`, 20 November 2026
- **Jira issue:** EPM-62
- **Reported by:** WEI XIN · **Assigned to:** M1 (Ng Yue Qhi) / M6
- **Status:** Open
- **Found by:** browser click-through

**Preconditions**
Any visitor, signed in or not.

**Steps to reproduce**
1. Open `http://localhost:3000` — the signed-out landing page.
2. Read **Explore Shared Resources**: four cards are listed (Folding Chairs, Portable Speakers, Display Easels, HD Multimedia Projector), all badge `Available` except the last one, `Borrowed`.
3. Read the **Our Impact** panel: `19 kg`, `144 items`, `RM 6,600`, `7 / 8 UM clubs active`.
4. Sign in and open **Marketplace**.

**Expected result**
Both surfaces should describe the same catalogue. The landing page is the product's shop window; whatever it advertises must be what exists. After sign-in the catalogue shows one resource (Projector), so the landing page should show that same single resource and the impact figures should be computed from the same data.

**Actual result**
The landing page shows four resources and a full impact dashboard; the marketplace — reading the live backend — shows exactly **one** resource (`Projector`, 5 units, owner ABC Society). Three of the four advertised items do not exist in the database, and the `Our Impact` numbers are not derived from any stored record.

**Evidence**
- `UI-01-landing-page.png` — four cards + `19 kg / 144 items / RM 6,600 / 7 of 8 clubs`.
- `UI-04-marketplace-list.png` — "Showing 1–1 of 1 resources", Projector only.
- `src/pages/HomePage.tsx` line ~48: `featuredResources` is filtered from `resources`, and `AppContext` exposes `resources: state.resources` — the `INITIAL_RESOURCES` demo fixtures. The `Our Impact` block is likewise computed from fixtures.
- The marketplace list instead calls `GET /api/resources` and renders the returned page.

**Notes / suspected cause**

Two data sources exist side by side: the demo fixtures in `src/data/seedData.ts` and the real Firestore records reached through `/api/*`. The marketplace was migrated to the API; the landing page and the impact panel were not. The effect in a demo is that the audience sees four items, then one — and the first question a lecturer or judge asks is "where did the other three go?", which undermines the credibility of everything else shown.

The same split explains why the sustainability figures cannot be trusted: FR6.1 and FR6.2 ask for avoided expenditure computed from completed borrows, but the panel shows a constant. If a fixture-backed landing page is intentional for the demo, it must be labelled as sample data ("Sample data — not live inventory"); otherwise the two surfaces must read from one source.

---

## Coverage note — what this round reached

Recorded here so that the absence of a defect is not mistaken for evidence of correctness. Round 1 (8 November) was static review only, because no runnable environment existed. Round 2 (20 November) executed 17 cases against a live stack — frontend :3000 → Vite proxy → Express :5001 → Firebase project `eventpool-78758` — using the club account `club_b_1795151812329@eventpool.test`. Full results: `test-execution-record.md`.

| Area | Round 1 (static) | Round 2 (executed 20 Nov) |
| --- | --- | --- |
| Authentication: valid login, wrong password, disabled account | Not reachable | **Executed — 3/3 pass** (`USER_DISABLED` and `INVALID_LOGIN_CREDENTIALS` both returned correctly) |
| Authorisation: no token, forged token, club token on admin endpoint | Not reachable | **Executed — 3/3 pass** (401, 401, 403) |
| M1 Marketplace: list, detail, 404, search, pagination | Blocked | **Executed — 5/5 pass** |
| M1 stock invariant `total = available + reserved + borrowed` | Not reachable | **Executed — holds for every returned record** |
| M3 Borrowing request (create, list, approve, reject) | Blocked; defect suspected | **Executed — 4/4 fail with 404**, BUG-001 confirmed |
| M2 Resource management (create, edit, archive, availability) | Blocked | **Not executed** — would write to the shared database; needs a disposable test project (DR-04) |
| M4 Club profiles, M5 Return tracking | Blocked | **Not executed** — M5 depends on the missing borrowing module |
| M6 Sustainability dashboard, admin dashboard | Not reachable | **Not executed** — admin credentials not available |
| Backend automated suite (`npm run test:verify`, 41 cases) | Not executed | **Not executed** — the suite creates its own clubs and users; run it only against a disposable project |
| Frontend UI (click-through, visual states, error messages) | Not executed | **Executed — 8 observations, 3 new defects (BUG-006 to BUG-008)**, see `test-execution-record.md` section 8 |

**Deliberately not reported as defects.** Three observations were checked and cleared, and are recorded here so that a later reader does not re-raise them:

1. `Clubs` documents carry **both** `authUId` and `authUid`. This looks like a field-naming defect, but `backend/src/middlewares/auth.js` queries `authUId` first and falls back to `authUid`, so resolution works either way. It is data-hygiene debt in the seeded records, not a live defect.
2. `/api/resources/search?q=banner` returns nothing. The dataset contains a single visible resource (Projector, category `Electronics`); there is no Banner record, so the empty result is correct behaviour on thin data, not a search defect.
3. `GET /api/events` returned an empty list for the test account at the start of the run. The account's club owned no events, so the filter was behaving as designed — confirmed later the same evening, when an event was created through the UI (**FSKTM Charity night**, `2026-11-27`) and `GET /api/events` immediately returned it. Creation and owner filtering both work.
4. The **All Owning Clubs** filter lists six clubs, five of them named `Debate Union <timestamp>`. This is test-data pollution — each registration run in the shared Firebase project added another club — not a defect in the filter, which is correctly listing what the database contains. It is a symptom of DR-04 (no disposable test project) and should be cleaned up before the UAT session, or the first thing a UAT participant will see is a dropdown of duplicates.

**Consequence for EPM-62.** Eight defects stand, one of them Critical, and the Critical one is now proven against a live server rather than inferred from source. Because BUG-001 makes the whole borrowing flow unreachable, the sprint cannot be accepted on evidence — see `sprint-acceptance-checklist.md`.

---

## Entry template

Copy this block for each new defect. Do not delete any field; write `n/a` when a field genuinely does not apply, so that a missing field always means "forgot to fill it in".

```markdown
### BUG-000 — <one sentence describing the problem>

- **Module:** M1 Resource Marketplace
- **Severity:** Critical / Major / Minor
- **Found in:** <version, sprint or date>
- **Jira issue:** EPM-00 / none
- **Reported by:** <name> · **Assigned to:** <name>
- **Status:** Open

**Preconditions**
<what must be true before the steps can be followed>

**Steps to reproduce**
1.
2.
3.

**Expected result**
<what the system should do>

**Actual result**
<what the system does instead>

**Evidence**
<screenshot or screen recording link>

**Notes / suspected cause**
<optional — only if the reporter has a concrete suspicion; do not guess>
```
