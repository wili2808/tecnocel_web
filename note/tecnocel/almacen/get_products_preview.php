<?php
include('../app/config.php');

// Obtener los parámetros
$type = isset($_GET['type']) ? $_GET['type'] : '';
$id = isset($_GET['id']) ? $_GET['id'] : '';

// Verificar si ambos parámetros están definidos
if (empty($type) || empty($id)) {
    http_response_code(400); // Bad Request
    echo json_encode(["error" => "Parámetros inválidos."]);
    exit;
}

// Verificar si el id es un número entero
if (!filter_var($id, FILTER_VALIDATE_INT) && $type != 'code') { // Excluir validación para el caso 'code'
    http_response_code(400); // Bad Request
    echo json_encode(["error" => "El parámetro 'id' debe ser un número válido."]);
    exit;
}

// Inicializar el array de productos
$products = [];

// Validar y ejecutar la consulta en función del tipo
switch ($type) {
    case 'products':
        $sql = "SELECT a.id_producto, a.nombre, cat.nombre_categoria AS categoria, a.precio_venta, u.email
                FROM tb_almacen AS a
                INNER JOIN tb_categorias AS cat ON a.id_categoria = cat.id_categoria
                INNER JOIN tb_usuarios AS u ON a.id_usuario = u.id_usuario
                WHERE a.id_producto = :id";
        break;

    case 'categories':
        $sql = "SELECT a.id_producto, a.nombre, cat.nombre_categoria AS categoria, a.precio_venta
                FROM tb_almacen AS a
                INNER JOIN tb_categorias AS cat ON a.id_categoria = cat.id_categoria
                WHERE a.id_categoria = :id";
        break;

    case 'suppliers':
        $sql = "SELECT a.id_producto, a.nombre, cat.nombre_categoria AS categoria, a.precio_venta, p.nombre_proveedor
                FROM tb_almacen AS a
                INNER JOIN tb_categorias AS cat ON a.id_categoria = cat.id_categoria
                INNER JOIN tb_compras AS comp ON a.id_producto = comp.id_producto
                INNER JOIN tb_proveedores AS p ON comp.id_proveedor = p.id_proveedor
                WHERE comp.id_proveedor = :id";
        break;

    default:
        http_response_code(400); // Bad Request
        echo json_encode(["error" => "Tipo de filtro no válido."]);
        exit;
}

try {
    // Preparar y ejecutar la consulta
    $query = $pdo->prepare($sql);
    $query->bindParam(':id', $id); // Simplificado: el tipo de parámetro se maneja automáticamente

    $query->execute();

    // Obtener los resultados
    $products = $query->fetchAll(PDO::FETCH_ASSOC);

    // Verificar si se encontraron productos
    if (empty($products)) {
        http_response_code(404); // Not Found
        echo json_encode(["error" => "No se encontraron productos."]);
    } else {
        // Mostrar los productos en formato JSON
        echo json_encode($products);
    }
} catch (PDOException $e) {
    http_response_code(500); // Internal Server Error
    error_log($e->getMessage()); // Log del error para depuración
    echo json_encode(["error" => "Error en la base de datos."]);
}
?>
