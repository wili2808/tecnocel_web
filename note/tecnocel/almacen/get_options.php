<?php
include('../app/config.php'); // Asegúrate de incluir la configuración correctamente

header('Content-Type: application/json'); // Establecer el encabezado para respuesta JSON

// Obtener el parámetro 'type' y comprobar su validez
$type = isset($_GET['type']) ? $_GET['type'] : ''; // Obtener el parámetro 'type'

if (empty($type)) {
    echo json_encode(['error' => 'Parámetro "type" no proporcionado o vacío.']);
    exit; // Terminar la ejecución si no se proporciona 'type'
}

try {
    switch ($type) {
        case 'products':
            // Consulta para productos
            $query = "SELECT id_producto, nombre FROM tb_almacen";
            $stmt = $pdo->prepare($query);
            $stmt->execute();
            $productos = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($productos); // Devolver los productos en formato JSON
            break;

        case 'categories':
            // Consulta para categorías
            $query = "SELECT id_categoria, nombre_categoria FROM tb_categorias";
            $stmt = $pdo->prepare($query);
            $stmt->execute();
            $categorias = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($categorias); // Devolver las categorías en formato JSON
            break;

        case 'suppliers':
            // Consulta para proveedores
            $query = "SELECT id_proveedor, nombre_proveedor FROM tb_proveedores";
            $stmt = $pdo->prepare($query);
            $stmt->execute();
            $proveedores = $stmt->fetchAll(PDO::FETCH_ASSOC);
            echo json_encode($proveedores); // Devolver los proveedores en formato JSON
            break;

        default:
            // Si el tipo no es válido, devolver un error
            echo json_encode(['error' => 'Tipo de solicitud no válido.']);
            break;
    }
} catch (Exception $e) {
    // Si ocurre un error en la consulta o conexión, se captura y muestra el error
    echo json_encode(['error' => 'Error en la solicitud: ' . $e->getMessage()]);
}
?>




