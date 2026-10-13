import {
  SESSION_KEY
} from "../context/AuthContext";


const AUTH_BASE_URL =
  import.meta.env.VITE_AUTH_API_BASE_URL;


function getAccessToken() {

  try {

    const session =
      JSON.parse(
        sessionStorage.getItem(
          SESSION_KEY
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

  if (!token) {
    throw new Error(
      "Authentication session has expired."
    );
  }


  const response =
    await fetch(
      `${AUTH_BASE_URL}${path}`,
      {
        ...options,

        headers: {
          "Content-Type":
            "application/json",

          Authorization:
            `Bearer ${token}`,

          ...(options.headers || {})
        }
      }
    );


  const data =
    await response
      .json()
      .catch(() => ({}));


  if (!response.ok) {

    throw new Error(
      data?.message ||
      `Request failed with status ${response.status}`
    );
  }


  return data;
}


export async function getAdminUsers() {

  return request(
    "/admin/users",
    {
      method: "GET"
    }
  );
}


export async function adminUserAction(
  email,
  action
) {

  return request(
    "/admin/users/action",
    {
      method: "POST",

      body: JSON.stringify({
        email,
        action
      })
    }
  );
}