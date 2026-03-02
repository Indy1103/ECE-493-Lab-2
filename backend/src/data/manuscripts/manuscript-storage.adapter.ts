export interface ManuscriptStorageAdapter {
  store(input: {
    authorId: string;
    requestId: string;
    filename: string;
    mediaType: string;
    byteSize: number;
    sha256Digest: string;
    contentBase64?: string;
  }): Promise<{ storageObjectKey: string }>;
}

interface InMemoryManuscriptStorageAdapterOptions {
  forceFailure?: boolean;
}

export class InMemoryManuscriptStorageAdapter implements ManuscriptStorageAdapter {
  private readonly forceFailure: boolean;

  constructor(options: InMemoryManuscriptStorageAdapterOptions = {}) {
    this.forceFailure = options.forceFailure ?? false;
  }

  async store(input: {
    authorId: string;
    requestId: string;
    filename: string;
    mediaType: string;
    byteSize: number;
    sha256Digest: string;
    contentBase64?: string;
  }): Promise<{ storageObjectKey: string }> {
    if (this.forceFailure) {
      throw new Error("storage unavailable");
    }

    return {
      storageObjectKey: `encrypted://${input.authorId}/${input.requestId}/${input.filename}`
    };
  }
}
