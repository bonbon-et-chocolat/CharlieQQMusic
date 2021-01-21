sap.ui.define([
	'./BaseController',
	'../util/ServiceDAO',
	'sap/ui/model/json/JSONModel',
	'../model/formatter',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (BaseController, ServiceDAO, JSONModel, formatter, Filter, FilterOperator) {
	"use strict";

	return BaseController.extend("charlie.data.controller.Worklist", {

		formatter: formatter,
		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			const oModel = new JSONModel({
				songsLoading: true,
				yobangLoading: true
			});
			this.setModel(oModel, "viewModel");
			this._loadTableData();
			this._loadYoBang();
		},

		_loadTableData: async function() {
			try{
				const [ response ] = await ServiceDAO.getSongs();
				const oModel = new JSONModel(response);
				this.setModel(oModel, "dataModel");
			} catch(error) {
				//
			} finally{
				this.getView().getModel( 'viewModel' ).setProperty( '/songsLoading', false);
			}
		},

		_loadYoBang: async function() {
			try{
				const [ response ] = await ServiceDAO.getYobang();
				const oModel = new JSONModel({
					updatedAt: response.data.updateTime,
					data: response.data.chartsList.filter( song => song.singerId==='199509')
				});
				this.setModel(oModel, "yobangModel");
			} catch(error) {
				//
			} finally {
				this.getView().getModel( 'viewModel' ).setProperty( '/yobangLoading', false);
			}
			
		},
		/**
		 * Triggered by the SearchFields's 'search' event
		 * @param {sap.ui.base.Event} oEvent SearchFields's search event
		 * @public
		 */
		onFilterSongs: function (oEvent, tableId='fav-table') {

			// build filter array
			var aFilter = [];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				aFilter.push(new Filter("title", FilterOperator.Contains, sQuery));
			}

			// filter binding
			var oTable = this.byId(tableId);
			var oBinding = oTable.getBinding("items");
			oBinding.filter(aFilter);
		},

		openAd: function() {
			this.openURL( 'https://www.douban.com/group/topic/208627731/' );
		},

		createRecordContent: function(sId, oContext) {
			return new sap.m.Text( { text: oContext.getProperty()});
		}
	});

});
