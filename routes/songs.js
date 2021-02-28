const db = require("../util/db");
const Songs = require("../controllers/Songs");

function formatNumberWithCommas(x) {
    try{
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch(err) {
        return '-';
    }
}

async function _getData( req ) {
    let bToday = !!req.query.date;
    let data = null;
    if( bToday ) {
        data = global.reportData;
    }
    if( !data ) {
        const client = await db.connect();
        data = await Songs.getExistingData( client, req.query  );
        await client.close();
        if( bToday ) {
            if( !data ) {
                data = await Songs.updateReportData();
            }
            global.reportData = data;
        }
    }
    return data;
}

module.exports = {
    '/': async (req, res) => {
        try {
            let data = await _getData(req);
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
        }
    }
}
