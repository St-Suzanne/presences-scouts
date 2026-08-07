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

export async function fetchData(apiUrl, onRequest, onResponse) {
  onRequest(`GET ${apiUrl}`);
  onResponse("Attente de la réponse...");

  const response = await fetch(apiUrl);
  const result = await parseJsonResponse(response);
  onResponse(formatApiResponse(response, result));

  if (!result) {
    throw new Error("La réponse ne contient pas de JSON exploitable.");
  }

  return result;
}

export async function submitData(apiUrl, payload, onRequest, onResponse) {
  onRequest(`POST ${apiUrl}\n\n${JSON.stringify(payload, null, 2)}`);
  onResponse("Attente de la réponse...");

  const response = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = await parseJsonResponse(response);
  onResponse(formatApiResponse(response, result));

  if (!result) {
    throw new Error("La réponse ne contient pas de JSON exploitable.");
  }

  return result;
}
