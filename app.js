'use strict';

const createError = require( 'http-errors' );
const express = require( 'express' );
const path = require( 'path' );
const fs = require( 'fs' );
const Cache = require( './util/cache' );

const app = express();
app.use( express.static( __dirname ) );
global.cache = new Cache();
global.reportData = null;

// view engine setup
app.set( 'views', path.join( __dirname, 'views' ) );
app.set( 'view engine', 'jade' );

app.use( express.json() );
app.use( express.urlencoded({ extended: false }) );
app.use( express.static( path.join( __dirname, 'public' ) ) );
// Priority serve any static files.
app.use( express.static(path.resolve(__dirname, './react-ui/build')) );

const corsMap = {
    '/user/setCookie': true
};
fs.readdirSync( path.join( __dirname, 'routes' ) ).forEach( file => {
    const filename = file.replace( /\.js$/, '' );
    const RouterMap = require( `./routes/${filename}` );
    Object.keys( RouterMap ).forEach( ( routePath ) => {
        app.use( `/${filename}${routePath}`, ( req, res, next ) => {
            const router = express.Router();
            global.response = res;
            global.req = req;
            req.query = {
                ...req.query,
                ...req.body
            };
            const func = RouterMap[routePath];

            console.log( `/${filename}${routePath}`, routePath, func );
            router.post( '/', func );
            router.get( '/', func );
            if( corsMap[`/${filename}${routePath}`] ) {
                // eslint-disable-next-line max-nested-callbacks
                router.options( '/', ( _req, _res ) => {
                    _res.set( 'Access-Control-Allow-Origin', 'https://y.qq.com' );
                    _res.set( 'Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE' );
                    _res.set( 'Access-Control-Allow-Headers', 'Content-Type' );
                    _res.set( 'Access-Control-Allow-Credentials', 'true' );
                    _res.sendStatus( 200 );
                });
            }
            router( req, res, next );
        });
    });
});

app.use( '/zhoushen/hitsongs', ( req, res ) => {
    res.redirect( '/webapp/index.html' );
});
app.use( '/hitsongs', ( req, res ) => {
    res.redirect( '/webapp/index.html' );
});
  
app.use( '/', ( req, res, next ) => {
    const router = express.Router();
    router.get( '/', ( _req, _res ) => require( './routes/index' )['/']( _req, _res ) );
    router( req, res, next );
});

// catch 404 and forward to error handler
app.use( function( req, res, next ) {
    next( createError( 404 ) );
});

// error handler
app.use( function( err, req, res ) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get( 'env' ) === 'development' ? err : {};

    // render the error page
    res.status( err.status || 500 );
    res.render( 'error' );
});

// All remaining requests return the React app, so it can handle routing.
app.get('*', function(request, response) {
    response.sendFile(path.resolve(__dirname, './react-ui/build', 'index.html'));
});

module.exports = app;
