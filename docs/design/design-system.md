# EventPool Design System

## 1. Design Overview

### 1.1 Purpose

EventPool is a resource-sharing platform for student clubs at Universiti Malaya. The platform enables authorised club representatives to discover available resources, coordinate borrowing arrangements, manage club inventories and monitor resource-sharing activities through a centralised application.

This design system establishes the visual language, interface components, layout conventions and interaction principles governing EventPool. It serves as a common reference for maintaining consistency between the Figma designs and the frontend implementation.

The system adopts the existing application theme as its official colour baseline, supported by the typography and component specifications established in Figma.

**Primary design reference:** [EventPool Figma Design](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool)

### 1.2 Design Principles

EventPool follows five design principles:

| Principle | Application |
|---|---|
| Clarity | Resource information, availability and borrowing actions must be understandable at a glance. |
| Consistency | Equivalent components and interactions should maintain consistent visual treatment and behaviour. |
| Efficiency | Users should be able to discover resources and complete borrowing tasks without unnecessary steps. |
| Responsiveness | Essential information and functionality must remain accessible across desktop and mobile layouts. |
| Accessibility | Interactive controls, text and system feedback should be perceivable and understandable to users with different accessibility needs. |

### 1.3 Visual Identity

EventPool adopts a restrained, sustainability-oriented visual identity built around forest green, warm cream and sage-green accents.

The principal visual characteristics are:

- Forest-green primary actions and brand elements.
- Warm cream application backgrounds.
- White cards and content surfaces.
- Sage-green supporting accents.
- Dark-green text for readable content.
- Subtle neutral borders separating interface elements.

The design prioritises clarity and usability over excessive decorative elements.

### 1.4 Target Users

The interface serves three principal user groups:

**Borrowing club representatives** discover resources, submit borrowing requests and monitor outgoing transactions.

**Resource-owning club representatives** manage inventory, review incoming requests, approve or reject borrowing requests and verify returns.

**Platform administrators** manage authorised administrative functions, including club accounts and platform oversight.

Navigation and available actions should reflect each user's permissions.

---

## 2. Colour System

### 2.1 Official Colour Palette

The following colours constitute EventPool's approved application palette, based on the existing frontend theme.

| Colour | HEX | CSS token | Usage |
|---|---|---|---|
| Primary Forest Green | `#2D4A35` | `--color-ep-primary` | Branding, primary buttons and prominent interactive elements |
| Dark Green / Ink | `#1F3626` | `--color-ep-ink` | Primary text, headings and interface emphasis |
| Warm Cream | `#FAF8F2` | `--color-ep-bg` | Main application background |
| Card White | `#FFFFFF` | `--color-ep-surface` | Cards, forms, dialogs and elevated surfaces |
| Sage Green | `#DCE7D8` | `--color-ep-sage` | Secondary backgrounds, supporting actions and selected accents |
| Border Neutral | `#E5E2D9` | `--color-ep-border` | Input borders, card outlines and separators |

These colours form the authoritative shared palette for the frontend.

### 2.2 Colour Preview

| Element | Colour |
|---|---|
| Main application background | Warm Cream |
| Primary button background | Primary Forest Green |
| Primary button text | Card White |
| Main headings and text | Dark Green / Ink |
| Content cards | Card White |
| Secondary action background | Sage Green |
| Form and component borders | Border Neutral |

### 2.3 Supporting Colours

The Figma design contains additional named styles, including Deep Green, Muted Olive, Text Charcoal and Feedback.

These may be retained as supporting visual variations where they serve a distinct design purpose.

However, they should not replace the official application tokens for equivalent interface elements without an approved design change.

### 2.4 Semantic Colours

Semantic colours communicate system conditions rather than decorative emphasis.

| Semantic state | Purpose | Presentation |
|---|---|---|
| Success | Successful submission or completed action | Positive feedback with a descriptive label |
| Warning | Pending action or condition requiring attention | Distinct warning treatment |
| Error | Invalid input or unsuccessful operation | Clear error message and affected control |
| Information | Neutral system guidance | Supporting feedback treatment |
| Disabled | Unavailable action | Reduced visual emphasis and non-interactive behaviour |

Resource availability and request status must not be communicated through colour alone.

### 2.5 Scrollbar Styling

The existing frontend defines the following scrollbar colours:

| Element | HEX |
|---|---|
| Scrollbar track | `#F2EFE6` |
| Scrollbar thumb | `#8FA38B` |
| Scrollbar thumb on hover | `#2D4A35` |

The scrollbar width and height are defined as `6px` in the current CSS.

### 2.6 Colour Implementation

The official palette is maintained in `src/styles/theme.css`.

Equivalent components should reference shared tokens instead of introducing repeated hard-coded colours.

Where Figma contains local colour variations, developers should preserve the official semantic role and document any intentional exceptions.

---

## 3. Typography

### 3.1 Font Families

EventPool's frontend declares the following typography families:

| Font | CSS declaration | Purpose |
|---|---|---|
| Plus Jakarta Sans | `--font-sans` | Primary application typography |
| Fraunces | `--font-serif` | Optional serif styling |
| JetBrains Mono | `--font-mono` | Monospaced or technical content |

**Plus Jakarta Sans is the default application font** through the `body` styling.

Fraunces and JetBrains Mono are available as declared font tokens. Their use should remain limited to components where the relevant typography treatment is intentionally required.

### 3.2 Heading Typography

The following heading scale is defined in the Figma text-style library.

| Text style | Font size | Line height | Usage |
|---|---:|---:|---|
| Display | 64px | 70px | Large introductory or display headings |
| H1 | 36px | 44px | Main page headings |
| H2 | 30px | 38px | Major section headings |
| H3 | 24px | 32px | Section headings |
| H4 | 20px | 28px | Subsection headings |
| H Card | 18px | 26px | Card headings |

Heading levels should reflect the semantic hierarchy of the content rather than merely its visual appearance.

### 3.3 Body Typography

| Text style | Font size | Line height | Usage |
|---|---:|---:|---|
| Body - L | 18px | 28px | Prominent supporting content |
| Body - R | 16px | 24px | Standard body text |
| Body - M | 16px | 24px | Emphasised body text |
| Body - S | 14px | 21px | Supporting information |
| Body - Caption | 12px | 18px | Captions and secondary labels |

Body - R and Body - M share the same size and line height. Any distinction between them should be expressed through the intended typography treatment without creating unnecessary additional sizes.

### 3.4 Interface Typography

| Text style | Font size | Line height | Usage |
|---|---:|---:|---|
| UI Navigation | 15px | 22px | Navigation labels |
| UI Input | 16px | 24px | Input fields |
| UI Button | 15px | 22px | Button text |
| UI Label | 14px | 20px | Form labels |
| UI Badge | 12px | 16px | Status labels |
| UI Error | 13px | 20px | Validation and error messages |

### 3.5 Dashboard Typography

| Text style | Font size | Line height | Usage |
|---|---:|---:|---|
| Data KPI Large | 32px | 40px | Prominent dashboard metrics |
| Data KPI Label | 14px | 20px | Metric descriptions |

Dashboard typography should distinguish numerical values from descriptive labels and units.

### 3.6 Typography Rules

The application should observe the following conventions:

- Use Plus Jakarta Sans as the primary interface typeface.
- Maintain consistent heading and body hierarchies.
- Use shared text styles for equivalent interface elements.
- Allow text to wrap naturally on narrower screens.
- Avoid using very small text for essential information.
- Maintain readable contrast between text and backgrounds.

The frontend should retain the established Figma type scale while applying responsive adjustments where necessary.

---

## 4. Spacing and Layout

### 4.1 Design Reference Widths

The Figma library includes the following layout guides:

| Layout | Reference width |
|---|---:|
| Desktop | 1440px |
| Mobile | 390px |

These dimensions are reference viewports for design comparison. Responsive implementation should remain usable at intermediate widths.

### 4.2 Layout Principles

Layouts should establish clear relationships between:

- Navigation and account controls.
- Page headings and supporting information.
- Search, filtering and contextual controls.
- Resource cards, forms and management content.
- Feedback messages and secondary information.

Spacing should be consistent across equivalent elements.

### 4.3 Desktop Layout

Desktop interfaces should use available horizontal space to support efficient navigation and resource management.

Applicable patterns include:

- Multi-column resource cards.
- Horizontally arranged filters.
- Structured forms and content panels.
- Request-management tables or grouped records.
- Dashboard metrics arranged in responsive grids.

### 4.4 Mobile Layout

Mobile layouts should prioritise the information and actions most relevant to the user's immediate task.

The design should:

1. Reorganise multi-column content into narrower arrangements.
2. Preserve meaningful reading order.
3. Maintain readable headings and labels.
4. Ensure buttons and form controls remain accessible.
5. Prevent unintended horizontal overflow.
6. Allow resource information and feedback messages to wrap.
7. Preserve essential desktop functionality.

### 4.5 Cards and Containers

Cards and content panels should use consistent spacing, borders and corner treatments.

The established colour system should distinguish the background from individual content surfaces.

Shared components should reuse common layout values rather than applying unrelated spacing and radii.

### 4.6 Scrolling

Scrolling should support content access without producing unexpected movement of important navigation controls.

Within Club Management, the navigation for Incoming Requests, Outgoing Requests, Events and Club Profile should remain visually consistent across related views.

Where content requires scrolling, the frontend should provide an appropriate scroll container while maintaining access to essential controls.

---

## 5. UI Components

### 5.1 Buttons

Buttons communicate available actions and their relative importance.

**Primary buttons** represent the principal action, such as Login, Request to Borrow or Submit Request.

**Secondary buttons** support alternative actions, including returning to a previous interface or cancelling an unfinished operation.

**Destructive actions**, such as rejecting a request or deactivating a club account, should be visually distinguishable and supported by appropriate confirmation.

Buttons should maintain consistent typography, alignment, shape and interaction feedback.

### 5.2 Form Controls

Form controls include:

- Text and password inputs.
- Search fields.
- Selection controls.
- Numeric quantity inputs.
- Date inputs.
- Radio buttons and other choice controls.
- Optional remarks fields.

Controls should have understandable labels and sufficient space for entered content.

Validation messages should appear close to the relevant field.

### 5.3 Resource Cards

Resource cards provide a summary of available resources.

Relevant information includes:

- Resource image.
- Resource name.
- Owner club.
- Available quantity.
- Availability status.
- Action to view resource details.

The visual hierarchy should prioritise the resource identity and information necessary for an initial borrowing decision.

### 5.4 Resource Details

The Resource Details interface presents information needed before submitting a borrowing request.

Relevant components include:

- Resource images.
- Resource name and description.
- Owner information.
- Quantity and availability.
- Condition and storage location.
- Borrowing instructions.
- Primary borrowing action.

The selected resource should remain associated with the subsequent borrowing form.

### 5.5 Status Badges

Status badges communicate resource availability or borrowing progress.

Resource availability must be distinguished from the lifecycle status of a borrowing request.

Borrowing-request terminology is standardised as follows:

| Status | Description |
|---|---|
| Pending | Awaiting the resource owner's decision |
| Approved | Accepted, with the applicable quantity reserved |
| Rejected | Declined by the resource owner |
| Borrowed | Resource collected by the borrowing club |
| Return Pending | Return indicated and awaiting owner verification |
| Completed | Return verified and transaction completed |
| Cancelled | Request cancelled, with applicable reservations released |

An overdue indicator may be displayed where an active transaction exceeds its expected return date.

### 5.6 Navigation

Navigation should be consistent across related pages.

Club Management includes:

- Incoming Requests.
- Outgoing Requests.
- Events.
- Club Profile.

The active section should be identifiable, and clickable areas must correspond to their visible labels.

### 5.7 Account Menu

The account dropdown provides access to relevant account and club-management functions.

Its design should remain compact and readable, with logically grouped actions and predictable opening and dismissal behaviour.

### 5.8 Dialogs

Dialogs support actions requiring confirmation or additional information.

Examples include request cancellation, approval or rejection, resource-management actions and other consequential operations.

Dialog controls should distinguish the main action from cancellation or dismissal.

### 5.9 Feedback Components

Feedback components should communicate:

- Loading.
- Empty results.
- Input errors.
- Retrieval failures.
- Successful submissions.
- Restricted access.
- Unavailable resources.
- Completed transactions.

Feedback must reflect the actual application state rather than an assumed outcome.

---

## 6. Component States

### 6.1 Standard Interaction States

| State | Expected behaviour |
|---|---|
| Default | Normal appearance |
| Hover | Visible pointer interaction feedback |
| Focus | Clear keyboard-focus indication |
| Active | Feedback during interaction |
| Selected | Identifiable active option or navigation item |
| Disabled | Action unavailable and non-interactive |
| Loading | Operation in progress |
| Error | Clear explanation of an unsuccessful action or invalid input |
| Success | Confirmation of a completed action |

These state conventions apply to interactive frontend components. Not every state requires a separate Figma frame.

### 6.2 Designed Feedback States

The Figma design includes reference frames for:

- Marketplace loading skeleton.
- No search results.
- Resource retrieval error and retry.
- Inline borrowing-form validation.
- Request approval and rejection.
- Request cancellation confirmation.
- Profile-save feedback.
- Resource-save feedback.
- Event-save feedback.

These designs guide frontend implementation but are not substitutes for runtime testing.

### 6.3 State Consistency

Equivalent feedback conditions should use consistent language and appearance.

For example, loading indicators should communicate that an operation is processing, while submission confirmation should appear only after the application confirms success.

---

## 7. Icons and Imagery

### 7.1 Iconography

Icons should maintain consistent visual styling, scale and alignment.

Relevant uses include:

- Search and filtering.
- Navigation.
- Calendar and date selection.
- Account actions.
- Resource information.
- Status indicators.
- Confirmation and dismissal controls.

Existing frontend icon assets and components should be reused before additional visual patterns are introduced.

### 7.2 Resource Images

Resource imagery helps users distinguish listed equipment and assess its suitability.

Images should:

- Correspond to the selected resource.
- Maintain consistent presentation within resource cards.
- Avoid distortion.
- Preserve important content during cropping.
- Use appropriate alternative text in the implemented frontend.

### 7.3 Image Fallbacks

Unavailable resource images should be handled through an intentional fallback rather than broken or empty image elements.

Developer annotations and image-placeholder instructions should not be displayed as ordinary user-facing content.

### 7.4 Asset Management

Image resources are maintained within the project's existing asset directories, including:

- `src/assets/images/`
- `public/assets/`

Shared assets should be reused where appropriate to reduce duplication.

---

## 8. Page Specifications

### 8.1 Landing and Login

**Purpose:** Introduce EventPool and provide authenticated platform access.

**Principal elements:**

- EventPool branding.
- Introductory information.
- Login form.
- Authentication feedback.
- Relevant account-access guidance.

**Interaction behaviour:**

The interface should distinguish normal, loading, unsuccessful and restricted authentication states.

**Responsive behaviour:**

The mobile layout should preserve readable login controls and a clearly identifiable primary action.

### 8.2 Resource Marketplace

**Purpose:** Support discovery of shared resources.

**Principal elements:**

- Keyword search.
- Category filtering.
- Availability filtering.
- Location filtering.
- Resource cards.
- Resource availability indicators.

**Feedback states:**

The design includes loading, no-results and retrieval-error references.

**Responsive behaviour:**

Resource cards and filtering controls should adapt to narrower viewports without obscuring essential information.

### 8.3 Resource Details

**Purpose:** Provide detailed information about a selected resource.

**Principal elements:**

- Resource image.
- Resource name and description.
- Owner club.
- Condition and availability.
- Quantity information.
- Storage location.
- Borrowing instructions.
- Request to Borrow action.

**Interaction behaviour:**

The selected resource should remain associated with the borrowing form.

### 8.4 Borrowing Request

**Purpose:** Collect the information required for a club to request a resource.

**Principal elements:**

- Selected resource information.
- Associated event and purpose.
- Requested quantity.
- Borrow start or pickup date.
- Expected return date.
- Optional remarks.
- Relevant sustainability-related question.
- Submission and cancellation controls.

**Validation behaviour:**

Required fields, valid quantities, date relationships and applicable availability restrictions should be checked.

Submission confirmation should reflect the application's actual response.

### 8.5 Club Management

**Purpose:** Support club resource administration and borrowing activities.

**Principal sections:**

- Incoming Requests.
- Outgoing Requests.
- Events.
- Club Profile.

The design includes references for request details, approvals, rejections, cancellation, event management, profile editing and resource-management feedback.

Owner and borrower responsibilities should remain clearly distinguished.

### 8.6 Sustainability Dashboard

**Purpose:** Communicate resource-sharing activity and relevant sustainability indicators.

Relevant information may include:

- Completed borrowing transactions.
- Resources reused.
- Estimated purchases avoided.
- Estimated expenditure avoided.
- Other supported sustainability measures.

The Figma typography library includes dedicated dashboard KPI styles.

Measured activity should be distinguished from estimates, with assumptions explained where appropriate.

---

## 9. Interaction Patterns

### 9.1 Primary Borrower Journey

The principal borrower journey follows:

**Landing and Login → Resource Marketplace → Resource Details → Borrowing Request → Submission Confirmation**

Navigation should preserve the selected resource throughout the relevant stages.

### 9.2 Search and Filtering

Search and filtering should allow users to narrow resource listings without unnecessary navigation.

The interface should communicate active selections, matching results and empty-result conditions.

### 9.3 Form Validation

Forms should provide specific feedback for incomplete or invalid information.

Borrowing-form validation includes:

- Required information.
- Valid positive quantities.
- Applicable stock limits.
- Valid pickup and return dates.
- Prevention of invalid date relationships.

Client-side validation improves usability but does not replace backend checks.

### 9.4 Confirmation and Feedback

Consequential actions should provide appropriate confirmation or outcome feedback.

The application should distinguish between processing, successful completion and unsuccessful operations.

### 9.5 Navigation Consistency

Related interfaces should maintain predictable navigation placement and behaviour.

Transitions should avoid unnecessary visual movement or unexpected scrolling.

The implemented frontend should be evaluated independently from the Figma prototype.

---

## 10. Accessibility Standards

### 10.1 Colour Contrast

Text and interactive controls should maintain sufficient contrast against their backgrounds.

Relevant WCAG contrast requirements should guide implementation and validation.

### 10.2 Keyboard Navigation

Interactive controls should support appropriate keyboard operation and provide visible focus indicators.

### 10.3 Forms

Form fields should have descriptive labels, accessible error feedback and understandable validation messages.

### 10.4 Touch Interaction

Mobile controls should provide sufficiently large interactive areas and appropriate separation between adjacent actions.

### 10.5 Status Communication

Important statuses should be communicated through text and other appropriate visual cues rather than colour alone.

### 10.6 Responsive Accessibility

Responsive layouts should preserve readable content, meaningful navigation and accessible actions without unnecessary horizontal scrolling.

Accessibility compliance must be established through appropriate testing of the implemented application.

---

## 11. Design Tokens

### 11.1 Official CSS Tokens

The following colour tokens are defined in the current EventPool frontend theme.

```css
@theme {
  --font-sans: "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif;
  --font-serif: "Fraunces", ui-serif, Georgia, serif;
  --font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, monospace;

  --color-ep-bg: #FAF8F2;
  --color-ep-surface: #FFFFFF;
  --color-ep-sage: #DCE7D8;
  --color-ep-primary: #2D4A35;
  --color-ep-ink: #1F3626;
  --color-ep-border: #E5E2D9;
}
```

These tokens constitute the official shared theme baseline.

### 11.2 Typography Tokens

The Figma typography scale defines the approved reference values for headings, body text, interface labels and dashboard metrics.

Frontend typography should use shared styles or reusable values consistent with this scale rather than introducing arbitrary dimensions.

### 11.3 Component Tokens

Reusable styling values should be centralised where appropriate, including:

- Component spacing.
- Border radii.
- Button and input dimensions.
- Border treatments.
- Shadows.
- Responsive layout values.

Existing frontend definitions should be reused instead of duplicated.

### 11.4 Effects

The Figma design library includes named effect styles:

- Shadow.
- Modal.
- Dropdown.
- Card.

The corresponding frontend effects should maintain a consistent visual hierarchy and avoid unnecessary variation between equivalent components.

### 11.5 Token Governance

Changes to shared design tokens should be reviewed for their effect across the application.

Where Figma contains intentional local overrides, their purpose should be documented rather than silently replacing the official token values.

---

## 12. Figma-to-Code Handoff

### 12.1 Design and Implementation Sources

| Reference | Location |
|---|---|
| Figma design | [EventPool Figma](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool) |
| Application theme | `src/styles/theme.css` |
| Global stylesheet | `src/index.css` |
| Shared components | `src/components/` |
| Borrower-facing pages | `src/pages/borrower/` |
| Frontend handoff | `docs/design/frontend-handoff.md` |
| User flows | `docs/design/user-flows.md` |
| Design review | `docs/design/design-review.md` |

### 12.2 Component Mapping

| Interface or component | Frontend reference |
|---|---|
| Landing and Login | `src/pages/HomePage.tsx` |
| Authentication controls | `src/components/AuthModals.tsx` |
| Resource Marketplace | `src/pages/borrower/MarketplacePage.tsx` |
| Resource Details | `src/pages/borrower/ResourceDetailPage.tsx` |
| Borrowing Request | `src/pages/borrower/BorrowFormPage.tsx` |
| Club Management | `src/pages/borrower/MyClubPage.tsx` |
| Request Details | `src/pages/borrower/RequestDetailPage.tsx` |
| Navigation | `src/components/Navbar.tsx` |
| Resource cards | `src/components/ResourceCard.tsx` |
| Form fields | `src/components/FormField.tsx` |
| Status badges | `src/components/StatusBadge.tsx` |
| Feedback messages | `src/components/StatusMessage.tsx` |
| Confirmation dialogs | `src/components/ConfirmDialog.tsx` |

These paths identify existing implementation locations. The actual behaviour of individual components must be confirmed through code review and testing.

### 12.3 Mobile Design References

The Figma file contains mobile references for:

- [Landing and Login](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool?node-id=484-190)
- [Resource Marketplace](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool?node-id=484-210)
- [Resource Details](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool?node-id=484-231)
- [Borrowing Request](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool?node-id=484-250)
- [Club Management](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool?node-id=484-279)

These frames provide responsive design references. Actual mobile functionality and layout behaviour must be verified in the frontend.

### 12.4 Implementation Standards

Frontend development should:

1. Reuse existing shared components.
2. Apply the official theme tokens.
3. Preserve the established typography hierarchy.
4. Follow the approved Figma layout and interaction patterns.
5. Implement appropriate loading, error and success states.
6. Preserve correct navigation and resource context.
7. Support responsive layouts.
8. Record material deviations from the design.

### 12.5 Design Review

Interfaces should be compared against Figma before acceptance.

The review should consider visual hierarchy, typography, spacing, navigation, accessibility, responsive behaviour and interaction feedback.

Any significant differences should be documented in the relevant design review or development issue record.

---

## 13. Design Governance and Version Control

### 13.1 Source of Truth

The EventPool Figma file is the principal reference for approved visual design.

The GitHub repository contains the implemented frontend and supporting technical documentation.

The official frontend theme tokens establish the application's shared colour baseline.

### 13.2 Design Changes

Changes to common interface elements should be reviewed for their impact across relevant pages.

These include changes to:

- Brand colours.
- Typography.
- Shared components.
- Navigation patterns.
- Form behaviour.
- Status indicators.
- Responsive layouts.

Changes should be applied consistently rather than corrected independently on individual screens without considering the broader interface.

### 13.3 Documentation Maintenance

Approved design changes affecting shared standards should be reflected in this document.

Related frontend handoff, user-flow and design-review documentation should remain consistent with the updated design.

### 13.4 GitHub Workflow

Design-system updates should follow the project's established Git workflow.

Changes should be committed through an appropriate working branch and reviewed before integration, according to the repository's collaboration rules.

Significant updates should identify the affected interface, the nature of the change and any implementation implications.

### 13.5 Review Records

Design issues should be recorded with sufficient information to support reproduction and correction.

A review record should identify:

- The affected interface or component.
- The observed issue.
- The expected behaviour.
- Relevant design or implementation references.
- The proposed or implemented correction.
- The verification outcome.

### 13.6 Maintaining Consistency

The design system should evolve alongside the application.

Figma designs, CSS tokens, shared frontend components and supporting documentation should remain aligned as features are refined.

The objective is to maintain a cohesive, accessible and reliable resource-sharing experience across EventPool's interfaces.

---

## Conclusion

The EventPool design system establishes a unified visual and interaction framework based on the application's forest-green and warm-cream identity, shared typography, reusable components and responsive interface principles.

By adopting the existing frontend theme as the official colour baseline and maintaining consistency with the approved Figma design, the system provides a stable foundation for interface development and future maintenance.