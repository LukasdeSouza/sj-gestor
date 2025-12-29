import { Button } from "@/components/ui/button";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { TOKEN_COOKIE_KEY, USER_COOKIE_KEY } from "@/constants/auth";

export default function LogoutButton({ variant = "ghost" as any }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    Cookies.remove(USER_COOKIE_KEY);
    Cookies.remove(TOKEN_COOKIE_KEY);
    navigate("/auth");
  };

  return (
    <Button variant={variant} onClick={handleLogout}>
      Sair
    </Button>
  );
}

