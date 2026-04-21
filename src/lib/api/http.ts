import { ApiError } from "@/lib/api/errors";

type HttpOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

async function parseBody(response: Response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    return await response.text();
  } catch {
    return null;
  }
}

export async function http<TResponse>(
  input: string,
  options: HttpOptions = {},
): Promise<TResponse> {
  const { body, headers, ...rest } = options;

  const response = await fetch(input, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const parsed = await parseBody(response);

  if (!response.ok) {
    const messageFromPayload =
      parsed && typeof parsed === "object" && "error" in parsed
        ? String((parsed as { error?: unknown }).error || "")
        : "";

    throw new ApiError(
      messageFromPayload || `Request failed with status ${response.status}`,
      response.status,
      parsed,
    );
  }

  return parsed as TResponse;
}
