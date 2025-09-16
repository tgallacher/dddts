import type { Config } from "prettier";

const config: Config = {
	$schema: "http://json.schemastore.org/prettierrc",
	proseWrap: "always",
	bracketSpacing: true,
	arrowParens: "always",
	trailingComma: "all",
	requirePragma: false,
	insertPragma: false,
	singleQuote: false,
	endOfLine: "lf",
	printWidth: 80,
	useTabs: false,
	tabWidth: 2,
	semi: true,
	bracketSameLine: true,
};

export default config;
