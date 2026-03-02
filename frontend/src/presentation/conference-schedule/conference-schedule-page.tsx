import { useState } from "react";

import {
  generateConferenceScheduleUseCase,
  type ConferenceScheduleViewState
} from "../../business/conference-schedule/generate-conference-schedule.use-case.js";

interface ConferenceSchedulePageProps {
  conferenceId: string;
}

export function ConferenceSchedulePage(props: ConferenceSchedulePageProps): JSX.Element {
  const [state, setState] = useState<ConferenceScheduleViewState | null>(null);
  const [loading, setLoading] = useState(false);

  async function onGenerate(): Promise<void> {
    setLoading(true);
    setState(await generateConferenceScheduleUseCase(props.conferenceId));
    setLoading(false);
  }

  return (
    <section>
      <h2>Conference Schedule</h2>
      <button type="button" disabled={loading} onClick={() => void onGenerate()}>
        Generate Schedule
      </button>

      {state?.state === "GENERATED" ? (
        <article>
          <p>Conference: {state.conferenceId}</p>
          <p role="status">Entries: {state.entries.length}</p>
        </article>
      ) : null}

      {state?.state === "NO_ACCEPTED_PAPERS" ? <p role="status">{state.message}</p> : null}
      {state?.state === "ERROR" ? <p role="status">{state.message}</p> : null}
    </section>
  );
}
