export interface MenuPermisoOption {
  id: string;
  label: string;
  icon: string;
  permisosRequeridos: string[];
}

export const MENU_PERMISOS: MenuPermisoOption[] = [
  { 
    id: 'dashboard', 
    label: 'Dashboard', 
    icon: 'dashboard',
    permisosRequeridos: []
  },
  { 
    id: 'productos', 
    label: 'Gestión de Productos', 
    icon: 'inventory_2',
    permisosRequeridos: ['ver_productos'],
  },
  { 
    id: 'usuarios', 
    label: 'Gestión de Usuarios', 
    icon: 'group', 
    permisosRequeridos: ['ver_usuarios', 'ver_roles']
  },
  { 
    id: 'clientes', 
    label: 'Gestión de Clientes', 
    icon: 'people',
    permisosRequeridos: ['ver_clientes']
  },
  { 
    id: 'ofertas', 
    label: 'Gestión de Ofertas', 
    icon: 'local_offer', 
    permisosRequeridos: ['ver_ofertas']
  },
  { 
    id: 'compras', 
    label: 'Gestión de Compras', 
    icon: 'shopping_cart', 
    permisosRequeridos: ['ver_compras']
  },
  { 
    id: 'ventas', 
    label: 'Gestión de Ventas', 
    icon: 'receipt_long',
    permisosRequeridos: ['ver_ventas']
  },
  { 
    id: 'reportes', 
    label: 'Reportes', 
    icon: 'assessment', 
    permisosRequeridos: ['ver_reportes']
  },
  { 
    id: 'permisos', 
    label: 'Gestión de Permisos', 
    icon: 'admin_panel_settings', 
    permisosRequeridos: ['gestionar_permisos']
  },
  { 
    id: 'mensajes', 
    label: 'Mensajes', 
    icon: 'email', 
    permisosRequeridos: ['ver_mensajes']
  },
  { 
    id: 'comentarios', 
    label: 'Reseñas', 
    icon: 'rate_review', 
    permisosRequeridos: ['moderar_comentarios']
  },
];

export const getPermisoPorModulo = (modulo: string): string[] => {
  const option = MENU_PERMISOS.find(m => m.id === modulo);
  return option?.permisosRequeridos || [];
};
