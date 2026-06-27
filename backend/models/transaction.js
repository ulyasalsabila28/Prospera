module.exports = (sequelize, DataTypes) => {
  const Transaction = sequelize.define('Transaction', {
    transaction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    cashier_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    total_amount: {
      type: DataTypes.BIGINT,
      allowNull: false,
      defaultValue: 0
    },
    transaction_type: {
      type: DataTypes.ENUM('buy', 'sell'),
      defaultValue: 'sell',
      allowNull: false
    },
    transaction_datetime: {
      type: DataTypes.DATE, 
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('pending', 'success', 'cancelled'),
      defaultValue: 'success',
      allowNull: false
    }
  }, {
    tableName: 'Transactions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    paranoid: true, // Soft delete (deletedAt)
    // FIX (HIGH-09): Index pada kolom FK dan filter paling sering dipakai.
    // Tanpa index ini, setiap query history melakukan full table scan.
    indexes: [
      { fields: ['user_id_fk'] },                            // Filter per toko
      { fields: ['transaction_datetime'] },                  // Filter range tanggal
      { fields: ['user_id_fk', 'transaction_datetime'] },    // Composite: filter toko + tanggal (paling sering)
      { fields: ['status'] }                                 // Filter status='success'
    ]
  });

  Transaction.associate = (models) => {
    Transaction.hasMany(models.TransactionDetail, { foreignKey: 'transaction_id_fk' });
    Transaction.belongsTo(models.User, { foreignKey: 'user_id_fk' });
    Transaction.belongsTo(models.User, { foreignKey: 'cashier_id', as: 'Cashier' });
  };

  const checkTimeAnomaly = async (transaction, options) => {
    const { StoreSettings, AnomalyTicket, User } = sequelize.models;
    const user = await User.findByPk(transaction.cashier_id);
    if (!user || user.role === 'owner') return;

    const settings = await StoreSettings.findOne({ where: { user_id_fk: transaction.user_id_fk } });
    if (!settings) return;

    const moment = require('moment-timezone');
    const trxTime = moment(transaction.transaction_datetime).tz('Asia/Jakarta').format('HH:mm:ss');
    const openHour = settings.open_hour;
    const closeMoment = moment.tz(`1970-01-01 ${settings.close_hour}`, 'YYYY-MM-DD HH:mm:ss', 'Asia/Jakarta');
    closeMoment.add(settings.grace_period_minutes, 'minutes');
    const closeHourWithGrace = closeMoment.format('HH:mm:ss');

    let isOutsideHours = false;
    if (openHour <= closeHourWithGrace) {
        isOutsideHours = trxTime < openHour || trxTime > closeHourWithGrace;
    } else {
        isOutsideHours = trxTime < openHour && trxTime > closeHourWithGrace;
    }

    if (isOutsideHours) {
        const existing = await AnomalyTicket.findOne({
            where: { reference_id: transaction.transaction_id, anomaly_type: 'TIME' }
        });
        if (!existing) {
            await AnomalyTicket.create({
                user_id_fk: transaction.user_id_fk,
                anomaly_type: 'TIME',
                reference_id: transaction.transaction_id,
                description: `Di luar jam operasional (${openHour} - ${closeHourWithGrace})`,
                status: 'OPEN'
            }, { transaction: options.transaction });
        }
    } else {
        await AnomalyTicket.update({ status: 'RESOLVED', resolution_note: 'Sistem: Waktu transaksi telah diperbaiki menjadi wajar.' }, {
            where: { reference_id: transaction.transaction_id, anomaly_type: 'TIME', status: 'OPEN' },
            transaction: options.transaction
        });
    }
  };

  Transaction.addHook('afterCreate', async (transaction, options) => {
      // FIX (MEDIUM-01): Hook error TIDAK boleh membatalkan transaksi yang sudah berhasil.
      // Anomaly detection adalah operasi sekunder — jika gagal, log dan lanjutkan.
      try {
          await checkTimeAnomaly(transaction, options);
      } catch (hookErr) {
          console.error('[Hook] afterCreate checkTimeAnomaly gagal (non-fatal):', {
              transaction_id: transaction.transaction_id,
              error: hookErr.message
          });
      }
  });
  
  Transaction.addHook('afterUpdate', async (transaction, options) => {
      try {
          if (transaction.status === 'cancelled') {
             const { AnomalyTicket } = sequelize.models;
             await AnomalyTicket.update({ status: 'DISMISSED', resolution_note: 'Sistem: Transaksi telah di-Void/Dibatalkan' }, {
                 where: { reference_id: transaction.transaction_id, anomaly_type: 'TIME', status: 'OPEN' },
                 transaction: options.transaction
             });
          } else {
             await checkTimeAnomaly(transaction, options);
          }
      } catch (hookErr) {
          console.error('[Hook] afterUpdate checkTimeAnomaly gagal (non-fatal):', {
              transaction_id: transaction.transaction_id,
              error: hookErr.message
          });
      }
  });

  Transaction.addHook('afterDestroy', async (transaction, options) => {
      try {
          const { AnomalyTicket } = sequelize.models;
          await AnomalyTicket.update({ status: 'DISMISSED', resolution_note: 'Sistem: Transaksi telah di-Void/Dihapus' }, {
              where: { reference_id: transaction.transaction_id, anomaly_type: 'TIME', status: 'OPEN' },
              transaction: options.transaction
          });
      } catch (hookErr) {
          console.error('[Hook] afterDestroy AnomalyTicket update gagal (non-fatal):', {
              transaction_id: transaction.transaction_id,
              error: hookErr.message
          });
      }
  });

  return Transaction;
};