export function installFetchMock(
  handler: (url: string, init?: RequestInit) => Response | Promise<Response>,
) {
  async function fetchMock(input: RequestInfo | URL, init?: RequestInit) {
    return handler(String(input), init);
  }
  fetchMock.preconnect = () => undefined;
  globalThis.fetch = fetchMock;
}
