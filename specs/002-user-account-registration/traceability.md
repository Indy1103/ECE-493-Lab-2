# UC-02 Traceability

## Requirement to Test Mapping

- FR-004/FR-005/FR-011 -> `backend/tests/contract/publicRegistration.contract.spec.ts` (`201 REGISTERED`) and `backend/tests/integration/registration/registrationSuccess.spec.ts`
- FR-006/FR-007/FR-010/FR-012 -> `backend/tests/integration/registration/registrationValidationAndThrottle.spec.ts`
- FR-008/FR-009 -> `backend/tests/integration/registration/registrationDuplicateEmail.spec.ts`
- FR-013 -> `backend/tests/contract/publicRegistration.contract.spec.ts` (`429`) and `backend/tests/integration/registration/registrationValidationAndThrottle.spec.ts`
- FR-014/RAR-003 -> `backend/tests/integration/registration/registrationFailure.spec.ts`

## Security and Reliability Mapping

- SPR-001 -> `backend/tests/integration/security/registrationFoundationSecurity.spec.ts`
- SPR-003 -> `backend/tests/integration/security/registrationFoundationSecurity.spec.ts`
- RAR-001/RAR-002 -> `backend/tests/integration/reliability/registrationFoundationReliability.spec.ts`
- OBS-001/OBS-002/OBS-003 -> `backend/tests/integration/observability/registrationFoundationObservability.spec.ts`
