
import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container, Alert } from 'react-bootstrap';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './components/Home';
import Search from './components/Search';
import AddPet from './components/AddPet';
import Profile from './components/Profile';
import Login from './components/Login';
import Registration from './components/Registration';
import PetModal from './components/PetModal';
import EditAdModal from './components/EditAdModal';
import { AuthProvider, useAuth } from './context/AuthContext';

function AppContent() {
  const { deleteUserAd, updateUserAd, isAuthenticated } = useAuth();
  const [showPetModal, setShowPetModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [selectedAd, setSelectedAd] = useState(null);
  const [error, setError] = useState('');

  const showPetDetails = (pet) => {
    if (pet) {
      setSelectedPet(pet);
      setShowPetModal(true);
    }
  };

  const editAd = (ad) => {
    if (ad) {
      setSelectedAd(ad);
      setShowEditModal(true);
    }
  };

  const deleteAdvertisement = async (id) => {
    try {
      await deleteUserAd(id);
      alert('Объявление успешно удалено!');
    } catch (error) {
      setError('Ошибка при удалении объявления: ' + error.message);
      console.error(error);
    }
  };

  const saveEditedAd = async (updatedData) => {
    if (selectedAd && selectedAd.id) {
      try {
        await updateUserAd(selectedAd.id, updatedData);
        setShowEditModal(false);
        setSelectedAd(null);
        alert('Объявление успешно обновлено!');
      } catch (error) {
        setError('Ошибка при обновлении объявления: ' + error.message);
        console.error(error);
      }
    }
  };

  return (
    <>
      <Header />
      <Container className="my-4">
        {error && (
          <Alert variant="danger" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}
        <Routes>
          <Route path="/" element={<Home showPetDetails={showPetDetails} />} />
          <Route path="/search" element={<Search showPetDetails={showPetDetails} />} />
          <Route 
            path="/add-pet" 
            element={
              isAuthenticated ? <AddPet /> : <Navigate to="/login" replace />
            } 
          />
          <Route 
            path="/profile" 
            element={
              isAuthenticated ? (
                <Profile 
                  editAd={editAd} 
                  deleteAdvertisement={deleteAdvertisement} 
                />
              ) : <Navigate to="/login" replace />
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
      <Footer />
      
      {selectedPet && (
        <PetModal 
          pet={selectedPet} 
          show={showPetModal} 
          onHide={() => {
            setShowPetModal(false);
            setSelectedPet(null);
          }} 
        />
      )}
      
      <EditAdModal 
        ad={selectedAd} 
        show={showEditModal} 
        onHide={() => {
          setShowEditModal(false);
          setSelectedAd(null);
        }} 
        onSave={saveEditedAd}
      />
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
