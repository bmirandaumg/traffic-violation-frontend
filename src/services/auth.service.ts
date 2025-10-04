import api from "../api/api";

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    email: string;
    username: string;
    refresh_token: string;
}

export const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token");
    const { data } = await api.post("auth/refresh", { refresh_token: refreshToken });
    localStorage.setItem("accessToken", data.access_token);
    return data.access_token;
};
export const AuthService = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const { data } = await api.post('auth/login', credentials);
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem("refreshToken", data.refresh_token);
        return data;
    }
};
