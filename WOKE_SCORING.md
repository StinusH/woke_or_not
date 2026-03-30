# Woke Scoring

## Purpose
The old score formula averaged most factors together and then added a small legacy/canon bonus. That diluted titles where one on-screen factor was dominant. A movie with very strong identity-driven themes but little direct political dialogue could land too low because the average flattened the signal.

The current model fixes that by:

- separating **core content** from **context**
- making the strongest core factor matter much more than the weaker ones
- keeping context additive, but capped
- treating creator track record as supporting evidence, not primary evidence

## Factor Taxonomy
The scoring system uses exactly these seven canonical factors.

### Core Bucket
- `Representation / casting choices`
- `Political / ideological dialogue`
- `Identity-driven story themes`
- `Institutional / cultural critique`

### Context Bucket
- `Legacy character or canon changes`
- `Public controversy / woke complaints`
- `Creator track record context`

Notes:

- Core factors describe what the audience experiences in the work itself.
- Context factors describe surrounding support, backlash, or framing.
- `Creator track record context` is intentionally weaker than the other two context factors.

## Formula
1. Clamp every factor to `0-100`.
2. Sort the 4 core scores from highest to lowest.
3. Compute the core score:

```text
core = highest * 0.70
     + second * 0.20
     + third * 0.07
     + fourth * 0.03
```

4. Compute the context bonus:

```text
context_bonus = round((public_controversy + legacy_canon + creator_track_record * 0.5) / 10)
context_bonus = min(context_bonus, 25)
```

5. Final score:

```text
final = clamp(round(core + context_bonus), 0, 100)
```

## Worked Examples
### `80, 0, 0, 0` core and no context
- Core sort: `80, 0, 0, 0`
- Core score: `80 * 0.70 = 56`
- Context bonus: `0`
- Final score: `56`

### High identity themes, low political dialogue
- Core inputs:
  - Representation `25`
  - Political dialogue `5`
  - Identity themes `80`
  - Institutional critique `10`
- Sorted core: `80, 25, 10, 5`
- Core score: `56 + 5 + 0.7 + 0.15 = 61.85`
- Rounded core: `62`
- With no context bonus, final score: `62`

This is the main behavior change from the old average-based model.

### Weak core but high creator track record
- Core inputs: `5, 5, 5, 5`
- Core score: `5`
- Context:
  - Controversy `0`
  - Legacy `0`
  - Creator `100`
- Context bonus: `round(50 / 10) = 5`
- Final score: `10`

This is intentional. Creator history can support the case, but it should not define the case by itself.

### Strong controversy plus legacy boost
- Core inputs: `40, 35, 20, 10`
- Sorted core: `40, 35, 20, 10`
- Core score: `28 + 7 + 1.4 + 0.3 = 36.7`
- Rounded core: `37`
- Context:
  - Controversy `90`
  - Legacy `80`
  - Creator `40`
- Context bonus: `round((90 + 80 + 20) / 10) = 19`
- Final score: `56`

## Guardrails
- Context can raise the score, but should not define it by itself.
- Creator context is supporting evidence, not primary evidence.
- Unknown factor labels are invalid until normalized.
- Missing canonical factors are filled with `0` during normalization.
- Legacy aliases are normalized into canonical labels before scoring.

## Implementation Notes
- Canonical factor metadata and alias normalization live in `src/lib/woke-factors.ts`.
- The scoring formula lives in `src/lib/woke-score.ts`.
- AI prompt instructions in `src/lib/admin-ai-prompt.ts` must stay aligned with the formula and canonical factor list.
- AI parsing and local score recomputation in `src/lib/admin-ai-response.ts` use the same canonical normalization path.
- Admin-draft normalization and payload construction live in `src/lib/admin-title-draft.ts`.
- Admin UI enforcement of the fixed seven factors lives in `src/components/admin-title-form.tsx`.
- Validation for canonical factor order and labels lives in `src/lib/validation.ts`.

## Test Coverage
The formula is protected by unit tests that cover:

- dominant single-core-factor cases
- creator half-weight behavior
- context cap at `25`
- alias normalization
- unknown-label rejection
- AI response recalculation against the local formula
- admin-form score mismatch behavior
