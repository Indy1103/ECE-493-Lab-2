import type {
  CreateSubmissionOutcome,
  SubmissionRequirementsOutcome
} from "../domain/manuscript-submission.js";
import type { ConferenceCycleRepository } from "../../data/manuscripts/conference-cycle.repository.js";
import type { ManuscriptSubmissionRepository } from "../../data/manuscripts/manuscript-submission.repository.js";
import type { ManuscriptArtifactRepository } from "../../data/manuscripts/manuscript-artifact.repository.js";
import { SubmissionMetadataPolicyService } from "./submission-metadata-policy.service.js";
import {
  mapMetadataValidationViolations,
  parseSubmissionBody
} from "./submission-metadata-validation.service.js";
import { ManuscriptFileValidationService } from "./manuscript-file-validation.service.js";
import { normalizeManuscriptTitle } from "./title-normalization.service.js";
import { SubmissionDeduplicationService } from "./submission-deduplication.service.js";
import { SubmissionHandoffService } from "./submission-handoff.service.js";
import { ManuscriptSubmissionObservabilityService } from "../observability/manuscript-submission-observability.service.js";

interface SubmitManuscriptServiceDeps {
  conferenceCycleRepository: ConferenceCycleRepository;
  submissionRepository: ManuscriptSubmissionRepository;
  artifactRepository: ManuscriptArtifactRepository;
  metadataPolicyService: SubmissionMetadataPolicyService;
  fileValidationService: ManuscriptFileValidationService;
  deduplicationService: SubmissionDeduplicationService;
  handoffService: SubmissionHandoffService;
  observabilityService: ManuscriptSubmissionObservabilityService;
  nowProvider?: () => Date;
}

export class SubmitManuscriptService {
  private readonly nowProvider: () => Date;

  constructor(private readonly deps: SubmitManuscriptServiceDeps) {
    this.nowProvider = deps.nowProvider ?? (() => new Date());
  }

  async getRequirements(authorId: string | null): Promise<SubmissionRequirementsOutcome> {
    if (!authorId) {
      return { outcome: "INTAKE_CLOSED" };
    }

    const cycle = await this.deps.conferenceCycleRepository.getActiveCycle();
    if (cycle.intakeStatus === "CLOSED") {
      return { outcome: "INTAKE_CLOSED" };
    }

    const requirements = this.deps.metadataPolicyService.buildRequirements(cycle);
    return {
      outcome: "REQUIREMENTS",
      ...requirements
    };
  }

  async submit(input: {
    authorId: string;
    requestId: string;
    sourceIp: string;
    body: unknown;
  }): Promise<CreateSubmissionOutcome> {
    const startedAt = Date.now();

    const parsedBody = parseSubmissionBody(input.body);
    const cycle = await this.deps.conferenceCycleRepository.getActiveCycle();

    if (cycle.intakeStatus === "CLOSED") {
      await this.deps.observabilityService.recordAttempt({
        authorId: input.authorId,
        submissionId: null,
        requestId: input.requestId,
        outcome: "INTAKE_CLOSED",
        reasonCode: "INTAKE_CLOSED"
      });
      this.deps.observabilityService.observeLatencyMs(Date.now() - startedAt);
      return {
        outcome: "INTAKE_CLOSED",
        code: "INTAKE_CLOSED",
        message: "Submission intake is closed for the active cycle."
      };
    }

    if (parsedBody.violations.length > 0) {
      await this.deps.observabilityService.recordAttempt({
        authorId: input.authorId,
        submissionId: null,
        requestId: input.requestId,
        outcome: "METADATA_INVALID",
        reasonCode: "VALIDATION_FAILED"
      });
      this.deps.observabilityService.observeLatencyMs(Date.now() - startedAt);
      return {
        outcome: "VALIDATION_FAILED",
        code: "VALIDATION_FAILED",
        message: "Metadata validation failed.",
        violations: parsedBody.violations
      };
    }

    const policyFields = this.deps.metadataPolicyService.getRequiredFields();
    const metadataViolations = mapMetadataValidationViolations({
      metadata: parsedBody.metadata,
      requiredFields: policyFields
    });

    if (metadataViolations.length > 0) {
      await this.deps.observabilityService.recordAttempt({
        authorId: input.authorId,
        submissionId: null,
        requestId: input.requestId,
        outcome: "METADATA_INVALID",
        reasonCode: "VALIDATION_FAILED"
      });
      this.deps.observabilityService.observeLatencyMs(Date.now() - startedAt);
      return {
        outcome: "VALIDATION_FAILED",
        code: "VALIDATION_FAILED",
        message: "Metadata validation failed.",
        violations: metadataViolations
      };
    }

    const snapshots = {
      submissions: this.deps.submissionRepository.snapshot(),
      artifacts: this.deps.artifactRepository.snapshot(),
      audits: this.deps.observabilityService.snapshot()
    };

    try {
      const fileValidation = await this.deps.fileValidationService.validateAndStore({
        authorId: input.authorId,
        requestId: input.requestId,
        manuscriptFile: parsedBody.manuscriptFile
      });

      if (!fileValidation.valid) {
        await this.deps.observabilityService.recordAttempt({
          authorId: input.authorId,
          submissionId: null,
          requestId: input.requestId,
          outcome: fileValidation.outcome === "VALIDATION_FAILED" ? "FILE_INVALID" : "FILE_INVALID",
          reasonCode: fileValidation.outcome
        });
        this.deps.observabilityService.observeLatencyMs(Date.now() - startedAt);

        if (fileValidation.outcome === "FILE_TOO_LARGE") {
          return {
            outcome: "FILE_TOO_LARGE",
            code: "FILE_TOO_LARGE",
            message: fileValidation.message
          };
        }

        if (fileValidation.outcome === "FILE_TYPE_NOT_ALLOWED") {
          return {
            outcome: "FILE_TYPE_NOT_ALLOWED",
            code: "FILE_TYPE_NOT_ALLOWED",
            message: fileValidation.message
          };
        }

        return {
          outcome: "VALIDATION_FAILED",
          code: "VALIDATION_FAILED",
          message: fileValidation.message,
          violations: fileValidation.violations ?? []
        };
      }

      const artifact = await this.deps.artifactRepository.createArtifact({
        storageObjectKey: fileValidation.storageObjectKey,
        mediaType: fileValidation.mediaType,
        byteSize: fileValidation.byteSize,
        sha256Digest: fileValidation.sha256Digest
      });

      const deduped = await this.deps.deduplicationService.createSingleWinner({
        authorId: input.authorId,
        conferenceCycleId: cycle.id,
        normalizedTitle: normalizeManuscriptTitle(parsedBody.metadata.title),
        metadataPolicyVersion: cycle.metadataPolicyVersion,
        manuscriptArtifactId: artifact.id,
        metadata: parsedBody.metadata,
        now: this.nowProvider()
      });

      if (deduped.duplicate || !deduped.submission) {
        this.deps.artifactRepository.restore(snapshots.artifacts);
        this.deps.submissionRepository.restore(snapshots.submissions);

        await this.deps.observabilityService.recordAttempt({
          authorId: input.authorId,
          submissionId: null,
          requestId: input.requestId,
          outcome: "DUPLICATE_REJECTED",
          reasonCode: "DUPLICATE_ACTIVE_SUBMISSION"
        });
        this.deps.observabilityService.observeLatencyMs(Date.now() - startedAt);
        return {
          outcome: "DUPLICATE",
          code: "DUPLICATE_ACTIVE_SUBMISSION",
          message: "A duplicate active submission already exists for this title."
        };
      }

      await this.deps.handoffService.handoff(deduped.submission.id);

      await this.deps.observabilityService.recordAttempt({
        authorId: input.authorId,
        submissionId: deduped.submission.id,
        requestId: input.requestId,
        outcome: "SUCCESS",
        reasonCode: "SUBMISSION_ACCEPTED"
      });
      this.deps.observabilityService.observeLatencyMs(Date.now() - startedAt);

      return {
        outcome: "SUCCESS",
        submissionId: deduped.submission.id,
        status: "SUBMITTED",
        message: "Manuscript submitted successfully."
      };
    } catch {
      this.deps.submissionRepository.restore(snapshots.submissions);
      this.deps.artifactRepository.restore(snapshots.artifacts);
      this.deps.observabilityService.restore(snapshots.audits);

      await this.deps.observabilityService.recordAttempt({
        authorId: input.authorId,
        submissionId: null,
        requestId: input.requestId,
        outcome: "OPERATIONAL_FAILED",
        reasonCode: "OPERATIONAL_FAILURE"
      });
      this.deps.observabilityService.observeLatencyMs(Date.now() - startedAt);

      return {
        outcome: "OPERATIONAL_FAILURE",
        code: "OPERATIONAL_FAILURE",
        message: "Submission could not be completed. Please retry."
      };
    }
  }
}
