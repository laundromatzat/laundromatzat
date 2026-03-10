'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the table 'hours' exists before attempting to modify it
    const tableDefinition = await queryInterface.describeTable('hours').catch(() => null);
    if (!tableDefinition) {
      console.warn('Table "hours" does not exist. Skipping date column type change and constraint addition.');
      return;
    }

    // 1. Change the column type to DATEONLY if it's not already.
    // This might require a careful migration strategy if there's existing data with timezones.
    // For simplicity, this will drop time information and ensure YYYY-MM-DD format.
    // Note: Use `changeColumn` if the column already exists.
    // You might want to backup your data or handle existing data conversion carefully.
    await queryInterface.changeColumn('hours', 'date', {
      type: Sequelize.DATEONLY,
      allowNull: false,
    });

    // 2. Add unique constraint if it doesn't exist.
    // This ensures that a user can only have one entry for a given paystub, date, and day of the week.
    // This might fail if there are existing duplicate entries in your database.
    // You might need to clean up data before running this migration if duplicates exist.
    try {
      await queryInterface.addConstraint('hours', {
        fields: ['userId', 'paystubId', 'date', 'dayOfWeek'],
        type: 'unique',
        name: 'unique_user_paystub_date_dayofweek_hours'
      });
    } catch (error) {
      // Catch error if the constraint already exists or if there are duplicates
      if (error.name === 'SequelizeUniqueConstraintError' || error.message.includes('unique_user_paystub_date_dayofweek_hours')) {
        console.warn('Unique constraint "unique_user_paystub_date_dayofweek_hours" already exists or duplicate data found. Skipping addConstraint.');
      } else {
        console.error('Error adding unique constraint to hours table:', error.message);
        throw error; // Re-throw if it's an unexpected error
      }
    }
  },

  down: async (queryInterface, Sequelize) => {
    const tableDefinition = await queryInterface.describeTable('hours').catch(() => null);
    if (!tableDefinition) {
      return; // Table does not exist, nothing to revert
    }

    // Revert date column type if needed
    // You'd revert to the previous type, e.g., Sequelize.DATE
    await queryInterface.changeColumn('hours', 'date', {
      type: Sequelize.DATE, // Or whatever the previous type was before this migration
      allowNull: false,
    });

    // Remove the unique constraint
    try {
      await queryInterface.removeConstraint('hours', 'unique_user_paystub_date_dayofweek_hours');
    } catch (error) {
      if (error.message.includes('unique_user_paystub_date_dayofweek_hours')) {
        console.warn('Unique constraint "unique_user_paystub_date_dayofweek_hours" does not exist. Skipping removeConstraint.');
      } else {
        console.error('Error removing unique constraint from hours table:', error.message);
        throw error;
      }
    }
  }
};
