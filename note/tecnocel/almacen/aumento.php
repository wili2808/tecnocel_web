<?php
include('../app/config.php');
include('../layout/sesion.php');
include('../layout/parte1.php');
?>
<!-- Cargar jQuery solo una vez -->
<script src="https://code.jquery.com/jquery-3.6.4.min.js"></script>

<div class="container mt-3 d-flex justify-content-center">
    <div class="col-md-6">
        <h4 class="text-center">Aumentos Masivos en los Precios</h4>
        <form id="increaseForm" method="POST" action="procesar_aumento.php">

            <!-- Tipo de aumento -->
            <div class="form-group">
                <label for="increaseType">Tipo de Aumento:</label>
                <select id="increaseType" name="increaseType" class="form-control" required>
                    <option value="">Selecciona un tipo</option>
                    <option value="products">Por Productos</option>
                    <option value="categories">Por Categorías</option>
                    <option value="suppliers">Por Proveedores</option>
                </select>
            </div>

            <!-- Selección dinámica -->
            <div id="dynamicSelect" class="form-group" style="display: none;">
                <label for="dynamicOptions">Selecciona una opción:</label>
                <select id="dynamicOptions" name="dynamicOptions" class="form-control" required></select>
            </div>

            <!-- Vista previa de productos -->
            <div id="previewSection" style="display: none;">
                <h4>Vista previa de productos:</h4>
                <table class="table table-bordered">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Producto</th>
                            <th>Categoría</th>
                            <th>Precio Actual</th>
                        </tr>
                    </thead>
                    <tbody id="previewTable"></tbody>
                </table>
            </div>

            <!-- Porcentaje de aumento -->
            <div class="form-group">
                <label for="percentage">Porcentaje de Aumento (%):</label>
                <input type="number" id="percentage" name="percentage" class="form-control" required>
            </div>

            <!-- Botón de aplicar aumento -->
            <button type="submit" class="btn btn-primary btn-block">Aplicar Aumento</button>
        </form>
    </div>
</div>



<script>
    document.addEventListener("DOMContentLoaded", function() {
        const increaseType = document.getElementById("increaseType");
        const dynamicSelect = document.getElementById("dynamicSelect");
        const dynamicOptions = document.getElementById("dynamicOptions");
        const previewSection = document.getElementById("previewSection");
        const previewTable = document.getElementById("previewTable");

        // Mostrar/Ocultar el selector de opciones basado en el tipo de aumento
        increaseType.addEventListener("change", function () {
            dynamicSelect.style.display = "none";  // Ocultar el selector dinámico inicialmente
            previewSection.style.display = "none"; // Ocultar la vista previa

            if (this.value) {
                dynamicSelect.style.display = "block";  // Mostrar el selector dinámico

                // Construir la URL con el tipo seleccionado
                const url = `../almacen/get_options.php?type=${encodeURIComponent(this.value)}`;

                // Hacer la solicitud AJAX para obtener las opciones dinámicas
                fetch(url)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Error en la respuesta del servidor: ${response.status}`);
                        }
                        return response.json(); // Parsear el JSON
                    })
                    .then(data => {
                        if (data && Array.isArray(data)) {
                            dynamicOptions.innerHTML = '<option value="">Selecciona una opción</option>';
                            data.forEach(option => {
                                dynamicOptions.innerHTML += `<option value="${option.id_producto || option.id_categoria || option.id_proveedor}">
                                    ${option.nombre || option.nombre_categoria || option.nombre_proveedor}
                                </option>`;
                            });
                        } else {
                            dynamicOptions.innerHTML = '<option value="">No hay opciones disponibles</option>';
                        }
                    })
                    .catch(error => {
                        console.error("Error al cargar las opciones:", error);
                        dynamicOptions.innerHTML = '<option value="">Error al cargar opciones</option>';
                    });
            }
        });

        // Mostrar vista previa de productos al seleccionar una opción
        dynamicOptions.addEventListener("change", function () {
            if (this.value) {
                const type = increaseType.value;
                const id = this.value;

                // Realizar la solicitud para obtener los datos de productos
                fetch(`../almacen/get_products_preview.php?type=${type}&id=${id}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Error en la respuesta del servidor: ${response.status}`);
                        }
                        return response.json();
                    })
                    .then(data => {
                        previewTable.innerHTML = "";
                        if (data && data.length > 0) {
                            data.forEach(product => {
                                const row = document.createElement("tr");
                                row.innerHTML = `
                                    <td>${product.id_producto}</td>
                                    <td>${product.nombre}</td>
                                    <td>${product.categoria}</td>
                                    <td>${product.precio_venta}</td>
                                `;
                                previewTable.appendChild(row);
                            });
                            previewSection.style.display = "block"; // Mostrar la sección de vista previa
                        } else {
                            previewTable.innerHTML = `<tr><td colspan="4">No hay productos disponibles para esta opción.</td></tr>`;
                            previewSection.style.display = "block";
                        }
                    })
                    .catch(error => {
                        console.error("Error al cargar los productos:", error);
                        previewTable.innerHTML = `<tr><td colspan="4">Hubo un error al cargar los productos. Intenta nuevamente más tarde.</td></tr>`;
                        previewSection.style.display = "block";
                    });
            } else {
                previewSection.style.display = "none"; // Ocultar vista previa si no hay selección
            }
        });
    });

    document.addEventListener("DOMContentLoaded", function() {
        const form = document.getElementById('increaseForm');
        form.addEventListener('submit', function(e) {
            e.preventDefault();

            const formData = new FormData(form);

            fetch(form.action, {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert(data.error);
                } else {
                    alert(data.message);
                    form.reset();
                }
            })
            .catch(error => {
                console.error("Error al enviar el formulario:", error);
                alert('Hubo un error al procesar la solicitud.');
            });
        });
    });
</script>

<!-- Cargar Bootstrap solo una vez -->
<link href="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css" rel="stylesheet">
<script src="https://stackpath.bootstrapcdn.com/bootstrap/4.5.2/js/bootstrap.bundle.min.js"></script>

<?php include('../layout/mensajes.php'); ?>
<?php include('../layout/parte2.php'); ?>


