import argon2 from "argon2";

export interface PasswordVerifier {
  verify(passwordHash: string, password: string): Promise<boolean>;
}

export class Argon2PasswordVerifier implements PasswordVerifier {
  async verify(passwordHash: string, password: string): Promise<boolean> {
    return argon2.verify(passwordHash, password);
  }
}
