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
            throw new Error( 'request failed' );
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

        async getBilibiliReport() {
            const sUrl = '/bili/report';
            return genericRequest( sUrl, defaultOptions );
        },

        async getNeteaseRanks() {
            const sUrl = '/netease/ranks';
            return genericRequest( sUrl, defaultOptions );
        },

        async getNeteaseSongs() {
            const sUrl = '/netease/songs';
            return genericRequest( sUrl, defaultOptions );
        },

        async getNeteasePlaylists() {
            const sUrl = '/netease/lists';
            return genericRequest( sUrl, defaultOptions );
        },
        async getQQPlaylists() {
            const sUrl = '/songs/lists';
            return genericRequest( sUrl, defaultOptions );
        },

        async getBot() {
            const sUrl = '/bot';
            return genericRequest( sUrl, defaultOptions );
        },

        async deleteBotComment( id ) {
            const sUrl = `/bot/delete`;
            return genericRequest( sUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id
                })
            });
        },

        async addBotComments( aComments ) {
            const sUrl = `/bot/add`;
            return genericRequest( sUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    data: aComments
                })
            });
        }

    };
});
