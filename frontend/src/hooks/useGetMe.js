import { useEffect, useState } from "react";
import { useAuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const useGetMe = () => {
    const { setAuthUser } = useAuthContext();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const getMe = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/auth/me`, {
                    credentials: "include", // Important to send cookies
                });
                
                // If unauthorized (e.g. cookie expired), don't throw, just clear user
                if (!res.ok) {
                    if (res.status === 401 || res.status === 403) {
                         localStorage.removeItem("chat-user");
                         setAuthUser(null);
                         return;
                    }
                    else throw new Error("Failed to fetch user data");
                }

                const data = await res.json();
                if (data.error) throw new Error(data.error);

                // Update context and local storage with fresh data
                localStorage.setItem("chat-user", JSON.stringify(data));
                setAuthUser(data);
                
            } catch (error) {
                console.error("Auth sync error:", error.message);
                // Optional: toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        getMe();
    }, [setAuthUser]);

    return { loading };
};

export default useGetMe;
