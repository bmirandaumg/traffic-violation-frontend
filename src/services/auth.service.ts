import api from "../api/api";

export interface LoginRequest {
    username: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
  }

export const AuthService = {
    login: async (credentials: LoginRequest): Promise<LoginResponse> => {
        const { data } = await api.post('auth/login', credentials);
        localStorage.setItem("accessToken", data.access_token);

        return data;
    }
};
