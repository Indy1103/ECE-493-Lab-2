import { useState } from "react";

import {
  loadEditableSchedule,
  submitEditableSchedule
} from "../../business/schedule/scheduleEditFacade.js";
import type { ScheduleEntryDto } from "../../data/mappers/scheduleMapper.js";

interface ScheduleEditorViewProps {
  conferenceId: string;
}

export function ScheduleEditorView(props: ScheduleEditorViewProps): JSX.Element {
  const [scheduleId, setScheduleId] = useState("");
  const [entries, setEntries] = useState<ScheduleEntryDto[]>([]);
  const [status, setStatus] = useState("Idle");
  const [errors, setErrors] = useState<string[]>([]);

  async function onLoad(): Promise<void> {
    const schedule = await loadEditableSchedule(props.conferenceId);
    setScheduleId(schedule.scheduleId);
    setEntries(schedule.entries);
    setStatus(`Loaded ${schedule.status}`);
    setErrors([]);
  }

  async function onSubmit(): Promise<void> {
    const result = await submitEditableSchedule(props.conferenceId, {
      scheduleId,
      entries
    });

    if (!result.ok) {
      setErrors(result.errors);
      setStatus("Validation failed");
      return;
    }

    setEntries(result.schedule.entries);
    setStatus(`Saved ${result.schedule.status}`);
    setErrors([]);
  }

  return (
    <section>
      <h2>Schedule Editor</h2>
      <button type="button" onClick={() => void onLoad()}>
        Load Schedule
      </button>
      <button type="button" onClick={() => void onSubmit()} disabled={!scheduleId}>
        Save Final Schedule
      </button>
      <p role="status">{status}</p>
      {errors.length > 0 ? (
        <ul>
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : null}
      <p>Entries: {entries.length}</p>
    </section>
  );
}
