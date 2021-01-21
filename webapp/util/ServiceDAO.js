'use strict';

sap.ui.define( [], function() {

    async function genericRequest( url, options = {}) {
        const oResponse = await fetch( url, options );
        let oData = {};
        try {
            oData = await oResponse.json();
        } catch( err ) {
            throw new Error( 'error' );
        }
        if( oResponse.status >= 400 ) {
            throw new Error('request failed');
        } else {
            return[ oData, oResponse ];
        }
    }

    return{
        async getSongs() {
            const sUrl = '/songs?format=json';
            const oOptions = {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            return genericRequest( sUrl, oOptions );
        }
    };
});
