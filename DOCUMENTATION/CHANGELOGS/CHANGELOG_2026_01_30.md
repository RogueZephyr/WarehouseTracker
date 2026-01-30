# Changelog - 2026-01-30 (v2)

## [2.0.0] - 2026-01-30

### Enhanced Loading Logistics & Mobile Optimization

This release focuses on improving the accuracy of missing items tracking, introducing contextual status badges (N/A & FND), and ensuring a premium, responsive experience across all devices.

#### Added
- **Logistics Badges**: Toggleable **N/A** (Not Available) and **FND** (Facturado no despachado) markers for loads, aiding in complex inventory tracking.
- **Mobile Card View**: Responsive shift in `LoadGroupDetailModal` that replaces technical tables with touch-friendly cards on small screens.
- **Horizontal Stats Scroll**: Support for horizontal scrolling in the group header to ensure stats remain accessible on narrow devices.

#### Changed
- **Missing Items Split**: Separated **Quantity** and **ID/Name** inputs for missing items in `LoadDetailModal`.
- **Accurate Quantity Parsing**: Implemented logic to parse and sum units from format-rich strings (e.g., "4x Item" now correctly counts as 4 units).
- **Badge Contextualization**: Relocated N/A and FND toggles to the **Missing Items** section to clarify their relationship to logistics discrepancies.
- **Touch Targets**: Increased padding and size for buttons and inputs across all modals for better mobile usability.
- **Improved Auto-Fill**: Marking a load as "Complete" now uses the accurately parsed missing total to calculate `Loaded Qty`.

#### Fixed
- **Missing Items Count**: Resolved issue where the system only counted the number of missing entries instead of the total quantity of items per entry.
- **Layout Overlaps**: Fixed text and button overlap issues on very narrow mobile screens.

---

### Commit Message Preview

```text
feat: warehouse tracking refinements v2

- Implement quantity parsing for missing items (e.g., "4x Item" = 4)
- Add N/A and FND badges with dedicated toggles in Missing Items section
- Implement responsive mobile card view for group client lists
- Optimize touch targets and layouts for mobile responsiveness
- Update auto-fill logic to use parsed missing totals
- Enhance backend persistence for new N/A and FND states
```
