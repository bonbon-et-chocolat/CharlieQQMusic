sap.ui.define([
	"sap/ui/test/Opa5",
	"./arrangements/Startup",
	"./WorklistJourney",
	"./PostJourney"
], function (Opa5, Startup) {
	"use strict";

	Opa5.extendConfig({
		arrangements: new Startup(),
		viewNamespace: "charlie.data.view.",
		autoWait: true
	});
});
