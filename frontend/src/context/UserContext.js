import { createContext, useContext, useState } from "react";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem("gym-user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const selectUser = (profile) => {
    setUser(profile);
    localStorage.setItem("gym-user", JSON.stringify(profile));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("gym-user");
  };

  return (
    <UserContext.Provider value={{ user, selectUser, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);
