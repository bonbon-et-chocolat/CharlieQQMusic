const Bili = require("../controllers/Bili");

function expired(data) {
    if(!data) {
        return true;
    }
    const lastUpdate = data.updatedAt;
    const now = Date.now();
    const bExpired = (now - lastUpdate) > 60*60;
    return bExpired;
}
module.exports = {
    '/channel': async (req, res) => {
        try {
            let data = global.channelData;
            if(expired(data)) {
                data = await Bili.getChannel();
                global.channelData = data;
            }
            
            res.send({
                data
            })
        } catch (err) {
            res.render('error', {
                message: "找不到数据",
                error: err
            });
        }
    },
    '/uploaded': async (req, res) => {
        try {
            let data = global.uploadedData;
            if(expired(data)) {
                data = await Bili.getUploaded();
                global.uploadedData = data;
            }
            res.send({
                data
            })
        } catch (err) {
            res.render('error', {
                message: "找不到数据",
                error: err
            });
        }
    }
}
