import React from 'react';
import { Card, Button, Badge } from 'react-bootstrap';
import { getAnimalType, getDistrictName } from '../utils/helpers'; 
import { getFirstPetImage } from '../utils/helpers';

const PetCard = ({ pet, onShowDetails }) => {
  const getImageUrl = () => {
    return getFirstPetImage(pet);
  };

  return (
    <Card className="card-custom shadow-sm h-100">
      <Card.Body className="p-3 d-flex flex-column">
        <div className="position-relative flex-grow-0">
          <img 
            src={getImageUrl()} 
            className="card-img-top pet-card-image mb-3" 
            alt={getAnimalType(pet.type)} 
            style={{ height: '200px', width: '100%', objectFit: 'cover' }}
          />
          {pet.registered && (
            <Badge 
              bg="info" 
              className="position-absolute top-0 end-0 m-2"
            >
              Зарегистрированный
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
            <div className="col-7">{pet.date}</div>
          </div>
          <div>
            <p className="text-dark fw-bold mb-1">Описание:</p>
            <p className="card-text small">{pet.description.length > 100 ? `${pet.description.substring(0, 100)}...` : pet.description}</p>
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