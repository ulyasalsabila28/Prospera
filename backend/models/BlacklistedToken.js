module.exports = (sequelize, DataTypes) => {
  const BlacklistedToken = sequelize.define('BlacklistedToken', {
    jti: {
      type: DataTypes.STRING(36),
      primaryKey: true,
      allowNull: false
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'BlacklistedTokens',
    timestamps: false
  });

  return BlacklistedToken;
};
