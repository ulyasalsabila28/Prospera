module.exports = (sequelize, DataTypes) => {
  const Product = sequelize.define('Product', {
    product_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id_fk: {
      type: DataTypes.INTEGER
    },
    product_name: {
      type: DataTypes.STRING(150) 
    },
    product_cost: {
      type: DataTypes.INTEGER 
    },
    product_price: {
      type: DataTypes.INTEGER 
    },
    product_stock: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  }, {
    tableName: 'Products',
    timestamps: false
  });

  return Product;
};