import api from "../api/api";

export interface RejectionReason {
    id: number;
    reason: string;
}

export const RejectionReasonService = {
    get: async (): Promise<RejectionReason[]> => {
         const { data } =  await api.get("/rejection-reasons");
        return data;
    },

};
