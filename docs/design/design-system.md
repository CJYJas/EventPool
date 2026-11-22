
# EventPool Design System

## Overview

EventPool is a resource-sharing platform for student clubs at Universiti Malaya. The application enables authorised club representatives to discover resources, coordinate borrowing arrangements, manage club inventories and monitor resource-sharing activities through a centralised interface.

This design system establishes the visual, structural and interaction principles that guide the EventPool user interface. It provides a shared reference for implementing consistent, accessible and responsive experiences across the application.

The design system should be used alongside the [Figma design](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool), the existing frontend components and the application's stylesheet.

## Design Principles

### Clarity

Information should be presented according to its relevance to the user's current task. Resource availability, borrowing status and primary actions should be immediately identifiable without unnecessary visual complexity.

### Consistency

Components serving similar purposes should maintain consistent appearance and behaviour throughout the application. Shared interface patterns should be implemented as reusable components rather than independently styled elements.

### Usability

The interface should support straightforward navigation between resource discovery, borrowing requests and club-management functions. Important actions should provide clear visual feedback and predictable outcomes.

### Responsiveness

The interface should adapt to different viewport sizes without compromising readability or access to essential functions. Mobile layouts should prioritise content hierarchy and usability rather than simply scaling down desktop screens.

### Accessibility

Users should be able to identify interactive controls, read important information and understand system feedback without relying solely on colour, hover effects or visual assumptions.

## Visual Foundation

### Typography

Typography should establish a clear hierarchy between page titles, section headings, supporting information, form labels and status messages.

The application should use a consistent typeface and predictable variations in size, weight and spacing. Text should remain readable across desktop and mobile interfaces.

The approved values should follow the Figma design and existing frontend styling.

### Colour

The visual palette should distinguish:

- Application backgrounds and surfaces
- Primary and secondary text
- Interactive controls
- Borders and separators
- Selected navigation states
- Success and confirmation feedback
- Warnings and validation errors
- Disabled or unavailable content

Semantic colours should be used consistently. A status must also have a textual label so that its meaning does not depend on colour alone.

### Spacing and Alignment

Consistent spacing should be maintained between related elements. Cards, form fields, buttons and page sections should follow predictable alignment and spacing conventions.

Layouts should use reusable spacing values where appropriate, while remaining adaptable to different screen widths.

### Component Styling

Buttons, inputs, resource cards, dialogs and navigation elements should share consistent visual treatments.

The implementation should refer to the relevant Figma components and the existing frontend styles rather than introducing unrelated visual patterns.

## Navigation

EventPool's navigation should provide clear access to the features available to the authenticated user.

The main navigation should maintain a consistent structure across relevant application pages. Account-related actions should remain distinguishable from resource browsing and management actions.

Within Club Management, navigation includes:

- Incoming Requests
- Outgoing Requests
- Events
- Club Profile

Incoming Requests relate to resources owned by the current club. Outgoing Requests relate to borrowing requests submitted by the current club.

The active section should be visually identifiable. Navigation labels and interactive regions should remain aligned, with predictable transitions between views.

## Reusable Components

### Buttons

Primary buttons communicate the principal action available within an interface, such as initiating or submitting a borrowing request.

Secondary buttons support navigation and less prominent actions.

Button behaviour should account for:

- Default state
- Hover and keyboard focus
- Disabled state
- Processing or loading state
- Successful or unsuccessful action feedback

Destructive or consequential actions should provide appropriate safeguards or confirmation.

### Resource Cards

Resource cards summarise essential information about shared items.

A resource card should communicate the resource identity, ownership and availability, including the relevant image and quantity information where provided.

Selecting a resource should open its corresponding details. The clickable area must align with the visible card or action control.

### Availability Indicators

Resource availability should be distinguishable from the status of a borrowing transaction.

Availability indicators communicate whether an item can currently be requested, while request-status indicators describe the progress of a particular transaction.

Both should use clear, consistent labels.

### Forms

Forms should use visible field labels, appropriate input controls and understandable validation feedback.

Required fields should be distinguishable from optional information. Invalid inputs should display specific, actionable guidance.

Submission controls should prevent accidental repeated requests while an operation is processing.

### Dialogs and Menus

Dialogs and account menus should preserve a clear visual hierarchy and should not unnecessarily obscure important interface content.

Actions should be logically grouped, with consistent spacing and clear labels.

Menus should support predictable opening, dismissal and navigation behaviour.

### Feedback Components

The interface should provide appropriate feedback for:

- Loading operations
- Empty results
- Invalid input
- Failed requests
- Successful actions
- Restricted access
- Unavailable content

Feedback should accurately represent the current application state.

## Responsive Design

Desktop designs establish the broader information layout, while mobile reference designs demonstrate how essential content may be reorganised for narrower screens.

The available mobile design references use a 390-pixel-wide viewport.

Responsive implementation should ensure that:

1. Essential content remains visible and readable.
2. Multi-column arrangements adapt appropriately to smaller screens.
3. Resource cards preserve their important information.
4. Search, filtering and borrowing controls remain accessible.
5. Form labels and validation messages remain readable.
6. Interactive elements are suitable for touch input.
7. Unintended horizontal overflow is avoided.

Responsive design should preserve the intended user journey even where the arrangement of interface elements changes.

## Request Status Terminology

Borrowing requests use defined lifecycle states.

| Status | Description |
| --- | --- |
| Pending | Awaiting a decision from the resource owner |
| Approved | Accepted by the owner, with the applicable quantity reserved |
| Rejected | Declined by the resource owner |
| Borrowed | Resource collected by the borrowing club |
| Return Pending | Return indicated by the borrower and awaiting owner verification |
| Completed | Return verified and borrowing transaction completed |
| Cancelled | Request cancelled, with applicable reservations released |

An overdue indicator may accompany an active borrowing transaction whose expected return date has passed.

Request status and available resource quantity should reflect the authoritative application data.

## Accessibility and Interaction Standards

Interactive elements should provide:

- Meaningful text labels or accessible names
- Visible keyboard focus
- Appropriate contrast and readable text
- Clear feedback for errors and status changes
- Consistent navigation patterns
- Suitable interactive areas for touch input

Important actions should not depend exclusively on hover behaviour.

## Implementation References

The design system should remain consistent with the following project resources:

| Reference | Location |
| --- | --- |
| Figma design | [EventPool Figma](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool) |
| Application styles | `src/styles/theme.css` |
| Global styles | `src/index.css` |
| Shared interface components | `src/components/` |
| Borrower-facing pages | `src/pages/borrower/` |
| Design review | `docs/design/design-review.md` |

Where visual values or component behaviour differ between Figma and the implementation, the discrepancy should be reviewed and resolved rather than silently introducing additional styles.

This document provides the design principles and component conventions governing EventPool. The current Figma file and implemented styles should be consulted for exact visual specifications.
