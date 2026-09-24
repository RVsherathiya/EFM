# Reporting & Analytics Engine

## 1. Metrics & Pure Calculations

1. **Billable Percentage**:
   $$
   \text{Billable \%} = \frac{\text{Approved Billable Hours}}{\text{Total Approved Hours}} \times 100
   $$

2. **Employee Utilisation Rate**:
   $$
   \text{Utilisation \%} = \frac{\text{Billable Hours}}{\text{Working Days} \times 8} \times 100
   $$

## 2. Supported Reports

- **Timesheet Detail Report**: Server-side paginated list of logged tasks with project, category, billable status, and date filters.
- **Project Effort Summary**: Aggregated hours, billable vs non-billable breakdown, and billable ratios per project.
- **Employee Utilisation Report**: Month-by-month utilisation percentage against 8h/day standard working capacity.
- **Category Breakdown**: Distribution of hours across Development, Testing, Design, Meetings, Documentation, Support, Training, Other.
- **Executive Billable Summary**: High-level KPI metrics card for organizational health.

## 3. CSV & Streaming Exports

All reports support streaming CSV downloads directly from the database aggregation pipelines with server-enforced visibility scopes.
