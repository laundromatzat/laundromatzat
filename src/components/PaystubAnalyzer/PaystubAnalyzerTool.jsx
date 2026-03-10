import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import HoursEntryModal from './HoursEntryModal';
import apiService from '../../services/apiService'; // Assuming this path

// Example styled components (you'll have your own for the main tool)
const ToolContainer = styled.div`
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
`;

const ProfileSection = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap; /* Allow wrapping on small screens */
`;

const ProfilePicture = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-right: 20px;
  border: 2px solid #ddd;
  flex-shrink: 0;

  @media (max-width: 768px) {
    margin-bottom: 15px;
    margin-right: 0;
  }
`;

const ProfilePicturePlaceholder = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.8em;
  color: #666;
  text-align: center;
  border: 1px dashed #ccc;
  margin-right: 20px;
  cursor: pointer;
  flex-shrink: 0;

  &:hover {
    background-color: #e6e6e6;
  }
  @media (max-width: 768px) {
    margin-bottom: 15px;
    margin-right: 0;
  }
`;

const ProfileInfo = styled.div`
  h2 {
    margin: 0;
    font-size: 1.8em;
  }
  p {
    margin: 5px 0 0;
    color: #555;
  }
  @media (max-width: 768px) {
    text-align: center;
    width: 100%;
    margin-bottom: 15px;
  }
`;

const UploadButton = styled.label`
  background-color: #007bff;
  color: white;
  padding: 8px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9em;
  margin-left: 15px;
  &:hover {
    background-color: #0056b3;
  }
  @media (max-width: 768px) {
    margin: 0 auto; /* Center button on mobile */
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const PaystubList = styled.div`
  margin-top: 20px;
`;

const PaystubCard = styled.div`
  border: 1px solid #eee;
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap; /* Allow content to wrap */

  strong {
    font-size: 1.1em;
  }

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    div {
      width: 100%;
      margin-bottom: 10px;
    }
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 10px;

  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-end;
  }
`;

const ErrorMessage = styled.div`
  color: red;
  margin-top: 10px;
  text-align: center;
  width: 100%; /* Take full width for error messages */
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(0, 0, 0, 0.1);
  border-left-color: #007bff;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
  margin-left: 10px; /* Adjust margin for spinner */

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;



function PaystubAnalyzerTool() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPaystubId, setSelectedPaystubId] = useState(null);
  const [paystubs, setPaystubs] = useState([]); // State to hold paystub data
  const [userProfile, setUserProfile] = useState(null); // State for user profile and picture
  const [profilePicLoading, setProfilePicLoading] = useState(false);
  const [profilePicError, setProfilePicError] = useState(null);

  // Function to fetch paystubs and user profile
  const fetchData = useCallback(async () => {
    try {
      // Assuming you have API endpoints to fetch paystubs and user data
      const paystubsResponse = await apiService.getPaystubs(); // Example API call
      setPaystubs(paystubsResponse.data);

      const userProfileResponse = await apiService.getUserProfile(); // Example API call (for 'me')
      setUserProfile(userProfileResponse.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error display globally or per section
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenModal = (paystubId) => {
    setSelectedPaystubId(paystubId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPaystubId(null);
  };

  const handleHoursSaved = () => {
    // Re-fetch paystubs or just the specific paystub to update displayed hours
    fetchData(); // Simplest approach: re-fetch all relevant data
  };

  const handleProfilePictureUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setProfilePicLoading(true);
    setProfilePicError(null);

    const formData = new FormData();
    formData.append('profilePicture', file);

    try {
      if (!userProfile || !userProfile.id) {
        throw new Error('User profile not loaded, cannot upload picture.');
      }
      // Assuming apiService.uploadProfilePicture expects userId and formData and returns updated user profile
      const updatedUser = await apiService.uploadProfilePicture(userProfile.id, formData);
      setUserProfile(updatedUser.data.data); // Backend returns data nested under .data
      console.log('Profile picture uploaded successfully:', updatedUser.data.profilePictureUrl);
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      setProfilePicError(error.response?.data?.message || 'Failed to upload profile picture.');
    } finally {
      setProfilePicLoading(false);
    }
  };


  return (
    <ToolContainer>
      <h1>Paystub Analyzer</h1>

      {userProfile && (
        <ProfileSection>
          {userProfile.profilePictureUrl ? (
            <ProfilePicture src={userProfile.profilePictureUrl} alt="Profile" />
          ) : (
            <ProfilePicturePlaceholder onClick={() => document.getElementById('profilePicUpload').click()}>
              Upload Photo
            </ProfilePicturePlaceholder>
          )}
          <ProfileInfo>
            <h2>{userProfile.name || 'User Name'}</h2>
            <p>{userProfile.email || 'user@example.com'}</p>
          </ProfileInfo>
          <UploadButton htmlFor="profilePicUpload">
            {profilePicLoading ? <LoadingSpinner /> : 'Change Photo'}
            <HiddenFileInput
              id="profilePicUpload"
              type="file"
              accept="image/*"
              onChange={handleProfilePictureUpload}
              disabled={profilePicLoading}
            />
          </UploadButton>
          {profilePicError && <ErrorMessage>{profilePicError}</ErrorMessage>}
        </ProfileSection>
      )}


      <p>Upload your paystubs and enter your hours to analyze your earnings.</p>
      {/* Example Paystub List */}
      <PaystubList>
        <h3>Your Paystubs</h3>
        {paystubs.length === 0 ? (
          <p>No paystubs found. Upload one to get started!</p>
        ) : (
          paystubs.map((stub) => (
            <PaystubCard key={stub.id}>
              <div>
                <strong>Pay Period: {stub.startDate} - {stub.endDate}</strong>
                <p>Status: {stub.status}</p>
                {/* Display hours if available and valid */}
                {stub.hours && stub.hours.length > 0 ? (
                  <p>Hours Entered: {stub.hours.reduce((sum, h) => sum + h.hours, 0)}</p>
                ) : (
                  <p>Hours: Not entered / Invalid dates</p> // This is where "invalid dates" might appear
                )}
              </div>
              <ActionButtons>
                <button onClick={() => handleOpenModal(stub.id)}>Enter Hours</button>
                <button>View Details</button>
              </ActionButtons>
            </PaystubCard>
          ))
        )}
      </PaystubList>


      <HoursEntryModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        paystubId={selectedPaystubId}
        onHoursSaved={handleHoursSaved} // Callback for when hours are successfully saved
      />
    </ToolContainer>
  );
}

export default PaystubAnalyzerTool;
