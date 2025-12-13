// utils/petService.js
import { petsAPI, preparePetFormData } from './apiService';

export const petService = {
  // Добавление объявления
  addPetAdvertisement: async (formData, isAuthenticated, token) => {
    try {
      console.log('Adding pet advertisement:', { formData, isAuthenticated });
      
      // Подготавливаем FormData
      const petFormData = new FormData();
      
      // Добавляем текстовые поля
      const textFields = ['name', 'phone', 'email', 'kind', 'description', 'district', 'date', 'mark', 'confirm'];
      textFields.forEach(field => {
        if (formData[field] !== undefined && formData[field] !== null) {
          petFormData.append(field, formData[field]);
        }
      });
      
      // Добавляем фото
      if (formData.photos && formData.photos.length > 0) {
        formData.photos.forEach((photo, index) => {
          if (photo.type === 'image/png') {
            petFormData.append(`photo${index + 1}`, photo);
          }
        });
      }
      
      // Отправляем на сервер
      const response = await petsAPI.addPet(petFormData, isAuthenticated ? token : null);
      
      console.log('Pet added successfully:', response);
      
      // После успешного добавления, добавляем в локальный кэш для немедленного отображения
      if (response.data && response.data.pet) {
        // Сохраняем в localStorage для кэширования
        const cachedPets = JSON.parse(localStorage.getItem('recentPets') || '[]');
        cachedPets.unshift(response.data.pet);
        localStorage.setItem('recentPets', JSON.stringify(cachedPets.slice(0, 10)));
      }
      
      return response;
      
    } catch (error) {
      console.error('Error adding pet:', error);
      
      // Если ошибка сети, сохраняем локально
      if (error.message.includes('Failed to fetch') || error.message.includes('Network')) {
        console.log('Saving pet locally due to network error');
        return savePetLocally(formData);
      }
      
      throw error;
    }
  },
  
  // Получение свежих объявлений (с кэшированием)
  getRecentPets: async (forceRefresh = false) => {
    try {
      // Проверяем кэш
      if (!forceRefresh) {
        const cachedPets = JSON.parse(localStorage.getItem('recentPets') || '[]');
        if (cachedPets.length > 0) {
          console.log('Using cached pets:', cachedPets.length);
          return cachedPets;
        }
      }
      
      // Загружаем с сервера
      const response = await petsAPI.getAllPets(1, 6);
      const transformed = transformPetData(response);
      
      // Сохраняем в кэш
      if (transformed.pets && transformed.pets.length > 0) {
        localStorage.setItem('recentPets', JSON.stringify(transformed.pets));
      }
      
      return transformed.pets || [];
      
    } catch (error) {
      console.error('Error getting recent pets:', error);
      
      // Возвращаем кэш при ошибке
      const cachedPets = JSON.parse(localStorage.getItem('recentPets') || '[]');
      return cachedPets;
    }
  },
};

// Локальное сохранение при недоступности API
const savePetLocally = (formData) => {
  const localPet = {
    id: 'local_' + Date.now(),
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    kind: formData.kind,
    description: formData.description,
    district: formData.district,
    date: formData.date,
    mark: formData.mark || '',
    // ИСПРАВЛЕНО: Берем статус из formData
    status: formData.status || 'found',
    photos: formData.photos ? Array.from(formData.photos).map((file, index) => {
      return `local_photo_${index}_${Date.now()}`;
    }) : [],
    isLocal: true,
    createdAt: new Date().toISOString(),
  };
  
  // Сохраняем в localStorage
  const localPets = JSON.parse(localStorage.getItem('localPets') || '[]');
  localPets.unshift(localPet);
  localStorage.setItem('localPets', JSON.stringify(localPets));
  
  // Также добавляем в recentPets для немедленного отображения
  const cachedPets = JSON.parse(localStorage.getItem('recentPets') || '[]');
  cachedPets.unshift(localPet);
  localStorage.setItem('recentPets', JSON.stringify(cachedPets.slice(0, 10)));
  
  return { 
    success: true, 
    data: { 
      pet: localPet,
      message: 'Объявление сохранено локально (сервер недоступен)'
    } 
  };
};

// Упрощенная функция трансформации для сервиса
const transformPetData = (response) => {
  if (!response || !response.data) return { pets: [] };
  
  if (response.data.pets) {
    return {
      pets: response.data.pets.map(pet => ({
        id: pet.id,
        type: pet.kind || 'животное',
        // ИСПРАВЛЕНО: Берем статус из API
        status: pet.status || 'found',
        name: pet.name || '',
        description: pet.description || 'Нет описания',
        district: pet.district || '',
        date: pet.date || '',
        photos: pet.photos ? [pet.photos] : [],
        registered: pet.registered || false,
        isFromAPI: true,
        originalData: pet,
      }))
    };
  }
  
  return { pets: [] };
};