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
            this.viewModel = new JSONModel({
                botLoading: true,
                toDelete: {
                    _id: '',
                    content: ''
                }
            });
            this.setModel( this.viewModel, 'viewModel' );
            this.newCommentsModel = new JSONModel({});
            this.setModel( this.newCommentsModel, 'newComment' );
            this.clearCommentsModel();
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
        deleteComment: async function() {
            const oContext = this.viewModel.getProperty( '/toDelete' );
            await ServiceDAO.deleteBotComment( oContext._id );
            let msg = `辣辣再也不说"${oContext.content}"la`;
            MessageToast.show( msg );
            this._loadBot();
        },
        onApproveDialogPress: function() {

            if( !this.oApproveDialog ) {
                this.oApproveDialog = new sap.m.Dialog({
                    type: sap.m.DialogType.Message,
                    title: '确认删除',
                    content: new sap.m.Text(),
                    beginButton: new sap.m.Button({
                        type: sap.m.ButtonType.Emphasized,
                        text: '删除',
                        press: async function() {
                            // send a delete request to the odata service
                            await this.deleteComment();
                            this.oApproveDialog.close();
                        }.bind( this )
                    }),
                    endButton: new sap.m.Button({
                        text: '按错啦',
                        press: function() {
                            this.oApproveDialog.close();
                        }.bind( this )
                    })
                });
            }
            this.oApproveDialog.getContent()[0].setText( this.viewModel.getProperty( '/toDelete/content' ) );
            this.oApproveDialog.open();
        },
        handleDelete: async function( oEvent ) {
            let oItem = oEvent.getParameter( 'listItem' ),
                sPath = oItem.getBindingContextPath();
            const oContext = this.oModel.getProperty( sPath );
            this.viewModel.setProperty( '/toDelete', oContext );
            this.onApproveDialogPress( oContext );
        },

        openAddComment: function() {
            this.newCommentsModel.setProperty( '/isEmoji', false );
            this.openAdd();
        },
        openAddEmoji: function() {
            this.newCommentsModel.setProperty( '/isEmoji', true );
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
                tag: '1',
                content: '',
                isEmoji: false
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
                if( c.trim().length>0 ) {
                    result.push({
                        content: c,
                        isEmoji,
                        tag
                    });
                }
            });
            if( result.length===0 ) {
                this.newCommentsModel.setProperty( '/commentState', 'Error' );
                return;
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
