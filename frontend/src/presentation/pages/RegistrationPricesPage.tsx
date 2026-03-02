import { useEffect, useState } from "react";

import {
  fetchPublishedRegistrationPrices,
  type PublishedRegistrationPriceList
} from "../../data/api/registrationPrices.js";

type RegistrationPricesViewState =
  | { status: "LOADING" }
  | { status: "AVAILABLE"; priceList: PublishedRegistrationPriceList }
  | { status: "UNAVAILABLE"; message: string }
  | { status: "ERROR"; message: string };

export function RegistrationPricesPage(): JSX.Element {
  const [viewState, setViewState] = useState<RegistrationPricesViewState>({
    status: "LOADING"
  });

  useEffect(() => {
    let active = true;

    void fetchPublishedRegistrationPrices()
      .then((result) => {
        if (!active) {
          return;
        }

        if (result.state === "UNAVAILABLE") {
          setViewState({ status: "UNAVAILABLE", message: result.message });
          return;
        }

        setViewState({ status: "AVAILABLE", priceList: result.priceList });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setViewState({
          status: "ERROR",
          message:
            "Registration prices are temporarily unavailable. Please try again."
        });
      });

    return () => {
      active = false;
    };
  }, []);

  if (viewState.status === "LOADING") {
    return <p>Loading registration prices...</p>;
  }

  if (viewState.status === "UNAVAILABLE" || viewState.status === "ERROR") {
    return <p>{viewState.message}</p>;
  }

  return (
    <section>
      <h1>Conference Registration Prices</h1>
      <h2>{viewState.priceList.title}</h2>
      <ul>
        {viewState.priceList.prices.map((price) => (
          <li key={price.id}>
            <span>{price.attendanceType}</span>
            <span> - </span>
            <span>
              {price.currency} {price.amount}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
