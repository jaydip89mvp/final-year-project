import { createContext, useState, useEffect, useContext } from "react";
import API from "../api/axios";

export const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem("token");
            const storedUser = localStorage.getItem("user");

            if (token && storedUser) {
                try {
                    // Start with stored user data for immediate UI
                    setUser(JSON.parse(storedUser));
                    setIsAuthenticated(true);

                    // Optional: Verify token valid by making a profile call if needed
                    // const res = await API.get('/profile/me'); 
                    // setUser(res.data);
                } catch (error) {
                    console.error("Auth restoration failed", error);
                    logout();
                }
            }
            setLoading(false);
        };

        checkAuth();
    }, []);

    const login = async (email, password) => {
        try {
            const res = await API.post("/auth/login", { email, password });

            // Backend returns: { userId, name, email, role, token }
            const { token, userId, ...rest } = res.data.data;

            // Normalize to use _id for consistency with MongoDB
            const userObj = {
                _id: userId,
                userId, // Keep original just in case 
                ...rest
            };

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userObj));

            setUser(userObj);
            setIsAuthenticated(true);
            return { success: true };
        } catch (error) {
            console.error("Login error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Login failed"
            };
        }
    };

    const register = async (userDataPayload) => {
        try {
            const res = await API.post("/auth/register", userDataPayload);

            const { token, userId, ...rest } = res.data.data;
            // Normalize to use _id for consistency with MongoDB
            const userObj = {
                _id: userId,
                userId,
                ...rest
            };

            localStorage.setItem("token", token);
            localStorage.setItem("user", JSON.stringify(userObj));

            setUser(userObj);
            setIsAuthenticated(true);
            return { success: true };
        } catch (error) {
            console.error("Registration error:", error);
            return {
                success: false,
                message: error.response?.data?.message || "Registration failed"
            };
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
        setIsAuthenticated(false);
    };

    const updateUserProfile = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        localStorage.setItem("user", JSON.stringify(newUser));
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        updateUserProfile
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};