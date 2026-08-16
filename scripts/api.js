function formatApiResponse(response, result) {
  const payloadText = result ? JSON.stringify(result, null, 2) : "Aucune charge JSON dans la reponse.";
  return `HTTP ${response.status} ${response.statusText}\n${payloadText}`;
}

async function parseJsonResponse(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function serializePayload(payload) {
  if (payload && typeof payload === "object" && payload.postData && typeof payload.postData.contents === "string") {
    return payload.postData.contents;
  }

  return JSON.stringify(payload ?? {});
}

async function submit(apiUrl, payload) {
  await fetch(apiUrl, {
    method: "POST",
    mode: "no-cors",
    headers: {
      "Content-Type": "text/plain;charset=UTF-8"
    },
    body: serializePayload(payload)
  });

  return {
    response: {
      status: 0,
      statusText: "No CORS",
      type: "opaque"
    },
    result: {
      status: "success",
      count: payload.presences?.length || 0,
      transport: "no-cors"
    }
  };
}

export async function fetchData(apiUrl, onRequest, onResponse, password) {
  const url = password ? `${apiUrl}?password=${encodeURIComponent(password)}` : apiUrl;
  onRequest(`GET ${url}`);
  onResponse("Attente de la réponse...");

  const response = await fetch(url);
  const result = await parseJsonResponse(response);
  onResponse(formatApiResponse(response, result));

  if (!result) {
    throw new Error("La réponse ne contient pas de JSON exploitable.");
  }

  return result;
}

export async function submitData(apiUrl, payload, onRequest, onResponse) {
  onRequest(`POST ${apiUrl}\n\n${serializePayload(payload)}`);
  onResponse("Envoi des données...");

  const responseData = await submit(apiUrl, payload);

  const { response, result } = responseData;
  onResponse(formatApiResponse(response, result));

  if (!result) {
    throw new Error("La réponse ne contient pas de JSON exploitable.");
  }

  return result;
}
