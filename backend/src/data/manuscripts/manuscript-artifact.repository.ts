import { randomUUID } from "node:crypto";

export interface ManuscriptArtifactRecord {
  id: string;
  storageObjectKey: string;
  mediaType: string;
  byteSize: number;
  sha256Digest: string;
  uploadedAt: Date;
}

export interface ManuscriptArtifactRepository {
  createArtifact(input: Omit<ManuscriptArtifactRecord, "id" | "uploadedAt">): Promise<ManuscriptArtifactRecord>;
  removeArtifact(id: string): Promise<void>;
  getAll(): ManuscriptArtifactRecord[];
  snapshot(): ManuscriptArtifactRecord[];
  restore(snapshot: ManuscriptArtifactRecord[]): void;
}

export class InMemoryManuscriptArtifactRepository implements ManuscriptArtifactRepository {
  private readonly artifacts = new Map<string, ManuscriptArtifactRecord>();

  async createArtifact(
    input: Omit<ManuscriptArtifactRecord, "id" | "uploadedAt">
  ): Promise<ManuscriptArtifactRecord> {
    const artifact: ManuscriptArtifactRecord = {
      id: randomUUID(),
      uploadedAt: new Date(),
      ...input
    };

    this.artifacts.set(artifact.id, artifact);
    return artifact;
  }

  async removeArtifact(id: string): Promise<void> {
    this.artifacts.delete(id);
  }

  getAll(): ManuscriptArtifactRecord[] {
    return Array.from(this.artifacts.values());
  }

  snapshot(): ManuscriptArtifactRecord[] {
    return this.getAll().map((artifact) => ({ ...artifact }));
  }

  restore(snapshot: ManuscriptArtifactRecord[]): void {
    this.artifacts.clear();
    for (const artifact of snapshot) {
      this.artifacts.set(artifact.id, { ...artifact });
    }
  }
}
