'use strict';
sap.ui.define( [
    './BaseController',
    '../util/ServiceDAO',
    'sap/ui/model/json/JSONModel',
    'sap/ui/core/Fragment',
    'sap/m/MessageToast'
], function( BaseController, ServiceDAO, JSONModel, Fragment, MessageToast ) {

    return BaseController.extend( 'charlie.data.controller.Bot', {

        onInit: function() {
            const oModel = new JSONModel({
                botLoading: true,
                categories: [ {
                    key: '0',
                    name: ''
                } ]
            });
            this.setModel( oModel, 'viewModel' );
            this.newCommentsModel = new JSONModel({});
            this.setModel( this.newCommentsModel, 'newComment' );
            this._loadBot();
        },

        _loadBot: async function() {
            try {
                const[ response ] = await ServiceDAO.getBot();
                this.oModel = new JSONModel( response.data );
                this.setModel( this.oModel );
            } catch( error ) {
                //
            } finally{
                this.getView().getModel( 'viewModel' ).setProperty( '/botLoading', false );
            }

        },

        onSearch: function( oEvent ) {
            // add filter for search
            let aFilters = [];
            let sQuery = oEvent.getSource().getValue();
            if( sQuery && sQuery.length > 0 ) {
                let filter = new sap.ui.model.Filter( 'content', sap.ui.model.FilterOperator.Contains, sQuery );
                aFilters.push( filter );
            }

            // update list binding
            let oBinding = oEvent.getSource().getParent().getParent().getBinding( 'items' );
            oBinding.filter( aFilters );
        },
        getGroupHeader: function( oGroup ){
            return new sap.m.GroupHeaderListItem({
                title: `${oGroup.name}: ${oGroup.description}`
            });
        },
        handleDelete: async function( oEvent ) {
            let oList = oEvent.getSource(),
                oItem = oEvent.getParameter( 'listItem' ),
                sPath = oItem.getBindingContextPath();
            const{ _id, content } = this.oModel.getProperty( sPath );
            // after deletion put the focus back to the list
            oList.attachEventOnce( 'updateFinished', oList.focus, oList );

            // send a delete request to the odata service
            await ServiceDAO.deleteBotComment( _id );
            let msg = `辣辣再也不说"${content}"la`;
            MessageToast.show( msg );
            this._loadBot();
        },

        openAddComment: function() {
            this.newCommentsModel.setData({ isEmoji: false });
            this.openAdd();
        },
        openAddEmoji: function() {
            this.newCommentsModel.setData({ isEmoji: true });
            this.openAdd();
        },
        openAdd: async function() {
            if( !this.oDefaultDialog ) {
                this.oDefaultDialog = await Fragment.load({
                    id: this.getView().getId(),
                    name: 'charlie.data.util.AddDialog',
                    controller: this
                });
                // to get access to the controller's model
                this.getView().addDependent( this.oDefaultDialog );
            }

            this.oDefaultDialog.open();
        },
        clearCommentsModel: function() {
            this.newCommentsModel.setData({
                tag: '1'
            });
        },
        closeDialog: function() {
            this.oDefaultDialog.close();
        },
        saveComments: async function() {
            const{ content, isEmoji, tag } = this.newCommentsModel.getData();
            const aComments = content.trim().split( /[;；]+/ );
            const result = [];
            aComments.forEach( c => {
                if( c.trim() ) {
                    result.push({
                        content: c,
                        isEmoji,
                        tag
                    });
                }
            });
            if( aComments.length===0 ) {
                this.newCommentsModel.setProperty( '/commentState', 'Error' );
            }
            this.newCommentsModel.setProperty( '/dialogBusy', true );
            try {
                await ServiceDAO.addBotComments( result );
                let msg = `学会辣学会辣`;
                MessageToast.show( msg );
                this._loadBot();
                this.closeDialog();
            } catch( err ) {
                this.newCommentsModel.setProperty( '/saveFailed', true );
                this.newCommentsModel.setProperty( '/dialogBusy', false );
            }
        }
    });

});
