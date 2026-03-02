import type { ConferenceCycle } from "../../data/manuscripts/conference-cycle.repository.js";

const REQUIRED_FIELDS = [
  "title",
  "abstract",
  "keywords",
  "fullAuthorList",
  "correspondingAuthorEmail",
  "primarySubjectArea"
] as const;

export class SubmissionMetadataPolicyService {
  getRequiredFields(): string[] {
    return [...REQUIRED_FIELDS];
  }

  buildRequirements(cycle: ConferenceCycle): {
    cycleId: string;
    intakeStatus: "OPEN" | "CLOSED";
    metadataPolicyVersion: string;
    requiredMetadataFields: string[];
    fileConstraints: { allowedMediaTypes: string[]; maxBytes: number };
  } {
    return {
      cycleId: cycle.id,
      intakeStatus: cycle.intakeStatus,
      metadataPolicyVersion: cycle.metadataPolicyVersion,
      requiredMetadataFields: this.getRequiredFields(),
      fileConstraints: {
        allowedMediaTypes: ["application/pdf"],
        maxBytes: 20 * 1024 * 1024
      }
    };
  }
}
