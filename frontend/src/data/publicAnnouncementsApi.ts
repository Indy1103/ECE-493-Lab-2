export interface PublicAnnouncement {
  id: string;
  title: string;
  content: string;
  publishStart: string;
  publishEnd: string | null;
}

export interface PublicAnnouncementsApiResponse {
  state: "AVAILABLE" | "EMPTY";
  announcements: PublicAnnouncement[];
  message: string;
}

export interface PublicAnnouncementsApiError {
  code: "ANNOUNCEMENTS_UNAVAILABLE";
  message: string;
  requestId: string;
}

export async function fetchPublicAnnouncements(
  baseUrl = ""
): Promise<PublicAnnouncementsApiResponse> {
  const response = await fetch(`${baseUrl}/api/public/announcements`, {
    headers: {
      Accept: "application/json"
    }
  });

  if (response.status === 503) {
    const errorPayload = (await response.json()) as PublicAnnouncementsApiError;
    throw new Error(errorPayload.message);
  }

  return (await response.json()) as PublicAnnouncementsApiResponse;
}
