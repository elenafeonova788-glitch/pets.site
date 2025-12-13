// Импортируем getFullImageUrl из apiService.js
import { getFullImageUrl } from './apiService';

export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePhone = (phone) => {
  const re = /^[\+]?[0-9\s\-\(\)]+$/;
  return re.test(phone);
};

export const validateName = (name) => {
  const re = /^[а-яА-ЯёЁ\s\-]+$/;
  return re.test(name);
};

export const validatePassword = (password) => {
  // Минимум 7 символов, хотя бы 1 цифра, 1 строчная и 1 заглавная буква
  const re = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{7,}$/;
  return re.test(password);
};

export const getAnimalType = (type) => {
  const typeMap = {
    'кошка': 'Кошка',
    'собака': 'Собака',
    'птица': 'Птица',
    'грызун': 'Грызун',
    'рыба': 'Рыба',
    'рептилия': 'Рептилия',
    'другое': 'Другое',
    'cat': 'Кошка',
    'dog': 'Собака',
    'bird': 'Птица',
    'rodent': 'Грызун'
  };
  return typeMap[type] || type || 'Животное';
};

export const getDistrictName = (districtKey) => {
  const districts = {
    'admiralteyskiy': 'Адмиралтейский',
    'vasileostrovskiy': 'Василеостровский',
    'vyborgskiy': 'Выборгский',
    'kalininskiy': 'Калининский',
    'kirovskiy': 'Кировский',
    'kolpinskiy': 'Колпинский',
    'krasnogvardeyskiy': 'Красногвардейский',
    'krasnoselskiy': 'Красносельский',
    'kronshtadtskiy': 'Кронштадтский',
    'kurortnyy': 'Курортный',
    'moskovskiy': 'Московский',
    'nevskiy': 'Невский',
    'petrogradskiy': 'Петроградский',
    'petrodvortsovyy': 'Петродворцовый',
    'primorskiy': 'Приморский',
    'pushkinskiy': 'Пушкинский',
    'frunzenskiy': 'Фрунзенский',
    'tsentralnyy': 'Центральный'
  };
  return districts[districtKey] || districtKey || 'Не указан';
};

// ДОБАВЛЕНА ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ТЕКСТА СТАТУСА
export const getStatusText = (status) => {
  const statusMap = {
    'found': 'Найден',
    'lost': 'Потерян',
    'active': 'Активно',
    'inactive': 'Не активно',
    'adopted': 'Пристроен'
  };
  return statusMap[status] || status || 'Не указан';
};

// ДОБАВЛЕНА ФУНКЦИЯ ДЛЯ ПОЛУЧЕНИЯ ЦВЕТА СТАТУСА
export const getStatusColor = (status) => {
  const colorMap = {
    'found': 'success', // Зеленый для "Найден"
    'lost': 'warning', // Желтый для "Потерян"
    'active': 'primary',
    'inactive': 'secondary',
    'adopted': 'info'
  };
  return colorMap[status] || 'secondary';
};

export const getFirstPetImage = (pet) => {
  if (!pet) {
    console.log('No pet object provided');
    return 'https://via.placeholder.com/300x200?text=Нет+фото';
  }
  
  console.log('=== Getting image for pet:', pet.id, pet.type);
  console.log('Pet object structure:', Object.keys(pet));
  
  // Проверяем разные источники изображений в правильном порядке
  
  // 1. Проверяем photos массив
  if (pet.photos && Array.isArray(pet.photos) && pet.photos.length > 0) {
    console.log('Checking photos array:', pet.photos);
    for (let i = 0; i < pet.photos.length; i++) {
      const photo = pet.photos[i];
      if (photo && typeof photo === 'string' && photo.trim() !== '') {
        console.log(`Found photo in photos[${i}]:`, photo);
        const fullUrl = getFullImageUrl(photo);
        console.log(`Converted to full URL: ${fullUrl}`);
        if (fullUrl && !fullUrl.includes('placeholder')) {
          return fullUrl;
        }
      } else if (photo && typeof photo === 'object' && photo.url) {
        console.log(`Found photo object in photos[${i}]:`, photo);
        const fullUrl = getFullImageUrl(photo.url);
        console.log(`Converted to full URL: ${fullUrl}`);
        if (fullUrl && !fullUrl.includes('placeholder')) {
          return fullUrl;
        }
      }
    }
  }
  
  // 2. Проверяем поле image
  if (pet.image && typeof pet.image === 'string' && pet.image.trim() !== '') {
    console.log('Found in image field:', pet.image);
    const fullUrl = getFullImageUrl(pet.image);
    console.log(`Converted to full URL: ${fullUrl}`);
    if (fullUrl && !fullUrl.includes('placeholder')) {
      return fullUrl;
    }
  } else if (pet.image && typeof pet.image === 'object' && pet.image.url) {
    console.log('Found image object:', pet.image);
    const fullUrl = getFullImageUrl(pet.image.url);
    console.log(`Converted to full URL: ${fullUrl}`);
    if (fullUrl && !fullUrl.includes('placeholder')) {
      return fullUrl;
    }
  }
  
  // 3. Проверяем отдельные поля фото (photo1, photo2, photo3)
  for (let i = 1; i <= 3; i++) {
    const photoKey = `photo${i}`;
    if (pet[photoKey] && typeof pet[photoKey] === 'string' && pet[photoKey].trim() !== '') {
      console.log(`Found in ${photoKey}:`, pet[photoKey]);
      const fullUrl = getFullImageUrl(pet[photoKey]);
      console.log(`Converted to full URL: ${fullUrl}`);
      if (fullUrl && !fullUrl.includes('placeholder')) {
        return fullUrl;
      }
    }
  }
  
  // 4. Проверяем оригинальные данные из API
  if (pet.originalData) {
    console.log('Checking originalData:', pet.originalData);
    
    // Проверяем photos в originalData
    if (pet.originalData.photos && Array.isArray(pet.originalData.photos) && pet.originalData.photos.length > 0) {
      console.log('Found photos in originalData:', pet.originalData.photos);
      for (let i = 0; i < pet.originalData.photos.length; i++) {
        const photo = pet.originalData.photos[i];
        if (photo && typeof photo === 'string' && photo.trim() !== '') {
          const fullUrl = getFullImageUrl(photo);
          console.log(`Converted originalData photo to full URL: ${fullUrl}`);
          if (fullUrl && !fullUrl.includes('placeholder')) {
            return fullUrl;
          }
        }
      }
    }
    
    // Проверяем image в originalData
    if (pet.originalData.image && typeof pet.originalData.image === 'string' && pet.originalData.image.trim() !== '') {
      const fullUrl = getFullImageUrl(pet.originalData.image);
      console.log(`Converted originalData image to full URL: ${fullUrl}`);
      if (fullUrl && !fullUrl.includes('placeholder')) {
        return fullUrl;
      }
    }
    
    // Проверяем photo1, photo2, photo3 в originalData
    for (let i = 1; i <= 3; i++) {
      const photoKey = `photo${i}`;
      if (pet.originalData[photoKey] && typeof pet.originalData[photoKey] === 'string' && pet.originalData[photoKey].trim() !== '') {
        const fullUrl = getFullImageUrl(pet.originalData[photoKey]);
        console.log(`Converted originalData ${photoKey} to full URL: ${fullUrl}`);
        if (fullUrl && !fullUrl.includes('placeholder')) {
          return fullUrl;
        }
      }
    }
  }
  
  // 5. Проверяем, есть ли локальные изображения
  if (pet.localPhotos && Array.isArray(pet.localPhotos) && pet.localPhotos.length > 0) {
    console.log('Checking localPhotos:', pet.localPhotos);
    const firstLocalPhoto = pet.localPhotos[0];
    if (firstLocalPhoto && (firstLocalPhoto.startsWith('http') || firstLocalPhoto.startsWith('data:'))) {
      console.log('Using local photo:', firstLocalPhoto);
      return firstLocalPhoto;
    }
  }
  
  // 6. Fallback изображение по типу животного
  console.log('Using fallback image for type:', pet.type);
  const fallbackImages = {
    'кошка': 'https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=600&h=400&fit=crop',
    'собака': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop',
    'птица': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop',
    'грызун': 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=600&h=400&fit=crop',
    'лошадь': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop',
    'попугай': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop',
    'другое': 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&h=400&fit=crop',
    'cat': 'https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=600&h=400&fit=crop',
    'dog': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop',
    'bird': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop',
    'rodent': 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=600&h=400&fit=crop',
    'horse': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop',
  };
  
  const imageUrl = fallbackImages[pet.type] || 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&h=400&fit=crop';
  console.log('Selected fallback image:', imageUrl);
  return imageUrl;
};

export const getAllPetImages = (pet) => {
  const images = [];
  
  if (pet.photos && Array.isArray(pet.photos)) {
    pet.photos.forEach(photo => {
      if (photo && typeof photo === 'string' && photo.trim() !== '') {
        images.push(getFullImageUrl(photo));
      }
    });
  }
  
  if (pet.image && typeof pet.image === 'string' && pet.image.trim() !== '') {
    const imageUrl = getFullImageUrl(pet.image);
    if (!images.includes(imageUrl)) {
      images.push(imageUrl);
    }
  }
  
  // Проверяем отдельные поля фото
  for (let i = 1; i <= 3; i++) {
    const photoKey = `photo${i}`;
    if (pet[photoKey] && typeof pet[photoKey] === 'string' && pet[photoKey].trim() !== '') {
      const photoUrl = getFullImageUrl(pet[photoKey]);
      if (!images.includes(photoUrl)) {
        images.push(photoUrl);
      }
    }
  }
  
  // Если нет фото, добавляем заглушку
  if (images.length === 0) {
    images.push('https://via.placeholder.com/600x400?text=Нет+фото');
  }
  
  return images;
};

export const formatDate = (dateString) => {
  if (!dateString) return 'Не указана';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return dateString;
    }
    return date.toLocaleDateString('ru-RU');
  } catch (error) {
    return dateString;
  }
};