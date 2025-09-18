import api from "../api/api";

export interface Cruise {
    id: number;
    cruise_name: string;
}

export const CruiseService = {
    get: async (): Promise<Cruise[]> => {
         const { data } =  await api.get("/cruise");
        return data;
    },

};
