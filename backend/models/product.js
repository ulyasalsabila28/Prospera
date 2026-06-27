module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    product_name: {
      type: DataTypes.STRING(150),
      allowNull: false
    },
    product_cost: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    product_price: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    product_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    category_id_fk: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    expired_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    min_display_qty: {
      type: DataTypes.INTEGER,
      defaultValue: 5,
      allowNull: false
    },
    calculated_reorder_point: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      allowNull: false
    }
  }, {
    tableName: 'Products',
    timestamps: true,
    paranoid: true, // Mengaktifkan soft delete (deletedAt)
    // FIX (HIGH-09): Index pada kolom filter utama.
    // Setiap query produk difilter oleh user_id_fk (SaaS tenant isolation).
    indexes: [
      { fields: ['user_id_fk'] },          // Filter per toko (dipakai di SETIAP query)
      { fields: ['category_id_fk'] },      // JOIN ke Category
      { fields: ['expired_date'] },        // Query SmartExpiry (filter produk mendekati kadaluarsa)
      { fields: ['createdAt'] }            // Filter range tanggal
    ]
  });

  Product.associate = (models) => {
    Product.hasMany(models.TransactionDetail, { foreignKey: 'product_id_fk' });
    Product.belongsTo(models.Category, { foreignKey: 'category_id_fk' });
  };

  return Product;
};