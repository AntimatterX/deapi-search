'use strict';
var assert = require("assert"),
    deapisearch = require("../lib/deapi-search");

describe("deapisearch", function() {
    it("return undefined", function() {
        assert.equal(deapisearch(), undefined);
    });
});
