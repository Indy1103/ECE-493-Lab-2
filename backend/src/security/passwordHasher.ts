import argon2 from "argon2";

export interface PasswordHasher {
  hash(password: string): Promise<string>;
  verify(hash: string, password: string): Promise<boolean>;
}

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return argon2.hash(password, { type: argon2.argon2id });
  }

  async verify(hash: string, password: string): Promise<boolean> {
    return argon2.verify(hash, password);
  }
}
