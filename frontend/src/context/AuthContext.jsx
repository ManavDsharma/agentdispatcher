import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

import {
  loginUser,
  completeNewPassword as completeNewPasswordApi,
  refreshAuth
} from "../services/authService";


const AuthContext =
  createContext(null);

export const SESSION_KEY =
  "l1d_auth_session";


function loadSession() {
  try {
    const raw =
      sessionStorage.getItem(
        SESSION_KEY
      );

    return raw
      ? JSON.parse(raw)
      : null;
  } catch {
    return null;
  }
}


function saveSession(session) {
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(session)
  );
}


function clearSession() {
  sessionStorage.removeItem(
    SESSION_KEY
  );
}


export function AuthProvider({
  children
}) {

  const [
    session,
    setSession
  ] = useState(loadSession);


  useEffect(() => {

    if (session) {
      saveSession(session);
    } else {
      clearSession();
    }

  }, [session]);


  async function login(
    email,
    password
  ) {

    const result =
      await loginUser({
        email,
        password
      });


    if (
      result.challenge ===
      "NEW_PASSWORD_REQUIRED"
    ) {

      return {
        requiresNewPassword: true,
        username:
          result.username,
        challengeSession:
          result.session,
        user:
          result.user
      };
    }


    const nextSession = {
      accessToken:
        result.accessToken,

      idToken:
        result.idToken,

      refreshToken:
        result.refreshToken,

      expiresIn:
        result.expiresIn,

      user:
        result.user
    };


    setSession(nextSession);

    return {
      requiresNewPassword: false,
      user:
        result.user
    };
  }


  async function completeNewPassword(
    username,
    challengeSession,
    newPassword
  ) {

    const result =
      await completeNewPasswordApi({
        username,
        session:
          challengeSession,
        newPassword
      });


    const nextSession = {
      accessToken:
        result.accessToken,

      idToken:
        result.idToken,

      refreshToken:
        result.refreshToken,

      expiresIn:
        result.expiresIn,

      user:
        result.user
    };


    setSession(nextSession);

    return result;
  }


  async function refresh() {

    if (
      !session?.refreshToken ||
      !session?.user?.email
    ) {
      return false;
    }


    try {

      const result =
        await refreshAuth({
          refreshToken:
            session.refreshToken,

          username:
            session.user.email
        });


      setSession({
        ...session,

        accessToken:
          result.accessToken,

        idToken:
          result.idToken,

        expiresIn:
          result.expiresIn,

        user:
          result.user ||
          session.user
      });


      return true;

    } catch {

      logout();

      return false;
    }
  }


  function logout() {

    setSession(null);
  }


  const value =
    useMemo(
      () => ({
        session,

        user:
          session?.user || null,

        isAuthenticated:
          Boolean(session?.accessToken),

        isAdmin:
          session?.user?.cognitoGroup ===
          "DTP_OPERATE_AGENT_ADMIN",

        login,

        completeNewPassword,

        refresh,

        logout
      }),
      [session]
    );


  return (
    <AuthContext.Provider
      value={value}
    >
      {children}
    </AuthContext.Provider>
  );
}


export function useAuth() {

  const context =
    useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}