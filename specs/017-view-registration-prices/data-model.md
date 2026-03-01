# Data Model: View Registration Prices

## Entities

### RegistrationPriceList

- **id**: UUID (PK)
- **title**: string
- **status**: enum (`DRAFT`, `PUBLISHED`, `ARCHIVED`)
- **publishedAt**: timestamp (nullable when not published)
- **effectiveFrom**: date (nullable)
- **effectiveTo**: date (nullable)
- **createdAt**: timestamp
- **updatedAt**: timestamp

**Rules**:
- Only one `PUBLISHED` price list may exist at a time.
- A `PUBLISHED` list must have `publishedAt` set.

### RegistrationPrice

- **id**: UUID (PK)
- **priceListId**: UUID (FK → RegistrationPriceList.id)
- **attendanceType**: string (e.g., `student`, `regular`, `virtual`)
- **amount**: decimal
- **currency**: string (ISO 4217 code)
- **createdAt**: timestamp
- **updatedAt**: timestamp

**Rules**:
- Each `RegistrationPrice` must belong to a `RegistrationPriceList`.
- A published list must include at least one `RegistrationPrice` entry.

## Relationships

- **RegistrationPriceList 1 ── * RegistrationPrice**

## Access Notes

- Read access to `PUBLISHED` lists is public (no authentication required).
- Write access is restricted to privileged roles (outside UC-17 scope).
