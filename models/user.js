module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(100) 
    },
    email: {
      type: DataTypes.STRING(100), 
      unique: true 
    },
    password: {
      type: DataTypes.STRING(255)
    }
  }, {
    tableName: 'Users',
    timestamps: false
  });

  return User;
};