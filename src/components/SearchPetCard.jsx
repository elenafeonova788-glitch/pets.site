import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { getAnimalType, getDistrictName, getFirstPetImage } from '../utils/helpers'; 

const SearchPetCard = ({ pet, onShowDetails }) => {
  // Функция для получения изображения с fallback
  const getImageUrl = () => {
    if (!pet) return 'https://via.placeholder.com/300x200?text=Нет+фото';
    
    // Используем функцию getFirstPetImage из helpers
    const imageUrl = getFirstPetImage(pet);
    
    return imageUrl;
  };

  const imageUrl = getImageUrl();

  return (
    <Card className="search-result-card shadow-sm mb-3">
      <Card.Body className="p-3">
        <div className="row align-items-center">
          <div className="col-md-4">
            <img 
              src={imageUrl} 
              className="pet-image-preview rounded w-100" 
              alt={getAnimalType(pet.type)} 
              style={{ 
                height: '150px', 
                objectFit: 'cover',
                backgroundColor: '#f5f5f5'
              }}
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/150x150?text=Нет+фото';
              }}
            />
          </div>
          <div className="col-md-8">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <h6 className="mb-1">
                {getAnimalType(pet.type)} {pet.name ? `- ${pet.name}` : ''}
              </h6>
              {pet.registered && (
                <Badge bg="info" className="ms-2">
                  Зарегистрированный
                </Badge>
              )}
            </div>
            <p className="mb-1 small">{pet.description && pet.description.length > 100 ? `${pet.description.substring(0, 100)}...` : (pet.description || 'Нет описания')}</p>
            <div className="d-flex justify-content-between align-items-center mt-2">
              <small className="text-muted">
                Район: {getDistrictName(pet.district)} | Дата: {pet.date || 'Не указана'}
              </small>
              <Button variant="outline-primary" size="sm" onClick={onShowDetails}>
                Подробнее
              </Button>
            </div>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default SearchPetCard;