import { useMemo, useState, type FormEvent } from "react";

import { assignRefereesAction, type AssignRefereesActionState } from "../../business/referee-assignments/assignRefereesAction.js";
import {
  getAssignmentOptions,
  type AssignmentOptionReferee
} from "../../data/referee-assignments/getAssignmentOptionsClient.js";

interface RefereeAssignmentPanelProps {
  paperId: string;
  onAssigned?: (result: Extract<AssignRefereesActionState, { state: "SUCCESS" }>) => void;
}

export function RefereeAssignmentPanel(props: RefereeAssignmentPanelProps): JSX.Element {
  const [options, setOptions] = useState<AssignmentOptionReferee[]>([]);
  const [selectedRefereeIds, setSelectedRefereeIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<AssignRefereesActionState | null>(null);
  const [loadMessage, setLoadMessage] = useState<string>("Loading assignment options...");
  const [loading, setLoading] = useState(false);

  const selectedCount = useMemo(() => selectedRefereeIds.length, [selectedRefereeIds]);

  async function loadOptions(): Promise<void> {
    setLoading(true);
    const result = await getAssignmentOptions(props.paperId);

    if (result.status === "SUCCESS") {
      setOptions(result.candidateReferees);
      setLoadMessage(`Loaded ${result.candidateReferees.length} referee options.`);
    } else {
      setOptions([]);
      setLoadMessage(result.message);
    }

    setLoading(false);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setLoading(true);

    const result = await assignRefereesAction(props.paperId, selectedRefereeIds);
    setFeedback(result);
    setLoading(false);

    if (result.state === "SUCCESS") {
      props.onAssigned?.(result);
      setSelectedRefereeIds([]);
      await loadOptions();
    }
  }

  function toggleSelection(refereeId: string): void {
    setSelectedRefereeIds((current) =>
      current.includes(refereeId)
        ? current.filter((item) => item !== refereeId)
        : [...current, refereeId]
    );
  }

  return (
    <section>
      <h2>Assign Referees</h2>
      <button type="button" onClick={() => void loadOptions()} disabled={loading}>
        Refresh Options
      </button>
      <p>{loadMessage}</p>

      <form onSubmit={onSubmit}>
        <ul>
          {options.map((referee) => (
            <li key={referee.refereeId}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedRefereeIds.includes(referee.refereeId)}
                  disabled={!referee.eligible || loading}
                  onChange={() => toggleSelection(referee.refereeId)}
                />
                {referee.displayName} ({referee.currentWorkload}/{referee.maxWorkload})
              </label>
            </li>
          ))}
        </ul>

        <p>Selected referees: {selectedCount}</p>
        <button type="submit" disabled={loading || selectedCount === 0}>
          Assign Selected Referees
        </button>
      </form>

      {feedback?.state === "SUCCESS" ? <p>{feedback.message}</p> : null}

      {feedback?.state === "VALIDATION_FAILED" ? (
        <ul>
          <li>{feedback.message}</li>
          {feedback.violations.map((violation) => (
            <li key={`${violation.rule}:${violation.refereeId ?? "none"}`}>{violation.message}</li>
          ))}
        </ul>
      ) : null}

      {feedback && feedback.state !== "SUCCESS" && feedback.state !== "VALIDATION_FAILED" ? (
        <p>{feedback.message}</p>
      ) : null}
    </section>
  );
}
