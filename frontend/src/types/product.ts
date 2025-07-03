// Interfaz completa del producto según el modelo Almacen
export interface Product {
  id_producto: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  stock: number;
  stock_minimo: number | null;
  stock_maximo: number | null;
  precio_compra: string;
  precio_venta: string;
  fecha_ingreso: string;
  imagen: string | null;
  imagen_url?: string | null; // Generada por el backend
  imagen_disponible?: boolean; // Generada por el backend
  id_usuario: number;
  id_categoria: number;
  fyh_creacion: string;
  fyh_actualizacion: string;
  // Relaciones incluidas en las consultas
  Categoria?: {
    nombre_categoria: string;
  };
  Usuario?: {
    nombres: string;
  };
}

// Interfaz para categorías del backend
export interface Category {
  id_categoria: number;
  nombre_categoria: string;
}

// Interfaz para las props del ProductCard (solo propiedades necesarias)
export interface ProductCardProps {
  id_producto: number;
  nombre: string;
  descripcion?: string | null;
  imagen_url?: string | null;
  precio_venta: string;
  stock: number;
  className?: string;
  onClick?: () => void;
}

// Interfaz para filtros de productos
export interface ProductFilters {
  categoria?: number;
  busqueda?: string;
  precio_min?: number;
  precio_max?: number;
  solo_con_stock?: boolean;
}

// Interfaz para respuesta de la API
export interface ProductsResponse {
  productos: Product[];
  total: number;
  pagina: number;
  por_pagina: number;
} 