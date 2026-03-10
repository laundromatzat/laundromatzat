import { DataTypes } from 'sequelize';
// Assuming `sequelize` instance is imported or passed

export default (sequelize) => {
  const Hours = sequelize.define('Hours', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'users', // Assumes 'users' is the table name for User model
        key: 'id',
      },
    },
    paystubId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'paystubs', // Assumes 'paystubs' is the table name for Paystub model
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY, // Store only the date part (YYYY-MM-DD)
      allowNull: false,
    },
    dayOfWeek: {
      type: DataTypes.ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'),
      allowNull: false,
    },
    hours: {
      type: DataTypes.FLOAT, // Allow decimal hours (e.g., 8.5)
      allowNull: false,
      defaultValue: 0,
    },
    // Other fields if any (e.g., description)
  }, {
    tableName: 'hours',
    timestamps: true,
    // Add a unique constraint to prevent duplicate entries for the same user, paystub, date, and dayOfWeek
    // This is important for findOrCreate to work correctly when updating, as it ensures a unique record.
    indexes: [
      {
        unique: true,
        fields: ['userId', 'paystubId', 'date', 'dayOfWeek']
      }
    ]
  });

  Hours.associate = (models) => {
    Hours.belongsTo(models.User, { foreignKey: 'userId' });
    Hours.belongsTo(models.Paystub, { foreignKey: 'paystubId' });
  };

  return Hours;
};
