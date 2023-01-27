module.exports = {
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		tsconfigRootDir : __dirname,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint/eslint-plugin'],
	extends: [
		'plugin:@typescript-eslint/recommended',
		'plugin:prettier/recommended',
		'plugin:react/recommended',
	],
	root: true,
	env: {
		node: true,
		jest: true,
	},
	ignorePatterns: ['.eslintrc.js'],
	rules: {
		'@typescript-eslint/interface-name-prefix': 'off',
		'@typescript-eslint/explicit-function-return-type': 'off',
		'@typescript-eslint/explicit-module-boundary-types': 'off',
		'@typescript-eslint/no-explicit-any': 'off',
	},
	settings: {
		react: {
			version: 'detect',  // Tells eslint-plugin-react to automatically detect the version of React to use
		},
	},
	// settings: {
	// 	"import/resolver": {
	// 		"node": {
	// 			"extensions": [".js", ".jsx", ".ts", ".tsx"]
	// 		}
	// 	}
	// },
	// overrides: [
	// 	{
	// 		"files": ["**/*.ts", "**/*.tsx"],
	// 		"parser": "typescript-eslint-parser",
	// 		"rules": {
	// 			"no-undef": "off"
	// 		}
	// 	}
	// ]
};
