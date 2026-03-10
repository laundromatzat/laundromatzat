'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists to avoid errors on re-running migration
    const tableDefinition = await queryInterface.describeTable('users');
    if (!tableDefinition.profilePictureUrl) {
      await queryInterface.addColumn('users', 'profilePictureUrl', {
        type: Sequelize.STRING(500), // Increased length for S3 URLs
        allowNull: true,
        defaultValue: null,
      });
    } else {
      // If column exists, ensure its type and length are correct
      await queryInterface.changeColumn('users', 'profilePictureUrl', {
        type: Sequelize.STRING(500),
        allowNull: true,
        defaultValue: null,
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Only remove if it was added or modified by this migration and we are sure
    // it's not needed by other parts of the system.
    // For simplicity, we'll remove it, but in a real system, you might revert to a previous state.
    await queryInterface.removeColumn('users', 'profilePictureUrl');
  }
};
