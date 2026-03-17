import adminApi from '../api/axiosAdminConfig';
import type {
  ListarEnviosResponse,
  EnvioAdminDetalle,
  FiltrosEnviosAdmin,
  ActualizarEstadoEnvioBody,
} from '../types/envio';

export const envioAdminService = {
  listarEnvios: async (filtros: FiltrosEnviosAdmin = {}): Promise<ListarEnviosResponse> => {
    const { data } = await adminApi.get('/envios/admin', { params: filtros });
    return data;
  },

  obtenerDetalle: async (id: number): Promise<EnvioAdminDetalle> => {
    const { data } = await adminApi.get(`/envios/admin/${id}`);
    return data.data;
  },

  actualizarEstado: async (id: number, body: ActualizarEstadoEnvioBody): Promise<void> => {
    await adminApi.patch(`/envios/admin/${id}/estado`, body);
  },
};
