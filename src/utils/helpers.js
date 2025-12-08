// src/utils/helpers.js
import { districts } from './constants';

export const getAnimalType = (type) => {
  const types = {
    'кошка': 'Кошка',
    'собака': 'Собака',
    'птица': 'Птица',
    'грызун': 'Грызун',
    'другое': 'Другое'
  };
  return types[type] || 'Другое';
};

export const getDistrictName = (districtCode) => {
  if (!districtCode) return 'Район не указан';
  
  const districtStr = districtCode.toString();
  return districts[districtStr] || 'Район не указан';
};

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\d\s()+.-]+$/;
  return re.test(phone);
};

export const validateName = (name) => {
  const re = /^[а-яА-ЯёЁ\s-]+$/;
  return re.test(name);
};

export const validatePassword = (password) => {
  const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{7,}$/;
  return re.test(password);
};

// Функция для форматирования даты
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  } catch (e) {
    return dateString;
  }
};

// Функция для получения первого изображения животного
export const getFirstPetImage = (pet) => {
  if (!pet) return 'https://via.placeholder.com/300x200?text=Нет+фото';
  
  if (pet.photos && pet.photos.length > 0 && pet.photos[0]) {
    return pet.photos[0];
  }
  
  // Фолбэк по типу животного
  const type = pet.type || 'другое';
  const fallbackImages = {
    'кошка': 'https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=600&auto=format&fit=crop',
    'собака': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&auto=format&fit=crop',
    'птица': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&auto=format&fit=crop',
    'грызун': 'https://images.unsplash.com/photo-1567254790685-6f6b4690f1f9?w=600&auto=format&fit=crop',
    'другое': 'https://images.unsplash.com/photo-1589652043056-ba1a2c4830a5?w=600&auto=format&fit=crop'
  };
  
  return fallbackImages[type] || 'https://via.placeholder.com/600x400?text=Животное';
};