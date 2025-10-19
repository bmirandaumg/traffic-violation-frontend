import api from "../api/api";

export interface RejectionReason {
    id: number;
    description: string;
}

export const RejectionReasonService = {
    get: async (): Promise<RejectionReason[]> => {
         const { data } =  await api.get("/rejection-reasons");
        return data;
    },

};
