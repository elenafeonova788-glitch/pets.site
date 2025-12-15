const API_BASE_URL = 'https://pets.сделай.site/api';

// Функция для полного URL изображения
export const getFullImageUrl = (imagePath) => {
  if (!imagePath || 
      imagePath === '' || 
      imagePath === null || 
      imagePath === 'null' ||
      imagePath === undefined ||
      imagePath === 'undefined' ||
      typeof imagePath !== 'string') {
    console.log('Empty or invalid image path, using fallback');
    return 'https://via.placeholder.com/600x400?text=Нет+фото';
  }
  
  const trimmedPath = imagePath.trim();
  
  if (trimmedPath === '') {
    console.log('Empty trimmed path, using fallback');
    return 'https://via.placeholder.com/600x400?text=Нет+фото';
  }
  
  console.log('Original image path:', trimmedPath);
  
  if (trimmedPath.startsWith('http') || trimmedPath.startsWith('data:')) {
    console.log('Already full URL, returning as is');
    return trimmedPath;
  }
  
  const baseUrl = 'https://pets.сделай.site';
  
  if (trimmedPath.startsWith('/storage/')) {
    const url = `${baseUrl}${trimmedPath}`;
    console.log('Building URL from /storage/ path:', url);
    return url;
  } else if (trimmedPath.startsWith('storage/')) {
    const url = `${baseUrl}/${trimmedPath}`;
    console.log('Building URL from storage/ path:', url);
    return url;
  } else if (trimmedPath.startsWith('/')) {
    if (!trimmedPath.startsWith('/storage')) {
      const url = `${baseUrl}/storage${trimmedPath}`;
      console.log('Building URL with /storage prefix:', url);
      return url;
    }
    const url = `${baseUrl}${trimmedPath}`;
    console.log('Building URL from absolute path:', url);
    return url;
  } else {
    if (trimmedPath.includes('storage/')) {
      const url = `${baseUrl}/${trimmedPath}`;
      console.log('Building URL with base + relative path:', url);
      return url;
    }
    const url = `${baseUrl}/storage/${trimmedPath}`;
    console.log('Building URL with /storage/ default:', url);
    return url;
  }
};

// Общая функция для выполнения запросов
export const apiRequest = async (endpoint, options = {}) => {
  const {
    method = 'GET',
    body = null,
    token = null,
    headers: customHeaders = {},
  } = options;

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...customHeaders,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    method,
    headers,
  };

  if (body) {
    config.body = JSON.stringify(body);
  }

  try {
    console.log(`=== API REQUEST ===`);
    console.log(`URL: ${API_BASE_URL}${endpoint}`);
    console.log(`Method: ${method}`);
    console.log(`Headers:`, headers);
    console.log(`Body:`, body ? { ...body, password: '***' } : 'No body');

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    console.log(`=== API RESPONSE ===`);
    console.log(`Status: ${response.status} ${response.statusText}`);

    // Для статуса 204 (No Content) возвращаем пустой объект
    if (response.status === 204) {
      console.log('204 No Content - registration successful');
      return {};
    }

    const responseText = await response.text();
    console.log(`Response text:`, responseText);

    let data;
    try {
      data = responseText ? JSON.parse(responseText) : {};
    } catch (parseError) {
      console.error('Failed to parse JSON:', parseError);
      data = { message: responseText };
    }

    if (!response.ok) {
      console.error(`=== API ERROR ===`);
      
      let errorMessage = 'Ошибка сервера';
      let validationErrors = {};
      
      if (data.error) {
        console.log('Error in data.error:', data.error);
        if (data.error.message) {
          errorMessage = data.error.message;
        }
        if (data.error.errors) {
          validationErrors = data.error.errors;
        }
      } else if (data.errors) {
        console.log('Errors in data.errors:', data.errors);
        validationErrors = data.errors;
      } else if (data.message) {
        errorMessage = data.message;
      }
      
      // Форматируем ошибки валидации
      if (Object.keys(validationErrors).length > 0) {
        const formattedErrors = [];
        for (const [field, errors] of Object.entries(validationErrors)) {
          if (Array.isArray(errors)) {
            errors.forEach(error => {
              if (error) formattedErrors.push(`${field}: ${error}`);
            });
          } else if (typeof errors === 'string') {
            formattedErrors.push(`${field}: ${errors}`);
          }
        }
        
        if (formattedErrors.length > 0) {
          errorMessage = formattedErrors.join('; ');
        }
      }
      
      console.log('Final error message:', errorMessage);
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      error.validationErrors = validationErrors;
      throw error;
    }

    console.log(`=== API SUCCESS ===`);
    return data;
    
  } catch (error) {
    console.error('=== FETCH ERROR ===');
    console.error('Error:', error);
    
    if (error.message.includes('Failed to fetch')) {
      error.message = 'Не удалось подключиться к серверу. Проверьте интернет-соединение.';
    }
    
    throw error;
  }
};


// Преобразование данных API в формат приложения
export const transformPetData = (apiResponse, source = 'pets') => {
  console.log('Transform pet data - API response:', apiResponse);
  console.log('Source:', source);
  
  if (!apiResponse || !apiResponse.data) {
    console.log('No data in API response');
    return { pets: [] };
  }
  
  let pets = [];
  
  try {
    console.log('API data structure:', apiResponse.data);
    
    if (source === 'slider' && apiResponse.data.pets) {
      console.log('Processing slider data');
      pets = apiResponse.data.pets.map(item => {
        console.log('Slider item:', item);
        
        const photos = [];
        
        if (item.photos) {
          if (Array.isArray(item.photos)) {
            item.photos.forEach(photo => {
              if (photo && photo !== '') {
                const fullUrl = getFullImageUrl(photo);
                if (fullUrl && !fullUrl.includes('placeholder')) {
                  photos.push(fullUrl);
                }
              }
            });
          } else if (typeof item.photos === 'string' && item.photos !== '') {
            const fullUrl = getFullImageUrl(item.photos);
            if (fullUrl && !fullUrl.includes('placeholder')) {
              photos.push(fullUrl);
            }
          }
        }
        
        for (let i = 1; i <= 3; i++) {
          const photoKey = `photo${i}`;
          if (item[photoKey] && item[photoKey] !== '') {
            const fullUrl = getFullImageUrl(item[photoKey]);
            if (fullUrl && !fullUrl.includes('placeholder')) {
              photos.push(fullUrl);
            }
          }
        }
        
        if (item.image && item.image !== '' && !photos.some(p => p.includes(item.image))) {
          const fullUrl = getFullImageUrl(item.image);
          if (fullUrl && !fullUrl.includes('placeholder')) {
            photos.push(fullUrl);
          }
        }
        
        if (photos.length === 0) {
          const fallbackImages = {
            'кошка': 'https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=600&h=400&fit=crop',
            'собака': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop',
            'птица': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop',
            'грызун': 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=600&h=400&fit=crop',
            'лошадь': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop',
            'попугай': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop',
            'другое': 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&h=400&fit=crop',
          };
          
          const fallbackImage = fallbackImages[item.kind] || 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&h=400&fit=crop';
          photos.push(fallbackImage);
        }
        
        return {
          id: item.id || Math.random(),
          type: item.kind || 'животное',
          status: item.status || 'found',
          name: item.name || '',
          description: item.description || 'Нет описания',
          district: item.district || '',
          date: item.date || '',
          photos: photos,
          isFromAPI: true,
          originalData: item,
        };
      });
    } else if (apiResponse.data.pets) {
      console.log('Processing pets data');
      pets = apiResponse.data.pets.map(item => {
        console.log('Pet item:', item);
        
        const photos = [];
        
        if (item.photos) {
          if (Array.isArray(item.photos)) {
            item.photos.forEach(photo => {
              if (photo && photo !== '') {
                const fullUrl = getFullImageUrl(photo);
                if (fullUrl && !fullUrl.includes('placeholder')) {
                  photos.push(fullUrl);
                }
              }
            });
          } else if (typeof item.photos === 'string' && item.photos !== '') {
            const fullUrl = getFullImageUrl(item.photos);
            if (fullUrl && !fullUrl.includes('placeholder')) {
              photos.push(fullUrl);
            }
          }
        }
        
        for (let i = 1; i <= 3; i++) {
          const photoKey = `photo${i}`;
          if (item[photoKey] && item[photoKey] !== '') {
            const fullUrl = getFullImageUrl(item[photoKey]);
            if (fullUrl && !fullUrl.includes('placeholder')) {
              photos.push(fullUrl);
            }
          }
        }
        
        if (item.image && item.image !== '' && !photos.some(p => p.includes(item.image))) {
          const fullUrl = getFullImageUrl(item.image);
          if (fullUrl && !fullUrl.includes('placeholder')) {
            photos.push(fullUrl);
          }
        }
        
        if (photos.length === 0) {
          const fallbackImages = {
            'кошка': 'https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=600&h=400&fit=crop',
            'собака': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=400&fit=crop',
            'птица': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop',
            'грызун': 'https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=600&h=400&fit=crop',
            'лошадь': 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&h=400&fit=crop',
            'попугай': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=600&h=400&fit=crop',
            'другое': 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&h=400&fit=crop',
          };
          
          const fallbackImage = fallbackImages[item.kind] || 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&h=400&fit=crop';
          photos.push(fallbackImage);
        }
        
        return {
          id: item.id,
          type: item.kind || 'животное',
          status: item.status || 'found',
          name: item.name || '',
          description: item.description || 'Нет описания',
          district: item.district || '',
          date: item.date || '',
          photos: photos,
          userPhone: item.phone || '',
          userEmail: item.email || '',
          userName: item.name || '',
          registered: item.registered || false,
          mark: item.mark || '',
          isFromAPI: true,
          originalData: item,
        };
      });
    } else if (apiResponse.data.orders) {
      console.log('Processing ORDERS data from advancedSearch');
      console.log('Number of orders:', apiResponse.data.orders.length);
      
      pets = apiResponse.data.orders.map(order => {
        console.log('Order item details:', {
          id: order.id,
          kind: order.kind,
          photos: order.photos,
          photo1: order.photo1,
          photo2: order.photo2,
          photo3: order.photo3,
          image: order.image,
          description: order.description,
          district: order.district,
          date: order.date
        });
        
        const photos = [];
        
        if (order.photos) {
          if (Array.isArray(order.photos)) {
            order.photos.forEach(photo => {
              if (photo && photo !== '') {
                const fullUrl = getFullImageUrl(photo);
                if (fullUrl && !fullUrl.includes('placeholder')) {
                  photos.push(fullUrl);
                }
              }
            });
          } else if (typeof order.photos === 'string' && order.photos !== '') {
            const fullUrl = getFullImageUrl(order.photos);
            if (fullUrl && !fullUrl.includes('placeholder')) {
              photos.push(fullUrl);
            }
          }
        }
        
        for (let i = 1; i <= 3; i++) {
          const photoKey = `photo${i}`;
          if (order[photoKey] && order[photoKey] !== '') {
            const fullUrl = getFullImageUrl(order[photoKey]);
            if (fullUrl && !fullUrl.includes('placeholder')) {
              photos.push(fullUrl);
            }
          }
        }
        
        if (order.image && order.image !== '' && !photos.some(p => p.includes(order.image))) {
          const fullUrl = getFullImageUrl(order.image);
          if (fullUrl && !fullUrl.includes('placeholder')) {
            photos.push(fullUrl);
          }
        }
        
        const uniquePhotos = [...new Set(photos)];
        
        console.log(`Order ${order.id} collected photos:`, uniquePhotos);
        
        return {
          id: order.id,
          type: order.kind || 'животное',
          name: order.name || '',
          description: order.description || 'Нет описания',
          district: order.district || '',
          date: order.date || '',
          photos: uniquePhotos,
          userPhone: order.phone || '',
          userEmail: order.email || '',
          userName: order.name || '',
          registered: order.registred || false,
          mark: order.mark || '',
          isFromAPI: true,
          originalData: order,
        };
      });
    }
  } catch (error) {
    console.error('Error transforming pet data:', error);
  }
  
  console.log('Transformed pets:', pets);
  return { pets };
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
    
    const districtMap = {
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
    
    if (district && district !== '') {
      const russianDistrict = districtMap[district] || district;
      queryParams.append('district', russianDistrict);
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
      method: 'PATCH',
      body: formData,
      token,
    }),
  
  deletePet: (id, token) =>
    apiRequest(`/users/orders/${id}`, {
      method: 'DELETE',
      token,
    }),
};

// API для пользователей - ОБНОВЛЕНО ПО ТЗ
// API для пользователей - по ТЗ
export const usersAPI = {
  // Регистрация - JSON формат как в ТЗ
  register: (userData) => {
    console.log('Register data to send:', userData);

    const body = {
      name: userData.name,
      phone: userData.phone,
      email: userData.email,
      password: userData.password,
      password_confirmation: userData.password_confirmation,
      confirm: userData.confirm || 1,
    };

    console.log('JSON body for register:', body);

    return apiRequest('/register', {
      method: 'POST',
      body,
    });
  },

  // Вход - JSON формат как в ТЗ
  login: (credentials) => {
    console.log('Login data to send:', { ...credentials, password: '***' });

    const body = {
      email: credentials.email,
      password: credentials.password,
    };

    console.log('JSON body for login:', body);

    return apiRequest('/login', {
      method: 'POST',
      body,
    });
  },

  // Получить данные пользователя
  getUser: (id, token) =>
    apiRequest(`/users/${id}`, {
      method: 'GET',
      token,
    }),

  // Обновить телефон
  updatePhone: (id, phone, token) =>
    apiRequest(`/users/${id}/phone`, {
      method: 'PATCH',
      body: { phone },
      token,
    }),

  // Обновить email
  updateEmail: (id, email, token) =>
    apiRequest(`/users/${id}/email`, {
      method: 'PATCH',
      body: { email },
      token,
    }),

  // Получить объявления пользователя
  getUserOrders: (id, token) =>
    apiRequest(`/users/orders/${id}`, {
      method: 'GET',
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

// Функция для подготовки FormData для объявления
export const preparePetFormData = (formData, files) => {
  const data = new FormData();
  
  Object.keys(formData).forEach(key => {
    if (formData[key] !== undefined && formData[key] !== null) {
      data.append(key, formData[key]);
    }
  });
  
  if (files && files.length > 0) {
    files.forEach((file, index) => {
      if (file.type === 'image/png') {
        data.append(`photo${index + 1}`, file);
      }
    });
  }
  
  return data;
};