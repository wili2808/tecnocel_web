#!/bin/bash

# Script de prueba para crear productos (endpoint privado)
# Uso: bash scripts/test-create-product.sh

BASE_URL="http://localhost:3000/api"

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "==========================================================="
echo "  TEST: Crear Producto (Endpoint Privado)"
echo "==========================================================="
echo ""

# Paso 1: Obtener token
echo -e "${BLUE}→ Paso 1: Obteniendo token JWT...${NC}"
echo ""

# Intentar login como cliente
echo "Intentando login como cliente..."
RESPONSE=$(curl -s -X POST "${BASE_URL}/clientes/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email_cliente": "cliente@example.com",
    "contrasena": "password123"
  }')

TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

# Si no funciona, intentar registro
if [ -z "$TOKEN" ]; then
  echo -e "${YELLOW}⚠ Login falló, registrando nuevo cliente...${NC}"

  EMAIL="test$(date +%s)@example.com"
  RESPONSE=$(curl -s -X POST "${BASE_URL}/clientes/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"nombre_cliente\": \"Test\",
      \"apellido_cliente\": \"Usuario\",
      \"email_cliente\": \"$EMAIL\",
      \"celular_cliente\": \"70000000\",
      \"nit_ci_cliente\": \"0000000\",
      \"contrasena\": \"Test123456\"
    }")

  TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

  if [ ! -z "$TOKEN" ]; then
    echo -e "${GREEN}✓ Cliente registrado exitosamente${NC}"
    echo "Email: $EMAIL"
    echo "Contraseña: Test123456"
  fi
fi

if [ -z "$TOKEN" ]; then
  echo -e "${RED}✗ Error: No se pudo obtener token${NC}"
  echo "Respuesta del servidor:"
  echo $RESPONSE | python -m json.tool 2>/dev/null || echo $RESPONSE
  exit 1
fi

echo -e "${GREEN}✓ Token obtenido exitosamente${NC}"
echo "Token (primeros 30 caracteres): ${TOKEN:0:30}..."
echo ""

# Paso 2: Crear producto
echo -e "${BLUE}→ Paso 2: Creando producto...${NC}"
echo ""

CODIGO="TEST-$(date +%s)"
echo "Código del producto: $CODIGO"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/almacen/productos" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"codigo\": \"$CODIGO\",
    \"nombre\": \"Producto de Prueba\",
    \"descripcion\": \"Este es un producto creado mediante script de prueba\",
    \"precio_venta\": 999.99,
    \"stock\": 100,
    \"id_categoria\": 1,
    \"id_marca\": 1,
    \"id_usuario\": 1,
    \"es_destacado\": false,
    \"imagenes\": [
      {
        \"url_imagen\": \"test-producto.jpg\",
        \"alt_text\": \"Imagen de prueba del producto\"
      }
    ]
  }")

# Separar el código de estado HTTP
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

echo "Código HTTP: $HTTP_CODE"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo -e "${GREEN}✓ Producto creado exitosamente!${NC}"
  echo ""
  echo "Respuesta del servidor:"
  echo "$BODY" | python -m json.tool 2>/dev/null || echo "$BODY"
else
  echo -e "${RED}✗ Error al crear producto${NC}"
  echo ""
  echo "Respuesta del servidor:"
  echo "$BODY" | python -m json.tool 2>/dev/null || echo "$BODY"

  if [ "$HTTP_CODE" = "401" ]; then
    echo -e "${YELLOW}⚠ Token inválido o expirado${NC}"
  elif [ "$HTTP_CODE" = "403" ]; then
    echo -e "${YELLOW}⚠ No tienes permisos suficientes (necesitas ser admin/usuario)${NC}"
  fi
fi

echo ""
echo "==========================================================="
