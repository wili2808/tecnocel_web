/**
 * Tipos para gestión de Proveedores
 */

export interface CreateProveedorBody {
  nombre_proveedor: string;
  empresa: string;
  celular: string;
  telefono?: string;
  email?: string;
  direccion: string;
}

export interface UpdateProveedorBody extends Partial<CreateProveedorBody> {}

export interface ListarProveedoresQuery {
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ProveedorListItem {
  id_proveedor: number;
  nombre_proveedor: string;
  empresa: string;
  celular: string;
  telefono?: string;
  email?: string;
  direccion: string;
  fyh_creacion: Date;
  fyh_actualizacion: Date;
}
