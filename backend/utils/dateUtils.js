const { Op } = require("sequelize");

const getDateFilter = (startDate, endDate) => {
    if (startDate && endDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);

        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        return {
            transaction_datetime: {
                [Op.between]: [start, end]
            }
        };
    }
    return {};
};

module.exports = { getDateFilter };