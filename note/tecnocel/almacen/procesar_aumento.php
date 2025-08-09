<?php
include('../app/config.php');

// Configuración de encabezados
header('Content-Type: application/json');

// Verificar que el formulario haya sido enviado
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    // Recoger datos del formulario
    $increaseType = $_POST['increaseType'] ?? '';
    $dynamicOption = $_POST['dynamicOptions'] ?? '';
    $percentage = $_POST['percentage'] ?? '';

    // Validación de datos
    if (empty($increaseType) || empty($dynamicOption) || empty($percentage)) {
        echo json_encode(['error' => 'Todos los campos son obligatorios.']);
        exit;
    }

    if (!is_numeric($percentage)) {
        echo json_encode(['error' => 'El porcentaje debe ser un número.']);
        exit;
    }

    // Calcular el aumento
    $increaseFactor = 1 + ($percentage / 100);

    try {
        // Realizar la actualización de precios
        if ($increaseType == 'products') {
            $sql = "UPDATE tb_almacen SET precio_venta = precio_venta * :increaseFactor WHERE id_producto = :id";
        } elseif ($increaseType == 'categories') {
            $sql = "UPDATE tb_almacen SET precio_venta = precio_venta * :increaseFactor WHERE id_categoria = :id";
        } elseif ($increaseType == 'suppliers') {
            // Actualización basada en el proveedor con INNER JOIN
            $sql = "UPDATE tb_almacen a
        INNER JOIN tb_compras c ON a.id_producto = c.id_producto
        SET a.precio_venta = a.precio_venta * :increaseFactor
        WHERE c.id_proveedor = :id";
        } else {
            echo json_encode(['error' => 'Tipo de aumento no válido.']);
            exit;
        }

        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':increaseFactor', $increaseFactor);
        $stmt->bindParam(':id', $dynamicOption);

        // Ejecutar la consulta
        if ($stmt->execute()) {
            echo json_encode(['message' => 'Aumento aplicado correctamente.']);
        } else {
            echo json_encode(['error' => 'Hubo un error al ejecutar la consulta.']);
        }
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Error de base de datos: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['error' => 'Método no permitido.']);
}
?>

