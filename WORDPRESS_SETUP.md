# Configuración de WordPress para Store for Devs

## 📋 Requisitos previos

Para que tu sitio Astro pueda consumir los datos de productos desde WordPress, necesitarás:

1. **WordPress con WooCommerce** (recomendado) o **WordPress estándar** con productos como custom posts
2. **API REST de WordPress** habilitada (viene por defecto)
3. **Credenciales de autenticación** para acceso a la API

## 🔧 Configuración en WordPress

### Opción 1: Usando WooCommerce (Recomendado)

Si tienes WooCommerce instalado, sigue estos pasos:

#### 1. Instalar WooCommerce

```bash
# Si no tienes WooCommerce instalado:
# Ve a Plugins > Añadir nuevo > Busca "WooCommerce" > Instalar y activar
```

#### 2. Generar claves API de WooCommerce

1. Ve a **WooCommerce > Configuración > Avanzado > API REST**
2. Haz clic en **"Añadir clave"**
3. Configura los siguientes valores:
   - **Descripción**: `Store for Devs Integration`
   - **Usuario**: Selecciona un usuario administrador
   - **Permisos**: `Lectura` (Read)
4. Haz clic en **"Generar clave API"**
5. **¡IMPORTANTE!** Copia y guarda las credenciales:
   - **Consumer Key**: `ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
   - **Consumer Secret**: `cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

#### 3. Configurar variables de entorno en Astro

En tu archivo `.env` del proyecto Astro:

```env
# Para WooCommerce
WORDPRESS_API_URL=https://tu-sitio-wordpress.com/wp-json/wc/v3
WORDPRESS_CONSUMER_KEY=ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
WORDPRESS_CONSUMER_SECRET=cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Opción 2: WordPress estándar (sin WooCommerce)

Si prefieres usar WordPress sin WooCommerce:

#### 1. Crear Custom Post Type para productos

Añade este código al `functions.php` de tu tema o crea un plugin:

```php
<?php
// Registrar Custom Post Type para productos
function register_products_post_type() {
    register_post_type('producto', array(
        'labels' => array(
            'name' => 'Productos',
            'singular_name' => 'Producto',
        ),
        'public' => true,
        'has_archive' => true,
        'show_in_rest' => true, // Importante: habilita la API REST
        'supports' => array('title', 'editor', 'thumbnail', 'excerpt'),
        'taxonomies' => array('categoria_producto'),
    ));
}
add_action('init', 'register_products_post_type');

// Registrar taxonomía para categorías de productos
function register_product_category_taxonomy() {
    register_taxonomy('categoria_producto', 'producto', array(
        'labels' => array(
            'name' => 'Categorías de Productos',
            'singular_name' => 'Categoría de Producto',
        ),
        'public' => true,
        'show_in_rest' => true, // Importante: habilita la API REST
        'hierarchical' => true,
    ));
}
add_action('init', 'register_product_category_taxonomy');

// Añadir campos personalizados para precio
function add_product_meta_boxes() {
    add_meta_box(
        'product_details',
        'Detalles del Producto',
        'product_details_callback',
        'producto'
    );
}
add_action('add_meta_boxes', 'add_product_meta_boxes');

function product_details_callback($post) {
    wp_nonce_field('save_product_details', 'product_details_nonce');

    $price = get_post_meta($post->ID, '_price', true);
    $sale_price = get_post_meta($post->ID, '_sale_price', true);
    $featured = get_post_meta($post->ID, '_featured', true);

    echo '<table class="form-table">';
    echo '<tr><th><label for="product_price">Precio Regular</label></th>';
    echo '<td><input type="number" step="0.01" id="product_price" name="product_price" value="' . esc_attr($price) . '" /></td></tr>';
    echo '<tr><th><label for="product_sale_price">Precio de Oferta</label></th>';
    echo '<td><input type="number" step="0.01" id="product_sale_price" name="product_sale_price" value="' . esc_attr($sale_price) . '" /></td></tr>';
    echo '<tr><th><label for="product_featured">Producto Destacado</label></th>';
    echo '<td><input type="checkbox" id="product_featured" name="product_featured" value="1" ' . checked($featured, 1, false) . ' /></td></tr>';
    echo '</table>';
}

function save_product_details($post_id) {
    if (!isset($_POST['product_details_nonce']) || !wp_verify_nonce($_POST['product_details_nonce'], 'save_product_details')) {
        return;
    }

    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }

    if (!current_user_can('edit_post', $post_id)) {
        return;
    }

    if (isset($_POST['product_price'])) {
        update_post_meta($post_id, '_price', sanitize_text_field($_POST['product_price']));
    }

    if (isset($_POST['product_sale_price'])) {
        update_post_meta($post_id, '_sale_price', sanitize_text_field($_POST['product_sale_price']));
    }

    update_post_meta($post_id, '_featured', isset($_POST['product_featured']) ? 1 : 0);
}
add_action('save_post', 'save_product_details');

// Exponer campos personalizados en la API REST
function add_product_fields_to_rest_api() {
    register_rest_field('producto', 'price', array(
        'get_callback' => function($post) {
            return get_post_meta($post['id'], '_price', true);
        }
    ));

    register_rest_field('producto', 'sale_price', array(
        'get_callback' => function($post) {
            return get_post_meta($post['id'], '_sale_price', true);
        }
    ));

    register_rest_field('producto', 'featured', array(
        'get_callback' => function($post) {
            return get_post_meta($post['id'], '_featured', true) == 1;
        }
    ));
}
add_action('rest_api_init', 'add_product_fields_to_rest_api');
?>
```

#### 2. Configurar variables de entorno para WordPress estándar

```env
# Para WordPress estándar
WORDPRESS_API_URL=https://tu-sitio-wordpress.com/wp-json/wp/v2
# No necesitas consumer key/secret para WordPress estándar
```

## 🛡️ Configuración de Seguridad

### Habilitar CORS (si es necesario)

Si tu sitio Astro está en un dominio diferente al de WordPress, añade esto al `functions.php`:

```php
<?php
// Habilitar CORS para la API REST
function add_cors_http_header(){
    header("Access-Control-Allow-Origin: https://tu-sitio-astro.com");
    header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
}
add_action('rest_api_init', 'add_cors_http_header', 15);
?>
```

### Limitar acceso a la API (opcional)

```php
<?php
// Limitar acceso a usuarios autenticados
function restrict_rest_api_access($result) {
    if (!is_user_logged_in() && !current_user_can('read')) {
        return new WP_Error('rest_forbidden', 'Solo usuarios autenticados pueden acceder a la API', array('status' => 401));
    }
    return $result;
}
add_filter('rest_authentication_errors', 'restrict_rest_api_access');
?>
```

## 🧪 Probar la conexión

### 1. Verificar que la API funciona

Visita estas URLs en tu navegador:

**Para WooCommerce:**

```
https://tu-sitio-wordpress.com/wp-json/wc/v3/products?consumer_key=TU_KEY&consumer_secret=TU_SECRET
```

**Para WordPress estándar:**

```
https://tu-sitio-wordpress.com/wp-json/wp/v2/producto
```

### 2. Ejecutar el proyecto Astro

```bash
cd /Users/consultor/dev/store-for-devs
pnpm dev
```

## 📝 Estructura de datos esperada

El servicio WordPress está configurado para trabajar con estos campos:

- **id**: ID del producto
- **name**: Nombre del producto
- **slug**: Slug del producto
- **price**: Precio actual
- **regular_price**: Precio regular
- **sale_price**: Precio de oferta
- **on_sale**: Boolean si está en oferta
- **images**: Array de imágenes
- **categories**: Array de categorías
- **description**: Descripción completa
- **short_description**: Descripción corta
- **featured**: Si es producto destacado
- **total_sales**: Total de ventas

## 🔧 Solución de problemas

### Error: "API no encontrada"

- Verifica que WordPress esté actualizado
- Confirma que los permalinks estén configurados (no "Plain")
- Asegúrate de que WooCommerce esté activado (si lo usas)

### Error: "Autenticación fallida"

- Verifica las credenciales en el archivo `.env`
- Regenera las claves API en WooCommerce
- Confirma que el usuario tenga permisos adecuados

### Error: "CORS"

- Añade el código de CORS mostrado arriba
- Configura correctamente el dominio permitido

### Sin productos mostrados

- Verifica que tengas productos publicados en WordPress
- Confirma que las categorías tengan productos asignados
- Revisa la consola del navegador para errores

## 🚀 Próximos pasos

Una vez configurado, podrás:

1. Ver productos reales de WordPress en tu sitio Astro
2. Agregar nuevos productos desde WordPress
3. Modificar categorías y verlas reflejadas automáticamente
4. Expandir la funcionalidad con carritos de compra, checkout, etc.

¡Tu integración WordPress + Astro está lista! 🎉
