import { createContext, useContext, useState } from "react";

const UserContext = createContext();
const ANDREA_PROFILE = { id: "andrea", name: "Andrea", color: "#F59E0B" };

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("gym-user");
      const parsed = saved ? JSON.parse(saved) : ANDREA_PROFILE;
      return parsed?.id === "andrea" ? parsed : ANDREA_PROFILE;
    } catch {
      return ANDREA_PROFILE;
    }
  });

  const selectUser = (profile) => {
    setUser(profile);
    localStorage.setItem("gym-user", JSON.stringify(profile));
  };

  const logout = () => {
    setUser(ANDREA_PROFILE);
    localStorage.setItem("gym-user", JSON.stringify(ANDREA_PROFILE));
  };

  return (
    <UserContext.Provider value={{ user, selectUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
