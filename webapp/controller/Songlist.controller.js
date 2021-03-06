sap.ui.define([
	'./BaseController',
	'../util/ServiceDAO',
	'sap/ui/model/json/JSONModel',
	'../model/formatter',
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	'sap/ui/model/Sorter',
	'sap/ui/core/Fragment',
	"sap/ui/Device"
], function (BaseController, ServiceDAO, JSONModel, formatter, Filter, FilterOperator, Sorter, Fragment, Device) {
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
				yobangLoading: true,
				biliLoading: true
			});
			this._initProductSwitcher();
			this.setModel(oModel, "viewModel");
			this._loadTableData();
			this._loadRankData();
			this._loadYoBang();
			this._loadBili();
		},

		_initProductSwitcher: function() {
			const oView = this.getView();
			var oModel = new JSONModel({
				"items": [
					{
						"src": "sap-icon://business-objects-experience",
						"title": "QQ音乐",
						"subTitle": "榜单成绩、收藏统计"
					},
					{
						"src": "sap-icon://business-objects-experience",
						"title": "Bilibili",
						"subTitle": "频道播放"
					}
				]
			});
			oView.setModel(oModel);
			if (!this._pPopover) {
				this._pPopover = Fragment.load({
					id: oView.getId(),
					name: "charlie.data.fragment.ProductSwitchPopover",
					controller: this
				}).then(function(oPopover){
					oView.addDependent(oPopover);
					if (Device.system.phone) {
						oPopover.setEndButton(new sap.m.Button({text: "Close", type: "Emphasized", press: this.handleProductSwitcherClose.bind(this)}));
					}
					return oPopover;
				}.bind(this));
			}
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

		_loadBili: async function() {
			try{
				const [ response ] = await ServiceDAO.getBilibiliReport();
				const oModel = new JSONModel({
					data: response.data
				});
				this.setModel(oModel, "biliModel");
			} catch(error) {
				//
			} finally {
				this.getView().getModel( 'viewModel' ).setProperty( '/biliLoading', false);
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

		openNeteaseList: function() {
			this.openURL( 'https://mp.music.163.com/5c9c3a0ec91fac1390052994/pages/index/index.html');
		},

		openSong: function( oEvent ) {
			const oButton = oEvent.getParameter( 'source' ) || oEvent.getSource();
			const mid = oButton.getBindingContext('dataModel').getProperty('mid');
			if (mid === '004AkQIa1JTR6p') {
				this.openURL( 'https://i.y.qq.com/n2/m/share/details/taoge.html?hosteuin=oK6kowEAoK4z7Kn5NKoFoecA7z**&id=7854751705');
			} else {
				this.openURL( `https://y.qq.com/n/yqq/song/${mid}.html`);			
			}
		},

		openBiliVideo: function( oEvent, context='biliModel' ) {
			const oButton = oEvent.getParameter( 'source' ) || oEvent.getSource();
			const bvid = oButton.getBindingContext(context).getProperty('bvid');
			this.openURL(`https://www.bilibili.com/video/${bvid}`);
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

		handleSortButtonPressed: function (dialogName='SortDialog') {
			this.getViewSettingsDialog("charlie.data.util."+dialogName)
				.then(function (oViewSettingsDialog) {
					oViewSettingsDialog.open();
				});
		},
		handleSortDialogConfirm: function (oEvent, tableName="fav-table") {
			var oTable = this.byId(tableName),
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

		_handlePopoverPress: function( oButton, title, text ) {
			// create popover
			if( !this._oPopover ) {
				this._oPopoverMessage = new sap.m.FormattedText({
					id: this.getView().createId( 'popover-message' )
				});
				
				this._oPopover = new sap.m.ResponsivePopover({
					horizontalScrolling: false,
					resizable: true,
					content: this._oPopoverMessage,
					contentWidth: '30%'
				});
				this.getView().addDependent( this._oPopover );
			}
			this._oPopoverMessage.setHtmlText( text ).addStyleClass( 'sapUiSmallMargin' );
			this._oPopover.setTitle(title).openBy( oButton );
		},

		handleChartPopoverPress: function( oEvent ) {
			const oButton = oEvent.getParameter( 'source' ) || oEvent.getSource();
			const title = oButton.getBindingContext('rankModel').getProperty('title');
			const text = oButton.getBindingContext('rankModel').getProperty('intro');
			this._handlePopoverPress( oButton, title, text );
		},

		handleHitInfoPress: function( oEvent ) {
			const oButton = oEvent.getParameter( 'source' ) || oEvent.getSource();
			const title = oButton.getBindingContext('dataModel').getProperty('title');
			const text = oButton.getBindingContext('dataModel').getProperty('record').join('<br><br>');
			this._handlePopoverPress( oButton, title, text );
		},

		handleProductSwitcher: function (oEvent) {
			var oButton = oEvent.getSource();
			this._pPopover.then(function(oPopover){
				oPopover.openBy(oButton);
			});
		},

		handleProductSwitcherClose: function () {
			this._pPopover.then(function(oPopover){
				oPopover.close();
			});
		}
	});

});
