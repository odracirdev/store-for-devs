import type { WordPressProduct, Product, Category } from '../types/wordpress'

class WordPressService {
	private baseUrl: string
	private consumerKey: string
	private consumerSecret: string

	constructor() {
		this.baseUrl = import.meta.env.WORDPRESS_API_URL || ''
		this.consumerKey = import.meta.env.WORDPRESS_CONSUMER_KEY || ''
		this.consumerSecret = import.meta.env.WORDPRESS_CONSUMER_SECRET || ''
	}

	private getAuthHeaders(): Record<string, string> {
		if (this.consumerKey && this.consumerSecret) {
			const credentials = btoa(`${this.consumerKey}:${this.consumerSecret}`)
			return {
				Authorization: `Basic ${credentials}`,
				'Content-Type': 'application/json',
			}
		}
		return {
			'Content-Type': 'application/json',
		}
	}

	private async fetchFromAPI(
		endpoint: string,
		params: Record<string, string> = {}
	): Promise<unknown> {
		// Asegurar que la URL base termine con /
		const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`
		// Remover la barra inicial del endpoint para evitar problemas
		const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint

		const url = new URL(cleanEndpoint, baseUrl)

		// Agregar parámetros de consulta
		Object.entries(params).forEach(([key, value]) => {
			url.searchParams.append(key, value)
		})

		try {
			const response = await fetch(url.toString(), {
				headers: this.getAuthHeaders(),
			})

			if (!response.ok) {
				throw new Error(`WooCommerce Error ${response.status}: ${response.statusText}`)
			}

			return await response.json()
		} catch (error) {
			console.error('❌ WooCommerce API Error:', error)
			throw error
		}
	}

	// Método para verificar la conectividad con WordPress
	async testConnection(): Promise<{ success: boolean; message: string; details?: unknown }> {
		try {
			const wcResponse = await fetch(`${this.baseUrl}/products?per_page=1`, {
				headers: this.getAuthHeaders(),
			})

			if (wcResponse.ok) {
				return { success: true, message: 'Conexión exitosa con WooCommerce API' }
			} else {
				const errorText = await wcResponse.text()
				return {
					success: false,
					message: `Error ${wcResponse.status}: ${wcResponse.statusText}`,
					details: errorText,
				}
			}
		} catch (error) {
			return {
				success: false,
				message: 'Error de conectividad',
				details: error,
			}
		}
	}

	private transformWordPressProduct(wpProduct: WordPressProduct): Product {
		return {
			id: wpProduct.id,
			name: wpProduct.name,
			slug: wpProduct.slug,
			price: wpProduct.price,
			regularPrice: wpProduct.regular_price,
			salePrice: wpProduct.sale_price || undefined,
			onSale: wpProduct.on_sale,
			image: wpProduct.images.map((image) => image.src) || ['https://placehold.co/300'],
			imageAlt: wpProduct.images.map((image) => image.alt || wpProduct.name),
			category: wpProduct.categories[0]?.name || 'Sin categoría',
			description: wpProduct.description,
			shortDescription: wpProduct.short_description,
			featured: wpProduct.featured,
			totalSales: wpProduct.total_sales,
			stockStatus: wpProduct.stock_status,
			stockQuantity: wpProduct.stock_quantity,
			weight: wpProduct.weight,
			dimensions: wpProduct.dimensions,
			shippingClass: wpProduct.shipping_class,
			shippingClassId: wpProduct.shipping_class_id,
			attributes: wpProduct.attributes,
			variations: wpProduct.variations,
			relatedIds: wpProduct.related_ids,
			upsellIds: wpProduct.upsell_ids,
			crossSellIds: wpProduct.cross_sell_ids,
			reviewsAllowed: wpProduct.reviews_allowed,
			averageRating: wpProduct.average_rating,
			ratingCount: wpProduct.rating_count,
			permalink: wpProduct.permalink,
		}
	}

	// Obtener todos los productos
	async getProducts(
		params: {
			per_page?: number
			page?: number
			orderby?: string
			order?: 'asc' | 'desc'
			featured?: boolean
			category?: string
			status?: string
		} = {}
	): Promise<Product[]> {
		const defaultParams = {
			per_page: '10',
			status: 'publish',
			...params,
		}

		// Convertir boolean a string para la API
		const apiParams = Object.entries(defaultParams).reduce(
			(acc, [key, value]) => {
				acc[key] = typeof value === 'boolean' ? value.toString() : String(value)
				return acc
			},
			{} as Record<string, string>
		)

		const products = (await this.fetchFromAPI('/products', apiParams)) as WordPressProduct[]
		return products.map((product) => this.transformWordPressProduct(product))
	}

	// Obtener productos destacados
	async getFeaturedProducts(limit = 4): Promise<Product[]> {
		return this.getProducts({
			featured: true,
			per_page: limit,
			orderby: 'date',
			order: 'desc',
		})
	}

	// Obtener productos más vendidos
	async getBestSellingProducts(limit = 4): Promise<Product[]> {
		return this.getProducts({
			per_page: limit,
			orderby: 'popularity',
			order: 'desc',
		})
	}

	// Obtener productos nuevos
	async getNewProducts(limit = 8): Promise<Product[]> {
		return this.getProducts({
			per_page: limit,
			orderby: 'date',
			order: 'desc',
		})
	}

	// Obtener un producto por ID
	async getProduct(id: number): Promise<Product> {
		const product = (await this.fetchFromAPI(`/products/${id}`)) as WordPressProduct
		return this.transformWordPressProduct(product)
	}

	// Obtener un producto por slug
	async getProductBySlug(slug: string): Promise<Product | null> {
		const products = (await this.fetchFromAPI('/products', { slug })) as WordPressProduct[]
		if (products.length === 0) return null
		return this.transformWordPressProduct(products[0])
	}

	// Obtener categorías
	async getCategories(
		params: { per_page?: number; hide_empty?: boolean; parent?: number } = {}
	): Promise<Category[]> {
		const defaultParams = {
			per_page: '10',
			hide_empty: 'true',
			...params,
		}

		// Convertir boolean a string para la API
		const apiParams = Object.entries(defaultParams).reduce(
			(acc, [key, value]) => {
				acc[key] = typeof value === 'boolean' ? value.toString() : String(value)
				return acc
			},
			{} as Record<string, string>
		)

		const categories = (await this.fetchFromAPI('/products/categories', apiParams)) as Array<{
			id: number
			name: string
			slug: string
			description: string
			image?: { src: string }
			count: number
		}>

		return categories.map((cat) => ({
			id: cat.id,
			name: cat.name,
			slug: cat.slug,
			description: cat.description,
			image: cat.image?.src,
			count: cat.count,
		}))
	}
}

// Exportar instancia singleton
export const wordpressService = new WordPressService()

// Exportar la clase para testing
export default WordPressService
