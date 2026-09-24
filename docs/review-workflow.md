# Appraisal Review Workflow State Machine

The review cycle transitions follow a strict business state machine:

```
[DRAFT]
   | (Cycle Open)
   v
[SELF_PENDING] --------(Autosave Draft)
   |
   | (Submit Self Review)
   v
[SELF_SUBMITTED]
   |
   | (Transition to Senior)
   v
[SENIOR_PENDING] <--------------+ (Send Back - Max 1x)
   |                            |
   | (Submit Senior Rating)     |
   v                            |
[SENIOR_SUBMITTED]              |
   |                            |
   v                            |
[PM_PENDING] -------------------+
   |
   | (Submit PM Rating)
   v
[PM_SUBMITTED]
   |
   | (Calculate Grade via GradeEngine)
   v
[GRADE_CALCULATED]
   |
   | (HR Calibration Override if needed)
   v
[PUBLISHED]
   |
   +-----> [ACKNOWLEDGED] (Employee accepts)
   |
   +-----> [DISPUTED] (Employee raises dispute -> HR resolution)
```

## Key Business Rules

1. **BR-REVIEW-001**: Review ownership is preserved across manager changes; historical reviews stay with the historical evaluator.
2. **BR-REVIEW-002**: Project Managers can send back a review to the Senior Manager at most 1 time with mandatory reason.
3. **BR-REVIEW-004**: Any score of 1, 2, or 5 requires a mandatory comment justification on both frontend and backend.
4. **BR-REVIEW-005**: Extreme grades (`A+` and `C-`) require mandatory HR Admin sign-off before publishing.
5. **BR-REVIEW-006**: Employees cannot see Senior or PM ratings until the review status is `PUBLISHED`.
