const Bili = require("../controllers/Bili");

module.exports = {
    '/channel': async (req, res) => {
        try {
            let data = global.channelData || await Bili.getChannel();
            global.channelData = data;
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
