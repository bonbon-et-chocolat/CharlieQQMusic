'use strict';

sap.ui.define( [], function() {

    const defaultOptions = {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    };
    async function genericRequest( url, options = defaultOptions ) {
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
            return genericRequest( sUrl, defaultOptions );
        },

        async getRanks() {
            const sUrl = '/ranks';
            return genericRequest( sUrl, defaultOptions );
        },

        async getYobang() {
            const sUrl = 'https://yobang.tencentmusic.com/unichartsapi/v1/songs/charts/dynamic?platform=qqyin&offset=0&limit=100';
            return genericRequest( sUrl, defaultOptions );
        },

        async getBilibiliChannel() {
            const sUrl = '/bili/channel';
            return genericRequest( sUrl, defaultOptions );
        }
    };
});
