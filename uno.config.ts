import { defineConfig, presetIcons } from 'unocss'
import { FileSystemIconLoader } from '@iconify/utils/lib/loader/node-loaders'
import path from 'node:path'

export default defineConfig({
	outputToCssLayers: true,
	presets: [
		presetIcons({
			cdn: 'https://esm.sh/',
			extraProperties: {
				display: 'inline-block',
				'vertical-align': 'middle',
			},
			collections: {
				app: FileSystemIconLoader(path.resolve(__dirname, './src/icons')),
			},
		}),
	],
})
