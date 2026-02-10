## Question 1 

Recommended: Option A - A single canonical draft per author per in-progress submission is the safest
  default for consistency and simplest recovery semantics under concurrent saves.

  | Option | Description |
  |--------|-------------|
  | A | Maintain exactly one current draft per (author, in-progress submission); each save overwrites
  current state and optionally records internal revision history. |
  | B | Allow multiple named drafts per in-progress submission and let author choose which draft is
  current. |
  | C | Save each request as an immutable new draft version and compute “latest” by timestamp/version
  on resume. |
  | Short | Provide a different short answer (<=5 words). |

  You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or
  "recommended", or provide your own short answer.

  ## Response
  
  A

  ## Question 2
  Recommended: Option A - Draft save should validate only provided fields plus a minimal draft
  baseline, so authors can incrementally save without being forced into final-submission completeness
  too early.

  | A | Draft save validates provided fields and enforces only minimal draft-required fields (not full
  final-submission completeness). |
  | B | Draft save enforces the same full validation rules as final submission. |
  | C | Draft save skips validation and stores any payload. |
  | Short | Provide a different short answer (<=5 words). |

  You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or
  "recommended", or provide your own short answer.

  ## Question 3 
  ecommended: Option A - Draft save should validate only provided fields plus a minimal draft
  baseline, so authors can incrementally save without being forced into final-submission completeness
  too early.

  | A | Draft save validates provided fields and enforces only minimal draft-required fields (not full
  final-submission completeness). |
  | B | Draft save enforces the same full validation rules as final submission. |
  | C | Draft save skips validation and stores any payload. |
  | Short | Provide a different short answer (<=5 words). |

  You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or
  "recommended", or provide your own short answer.

  ## Question 4 
  • Recommended: Option B - Last-write-wins with timestamp/version update is the most practical draft-
  save behavior for UX, while still requiring deterministic state and no corruption.

  | Option | Description |
  |--------|-------------|
  | A | Reject second concurrent save with conflict error; author must retry manually. |
  | B | Deterministic last-write-wins for concurrent valid saves, with audit trail of each attempt. |
  | C | First-write-wins; later concurrent saves are dropped with warning. |
  | Short | Provide a different short answer (<=5 words). |

  You can reply with the option letter (e.g., "A"), accept the recommendation by saying "yes" or
  "recommended", or provide your own short answer.

