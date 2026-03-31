export interface PermisoItem {
  id_permiso: number;
  nombre: string;
  descripcion: string | null;
  modulo: string;
  accion: string;
}

export interface PermisoConEstado extends PermisoItem {
  asignado: boolean;
}

export interface PermisosPorModulo {
  [modulo: string]: PermisoConEstado[];
}

export interface RolResponse {
  id_rol: number;
  rol: string;
}

export interface PermisosPorRolResponse {
  rol: RolResponse;
  permisos: PermisosPorModulo;
}

export interface PermisosAgrupadosResponse {
  [modulo: string]: PermisoItem[];
}

export interface PermisosStatusResponse {
  permisos: PermisoItem[];
  asignados: number[];
}

export interface RolesConPermisos {
  id_rol: number;
  rol: string;
  cantidad_permisos: number;
}

export interface SyncPermisosRequest {
  id_rol: number;
  permisos: number[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  mensaje?: string;
}
