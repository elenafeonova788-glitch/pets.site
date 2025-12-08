import React, { useState } from 'react';
import { Button, Spinner, Alert } from 'react-bootstrap';
import { getAllLegacyPets } from '../utils/legacyApiService';

const LegacyImportButton = ({ onImportComplete }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleImport = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      const legacyPets = await getAllLegacyPets();
      
      if (legacyPets && legacyPets.length > 0) {
        setSuccess(`Успешно загружено ${legacyPets.length} животных из старой базы!`);
        
        if (onImportComplete) {
          onImportComplete(legacyPets);
        }
      } else {
        setError('Не удалось загрузить животных из старой базы');
      }
    } catch (error) {
      console.error('Import error:', error);
      setError('Ошибка при загрузке животных из старой базы');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-3">
      {error && <Alert variant="danger" className="mb-2">{error}</Alert>}
      {success && <Alert variant="success" className="mb-2">{success}</Alert>}
      
      <Button 
        variant="outline-info" 
        onClick={handleImport}
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            Загрузка...
          </>
        ) : (
          '📂 Загрузить животных из старой базы'
        )}
      </Button>
      <small className="text-muted d-block mt-1">
        Загружает всех животных с сайта tmpgmv.github.io/pet
      </small>
    </div>
  );
};

export default LegacyImportButton;