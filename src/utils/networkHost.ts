/**
 * Helper deteksi apakah aplikasi berjalan pada static hosting (GitHub Pages, dll.)
 * yang tidak memiliki backend Express `/api/*`.
 */
export function isStaticHosting(): boolean {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname || "";
  return /\.github\.io$/i.test(host) || window.location.protocol === "file:";
}

export async function safeApiFetch(input: string, init?: RequestInit): Promise<Response | null> {
  if (isStaticHosting()) {
    return null;
  }
  try {
    return await fetch(input, init);
  } catch {
    return null;
  }
}

let fetchGuardInstalled = false;

export function installStaticApiFetchGuard(): void {
  if (fetchGuardInstalled || typeof window === "undefined" || !isStaticHosting()) return;
  fetchGuardInstalled = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    try {
      const urlStr =
        typeof input === "string"
          ? input
          : input instanceof URL
          ? input.pathname
          : input && typeof (input as Request).url === "string"
          ? (input as Request).url
          : "";
      const isApiPath =
        urlStr.startsWith("/api/") ||
        urlStr.startsWith(window.location.origin + "/api/");
      if (isApiPath) {
        return Promise.resolve(
          new Response(JSON.stringify({ ok: false, staticHosting: true }), {
            status: 501,
            statusText: "Static Hosting",
            headers: { "Content-Type": "application/json" }
          })
        );
      }
    } catch {
      // fallback to native fetch
    }
    return nativeFetch(input, init);
  };
}
