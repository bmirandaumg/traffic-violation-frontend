import api from "../api/api";

export interface Photo {
  id: string;
  photo_base64: string;
  photo_date: string;
  photo_status: string;
}
export type Vehicle = {
  ESTADO: string,
  PLACA: string,
  MARCA: string,
  LINEA: string,
  MODELO: string,
  COLOR: string,
  TIPO: string
  USO: string
  CC: string
}


export type PhotoDetail = {
  id: number,
  timestamp: string,
  consultaVehiculo: Vehicle | null,
  location: string,
  speedLimit: string,
  videoNumber: number,
  serialNumber: number,
  measuredSpeed: string,
  isSatVehicleInfoFound: boolean
}

 type ProcessPhotoRequest=
{
  cruise:string,
  timestamp: Date,
  speed_limit_kmh: number,
  current_speed_kmh: number,
  lpNumber: string,
  lpType: string,
  photoId: number
}

export const PhotosService = {
  getAll: async (cruise_id: number, date: string, page: number): Promise<Photo[]> => {
    const params = `photo_date=${date}&id_cruise=${cruise_id}&page=${page}&limit=10`;
    const { data } = await api.get(`/photos?${params}`);

    return data[0];
  },

  updateStatus: async (id: string, status: string) => {
    const { data } = await api.patch(`/photos/${id}`, { status });
    return data;
  },

  blockPhoto: async (id: string) => {
    const { data } = await api.patch(`/photos/${id}/take`);
    return data;
  },
  getById: async (id: string): Promise<PhotoDetail> => {
    const { data } = await api.get(`/photos/${id}`);
    console.log(data);
  return { id: data.id, ...data.photo_info, consultaVehiculo: data.consultaVehiculo, isSatVehicleInfoFound: data.isSatVehicleInfoFound };
  },
  processPhoto: async (params:ProcessPhotoRequest) => {

    const { data } =  await api.post(`/processed-photo/send-speed-event`, params);
    return data;
  },


};
