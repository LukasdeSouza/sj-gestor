import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Cookies from "js-cookie";
import { AUTH_REDIRECT_PATH, TOKEN_COOKIE_KEY, USER_COOKIE_KEY } from "@/constants/auth";

type Options = {
  redirectTo: string;
  condition: "if-authenticated" | "if-unauthenticated";
};

export function useAuthRedirect({ redirectTo, condition }: Options) {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const hasToken = Boolean(Cookies.get(TOKEN_COOKIE_KEY));

    if (condition === "if-authenticated" && hasToken) {
      navigate(redirectTo, { replace: true, state: { from: location.pathname } });
      return;
    }

    if (condition === "if-unauthenticated" && !hasToken) {
      Cookies.remove(TOKEN_COOKIE_KEY);
      Cookies.remove(USER_COOKIE_KEY);
      const target = redirectTo || AUTH_REDIRECT_PATH;
      navigate(target, { replace: true, state: { from: location.pathname } });
    }
  }, [condition, redirectTo, navigate, location]);
}
