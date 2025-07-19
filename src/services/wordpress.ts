import type {
	WordPressProduct,
	Product,
	Category,
	WordPressReview,
	Review,
} from '../types/wordpress'

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
		const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`
		const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
		const url = new URL(cleanEndpoint, baseUrl)

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

	private async fetchFromAPIWithPagination(
		endpoint: string,
		params: Record<string, string> = {}
	): Promise<{ data: unknown; totalPages: number; totalItems: number }> {
		const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl : `${this.baseUrl}/`
		const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
		const url = new URL(cleanEndpoint, baseUrl)

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

			const data = await response.json()
			const totalPages = parseInt(response.headers.get('X-WP-TotalPages') || '1')
			const totalItems = parseInt(response.headers.get('X-WP-Total') || '0')

			return { data, totalPages, totalItems }
		} catch (error) {
			console.error('❌ WooCommerce API Error:', error)
			throw error
		}
	}

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
		const images = wpProduct.images && wpProduct.images.length > 0 
			? wpProduct.images.map((image) => image.src).filter(src => src)
			: ['https://placehold.co/300']

		const imageAlts = wpProduct.images && wpProduct.images.length > 0
			? wpProduct.images.map((image) => image.alt || wpProduct.name || 'Producto')
			: [wpProduct.name || 'Producto']

		return {
			id: wpProduct.id,
			name: wpProduct.name || `Producto ${wpProduct.id}`,
			slug: wpProduct.slug || `producto-${wpProduct.id}`,
			price: wpProduct.price || wpProduct.regular_price || '0',
			regularPrice: wpProduct.regular_price || wpProduct.price || '0',
			salePrice: wpProduct.sale_price || undefined,
			onSale: wpProduct.on_sale || false,
			image: images,
			imageAlt: imageAlts,
			category: wpProduct.categories?.[0]?.name || 'Sin categoría',
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
			tags: wpProduct.tags.map((tag) => tag.name),
		}
	}

	private async fetchProductsAndTransform<T extends boolean = false>(
		params: Record<string, string>,
		withPagination: T
	): Promise<
		T extends true
			? { products: Product[]; totalPages: number; totalItems: number }
			: Product[]
	> {
		if (withPagination) {
			const { data, totalPages, totalItems } = await this.fetchFromAPIWithPagination('/products', params)
			const products = (data as WordPressProduct[]).map(p => this.transformWordPressProduct(p))
			return { products, totalPages, totalItems } as any
		} else {
			const data = await this.fetchFromAPI('/products', params)
			const products = (data as WordPressProduct[]).map(p => this.transformWordPressProduct(p))
			return products as any
		}
	}

	async getProducts(
		params: {
			per_page?: number
			page?: number
			orderby?: string
			order?: 'asc' | 'desc'
			featured?: boolean
			category?: string
			product_cat?: string
			status?: string
		} = {}
	): Promise<Product[]> {
		const defaultParams = {
			per_page: '10',
			status: 'publish',
			...params,
		}

		const apiParams = Object.entries(defaultParams).reduce(
			(acc, [key, value]) => {
				acc[key] = typeof value === 'boolean' ? value.toString() : String(value)
				return acc
			},
			{} as Record<string, string>
		)

		return await this.fetchProductsAndTransform(apiParams, false)
	}

	async getProductsWithPagination(
		params: {
			per_page?: number
			page?: number
			orderby?: string
			order?: 'asc' | 'desc'
			featured?: boolean
			category?: string
			product_cat?: string
			status?: string
		} = {}
	): Promise<{ products: Product[]; totalPages: number; totalItems: number }> {
		const defaultParams = {
			per_page: '10',
			status: 'publish',
			...params,
		}

		const apiParams = Object.entries(defaultParams).reduce(
			(acc, [key, value]) => {
				acc[key] = typeof value === 'boolean' ? value.toString() : String(value)
				return acc
			},
			{} as Record<string, string>
		)

		return await this.fetchProductsAndTransform(apiParams, true)
	}

	async getFeaturedProducts(limit = 4): Promise<Product[]> {
		return this.getProducts({
			featured: true,
			per_page: limit,
			orderby: 'date',
			order: 'desc',
		})
	}

	async getBestSellingProducts(limit = 4): Promise<Product[]> {
		return this.getProducts({
			per_page: limit,
			orderby: 'popularity',
			order: 'desc',
		})
	}

	async getNewProducts(limit = 8): Promise<Product[]> {
		return this.getProducts({
			per_page: limit,
			orderby: 'date',
			order: 'desc',
		})
	}

	async getProduct(id: number): Promise<Product> {
		const product = (await this.fetchFromAPI(`/products/${id}`)) as WordPressProduct
		return this.transformWordPressProduct(product)
	}

	async getProductBySlug(slug: string): Promise<Product | null> {
		const products = (await this.fetchFromAPI('/products', { slug })) as WordPressProduct[]
		if (products.length === 0) return null
		return this.transformWordPressProduct(products[0])
	}

	async getCategories(
		params: { per_page?: number; hide_empty?: boolean; parent?: number } = {}
	): Promise<Category[]> {
		const defaultParams = {
			per_page: '10',
			hide_empty: 'true',
			...params,
		}

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

	async getProductReviews(productId: number): Promise<Review[]> {
		try {
			const reviews = (await this.fetchFromAPI(`/products/reviews`, {
				product: productId.toString(),
				status: 'approved',
			})) as WordPressReview[]

			return reviews.map((review) => this.transformWordPressReview(review))
		} catch (error) {
			console.error('Error fetching product reviews:', error)
			return []
		}
	}

	private transformWordPressReview(wpReview: WordPressReview): Review {
		return {
			id: wpReview.id,
			dateCreated: wpReview.date_created,
			productId: wpReview.product_id,
			status: wpReview.status,
			reviewer: wpReview.reviewer,
			reviewerEmail: wpReview.reviewer_email,
			review: wpReview.review,
			rating: wpReview.rating,
			verified: wpReview.verified,
			reviewerAvatar: wpReview.reviewer_avatar_urls['48'] || wpReview.reviewer_avatar_urls['96'],
		}
	}
}

export const wordpressService = new WordPressService()
export default WordPressService
