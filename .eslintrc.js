module.exports = {
	root: true,
	env: { es6: true, browser: true, jquery: true, node: true },
	ignorePatterns: ["node_modules/"],
	parserOptions: { ecmaVersion: 2017, sourceType: "module" },
	rules: {
		quotes: [2, "double"],
		semi: 0,
		"space-before-function-paren": ["error", "never"],
		"object-curly-spacing": ["error", "always"],
		"quote-props": ["error", "as-needed"],
		indent: [2, "tab"],
		"no-tabs": ["error", { allowIndentationTabs: true }],
		"max-len": [
			"error",
			{
				code: 80,
				ignoreUrls: true,
				ignorePattern: "^import\\s.+\\sfrom\\s.+;$",
			},
		],
		"require-jsdoc": "off",
	},
	extends: ["eslint:recommended", "google"],
};
