// Tipos para WordPress API
export interface WordPressProduct {
	id: number
	name: string
	slug: string
	permalink: string
	date_created: string
	date_modified: string
	type: string
	status: string
	featured: boolean
	catalog_visibility: string
	description: string
	short_description: string
	sku: string
	price: string
	regular_price: string
	sale_price: string
	on_sale: boolean
	purchasable: boolean
	total_sales: number
	virtual: boolean
	downloadable: boolean
	downloads: unknown[]
	download_limit: number
	download_expiry: number
	external_url: string
	button_text: string
	tax_status: string
	tax_class: string
	manage_stock: boolean
	stock_quantity: number | null
	stock_status: string
	backorders: string
	backorders_allowed: boolean
	backordered: boolean
	sold_individually: boolean
	weight: string
	dimensions: {
		length: string
		width: string
		height: string
	}
	shipping_required: boolean
	shipping_taxable: boolean
	shipping_class: string
	shipping_class_id: number
	reviews_allowed: boolean
	average_rating: string
	rating_count: number
	related_ids: number[]
	upsell_ids: number[]
	cross_sell_ids: number[]
	parent_id: number
	purchase_note: string
	categories: Array<{
		id: number
		name: string
		slug: string
	}>
	tags: Array<{
		id: number
		name: string
		slug: string
	}>
	images: Array<{
		id: number
		date_created: string
		date_modified: string
		src: string
		name: string
		alt: string
	}>
	attributes: unknown[]
	default_attributes: unknown[]
	variations: number[]
	grouped_products: number[]
	menu_order: number
	meta_data: unknown[]
}

// Tipo simplificado para usar en componentes
export interface Product {
	id: number
	name: string
	slug: string
	price: string
	regularPrice: string
	salePrice?: string
	onSale: boolean
	image: string[]
	imageAlt: string[]
	category: string
	description: string
	shortDescription: string
	featured: boolean
	totalSales: number
	stockStatus: string
	stockQuantity: number | null
	weight: string
	dimensions: {
		length: string
		width: string
		height: string
	}
	shippingClass: string
	shippingClassId: number
	attributes: unknown[]
	variations: number[]
	relatedIds: number[]
	upsellIds: number[]
	crossSellIds: number[]
	reviewsAllowed: boolean
	averageRating: string
	ratingCount: number
	permalink: string
}

// Tipo para categorías
export interface Category {
	id: number
	name: string
	slug: string
	description: string
	image?: string
	count: number
}
