
# EventPool Frontend Design Handoff

## Purpose

This document describes the interface structure, interaction expectations and responsive considerations for implementing the EventPool borrower experience.

The borrower experience allows an authorised club representative to access the platform, discover shared resources, review resource information and submit borrowing requests.

The document should be read together with the approved Figma design, project requirements and existing frontend implementation.

**Design:** [EventPool Figma](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool)

## Application Structure

The borrower journey consists of the following principal interfaces:

| Interface | Purpose | Implementation reference |
| --- | --- | --- |
| Landing and Login | Introduce the platform and provide authenticated access | `src/pages/HomePage.tsx`, `src/components/AuthModals.tsx` |
| Resource Marketplace | Discover, search and filter shared resources | `src/pages/borrower/MarketplacePage.tsx` |
| Resource Details | Review information about a selected resource | `src/pages/borrower/ResourceDetailPage.tsx` |
| Borrowing Request | Submit a borrowing request for a selected resource | `src/pages/borrower/BorrowFormPage.tsx` |
| Club Management | Review club-related borrowing and management activities | `src/pages/borrower/MyClubPage.tsx` |
| Request Details | Display information about an individual borrowing request | `src/pages/borrower/RequestDetailPage.tsx` |

The listed files identify existing implementation locations. Their presence does not independently establish that all intended behaviour has been completed.

## Landing and Login

### Interface Purpose

The landing interface introduces EventPool and provides a clear entry point for authorised club representatives.

It should communicate the platform's resource-sharing purpose without overwhelming users with unnecessary information.

### Interaction Requirements

The interface should provide:

- A clearly identifiable login action
- Understandable authentication feedback
- An appropriate processing state during login
- Error handling for unsuccessful authentication
- An explanation when access is restricted
- Predictable redirection after successful authentication

Authentication results and permissions must follow the application's authoritative access-control rules.

### Responsive Considerations

The mobile layout should preserve the platform identity, introductory information and primary login action.

Text and interactive controls should remain readable without horizontal scrolling or clipped content.

## Resource Marketplace

### Interface Purpose

The marketplace enables users to discover resources offered by participating student clubs.

It should support efficient browsing and provide enough information for users to identify potentially suitable resources.

### Resource Listings

Resource cards should display the relevant available information, such as:

- Resource image and name
- Owner club
- Resource category
- Available quantity
- Availability status

Users should be able to select a listing to access its corresponding resource details.

### Search and Filtering

The marketplace should support:

- Keyword search
- Category filtering
- Availability filtering
- Storage-location filtering

Search and filters should be combinable where appropriate. The selected criteria should remain understandable and users should be able to clear or modify them.

The application should handle empty results, loading states and unsuccessful retrieval without leaving users uncertain about the outcome.

### Navigation

Selecting a resource must open the correct resource details rather than an unrelated static page.

Where practical, returning from the details page should preserve the user's previous marketplace context.

### Responsive Considerations

Resource cards should reorganise appropriately for narrow screens.

Search and filter controls should remain accessible without obstructing the resource catalogue.

## Resource Details

### Interface Purpose

The Resource Details interface enables the user to assess the suitability and availability of a selected resource before requesting it.

### Information Requirements

The interface should display the information relevant to the selected resource, including where available:

- Resource name and image
- Owner club
- Resource description
- Available quantity
- Condition and availability
- Storage location
- Relevant borrowing instructions

The primary borrowing action should remain clearly identifiable.

### Interaction Requirements

The user should be able to:

1. Review the resource information.
2. Understand whether the resource is currently available for borrowing.
3. Proceed to the Borrowing Request interface.
4. Return to resource discovery.

The selected resource must be carried into the borrowing form without requiring the user to select it again.

Resource availability should reflect current application data rather than static values from the design.

### Responsive Considerations

Images, descriptions and action controls should adapt to a narrow layout.

The primary borrowing action should remain accessible and visually distinguishable from secondary navigation.

## Borrowing Request

### Interface Purpose

The borrowing form collects the information necessary for a club to request a resource from another club.

### Form Information

The interface should capture the information required by the approved requirements and data model, including:

- Selected resource
- Requested quantity
- Event name or purpose
- Pickup date
- Expected return date

Additional fields, where present in the approved design, should be aligned with the corresponding backend data requirements.

### Validation

| Field or action | Expected behaviour |
| --- | --- |
| Required information | Prevent submission when mandatory fields are missing |
| Quantity | Accept valid positive whole numbers |
| Available quantity | Check the request against applicable availability limits |
| Pickup date | Accept a valid date according to the application's booking rules |
| Return date | Prevent a return date earlier than pickup |
| Submission | Prevent repeated submissions while processing |

Validation feedback should identify the affected input and explain how it can be corrected.

Client-side checks support usability but do not replace backend validation.

### Submission Behaviour

The interface should:

1. Validate the entered information.
2. Display a processing state while the request is being submitted.
3. Show understandable feedback if submission fails.
4. Preserve relevant entered values when retrying is appropriate.
5. Display confirmation only after the request has been accepted by the application.
6. Represent the newly submitted request as Pending, where confirmed by the backend.

Submitting a request does not constitute approval by the resource owner.

### Responsive Considerations

On smaller screens, form controls should follow a logical vertical reading order.

Labels, validation messages and the submission action should remain visible and usable without unintended horizontal overflow.

## Club Management and Borrowing Activities

Club Management should distinguish clearly between requests received by the current club and requests submitted to other clubs.

The navigation includes Incoming Requests, Outgoing Requests, Events and Club Profile.

Shared navigation should remain consistent across related views. Each action should open the intended interface, and the active section should be identifiable.

Any scrolling behaviour should preserve access to essential navigation and prevent unexpected movement of navigation controls.

The treatment of incoming requests and owner decisions must remain consistent with the applicable club permissions.

## Shared Interface Components

The frontend implementation should reuse common components where appropriate.

Relevant existing component locations include:

| Component | Implementation reference |
| --- | --- |
| Navigation | `src/components/Navbar.tsx` |
| Application layout | `src/components/Layout.tsx` |
| Buttons | `src/components/Button.tsx` |
| Resource cards | `src/components/ResourceCard.tsx` |
| Resource images | `src/components/ResourceImage.tsx` |
| Form fields | `src/components/FormField.tsx` |
| Status indicators | `src/components/StatusBadge.tsx` |
| Status messages | `src/components/StatusMessage.tsx` |
| Empty and loading states | `src/components/StateBlocks.tsx` |
| Confirmation dialogs | `src/components/ConfirmDialog.tsx` |

Existing components should be reviewed for suitability before introducing duplicate implementations.

## State and Feedback Requirements

The interface should provide appropriate visual feedback for:

- Loading operations
- Empty search results
- Missing resource information
- Unavailable resources
- Invalid form input
- Unsuccessful submissions
- Successful actions
- Restricted access

Request states and inventory availability must be displayed accurately.

User feedback should be based on confirmed application outcomes rather than assumed success.

## Responsive Design References

The Figma file contains mobile reference frames with a width of 390 pixels.

These references demonstrate the intended arrangement of content at a narrow viewport and should be considered alongside the desktop designs.

They are not substitutes for responsive testing of the implemented application.

Responsive verification should assess:

- Text readability
- Resource-card layout
- Search and filtering controls
- Form-field accessibility
- Navigation behaviour
- Status and validation messages
- Horizontal overflow
- Preservation of essential functionality

## Design Verification Checklist

- [ ] Shared components follow consistent styling.
- [ ] Navigation reaches the intended interfaces.
- [ ] Resource cards display the correct resource information.
- [ ] Search and filtering function as intended.
- [ ] Resource selection opens the corresponding details.
- [ ] The borrowing form retains the selected resource.
- [ ] Quantity and date validation provide appropriate feedback.
- [ ] Loading, error and empty states are understandable.
- [ ] Request submission provides an accurate result.
- [ ] Resource availability and request status are represented correctly.
- [ ] Relevant interfaces remain usable at mobile viewport sizes.
- [ ] Deviations from the approved design are documented and reviewed.

Unchecked items indicate verification activities; they should not be interpreted as confirmed defects.

## Design References

- [EventPool Figma Design](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool)
- [Marketplace Design](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool?node-id=41-296)
- [Resource Details Design](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool?node-id=42-528)
- [Club Management Design](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool?node-id=58-155)
- [Outgoing Requests Design](https://www.figma.com/design/23MNiaHbaB5D2D630kSCIh/PM---EventPool?node-id=332-323)

The Figma file provides the visual reference, while the application requirements and backend contracts determine authoritative functional behaviour.
