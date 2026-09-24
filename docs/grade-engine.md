# Pure Domain Grade Engine & Calibration

The Grade Engine is a pure, isolated domain module (`server/src/domain/grade-engine/grade.engine.ts`).

## 1. Weighted Score Formula

$$
\text{Criterion Score \%} = \frac{\text{Rating (1-5)}}{5} \times \text{Criterion Weight \%}
$$

### Default Reviewer Weights:
- **Self Review**: 10%
- **Senior Manager**: 50%
- **Project Manager**: 40%

$$
\text{Final Score \%} = (0.10 \times \text{Self\%}) + (0.50 \times \text{Senior\%}) + (0.40 \times \text{PM\%})
$$

### Missing Self-Review Redistribution:
If an employee fails to submit their self-review before the deadline, the 10% weight is proportionally redistributed between Senior (50/90) and PM (40/90).

## 2. Priority Grade Rules Matrix

| Priority | Grade | Score Band | Condition Requirements |
|:---:|:---:|:---:|---|
| 1 | **A+** | $\ge 95\%$ | No criterion $< 4$, 0 missed deadlines, PM exceptional contribution required. |
| 2 | **A** | $90 - 94.99\%$ | No criterion $< 4$, max 1 missed deadline. |
| 3 | **A-** | $85 - 89.99\%$ | No criterion $< 3$. |
| 4 | **B+** | $80 - 84.99\%$ | No criterion $< 3$. |
| 5 | **B** | $75 - 79.99\%$ | Maximum 1 criterion $< 3$. |
| 6 | **B-** | $70 - 74.99\%$ | Maximum 2 criteria $< 3$, Quality of Work $\ge 3$. |
| 7 | **C+** | $65 - 69.99\%$ | Quality of Work $\ge 2$. |
| 8 | **C** | $60 - 64.99\%$ | Self review submitted OR Senior justification provided. |
| 9 | **C-** | $< 60\%$ | Below 60% or fallback if no higher rule matches. |

## 3. Calibration & Anomaly Flags

1. **Self vs Senior Gap Flag**: Triggered if $|\text{Self Rating} - \text{Senior Rating}| > 1.5$ on any single criterion.
2. **Senior vs PM Discrepancy Flag**: Triggered if the grade step difference between Senior and PM ratings is $\ge 2$ grade steps (e.g. Senior rates A, PM rates B-).
3. **HR Approval Sign-Off**: Mandatory for `A+` and `C-` grades.
4. **HR Overrides**: Mandatory audit reason required for any grade change.
