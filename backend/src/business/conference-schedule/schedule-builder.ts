import type { AcceptedPaper, ConferenceScheduleEntry } from "./ports.js";

export class ConferenceScheduleBuilder {
  build(input: { conferenceId: string; acceptedPapers: AcceptedPaper[] }): ConferenceScheduleEntry[] {
    const base = Date.parse("2026-09-01T09:00:00.000Z");

    return [...input.acceptedPapers]
      .sort((left, right) => left.paperId.localeCompare(right.paperId))
      .map((paper, index) => {
        const start = new Date(base + index * 30 * 60 * 1000);
        const end = new Date(base + (index + 1) * 30 * 60 * 1000);

        return {
          paperId: paper.paperId,
          sessionCode: `S${String(index + 1).padStart(2, "0")}`,
          roomCode: `R${String((index % 3) + 1).padStart(2, "0")}`,
          startTime: start.toISOString(),
          endTime: end.toISOString()
        };
      });
  }
}
