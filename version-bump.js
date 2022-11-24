
const fs = require('fs');
const stringifyPackage = require("stringify-package");
const detectIndent = require("detect-indent");
const detectNewline = require("detect-newline");

module.exports.readVersion = function (contents) {
	const json = JSON.parse(contents);
	return Object.keys(json)[0];
};

module.exports.writeVersion = function (contents, version) {
	let manifest = JSON.parse(fs.readFileSync("manifest.json", "utf8"));
	const { minAppVersion } = manifest;

	const json = JSON.parse(contents);
	let indent = detectIndent(contents).indent;
	let newline = detectNewline(contents);
	const returnedJson = Object.assign({[version]: minAppVersion}, json);
	return stringifyPackage(returnedJson, indent, newline);
};
