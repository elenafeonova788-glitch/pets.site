// src/utils/imageUtils.js

// Преобразование пути к изображению в полный URL
export const getFullImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // Если уже полный URL
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Если путь начинается с /storage
  if (imagePath.startsWith('/storage')) {
    return `https://pets.xn--80ahdri7a.site${imagePath}`;
  }
  
  // Если относительный путь
  if (imagePath.startsWith('storage/')) {
    return `https://pets.xn--80ahdri7a.site/${imagePath}`;
  }
  
  // Добавляем базовый путь
  return `https://pets.xn--80ahdri7a.site/storage/${imagePath}`;
};

// Получение массива URL изображений из объекта животного
export const getPetImages = (petObj) => {
  const images = [];
  
  if (!petObj) return images;
  
  // Если есть photos массив
  if (petObj.photos && Array.isArray(petObj.photos)) {
    petObj.photos.forEach(photo => {
      if (photo && typeof photo === 'object' && photo.url) {
        images.push(getFullImageUrl(photo.url));
      } else if (photo && typeof photo === 'string') {
        images.push(getFullImageUrl(photo));
      }
    });
  }
  
  // Если есть images массив
  if (petObj.images && Array.isArray(petObj.images)) {
    petObj.images.forEach(image => {
      if (image && typeof image === 'string') {
        images.push(getFullImageUrl(image));
      }
    });
  }
  
  // Если есть отдельные поля с фото
  const singlePhotoFields = ['photo', 'image', 'image_url', 'photo_url', 'main_photo'];
  singlePhotoFields.forEach(field => {
    if (petObj[field] && typeof petObj[field] === 'string') {
      images.push(getFullImageUrl(petObj[field]));
    }
  });
  
  return images;
};