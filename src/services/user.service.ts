import api from "../api/api";

export interface User {
    username: string;
    password: string;
    email: string;
    roleId: number;
}

export const UserService = {
    registerUser: async (User:User): Promise<unknown> => {
        const { data } = await api.post("users/register",User);
        return data;
    },


};
