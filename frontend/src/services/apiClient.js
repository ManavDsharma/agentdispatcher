export const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8001";


function getAccessToken() {

  try {

    const session =
      JSON.parse(
        sessionStorage.getItem(
          "l1d_auth_session"
        ) || "null"
      );

    return session?.accessToken || null;

  } catch {

    return null;
  }
}


async function request(
  path,
  options = {}
) {

  const token =
    getAccessToken();


  const headers = {
    ...(options.headers || {})
  };


  if (token) {
    headers.Authorization =
      `Bearer ${token}`;
  }


  const response =
    await fetch(
      `${BASE_URL}${path}`,
      {
        ...options,
        headers
      }
    );


  if (!response.ok) {

    // FastAPI puts the human-readable reason in `detail`; keep it on the
    // error so callers can show it, without changing the default message.
    const body =
      await response
        .json()
        .catch(() => null);

    const error = new Error(
      `Request to ${path} failed with status ${response.status}`
    );

    error.status = response.status;

    error.detail =
      typeof body?.detail === "string"
        ? body.detail
        : null;

    throw error;
  }


  return response.json();
}


export async function apiGet(path) {

  return request(
    path,
    {
      method: "GET"
    }
  );
}


// multipart upload: the browser sets the Content-Type (with the boundary)
// itself, so no Content-Type header is passed here.
export async function apiPostForm(
  path,
  formData
) {

  return request(
    path,
    {
      method: "POST",
      body: formData
    }
  );
}


export async function apiPost(path) {

  return request(
    path,
    {
      method: "POST"
    }
  );
}


export async function apiPatch(
  path,
  body
) {

  return request(
    path,
    {
      method: "PATCH",

      headers: {
        "Content-Type":
          "application/json"
      },

      body:
        JSON.stringify(body)
    }
  );
}