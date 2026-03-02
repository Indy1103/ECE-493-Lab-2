import { publicGet } from "./publicClient.js";

export interface RegistrationPrice {
  id: string;
  attendanceType: string;
  amount: number;
  currency: string;
}

export interface PublishedRegistrationPriceList {
  id: string;
  title: string;
  status: "PUBLISHED";
  publishedAt: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  prices: RegistrationPrice[];
}

export interface RegistrationPricesUnavailableError {
  code: "REGISTRATION_PRICES_UNAVAILABLE";
  message: string;
}

export async function fetchPublishedRegistrationPrices(
  baseUrl = ""
): Promise<
  | { state: "AVAILABLE"; priceList: PublishedRegistrationPriceList }
  | { state: "UNAVAILABLE"; message: string }
> {
  const response = await publicGet("/public/registration-prices", baseUrl);

  if (response.status === 404) {
    const payload =
      (await response.json()) as RegistrationPricesUnavailableError;

    return {
      state: "UNAVAILABLE",
      message: payload.message
    };
  }

  if (!response.ok) {
    throw new Error("Registration prices are temporarily unavailable. Please try again.");
  }

  const payload = (await response.json()) as PublishedRegistrationPriceList;

  return {
    state: "AVAILABLE",
    priceList: payload
  };
}
