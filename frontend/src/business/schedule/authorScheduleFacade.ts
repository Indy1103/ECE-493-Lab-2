import { getAuthorSchedule } from "../../data/api/authorScheduleApi.js";
import {
  mapAuthorScheduleResultToViewState,
  type AuthorScheduleViewState
} from "../../data/mappers/authorScheduleMapper.js";

export type { AuthorScheduleViewState } from "../../data/mappers/authorScheduleMapper.js";

export async function getAuthorScheduleView(baseUrl = ""): Promise<AuthorScheduleViewState> {
  const result = await getAuthorSchedule(baseUrl);
  return mapAuthorScheduleResultToViewState(result);
}
