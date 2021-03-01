const db = require("../util/db");
const Ranks = require("../controllers/Ranks");

module.exports = {
    '/': async (req, res) => {
        try {
            let data = global.rankData || await Ranks.getExistingChartData();
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
