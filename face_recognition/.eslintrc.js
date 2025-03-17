const { rules } = require("../.eslintrc");

module.exports = {
	globals: {
		MLGraphBuilder: "readonly",
		MLTensorUsage: "readonly",
		tf: "readonly",
	},
	rules,
};
