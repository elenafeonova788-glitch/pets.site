// Файл: components/PetModal.jsx
import React from 'react';
import { Modal, Carousel, Row, Col, Button, Badge } from 'react-bootstrap';
import { getAnimalType, getDistrictName, getAllPetImages } from '../utils/helpers';

const PetModal = ({ pet, show, onHide }) => {
  if (!pet) {
    return null;
  }

  const isFromAPI = pet.originalData && !pet.userAdded;
  const isLegacy = pet.isLegacy;
  
  const images = getAllPetImages(pet);
  
  const getPetPageURL = () => {
    if (isLegacy && pet.originalData) {
      return `https://tmpgmv.github.io/pet/#/pets/${pet.id}`;
    }
    return null;
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          Детали животного
          {isFromAPI && (
            <Badge bg="info" className="ms-2">
              Из базы данных
            </Badge>
          )}
          {isLegacy && (
            <Badge bg="warning" className="ms-2">
              Из старой базы
            </Badge>
          )}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div id="petDetailsContent">
          {images.length > 0 ? (
            <Carousel className="pet-details-carousel mb-3">
              {images.map((photo, index) => (
                <Carousel.Item key={index}>
                  <img 
                    src={photo} 
                    className="d-block w-100" 
                    alt={`Фото животного ${index + 1}`} 
                    style={{ 
                      height: '300px', 
                      objectFit: 'cover',
                      backgroundColor: '#f5f5f5'
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/600x400?text=Нет+фото';
                    }}
                  />
                </Carousel.Item>
              ))}
            </Carousel>
          ) : (
            <p className="text-center text-muted">Фотографии отсутствуют</p>
          )}
          
          <Row>
            <Col md={6}>
              <p><strong>Тип животного:</strong> {getAnimalType(pet.type)}</p>
              <p><strong>Статус:</strong> 
                <Badge bg={pet.status === 'lost' ? 'warning' : 'success'} className="ms-2">
                  {pet.status === 'lost' ? 'Потерян' : 'Найден'}
                </Badge>
              </p>
              <p><strong>Кличка:</strong> {pet.name || 'Не указана'}</p>
              <p><strong>Район:</strong> {getDistrictName(pet.district)}</p>
            </Col>
            <Col md={6}>
              <p><strong>Дата:</strong> {pet.date || 'Не указана'}</p>
              <p><strong>Клеймо:</strong> {pet.mark || 'Не указано'}</p>
              <p><strong>Контактное лицо:</strong> {pet.author || pet.userName || 'Не указано'}</p>
              <p><strong>Телефон:</strong> {pet.userPhone || 'Не указан'}</p>
              <p><strong>Email:</strong> {pet.userEmail || 'Не указан'}</p>
            </Col>
          </Row>
          
          <div className="mt-3">
            <p><strong>Описание:</strong></p>
            <p>{pet.description || 'Нет описания'}</p>
          </div>
          
          {(isFromAPI || isLegacy) && (
            <div className="mt-3 p-2 bg-light rounded">
              <small className="text-muted">
                {isLegacy ? (
                  <>Это объявление из старой базы данных животных.</>
                ) : (
                  <>Это объявление загружено из общей базы данных животных.</>
                )}
                <br />
                {getPetPageURL() && (
                  <a 
                    href={getPetPageURL()} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-decoration-none"
                  >
                    Посмотреть оригинал на сайте
                  </a>
                )}
              </small>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Закрыть
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PetModal;