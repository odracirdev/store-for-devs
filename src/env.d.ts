interface ImportMetaEnv {
	readonly WORDPRESS_API_URL: string
	readonly WORDPRESS_CONSUMER_KEY: string
	readonly WORDPRESS_CONSUMER_SECRET: string
}

interface ImportMeta {
	readonly env: ImportMetaEnv
}
