const debug = require('debug')('WebNJGIS: Debug');
const xpath = require('xpath');
const dom = require('xmldom').DOMParser;

const xml = "asdfasf"
const doc = new dom().parseFromString(xml)
const nodes = xpath.select("//title", doc)
console.log(nodes[0].localName + ": " + nodes[0].firstChild.data)
console.log("Node: " + nodes[0].toString())