// Упрощенный apiService.js
const API_BASE_URL = 'https://pets.сделай.site/api';

// Базовая функция для запросов
const apiRequest = async (endpoint, options = {}) => {
  const { method = 'GET', body = null, token = null } = options;
  
  const headers = {
    'Accept': 'application/json',
  };
  
  // Не добавляем Content-Type для FormData
  if (!(body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const config = {
    method,
    headers,
  };
  
  if (body) {
    config.body = body instanceof FormData ? body : JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (response.status === 204) {
      return { success: true, status: 204 };
    }
    
    const responseText = await response.text();
    let data;
    
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = { message: responseText };
    }
    
    if (!response.ok) {
      let errorMessage = 'Ошибка сервера';
      
      if (data) {
        if (data.error?.message) {
          errorMessage = data.error.message;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (typeof data === 'string') {
          errorMessage = data;
        }
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }
    
    return data;
    
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      error.message = 'Не удалось подключиться к серверу. Проверьте интернет-соединение.';
    }
    
    throw error;
  }
};

// API для животных
export const petsAPI = {
  getSlider: () => apiRequest('/pets/slider'),
  
  getAllPets: (page = 1, limit = 6) => 
    apiRequest(`/pets?page=${page}&limit=${limit}`),
  
  quickSearch: (query, page = 1, limit = 10) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    params.append('page', page);
    params.append('limit', limit);
    return apiRequest(`/search?${params.toString()}`);
  },
  
  advancedSearch: (params = {}) => {
    const { district = '', kind = '', status = '', page = 1, limit = 10 } = params;
    const queryParams = new URLSearchParams();
    
    if (district && district !== '') {
      queryParams.append('district', district);
    }
    
    if (kind && kind !== '') {
      queryParams.append('kind', kind);
    }
    
    if (status && status !== '') {
      queryParams.append('status', status);
    }
    
    queryParams.append('page', page);
    queryParams.append('limit', limit);
    
    return apiRequest(`/search/order?${queryParams.toString()}`);
  },
  
  getPetById: (id) => apiRequest(`/pets/${id}`),
  
  addPet: (formData, token) => 
    apiRequest('/pets/new', {
      method: 'POST',
      body: formData,
      token,
    }),
  
  updatePet: (id, formData, token) =>
    apiRequest(`/pets/${id}`, {
      method: 'POST',
      body: formData,
      token,
    }),
  
  deletePet: (id, token) =>
    apiRequest(`/users/orders/${id}`, {
      method: 'DELETE',
      token,
    }),
};

// API для пользователей
export const usersAPI = {
  register: (userData) => {
    const body = {
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      password: userData.password,
      password_confirmation: userData.password_confirmation,
      confirm: userData.confirm || 1,
    };
    
    return apiRequest('/register', {
      method: 'POST',
      body,
    });
  },

  login: (credentials) => {
    const body = {
      email: credentials.email,
      password: credentials.password,
    };
    
    return apiRequest('/login', {
      method: 'POST',
      body,
    });
  },

  getCurrentUser: (token) =>
    apiRequest('/users', {
      method: 'GET',
      token,
    }),

  getUserOrders: (userId, token) =>
    apiRequest(`/users/orders/${userId}`, {
      method: 'GET',
      token,
    }),

  updatePhone: (phone, token) =>
    apiRequest('/users/phone', {
      method: 'PATCH',
      body: { phone },
      token,
    }),

  updateEmail: (email, token) =>
    apiRequest('/users/email', {
      method: 'PATCH',
      body: { email },
      token,
    }),
};

// API для подписки
export const subscriptionAPI = {
  subscribe: (email) =>
    apiRequest('/subscription', {
      method: 'POST',
      body: { email },
    }),
};

// Функция для получения полного URL изображения
export const getFullImageUrl = (imagePath) => {
  if (!imagePath || imagePath === '' || typeof imagePath !== 'string') {
    return 'https://via.placeholder.com/600x400?text=Нет+фото';
  }
  
  if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  
  const baseUrl = 'https://pets.сделай.site';
  
  if (imagePath.startsWith('/storage/')) {
    return `${baseUrl}${imagePath}`;
  }
  
  if (imagePath.startsWith('storage/')) {
    return `${baseUrl}/${imagePath}`;
  }
  
  return `${baseUrl}/storage/${imagePath}`;
};

// Преобразование данных API
export const transformPetData = (apiResponse, source = 'pets') => {
  if (!apiResponse || !apiResponse.data) {
    return { pets: [] };
  }
  
  let pets = [];
  
  if (source === 'slider' && apiResponse.data.pets) {
    pets = apiResponse.data.pets.map(item => ({
      id: item.id || Math.random(),
      type: item.kind || 'животное',
      status: item.status || 'found',
      name: item.name || '',
      description: item.description || 'Нет описания',
      district: item.district || '',
      date: item.date || '',
      photos: item.photos || [],
      isFromAPI: true,
      originalData: item,
    }));
  } else if (apiResponse.data.orders) {
    pets = apiResponse.data.orders.map(order => ({
      id: order.id,
      type: order.kind || 'животное',
      name: order.name || '',
      description: order.description || 'Нет описания',
      district: order.district || '',
      date: order.date || '',
      photos: order.photos || [],
      userPhone: order.phone || '',
      userEmail: order.email || '',
      userName: order.name || '',
      registered: order.registred || false,
      mark: order.mark || '',
      isFromAPI: true,
      originalData: order,
    }));
  }
  
  return { pets };
};