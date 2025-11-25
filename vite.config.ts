import { resolve } from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
	build: {
		lib: {
			entry: resolve(__dirname, "src/index.ts"),
			name: "DDDTypeScript",
			fileName: "index",
			formats: ["es", "cjs"],
		},
		target: "node18",
		rollupOptions: {
			external: ["fs", "path", "crypto"],
		},
	},
	// test: {
	// 	environment: "node",
	// 	globals: true,
	// },
	resolve: {
		alias: {
			"@": resolve(__dirname, "src"),
		},
	},
});
