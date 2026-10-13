const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL;

async function request(path, options = {}) {
  if (!AUTH_BASE_URL) {
    throw new Error(
      "VITE_AUTH_API_BASE_URL is not configured."
    );
  }

  const response = await fetch(
    `${AUTH_BASE_URL}${path}`,
    {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    }
  );

  const data =
    await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data?.message ||
      `Request failed with status ${response.status}`
    );
  }

  return data;
}


export async function registerUser(data) {
  return request(
    "/auth/register",
    {
      method: "POST",
      body: JSON.stringify(data)
    }
  );
}


export async function loginUser(data) {
  return request(
    "/auth/login",
    {
      method: "POST",
      body: JSON.stringify(data)
    }
  );
}


export async function completeNewPassword(data) {
  return request(
    "/auth/new-password",
    {
      method: "POST",
      body: JSON.stringify(data)
    }
  );
}


export async function refreshAuth(data) {
  return request(
    "/auth/refresh",
    {
      method: "POST",
      body: JSON.stringify(data)
    }
  );
}


export async function requestPasswordReset(email) {
  return request(
    "/auth/password-reset/request",
    {
      method: "POST",
      body: JSON.stringify({
        email
      })
    }
  );
}


export async function confirmPasswordReset(data) {
  return request(
    "/auth/password-reset/confirm",
    {
      method: "POST",
      body: JSON.stringify(data)
    }
  );
}