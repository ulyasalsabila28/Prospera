'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const transactionTableInfo = await queryInterface.describeTable('Transactions').catch(() => null);
    if (transactionTableInfo && !transactionTableInfo.deletedAt) {
      await queryInterface.addColumn('Transactions', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }

    const detailTableInfo = await queryInterface.describeTable('Transaction_details').catch(() => null);
    if (detailTableInfo && !detailTableInfo.deletedAt) {
      await queryInterface.addColumn('Transaction_details', 'deletedAt', {
        type: Sequelize.DATE,
        allowNull: true
      });
    }
  },

  async down(queryInterface, Sequelize) {
    const transactionTableInfo = await queryInterface.describeTable('Transactions').catch(() => null);
    if (transactionTableInfo && transactionTableInfo.deletedAt) {
      await queryInterface.removeColumn('Transactions', 'deletedAt');
    }

    const detailTableInfo = await queryInterface.describeTable('Transaction_details').catch(() => null);
    if (detailTableInfo && detailTableInfo.deletedAt) {
      await queryInterface.removeColumn('Transaction_details', 'deletedAt');
    }
  }
};



