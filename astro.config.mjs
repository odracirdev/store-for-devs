import { defineConfig } from 'astro/config'
import UnoCSS from 'unocss/astro'

const STANDARD_UNIT_SIZE = 16

// https://astro.build/config
export default defineConfig({
	vite: {
		build: {
			cssMinify: 'lightningcss',
		},
		css: {
			transformer: 'lightningcss',
			lightningcss: {
				visitor: {
					Length(length) {
						if (length.unit === 'px') {
							return { unit: 'rem', value: length.value / STANDARD_UNIT_SIZE }
						}
					},
				},
			},
		},
	},

	integrations: [UnoCSS()],
})
