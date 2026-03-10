import React, { useState, useEffect } from 'react';
import styled from 'styled-components'; // Assuming styled-components for UI
import apiService from '../../services/apiService'; // Assuming this path

// Styled components for the modal
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  width: 90%; /* Responsive width */
  max-width: 600px; /* Max width for larger screens */
  max-height: 90vh; /* Max height to fit viewport */
  overflow-y: auto; /* Allow scrolling content if it exceeds max-height, but try to prevent */

  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: 95%; /* Wider on smaller screens */
    padding: 15px;
    margin: 10px; /* Add some margin to prevent edge-to-edge on very small screens */
    max-height: calc(100vh - 20px); /* Adjust max-height for margin */
  }
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  h3 {
    margin: 0;
    font-size: 1.5em;
    @media (max-width: 768px) {
      font-size: 1.2em;
    }
  }
  button {
    background: none;
    border: none;
    font-size: 1.5em;
    cursor: pointer;
  }
`;

const HoursGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* Two columns on larger screens */
  gap: 15px; /* Spacing between day inputs */
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr; /* Single column on mobile */
    gap: 10px; /* Reduced spacing */
  }
`;

const DayInputWrapper = styled.div`
  display: flex;
  flex-direction: column;
  label {
    margin-bottom: 5px;
    font-weight: bold;
    font-size: 0.9em;
  }
  input {
    padding: 8px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 1em;
    @media (max-width: 768px) {
      padding: 6px;
      font-size: 0.9em;
    }
  }
`;

const ModalFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;

  button {
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1em;
    @media (max-width: 768px) {
      padding: 8px 15px;
      font-size: 0.9em;
    }
  }
`;

const SubmitButton = styled.button`
  background-color: #007bff;
  color: white;
  border: none;
  &:hover {
    background-color: #0056b3;
  }
`;

const CancelButton = styled.button`
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ccc;
  &:hover {
    background-color: #e0e0e0;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  margin-top: 10px;
  text-align: center;
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #007bff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin: 0 auto;

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;


const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function HoursEntryModal({ isOpen, onClose, paystubId, onHoursSaved }) {
  const [hours, setHours] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize hours state when modal opens or paystubId changes
  useEffect(() => {
    if (isOpen) {
      setHours(
        daysOfWeek.reduce((acc, day) => {
          // You might fetch existing hours for this paystub here if editing
          acc[day.toLowerCase()] = '';
          return acc;
        }, {})
      );
      setError(null); // Clear errors on open
    }
  }, [isOpen, paystubId]);

  const handleHourChange = (day, value) => {
    // Basic validation: allow only numbers and one decimal point
    if (/^\d*\.?\d*$/.test(value) || value === '') {
      setHours((prevHours) => ({
        ...prevHours,
        [day.toLowerCase()]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // In a real application, the pay period start date would be passed or derived from the paystubId.
    // For this example, let's assume `paystubId` has an associated start date
    // and we are simply calculating the specific date for each day of the week based on that.
    // Since we don't have the `paystubStartDate` here, we'll use a placeholder `today`
    // and adjust it to be the start of the week for consistency. This needs proper implementation
    // depending on how paystub periods are defined.
    const getDaySpecificDate = (dayName) => {
      const today = new Date();
      const dayIndex = daysOfWeek.findIndex(d => d.toLowerCase() === dayName.toLowerCase());
      // Adjust to the start of the current week (e.g., Monday)
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1)); // Adjust to Monday

      const targetDate = new Date(startOfWeek);
      targetDate.setDate(startOfWeek.getDate() + dayIndex);
      return targetDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }

    const hoursData = Object.entries(hours)
      .filter(([, value]) => value !== '') // Only send days with entered hours
      .map(([day, value]) => ({
        dayOfWeek: day,
        hours: parseFloat(value),
        paystubId: paystubId, // Link to the specific paystub
        date: getDaySpecificDate(day) // Dynamically generate date for the week
      }));

    if (hoursData.length === 0) {
      setError('Please enter some hours before submitting.');
      setLoading(false);
      return;
    }

    try {
      // Assuming apiService.saveHours expects an array of hour entries
      await apiService.saveHours(hoursData);
      onHoursSaved && onHoursSaved(); // Callback to parent to refresh data
      onClose(); // Close the modal on success
    } catch (err) {
      console.error('Failed to save hours:', err);
      setError(err.response?.data?.message || 'Failed to save hours. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <h3>Enter Hours for Paystub</h3>
          <button onClick={onClose}>&times;</button>
        </ModalHeader>
        <form onSubmit={handleSubmit}>
          <HoursGrid>
            {daysOfWeek.map((day) => (
              <DayInputWrapper key={day}>
                <label htmlFor={`hours-${day.toLowerCase()}`}>{day}</label>
                <input
                  id={`hours-${day.toLowerCase()}`}
                  type="text" // Use text to allow partial decimals, then parse to float
                  value={hours[day.toLowerCase()]}
                  onChange={(e) => handleHourChange(day, e.target.value)}
                  placeholder="e.g., 8.5"
                  inputMode="decimal" // Hint for mobile keyboards
                />
              </DayInputWrapper>
            ))}
          </HoursGrid>

          {error && <ErrorMessage>{error}</ErrorMessage>}
          {loading && <LoadingSpinner />}

          <ModalFooter>
            <CancelButton type="button" onClick={onClose} disabled={loading}>
              Cancel
            </CancelButton>
            <SubmitButton type="submit" disabled={loading}>
              Submit
            </SubmitButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </ModalOverlay>
  );
}

export default HoursEntryModal;
