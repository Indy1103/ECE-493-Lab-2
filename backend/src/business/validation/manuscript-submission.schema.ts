import { z } from "zod";

export const SubmissionMetadataSchema = z
  .object({
    title: z.string().min(1),
    abstract: z.string().min(1),
    keywords: z.array(z.string().min(1)).min(1),
    fullAuthorList: z.array(
      z
        .object({
          name: z.string().min(1),
          affiliation: z.string().optional()
        })
        .strict()
    ),
    correspondingAuthorEmail: z.string().email(),
    primarySubjectArea: z.string().min(1)
  })
  .strict();

export const ManuscriptFileSchema = z
  .object({
    filename: z.string().min(1),
    mediaType: z.string().min(1),
    byteSize: z.number().int().nonnegative(),
    sha256Digest: z.string().min(1),
    contentBase64: z.string().optional()
  })
  .strict();

export const ManuscriptSubmissionRequestSchema = z
  .object({
    metadata: SubmissionMetadataSchema,
    manuscriptFile: ManuscriptFileSchema
  })
  .strict();

export const ManuscriptViolationSchema = z.object({
  field: z.string(),
  rule: z.string(),
  message: z.string()
});

export const ManuscriptValidationErrorResponseSchema = z.object({
  code: z.literal("VALIDATION_FAILED"),
  message: z.string(),
  violations: z.array(ManuscriptViolationSchema)
});

export const ManuscriptErrorResponseSchema = z.object({
  code: z.string(),
  message: z.string()
});

export const ManuscriptSuccessResponseSchema = z.object({
  submissionId: z.string(),
  status: z.literal("SUBMITTED"),
  message: z.string()
});
