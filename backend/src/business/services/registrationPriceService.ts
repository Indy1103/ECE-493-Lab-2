import type {
  RegistrationPriceListRow,
  RegistrationPriceRepository
} from "../../data/repositories/registrationPriceRepository.js";
import {
  PublishedRegistrationPriceListSchema,
  type PublishedRegistrationPriceList
} from "../validation/registrationPriceValidation.js";

export interface RegistrationPriceService {
  getPublishedRegistrationPrices(): Promise<RegistrationPriceResult>;
}

export type RegistrationPriceResult =
  | {
      state: "AVAILABLE";
      message: string;
      priceList: PublishedRegistrationPriceList;
    }
  | {
      state: "UNAVAILABLE";
      message: string;
    };

export class RegistrationPriceRetrievalError extends Error {
  constructor() {
    super("Registration price retrieval failed.");
    this.name = "RegistrationPriceRetrievalError";
  }
}

function mapPublishedPriceList(
  record: RegistrationPriceListRow
): PublishedRegistrationPriceList {
  return PublishedRegistrationPriceListSchema.parse({
    id: record.id,
    title: record.title,
    status: record.status,
    publishedAt: record.publishedAt.toISOString(),
    effectiveFrom: record.effectiveFrom
      ? record.effectiveFrom.toISOString().slice(0, 10)
      : null,
    effectiveTo: record.effectiveTo
      ? record.effectiveTo.toISOString().slice(0, 10)
      : null,
    prices: record.prices
  });
}

export class DefaultRegistrationPriceService implements RegistrationPriceService {
  constructor(private readonly repository: RegistrationPriceRepository) {}

  async getPublishedRegistrationPrices(): Promise<RegistrationPriceResult> {
    try {
      const published = await this.repository.getPublishedPriceList();

      if (!published) {
        return {
          state: "UNAVAILABLE",
          message: "Registration prices are currently unavailable."
        };
      }

      return {
        state: "AVAILABLE",
        message: "Registration prices available.",
        priceList: mapPublishedPriceList(published)
      };
    } catch (error) {
      if (error instanceof RegistrationPriceRetrievalError) {
        throw error;
      }

      throw new RegistrationPriceRetrievalError();
    }
  }
}

export { mapPublishedPriceList };
