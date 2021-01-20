const db = require("../util/db");
const Songs = require("../controllers/Songs");
const fs = require('fs')
const fsPromises = fs.promises;
const cachedDataPath = './public/cache/data.json';

function formatNumberWithCommas(x) {
    try{
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } catch(err) {
        return '-';
    }
}

async function _getData( req ) {
    let date = req.query.date;
    let data = null;
    if( !date ) {
        try{
            const archived = await fsPromises.readFile(cachedDataPath);
            data = JSON.parse( archived );
        } catch( err ) {
            data = await Songs.updateReportData();
        }
        
    } else {
        const client = await db.connect();
        data = await Songs.getExistingData( client, req.query  );
        await client.close();
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
