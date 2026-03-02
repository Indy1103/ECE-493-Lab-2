import { useEffect, useState } from "react";

import type { PublicAnnouncement } from "../../data/publicAnnouncementsApi.js";
import { loadPublicAnnouncements } from "../../business/loadPublicAnnouncements.js";

type ViewState =
  | { status: "LOADING" }
  | { status: "AVAILABLE"; announcements: PublicAnnouncement[]; message: string }
  | { status: "EMPTY"; message: string }
  | { status: "RETRIEVAL_FAILURE"; message: string };

export function PublicAnnouncementsPage(): JSX.Element {
  const [viewState, setViewState] = useState<ViewState>({ status: "LOADING" });

  useEffect(() => {
    let active = true;

    void loadPublicAnnouncements()
      .then((response) => {
        if (!active) {
          return;
        }

        if (response.state === "EMPTY") {
          setViewState({ status: "EMPTY", message: response.message });
          return;
        }

        setViewState({
          status: "AVAILABLE",
          announcements: response.announcements,
          message: response.message
        });
      })
      .catch(() => {
        if (!active) {
          return;
        }

        setViewState({
          status: "RETRIEVAL_FAILURE",
          message:
            "Conference announcements are temporarily unavailable. Please try again."
        });
      });

    return () => {
      active = false;
    };
  }, []);

  if (viewState.status === "LOADING") {
    return <p>Loading announcements...</p>;
  }

  if (viewState.status === "RETRIEVAL_FAILURE") {
    return <p>{viewState.message}</p>;
  }

  if (viewState.status === "EMPTY") {
    return <p>{viewState.message}</p>;
  }

  return (
    <section>
      <h1>Conference Announcements</h1>
      <p>{viewState.message}</p>
      <ul>
        {viewState.announcements.map((announcement) => (
          <li key={announcement.id}>
            <article>
              <h2>{announcement.title}</h2>
              <p>{announcement.content}</p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
