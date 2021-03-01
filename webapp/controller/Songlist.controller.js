sap.ui.define([
	'./BaseController',
	'../util/ServiceDAO',
	'sap/ui/model/json/JSONModel',
	'../model/formatter',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	'sap/ui/core/Fragment'
], function (BaseController, ServiceDAO, JSONModel, formatter, Filter, FilterOperator, Sorter, Fragment) {
	"use strict";

	return BaseController.extend("charlie.data.controller.Songlist", {

		formatter: formatter,
		/**
		 * Called when the Songlist controller is instantiated.
		 * @public
		 */
		onInit: function () {
			this._mViewSettingsDialogs = {};
			const oModel = new JSONModel({
				songsLoading: true,
				ranksLoading: true,
				yobangLoading: true
			});
			this.setModel(oModel, "viewModel");
			this._loadTableData();
			this._loadRankData();
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

		_loadRankData: async function() {
			try{
				const [ response ] = await ServiceDAO.getRanks();
				const oRankModel = new JSONModel(response);
				this.setModel(oRankModel, "rankModel");
			} catch(error) {
				//
			} finally{
				this.getView().getModel( 'viewModel' ).setProperty( '/ranksLoading', false);
			}
		},

		_loadYoBang: async function() {
			try{
				const [ response ] = await ServiceDAO.getYobang();
				const oModel = new JSONModel({
					updatedAt: response.data.updateTime,
					data: response.data.chartsList.filter( song => song.singerId.match(/,*199509,*/))
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

		openHistory: function() {
			this.openURL( 'https://charts.mongodb.com/charts-prod-sihwb/public/dashboards/f4cd6ee1-ca04-4e1e-a5b3-80357f30dfaf' );
		},

		openViz: function() {
			this.openURL( 'https://charts.mongodb.com/charts-prod-sihwb/public/dashboards/600cdfd3-228b-4a07-8a14-c03fa7c0c957' );
		},

		openUni: function() {
			this.openURL( 'https://y.qq.com/m/client/toplist/uni.html?ADTAG=cbshare');
		},

		openDaBang: function() {
			this.openURL( 'https://c.y.qq.com/base/fcgi-bin/u?__=l8SVZzB');
		},

		openBuyTutorial: function() {
			this.openURL( 'https://www.douban.com/group/topic/209067429/')
		},

		createRecordContent: function(sId, oContext) {
			return new sap.m.Text( { text: oContext.getProperty()});
		},

		getViewSettingsDialog: function (sDialogFragmentName) {
			var pDialog = this._mViewSettingsDialogs[sDialogFragmentName];

			if (!pDialog) {
				pDialog = Fragment.load({
					id: this.getView().getId(),
					name: sDialogFragmentName,
					controller: this
				});
				this._mViewSettingsDialogs[sDialogFragmentName] = pDialog;
			}
			return pDialog;
		},

		handleSortButtonPressed: function () {
			this.getViewSettingsDialog("charlie.data.util.SortDialog")
				.then(function (oViewSettingsDialog) {
					oViewSettingsDialog.open();
				});
		},

		handleSortDialogConfirm: function (oEvent) {
			var oTable = this.byId("fav-table"),
				mParams = oEvent.getParameters(),
				oBinding = oTable.getBinding("items"),
				sPath,
				bDescending,
				aSorters = [];

			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new Sorter(sPath, bDescending));

			// apply the selected sort and group settings
			oBinding.sort(aSorters);
		},

		_handlePopoverPress: function( oButton, text ) {
			// create popover
			if( !this._oPopover ) {
				this._oPopoverMessage = new sap.m.FormattedText({
					id: this.getView().createId( 'popover-message' )
				});
				this._oPopover = new sap.m.ResponsivePopover({
					showHeader: false,
					horizontalScrolling: false,
					resizable: true,
					content: this._oPopoverMessage,
					contentWidth: '40%'
				});
				this.getView().addDependent( this._oPopover );
			}
			this._oPopoverMessage.setHtmlText( text ).addStyleClass( 'sapUiSmallMargin' );
			this._oPopover.openBy( oButton );
		},

		handleChartPopoverPress: function( oEvent ) {
			const oButton = oEvent.getParameter( 'source' ) || oEvent.getSource();
			const text = oButton.getBindingContext('rankModel').getProperty('intro');
			this._handlePopoverPress( oButton, text );
		},

		handleHitInfoPress: function( oEvent ) {
			const oButton = oEvent.getParameter( 'source' ) || oEvent.getSource();
			const text = oButton.getBindingContext('dataModel').getProperty('record').join('<br><br>');
			this._handlePopoverPress( oButton, text );
		}
	});

});
