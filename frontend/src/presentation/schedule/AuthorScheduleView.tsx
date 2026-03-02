import { useState } from "react";

import {
  getAuthorScheduleView,
  type AuthorScheduleViewState
} from "../../business/schedule/authorScheduleFacade.js";

export function AuthorScheduleView(): JSX.Element {
  const [state, setState] = useState<AuthorScheduleViewState | null>(null);
  const [loading, setLoading] = useState(false);

  async function onLoadSchedule(): Promise<void> {
    setLoading(true);
    setState(await getAuthorScheduleView());
    setLoading(false);
  }

  return (
    <section>
      <h2>Final Conference Schedule</h2>
      <button type="button" disabled={loading} onClick={() => void onLoadSchedule()}>
        View Final Schedule
      </button>

      {state?.state === "VISIBLE" ? (
        <article>
          <p>Conference: {state.schedule.conferenceId}</p>
          <p>Status: {state.schedule.status}</p>
          <h3>Your Presentation Details</h3>
          <ul>
            {state.schedule.authorPresentations.map((entry) => (
              <li key={`${entry.paperId}:${entry.timeSlotId}`}>
                Paper {entry.paperId} at {entry.timeSlotId} in room {entry.roomId}
              </li>
            ))}
          </ul>
        </article>
      ) : null}

      {state?.state === "UNPUBLISHED" ? <p role="status">{state.message}</p> : null}
      {state?.state === "ERROR" ? <p role="status">{state.message}</p> : null}
    </section>
  );
}
