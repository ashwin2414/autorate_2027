import { useEffect, useState } from "react";
import { getUser } from "./api";

export const notifyAuth = () => window.dispatchEvent(new Event("autorate-auth"));

export function useAuth() {
  const [user, setUser] = useState(getUser());
  useEffect(() => {
    const refreshUser = () => setUser(getUser());
    window.addEventListener("autorate-auth", refreshUser);
    return () => window.removeEventListener("autorate-auth", refreshUser);
  }, []);
  return user;
}
