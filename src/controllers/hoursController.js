import { sequelize } from '../models'; // Assuming you export the sequelize instance from your models index
import Hours from '../models/hours'; // Assuming Hours model is directly imported
// import Paystub from '../models/paystub'; // Assuming Paystub model for association (if needed for updates)

const hoursController = {
  async saveHours(req, res) {
    // Assumes req.user is set by authMiddleware
    const userId = req.user.id;
    const hourEntries = req.body.hours; // This will be the validated and parsed array

    if (!hourEntries || hourEntries.length === 0) {
      return res.status(400).json({ message: 'No hour entries provided.' });
    }

    // Wrap in a transaction to ensure atomicity
    const t = await sequelize.transaction();
    try {
      const savedHours = [];
      for (const entry of hourEntries) {
        // Find or create the Hours entry
        // The unique constraint on (userId, paystubId, date, dayOfWeek) makes findOrCreate ideal here.
        const [hoursInstance, created] = await Hours.findOrCreate({
          where: {
            userId: userId,
            paystubId: entry.paystubId,
            date: entry.date, // Use the parsed Date object from validator
            dayOfWeek: entry.dayOfWeek,
          },
          defaults: {
            hours: entry.hours,
          },
          transaction: t,
        });

        if (!created) {
          // If it exists, update the hours
          hoursInstance.hours = entry.hours;
          await hoursInstance.save({ transaction: t });
        }
        savedHours.push(hoursInstance);
      }

      // Optionally, update the paystub status or summary based on hours being entered
      // For example, mark paystub as 'hours_entered'
      // const paystubIds = [...new Set(hourEntries.map(e => e.paystubId))];
      // for (const paystubId of paystubIds) {
      //   await Paystub.update({ status: 'Hours Entered' }, { 
      //     where: { id: paystubId, userId: userId }, 
      //     transaction: t 
      //   });
      // }

      await t.commit(); // Commit the transaction if all operations succeed

      res.status(200).json({ message: 'Hours saved successfully.', savedHours: savedHours.map(h => h.toJSON()) });
    } catch (error) {
      await t.rollback(); // Rollback the transaction on error
      console.error('Error saving hours:', error); // Log detailed error for debugging
      // Provide more specific error messages if possible
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({ message: 'Duplicate hour entry for the same day and paystub. If you want to update, ensure each day is unique.' });
      }
      res.status(500).json({ message: 'Failed to save hours. Please try again.', error: error.message });
    }
  },

  // Other hours-related controller methods...
  // async getHoursForPaystub(req, res) { ... }
};

export default hoursController;
