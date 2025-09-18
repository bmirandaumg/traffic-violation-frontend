import api from "../api/api";

export interface Vehicle {
    ESTADO: string;
    PLACA: string;
    MARCA: string;
    LINEA: string;
    MODELO: string;
    COLOR: string;
    TIPO: string;
    USO: string;
    CC: string;
}

export const VehicleService = {
    consultarVehiculo: async (placa: string, tipo: string): Promise<Vehicle> => {
        const { data } = await api.post('/photos/consultar-vehiculo', { placa, tipo });
        return data;
    },
};
