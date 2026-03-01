import { fetchPublicAnnouncements } from "../data/publicAnnouncementsApi.js";

export async function loadPublicAnnouncements(baseUrl = "") {
  return fetchPublicAnnouncements(baseUrl);
}
