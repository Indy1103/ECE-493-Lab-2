export async function publicGet(
  path: string,
  baseUrl = ""
): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    method: "GET",
    headers: {
      Accept: "application/json"
    }
  });
}
