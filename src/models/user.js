import { DataTypes } from 'sequelize';
// Assuming `sequelize` instance is imported or passed

export default (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Add/Modify this field
    profilePictureUrl: {
      type: DataTypes.STRING(500), // S3 URLs can be long, 500 characters is a safe bet
      allowNull: true, // Allow users to not have a profile picture
      defaultValue: null,
    },
    // Other fields...
  }, {
    tableName: 'users',
    timestamps: true,
  });

  // Define associations if any
  // User.associate = (models) => {
  //   User.hasMany(models.Paystub, { foreignKey: 'userId' });
  //   User.hasMany(models.Hours, { foreignKey: 'userId' }); // Assuming hours are linked to user
  // };

  return User;
};
