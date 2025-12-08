// src/utils/apiService.js
const API_BASE_URL = 'https://pets.сделай.site/api';

// Общие заголовки для запросов
const getHeaders = (withAuth = true, contentType = 'application/json') => {
  const headers = {
    'Accept': 'application/json',
  };
  
  if (contentType) {
    headers['Content-Type'] = contentType;
  }
  
  if (withAuth) {
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};

// Обработка ответов
const handleResponse = async (response) => {
  console.log(`Response status: ${response.status} ${response.statusText}`);
  
  if (!response.ok) {
    let errorMessage = 'Ошибка запроса';
    try {
      const errorData = await response.json();
      console.log('Error response:', errorData);
      
      // Обрабатываем разные форматы ошибок
      if (errorData.errors) {
        // Laravel validation errors format
        const errors = Object.values(errorData.errors).flat();
        errorMessage = errors.join(', ');
      } else if (errorData.message) {
        errorMessage = errorData.message;
      } else if (errorData.error) {
        if (typeof errorData.error === 'string') {
          errorMessage = errorData.error;
        } else if (errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      }
    } catch (e) {
      errorMessage = `${response.status}: ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }
  
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    console.log('API Response data:', data);
    return data;
  }
  
  return response.text();
};

// API для аутентификации
export const authAPI = {
  register: async (userData) => {
    console.log('Register request:', userData);
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  login: async (credentials) => {
    console.log('Login request:', credentials);
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify(credentials),
    });
    return handleResponse(response);
  },

  getProfile: async (userId) => {
    console.log('Get profile request');
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  updatePhone: async (userId, phone) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/phone`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ phone }),
    });
    return handleResponse(response);
  },

  updateEmail: async (userId, email) => {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/email`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },

  logout: () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('currentUser');
  },

  saveToken: (token) => {
    localStorage.setItem('auth_token', token);
  },

  checkToken: () => {
    return localStorage.getItem('auth_token');
  },
};

// API для подписки
export const subscriptionAPI = {
  subscribe: async (email) => {
    const response = await fetch(`${API_BASE_URL}/subscription`, {
      method: 'POST',
      headers: getHeaders(false),
      body: JSON.stringify({ email }),
    });
    return handleResponse(response);
  },
};

// Функции для поиска
export const searchAPI = {
  // Быстрый поиск по описанию (для шапки и основного поиска)
  searchByQuery: async (query, page = 1, limit = 10, filters = {}) => {
    console.log(`Searching by query: "${query}", page ${page}...`);
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (query && query.trim()) {
      queryParams.append('q', query);
    }
    
    // Добавляем фильтры
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    console.log('Search URL:', `${API_BASE_URL}/search?${queryParams}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/search?${queryParams}`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Search by query error:', error);
      throw error;
    }
  },

  // Поиск по фильтрам (район и вид животного)
  searchByFilters: async (filters, page = 1, limit = 10) => {
    console.log(`Searching by filters:`, filters, `page ${page}...`);
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // Добавляем фильтры
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    console.log('Filter search URL:', `${API_BASE_URL}/search/order?${queryParams}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/search/order?${queryParams}`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Search by filters error:', error);
      throw error;
    }
  },
};

// API для животных и объявлений
export const petsAPI = {
  // Получить слайдер
  getSlider: async () => {
    console.log('Fetching slider...');
    try {
      const response = await fetch(`${API_BASE_URL}/pets/slider`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Slider fetch error:', error);
      throw error;
    }
  },

  // Получить всех животных (с пагинацией)
  getAllPets: async (page = 1, limit = 6, filters = {}) => {
    console.log(`Fetching pets page ${page}, limit ${limit}...`);
    const queryParams = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    // Добавляем фильтры
    Object.keys(filters).forEach(key => {
      if (filters[key]) {
        queryParams.append(key, filters[key]);
      }
    });
    
    console.log('Fetching URL:', `${API_BASE_URL}/pets?${queryParams}`);
    
    try {
      const response = await fetch(`${API_BASE_URL}/pets?${queryParams}`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    } catch (error) {
      console.error('Get all pets error:', error);
      throw error;
    }
  },

  // Универсальный поиск животных
  searchPets: async (query, page = 1, limit = 6, filters = {}) => {
    console.log(`Searching pets: "${query}", page ${page}...`);
    
    // Если есть текст запроса, используем текстовый поиск
    if (query && query.trim()) {
      return searchAPI.searchByQuery(query, page, limit, filters);
    }
    // Если нет текста, но есть фильтры, используем поиск по фильтрам
    else if (Object.keys(filters).length > 0) {
      return searchAPI.searchByFilters(filters, page, limit);
    }
    // Иначе возвращаем все объявления
    else {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      const response = await fetch(`${API_BASE_URL}/pets?${queryParams}`, {
        headers: getHeaders(false),
      });
      return handleResponse(response);
    }
  },

  // Получить животное по ID
  getPetById: async (id) => {
    const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
      headers: getHeaders(false),
    });
    return handleResponse(response);
  },

  // Создать объявление
  createPet: async (petData) => {
    console.log('Creating pet with data:', petData);
    const formData = new FormData();
    
    // Добавляем все поля в FormData
    Object.keys(petData).forEach(key => {
      if (key === 'photos' && Array.isArray(petData.photos)) {
        petData.photos.forEach((photo, index) => {
          if (photo instanceof File) {
            formData.append(`photo${index + 1}`, photo);
          }
        });
      } else if (petData[key] !== null && petData[key] !== undefined) {
        formData.append(key, petData[key]);
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/pets/new`, {
      method: 'POST',
      headers: getHeaders(true, null),
      body: formData,
    });
    return handleResponse(response);
  },

  // Обновить объявление
  updatePet: async (id, petData) => {
    const formData = new FormData();
    
    Object.keys(petData).forEach(key => {
      if (key === 'photos' && Array.isArray(petData.photos)) {
        petData.photos.forEach((photo, index) => {
          if (photo instanceof File) {
            formData.append(`photo${index + 1}`, photo);
          }
        });
      } else if (petData[key] !== null && petData[key] !== undefined) {
        formData.append(key, petData[key]);
      }
    });
    
    const response = await fetch(`${API_BASE_URL}/pets/${id}`, {
      method: 'PATCH',
      headers: getHeaders(true, null),
      body: formData,
    });
    return handleResponse(response);
  },

  // Удалить объявление
  deletePet: async (id) => {
    const response = await fetch(`${API_BASE_URL}/users/orders/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return handleResponse(response);
  },

  // Получить мои объявления
  getMyPets: async (userId, page = 1, limit = 100) => {
    console.log('Fetching my pets...');
    const response = await fetch(`${API_BASE_URL}/users/orders/${userId}?page=${page}&limit=${limit}`, {
      headers: getHeaders(),
    });
    return handleResponse(response);
  },
};

// Вспомогательные функции
const getFullImageUrl = (imagePath) => {
  if (!imagePath) return '';
  
  // Если уже полный URL
  if (imagePath.startsWith('http')) {
    return imagePath;
  }
  
  // Если путь начинается с /storage
  if (imagePath.startsWith('/storage')) {
    return `https://pets.сделай.site${imagePath}`;
  }
  
  // Если относительный путь
  if (imagePath.startsWith('storage/')) {
    return `https://pets.сделай.site/${imagePath}`;
  }
  
  // Добавляем базовый путь
  return `https://pets.сделай.site/storage/${imagePath}`;
};

const formatDate = (dateString) => {
  if (!dateString) return new Date().toLocaleDateString('ru-RU');
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
  } catch (e) {
    return dateString;
  }
};

// Преобразование одиночного питомца
const transformSinglePet = (petObj) => {
  if (!petObj) return null;
  
  console.log('Transforming single pet:', petObj);
  
  // Получаем фотографии
  const photos = getPhotosArray(petObj);
  
  // Формируем дату
  const date = formatDate(petObj.date);
  
  // Формируем результат
  const result = {
    id: petObj.id || Date.now(),
    type: petObj.kind || 'другое',
    status: 'found', // По спецификации - все найденные животные
    name: petObj.name || 'Без имени',
    description: petObj.description || 'Нет описания',
    district: petObj.district || '',
    date: date,
    userName: petObj.name || petObj.contact_name || 'Неизвестно',
    userPhone: petObj.phone || petObj.contact_phone || '',
    userEmail: petObj.email || petObj.contact_email || '',
    photos: photos,
    author: petObj.name || petObj.contact_name || 'Неизвестно',
    mark: petObj.mark || '',
    adStatus: petObj.status || 'active',
    originalData: petObj,
    isFromAPI: true,
    registered: petObj.registered || false
  };
  
  return result;
};

const getPhotosArray = (petObj) => {
  const photos = [];
  
  // Если есть photos массив
  if (petObj.photos && Array.isArray(petObj.photos)) {
    petObj.photos.forEach(photo => {
      if (photo && typeof photo === 'string') {
        const fullUrl = getFullImageUrl(photo);
        if (fullUrl) photos.push(fullUrl);
      }
    });
  }
  
  // Если photos это строка
  if (petObj.photos && typeof petObj.photos === 'string') {
    const fullUrl = getFullImageUrl(petObj.photos);
    if (fullUrl) photos.push(fullUrl);
  }
  
  // Если есть отдельные поля с фото
  const singlePhotoFields = ['photo', 'image', 'image_url', 'photo_url', 'main_photo'];
  singlePhotoFields.forEach(field => {
    if (petObj[field] && typeof petObj[field] === 'string') {
      const fullUrl = getFullImageUrl(petObj[field]);
      if (fullUrl) photos.push(fullUrl);
    }
  });
  
  // Если фото не найдены, используем фолбэк по типу животного
  if (photos.length === 0) {
    const type = petObj.kind || 'другое';
    const fallbackImages = {
      'кошка': ['https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=300&auto=format&fit=crop'],
      'собака': ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop'],
      'птица': ['https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=300&auto=format&fit=crop'],
      'грызун': ['https://images.unsplash.com/photo-1567254790685-6f6b4690f1f9?w=300&auto=format&fit=crop'],
      'другое': ['https://images.unsplash.com/photo-1589652043056-ba1a2c4830a5?w=300&auto=format&fit=crop']
    };
    return fallbackImages[type] || ['https://via.placeholder.com/300x200?text=Животное'];
  }
  
  return photos;
};

// Трансформация данных для единообразия
export const transformPetData = (apiData) => {
  console.log('Transforming pet data:', apiData);
  
  // Если пришел ответ с пагинацией
  if (apiData && apiData.data && apiData.data.orders && Array.isArray(apiData.data.orders)) {
    return apiData.data.orders.map(item => transformSinglePet(item));
  }
  
  // Если пришел ответ для слайдера
  if (apiData && apiData.data && apiData.data.pets && Array.isArray(apiData.data.pets)) {
    return apiData.data.pets.map(item => transformSinglePet(item));
  }
  
  // Если пришел ответ для одного питомца
  if (apiData && apiData.data && apiData.data.pet && Array.isArray(apiData.data.pet)) {
    return apiData.data.pet.map(item => transformSinglePet(item));
  }
  
  // Если пришел массив напрямую
  if (Array.isArray(apiData)) {
    console.log('Transforming array of', apiData.length, 'pets');
    return apiData.map(item => transformSinglePet(item));
  }
  
  console.warn('transformPetData received unexpected data:', apiData);
  return [];
};

// Функция для преобразования данных из формы в формат API
export const preparePetFormData = (formData, userId = null) => {
  const data = {
    kind: formData.type, // Уже на русском
    name: formData.userName,
    phone: formData.userPhone,
    email: formData.userEmail,
    description: formData.description,
    district: formData.district,
    date: formData.date,
    mark: formData.mark || '',
    confirm: formData.confirm ? 1 : 0,
  };
  
  if (formData.password && formData.password_confirmation) {
    data.password = formData.password;
    data.password_confirmation = formData.password_confirmation;
  }
  
  if (userId) {
    data.user_id = userId;
  }
  
  return data;
};

// Функция для извлечения метаданных пагинации
export const getPaginationMeta = (apiResponse) => {
  if (!apiResponse) {
    return { total: 0, last_page: 1, current_page: 1 };
  }
  
  // Laravel pagination format
  if (apiResponse.meta) {
    return {
      total: apiResponse.meta.total || 0,
      last_page: apiResponse.meta.last_page || 1,
      current_page: apiResponse.meta.current_page || 1,
    };
  }
  
  // Simple format
  return {
    total: apiResponse.total || 0,
    last_page: apiResponse.last_page || apiResponse.total_pages || 1,
    current_page: apiResponse.current_page || apiResponse.page || 1,
  };
};

// Экспортируем функцию для URL изображений
export { getFullImageUrl };