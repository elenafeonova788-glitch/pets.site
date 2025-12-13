import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { getAnimalType, getDistrictName, getFirstPetImage } from '../utils/helpers'; 

const PetCard = ({ pet, onShowDetails }) => {
  // Функция для получения изображения с fallback
  const getImageUrl = () => {
    if (!pet) return 'https://via.placeholder.com/300x200?text=Нет+фото';
    
    console.log('PetCard debug for pet:', {
      id: pet.id,
      type: pet.type,
      hasPhotos: pet.photos && pet.photos.length > 0,
      photosCount: pet.photos ? pet.photos.length : 0,
      photos: pet.photos,
      originalData: pet.originalData ? 'exists' : 'none',
      fromAPI: pet.isFromAPI,
      hasImageField: !!pet.image
    });
    
    // Используем функцию getFirstPetImage из helpers
    const imageUrl = getFirstPetImage(pet);
    
    console.log(`PetCard ${pet.id} final image URL:`, imageUrl);
    
    return imageUrl;
  };

  const imageUrl = getImageUrl();

  return (
    <Card className="card-custom shadow-sm h-100">
      <Card.Body className="p-3 d-flex flex-column">
        <div className="position-relative flex-grow-0">
          <img 
            src={imageUrl} 
            className="card-img-top pet-card-image mb-3" 
            alt={getAnimalType(pet.type)} 
            style={{ 
              height: '200px', 
              width: '100%', 
              objectFit: 'cover',
              backgroundColor: '#f5f5f5'
            }}
            onError={(e) => {
              console.error(`Error loading image for pet ${pet.id}:`, e.target.src);
              // Если изображение не загрузилось, используем fallback
              e.target.src = 'https://via.placeholder.com/300x200?text=Нет+фото';
              
              // Пробуем загрузить fallback изображение по типу
              setTimeout(() => {
                const fallbackImages = {
                  'кошка': 'https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=600&h=400&fit=crop',
                  'собака': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop',
                  'птица': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop',
                  'грызун': 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=600&h=400&fit=crop',
                  'лошадь': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop',
                  'попугай': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop',
                  'другое': 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&h=400&fit=crop',
                };
                
                const fallbackImage = fallbackImages[pet.type] || 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&h=400&fit=crop';
                e.target.src = fallbackImage;
              }, 100);
            }}
          />
          {/* Убраны бейджи "Зарегистрированный" и "Из базы" */}
          {pet.isLocal && (
            <Badge 
              bg="warning" 
              className="position-absolute top-0 start-0 m-2"
            >
              Локальное
            </Badge>
          )}
        </div>
        <div className="flex-grow-1">
          <div className="row mb-1">
            <div className="col-5 text-dark fw-bold">Вид животного:</div>
            <div className="col-7">{getAnimalType(pet.type)}</div>
          </div>
          <div className="row mb-1">
            <div className="col-5 text-dark fw-bold">Район:</div>
            <div className="col-7">{getDistrictName(pet.district)}</div>
          </div>
          <div className="row mb-2">
            <div className="col-5 text-dark fw-bold">Дата:</div>
            <div className="col-7">{pet.date || 'Не указана'}</div>
          </div>
          <div>
            <p className="text-dark fw-bold mb-1">Описание:</p>
            <p className="card-text small">{pet.description && pet.description.length > 100 ? `${pet.description.substring(0, 100)}...` : (pet.description || 'Нет описания')}</p>
          </div>
        </div>
        <Button variant="primary" className="w-100 mt-2" onClick={onShowDetails}>
          Подробнее
        </Button>
      </Card.Body>
    </Card>
  );
};

export default PetCard;