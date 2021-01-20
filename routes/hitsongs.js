const db = require("../util/db");
const Songs = require("../controllers/Songs");

function formatNumberWithCommas(x) {
    try{
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch(err) {
        return '-';
    }
}

module.exports = {
    '/': async (req, res) => {
        let data = null;
        let client = null;
        try {
            client = await db.connect();
            data = await Songs.getExistingData( client, req.query  );
            if( req.query.format === 'json' ) {
                res.send({
                    data,
                    result: data.details.length
                })
            } else {
                res.render('hitsongs', {
                    data,
                    util: {
                        formatNumberWithCommas
                    }
                });
            }
        } catch (err) {
            res.render('error', {
                message: "找不到数据",
                error: err
            });
        } finally {
            if( client ) {
                await client.close();
            }
        }
    }
}
