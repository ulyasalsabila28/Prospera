module.exports = (sequelize, DataTypes) => {
  const TransactionDetail = sequelize.define('TransactionDetail', {
    detail_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    transaction_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    capital_cost: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    selling_price: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    transaction_type: {
      type: DataTypes.ENUM('buy', 'sell'),
      defaultValue: 'sell',
      allowNull: false
    },
    sub_total: {
      type: DataTypes.BIGINT,
      allowNull: false
    }
  }, {
    tableName: 'Transaction_details',
    timestamps: true,
    createdAt: false,
    updatedAt: false,
    paranoid: true, // Soft delete (deletedAt)
    // FIX (HIGH-09): Index untuk JOIN dan analytics queries.
    // product_id_fk di-JOIN pada setiap query analytics breakdown produk.
    // transaction_id_fk di-JOIN pada setiap eager load history detail.
    indexes: [
      { fields: ['transaction_id_fk'] },             // JOIN dari Transaction → Detail
      { fields: ['product_id_fk'] },                 // JOIN dari Detail → Product (analytics)
      { fields: ['transaction_type'] }               // Filter sell/buy di analytics
    ]
  });

  TransactionDetail.associate = (models) => {
    TransactionDetail.belongsTo(models.Product, { foreignKey: 'product_id_fk' });
    TransactionDetail.belongsTo(models.Transaction, { foreignKey: 'transaction_id_fk' });
  };

  const checkPriceAnomaly = async (detail, options) => {
    const { Transaction, AnomalyTicket } = sequelize.models;
    const trx = await Transaction.findByPk(detail.transaction_id_fk);
    if (!trx) return;

    if (detail.transaction_type === 'sell' && detail.capital_cost > 0) {
        const margin = detail.selling_price - detail.capital_cost;
        const marginPercentage = (margin / detail.capital_cost) * 100;
        
        if (marginPercentage <= 2) {
            const existing = await AnomalyTicket.findOne({
                where: { reference_id: detail.detail_id, anomaly_type: 'PRICE' }
            });
            if (!existing) {
                await AnomalyTicket.create({
                    user_id_fk: trx.user_id_fk,
                    anomaly_type: 'PRICE',
                    reference_id: detail.detail_id,
                    description: `Margin sangat tipis atau jual rugi (${marginPercentage.toFixed(2)}%)`,
                    status: 'OPEN'
                }, { transaction: options.transaction });
            }
        } else {
            await AnomalyTicket.update({ status: 'RESOLVED', resolution_note: 'Sistem: Harga telah diperbaiki menjadi wajar.' }, {
                where: { reference_id: detail.detail_id, anomaly_type: 'PRICE', status: 'OPEN' },
                transaction: options.transaction
            });
        }
    }
  };

  TransactionDetail.addHook('afterCreate', async (detail, options) => {
    // syncProductAI adalah fire-and-forget (tidak di-await) — sudah safe
    const { syncProductAI } = require('../services/aiRestockService');
    syncProductAI(detail.product_id_fk);
    // FIX (MEDIUM-11): Bungkus dengan try-catch agar hook failure tidak abort transaksi utama
    try {
        await checkPriceAnomaly(detail, options);
    } catch (hookErr) {
        console.error('[Hook] afterCreate checkPriceAnomaly gagal (non-fatal):', {
            detail_id: detail.detail_id,
            error: hookErr.message
        });
    }
  });

  TransactionDetail.addHook('afterUpdate', async (detail, options) => {
    try {
        if (detail.changed('quantity') || detail.changed('transaction_type')) {
            const { syncProductAI } = require('../services/aiRestockService');
            syncProductAI(detail.product_id_fk);
        }
        await checkPriceAnomaly(detail, options);
    } catch (hookErr) {
        console.error('[Hook] afterUpdate checkPriceAnomaly gagal (non-fatal):', {
            detail_id: detail.detail_id,
            error: hookErr.message
        });
    }
  });

  TransactionDetail.addHook('afterDestroy', async (detail, options) => {
      try {
          const { AnomalyTicket } = sequelize.models;
          await AnomalyTicket.update({ status: 'DISMISSED', resolution_note: 'Sistem: Detail Transaksi telah di-Void/Dihapus' }, {
              where: { reference_id: detail.detail_id, anomaly_type: 'PRICE', status: 'OPEN' },
              transaction: options.transaction
          });
      } catch (hookErr) {
          console.error('[Hook] afterDestroy AnomalyTicket update gagal (non-fatal):', {
              detail_id: detail.detail_id,
              error: hookErr.message
          });
      }
  });

  return TransactionDetail;
};