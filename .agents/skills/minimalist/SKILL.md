---
name: minimalist
description: >-
  Use this skill whenever writing, refactoring, designing, or reviewing code in
  this project to ensure zero unnecessary lines, prevent over-engineering or
  premature abstractions, and strictly adhere to DRY (Don't Repeat Yourself)
  principles.
---

# Minimalist & DRY Code Standard

This skill establishes strict coding standards for the project: write the minimum amount of clear, idiomatic code necessary to solve the problem completely, correctly, and maintainably.

---

## 1. Zero Unnecessary Lines

Every line of code must justify its existence.

- **No Dead Code**: Never leave unused functions, dead branches, obsolete variables, or unreachable code.
- **No Speculative Code**: Do not write code for hypothetical scenarios, unused parameters, or future features.
- **No Comment Bloat**: Do not write comments that restate what the code clearly does. Code should be self-documenting through precise naming. Only document non-obvious business logic or algorithmic rationale.
- **No Unused Imports**: Keep imports minimal and strictly scoped to what is actively executed.
- **Inline Single-Use Intermediates**: Avoid assigning single-use temporary variables unless naming is crucial for clarity in complex expressions.

---

## 2. No Over-Engineering (YAGNI & Simplicity)

Build the simplest thing that solves the actual problem.

- **Functions Over Deep Classes**: Use plain functions and standard data structures (`dict`, `list`, `tuple`, `set`) instead of bloated OOP hierarchies, custom container classes, or factory patterns unless state and behavior genuinely require encapsulation.
- **Use Standard Library First**: Leverage Python's rich standard library (e.g., `statistics`, `math`, `csv`, `json`, `collections`, `pathlib`) rather than writing custom algorithms or pulling in heavy external dependencies.
- **Avoid Premature Abstraction**: Do not create generalized frameworks or utility wrappers for one-off operations. Abstract only after patterns emerge naturally across multiple concrete use-cases.
- **Flat Over Nested**: Keep call stacks shallow and avoid deeply nested conditionals, callback chains, or excessive wrapper functions.

---

## 3. Strict DRY (Don't Repeat Yourself)

Never write the same logic twice.

- **Single Source of Truth**: Core domain logic—such as grade boundaries, GPA calculations, validation rules, and file formatting—must be defined in exactly one place.
- **Parameterize Variations**: If two routines differ only by a constant, operator, or field, unify them into a single concise function with a parameter.
- **Centralize Constants**: Keep configuration, thresholds, and magic numbers in a single constant structure rather than scattering raw literals across files.
- **Consolidate Validations**: Validate data at boundaries (ingestion/input) once rather than repeating defensive validation checks throughout downstream functions.

---

## 4. Idiomatic Python Practices

Write concise, expressive Python:

- Use comprehensions (`[x for x in ...]`, `{k: v for ...}`) where clean and readable; avoid imperative accumulator loops.
- Use built-in aggregation functions (`sum()`, `min()`, `max()`, `any()`, `all()`, `statistics.mean()`) instead of manual summation or loop-based counters.
- Use context managers (`with open(...) as f:`) for resource management.
- Use `pathlib.Path` for file path operations.

---

## 5. Verification Checklist

Before finalizing any code change, verify:

1. [ ] Can any line or block be deleted without altering correctness?
2. [ ] Is any logic, formula, or string literal duplicated?
3. [ ] Are there unnecessary abstractions, layers, or boilerplate classes?
4. [ ] Are all imports, variables, and parameters actively used?
5. [ ] Does this directly and simply solve the user's requirement without extra fluff?
