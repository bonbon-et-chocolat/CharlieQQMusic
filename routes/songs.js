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
    let bToday = !req.query.date;
    let data = null;
    if( bToday ) {
        data = global.reportData;
    }
    if( !data ) {
        const client = await db.connect();
        data = await Songs.getExistingData( client, req.query, true  );
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
                    name: '周深',
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
    },
    '/forceupdatecache': async (req, res) => {
        try {
            const client = await db.connect();
            let data = await Songs.getExistingData( client, req.query  );
            await client.close();
            global.reportData = data;
            res.send({});
        } catch (err) {
            res.render('error', {
                message: "找不到数据",
                error: err
            });
        }
    },
    '/inc': async(req, res)=>{
        const client = await db.connect();
        let {details} = await Songs.getExistingData( client, req.query  );
        
        let {data} = await db.findYesterdayFavData( client );

        let data1 = {};
        details.forEach( ({id, favCount}) => {
            data1[id] = {
                favCount: data[id],
                inc: data[id]-favCount
            };
        });
        await db.updateQQHistoryData(client, req.query.date, {
            date: req.query.date,
            updatedAt: req.query.date,
            timestamp: Date.now(),
            data: data1
        });
        res.send({data1}); 
    },
    '/fav/report': async (req, res) => {
        try {
            const start = '2021-02-01';
            const end = '2021-02-28';
            const client = await db.connect();
            let data1 = await Songs.getExistingData( client,  {date: start});
            let data2 = await Songs.getExistingData( client,  {date: end});

            let dict = {};
            data1.details.forEach( x=> {
                dict[x.mid] = {
                    favCount: x.favCount
                }
            });

            const data = data2.details.map( ({mid, title, timePublic, favCount }) => {
                let formatted = {
                    mid,
                    title,
                    timePublic,
                    favCount
                };
                formatted.favCountMin = dict[mid] ? dict[mid].favCount : 0;
                if(mid === '003zysEj2zeF4I') {
                    formatted.favCountMin = 1830000
                } else if (timePublic<start && formatted.favCountMin === 0 ) {
                    formatted.favCountMin = formatted.favCount;
                }
                formatted.diff = formatted.favCount - formatted.favCountMin;
                return formatted;
            }).sort(({diff:diff1}, {diff:diff2}) => {
                if (diff1 > diff2) return -1;
                else return 1;
            });
            db.updateSummary(client, {
                tag: 'summary',
                data
            });
            res.send({
                data,
                result: data.details.length
            })
        } catch (err) {
            res.render('error', {
                message: "找不到数据",
                error: err
            });
        }
    },
    '/zhouxingzhuikeai': async(req, res)=>{
        try{
            const mid = await Songs.search(req);
            const data = await Songs.getLiveData({
                mid
            });
            res.render('hitsongs', {
                data,
                name: req.query.key,
                util: {
                    formatNumberWithCommas
                }
            });
        }catch (err) {
            res.render('error', {
                message: "找不到数据",
                error: err
            });
        }
    }
}
