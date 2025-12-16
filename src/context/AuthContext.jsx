import React, { createContext, useState, useContext, useEffect } from 'react';
import { usersAPI, petsAPI } from '../utils/apiService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken') || localStorage.getItem('token'));

  // Проверяем сохраненную аутентификацию при загрузке
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('authToken') || localStorage.getItem('token');
      const savedEmail = localStorage.getItem('userEmail');
      const savedName = localStorage.getItem('userName');
      const savedPhone = localStorage.getItem('userPhone');
      const savedUserId = localStorage.getItem('userId');

      // ВАЖНО: только если есть токен - это авторизованный пользователь
      if (savedToken && savedEmail) {
        try {
          // Пытаемся получить данные пользователя через API
          const userResponse = await usersAPI.getUser(savedUserId || 1, savedToken);
          console.log('User response:', userResponse);

          if (userResponse.data && userResponse.data.user) {
            const userData = userResponse.data.user;
            const user = Array.isArray(userData) ? userData[0] : userData;

            setCurrentUser({
              id: user.id || savedUserId || 1,
              name: user.name || savedName || savedEmail.split('@')[0],
              email: user.email || savedEmail || '',
              phone: user.phone || savedPhone || '',
              regDate: user.registrationDate || new Date().toISOString().split('T')[0],
              daysOnSite: calculateDaysOnSite(user.registrationDate),
              completedAds: user.petsCount || 0,
              incompleteAds: user.ordersCount || 0,
            });
            
            setToken(savedToken);
            
            // Загружаем объявления пользователя
            const ads = await loadUserAds(user.id || savedUserId || 1);
            setUserAds(ads);
          }
        } catch (error) {
          console.error('Ошибка загрузки данных пользователя:', error);
          // Если токен невалидный, удаляем его
          if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            localStorage.removeItem('authToken');
            localStorage.removeItem('token');
            setToken(null);
            setCurrentUser(null);
          }
        }
      } 
      // Если есть email но НЕТ токена - удаляем эти данные, они не нужны
      else if (savedEmail) {
        // Сохраняем данные пользователя, но удаляем токен
        const user = {
          id: savedUserId || Date.now(),
          name: savedName || savedEmail.split('@')[0],
          email: savedEmail || '',
          phone: savedPhone || '',
          regDate: new Date().toISOString().split('T')[0],
          daysOnSite: '1 день',
          completedAds: 0,
          incompleteAds: 0,
        };
        
        setCurrentUser(user);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Загрузка объявлений пользователя
  const loadUserAds = async (userId) => {
    try {
      const response = await usersAPI.getUserOrders(userId, token);

      if (response.data && response.data.orders) {
        return response.data.orders.map(ad => ({
          id: ad.id,
          type: ad.kind,
          status: ad.status || 'active',
          name: ad.name || '',
          description: ad.description,
          district: ad.district,
          date: ad.date,
          photos: ad.photos ? [ad.photos] : [],
          adStatus: ad.status || 'active',
        }));
      }
      return [];
    } catch (error) {
      console.error('Ошибка загрузки объявлений пользователя:', error);
      return [];
    }
  };

  // Расчет дней на сайте
  const calculateDaysOnSite = (registrationDate) => {
    if (!registrationDate) return '1 день';
    try {
      const regDate = new Date(registrationDate);
      const now = new Date();
      const diffTime = Math.abs(now - regDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `${diffDays} день${diffDays > 1 ? 'ей' : ''}`;
    } catch (error) {
      return '1 день';
    }
  };

  // Вход в систему
  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('=== LOGIN ATTEMPT ===');
      console.log('Credentials:', { ...credentials, password: '***' });

      // 1. Отправляем запрос на сервер для входа
      const response = await usersAPI.login(credentials);
      console.log('Login API response:', response);

      // Проверяем наличие токена в разных местах ответа
      let authToken = null;

      // Проверяем разные возможные места, где может быть токен
      if (response.data && response.data.token) {
        authToken = response.data.token;
      } else if (response.token) {
        authToken = response.token;
      } else if (response.data && response.data.access_token) {
        authToken = response.data.access_token;
      } else if (response.access_token) {
        authToken = response.access_token;
      } else if (response.data) {
        // Если data - это строка (токен)
        if (typeof response.data === 'string' && response.data.length > 20) {
          authToken = response.data;
        }
      }

      if (!authToken) {
        console.error('No token in response:', response);
        throw new Error('Токен не получен от сервера. Структура ответа: ' + JSON.stringify(response));
      }

      console.log('Setting token:', authToken);
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('token', authToken); // Дублируем для совместимости
      setToken(authToken);

      // 2. Получаем данные пользователя с сервера
      try {
        const userResponse = await usersAPI.getUser(1, authToken);
        console.log('User data response:', userResponse);

        let userData = null;
        if (userResponse.data && userResponse.data.user) {
          userData = Array.isArray(userResponse.data.user) ? userResponse.data.user[0] : userResponse.data.user;
        }

        // Создаем пользователя
        const user = {
          id: userData?.id || Date.now(),
          name: userData?.name || credentials.name || credentials.email?.split('@')[0] || 'Пользователь',
          email: userData?.email || credentials.email,
          phone: userData?.phone || credentials.phone || '',
          regDate: userData?.registrationDate || new Date().toISOString().split('T')[0],
          daysOnSite: calculateDaysOnSite(userData?.registrationDate),
          completedAds: userData?.petsCount || 0,
          incompleteAds: userData?.ordersCount || 0,
        };

        // Сохраняем ВСЕ данные пользователя в localStorage
        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userPhone', user.phone);
        localStorage.setItem('userId', user.id.toString());

        setCurrentUser(user);

        // Загружаем объявления пользователя
        const ads = await loadUserAds(user.id);
        setUserAds(ads);
        
      } catch (userError) {
        console.error('Error getting user data, using credentials:', userError);
        
        // Если не удалось получить данные с сервера, создаем пользователя из credentials
        const user = {
          id: Date.now(),
          name: credentials.name || credentials.email?.split('@')[0] || 'Пользователь',
          email: credentials.email,
          phone: credentials.phone || '',
          regDate: new Date().toISOString().split('T')[0],
          daysOnSite: '1 день',
          completedAds: 0,
          incompleteAds: 0,
        };

        localStorage.setItem('userEmail', user.email);
        localStorage.setItem('userName', user.name);
        localStorage.setItem('userPhone', user.phone);
        localStorage.setItem('userId', user.id.toString());

        setCurrentUser(user);
        setUserAds([]);
      }

      return { success: true, data: response };

    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Error:', error);

      let errorMessage = error.message || 'Ошибка при входе';

      if (error.status === 401 || error.status === 422 || 
          errorMessage.includes('Invalid credentials') || 
          errorMessage.includes('Unauthorized')) {
        errorMessage = 'Неверный email или пароль';
      }

      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Регистрация
  const register = async (userData) => {
    try {
      setLoading(true);
      console.log('=== REGISTRATION ATTEMPT ===');
      console.log('User data:', { ...userData, password: '***', password_confirmation: '***' });

      // Регистрация пользователя
      const response = await usersAPI.register(userData);
      console.log('Registration API response:', response);

      // Сохраняем ВСЕ данные пользователя в localStorage
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userName', userData.name);
      localStorage.setItem('userPhone', userData.phone);
      localStorage.setItem('userId', Date.now().toString());

      // Создаем пользователя
      const user = {
        id: Date.now(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        regDate: new Date().toISOString().split('T')[0],
        daysOnSite: '1 день',
        completedAds: 0,
        incompleteAds: 0,
      };

      setCurrentUser(user);
      setUserAds([]);

      // Автоматически входим после регистрации
      const loginData = {
        email: userData.email,
        password: userData.password,
        name: userData.name,
        phone: userData.phone
      };

      // Вызываем метод login для автоматического входа после регистрации
      await login(loginData);

      return { 
        success: true, 
        data: response,
        message: 'Регистрация прошла успешно! Вы автоматически вошли в систему.'
      };

    } catch (error) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Error:', error);
      
      let errorMessage = error.message;
      
      // Обработка ошибок валидации
      if (error.status === 422) {
        if (error.validationErrors) {
          const formattedErrors = [];
          for (const [field, errors] of Object.entries(error.validationErrors)) {
            if (Array.isArray(errors)) {
              errors.forEach(err => formattedErrors.push(`${field}: ${err}`));
            } else if (typeof errors === 'string') {
              formattedErrors.push(`${field}: ${errors}`);
            }
          }

          if (formattedErrors.length > 0) {
            errorMessage = formattedErrors.join('; ');
          } else {
            errorMessage = 'Ошибка валидации данных';
          }
        } else {
          errorMessage = 'Ошибка валидации данных';
        }
      }
      
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Выход из системы - ИСПРАВЛЕННЫЙ МЕТОД
  const logout = () => {
    console.log('Logging out');
    
    // Удаляем ТОЛЬКО токены авторизации
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    
    // НЕ удаляем данные пользователя - они сохраняются для удобства
    // localStorage.removeItem('userEmail');
    // localStorage.removeItem('userName');
    // localStorage.removeItem('userPhone');
    // localStorage.removeItem('userId');
    
    setToken(null);
    setCurrentUser(null);
    setUserAds([]);
  };

  // Обновление данных пользователя
  const updateUser = (userData) => {
    if (userData.name) {
      localStorage.setItem('userName', userData.name);
    }
    if (userData.phone) {
      localStorage.setItem('userPhone', userData.phone);
    }
    if (userData.email) {
      localStorage.setItem('userEmail', userData.email);
    }
    
    const updatedUser = {
      ...currentUser,
      ...userData,
    };

    setCurrentUser(updatedUser);
    
    return { success: true };
  };

  // Добавление объявления пользователем
  const addUserAd = async (formData) => {
    try {
      const response = await petsAPI.addPet(formData, token);
      await refreshUserAds();
      return response;
    } catch (error) {
      console.error('Add user ad error:', error);
      throw error;
    }
  };

  // Обновление объявления
  const updateUserAd = async (id, updatedData) => {
    try {
      const formData = new FormData();
      Object.keys(updatedData).forEach(key => {
        if (updatedData[key] !== undefined) {
          formData.append(key, updatedData[key]);
        }
      });

      const response = await petsAPI.updatePet(id, formData, token);
      await refreshUserAds();
      return response;
    } catch (error) {
      console.error('Update user ad error:', error);
      throw error;
    }
  };

  // Удаление объявления
  const deleteUserAd = async (id) => {
    try {
      const response = await petsAPI.deletePet(id, token);
      setUserAds(prev => prev.filter(ad => ad.id !== id));
      return response;
    } catch (error) {
      console.error('Delete user ad error:', error);
      throw error;
    }
  };

  // Обновление списка объявлений пользователя
  const refreshUserAds = async () => {
    if (currentUser && token) {
      const ads = await loadUserAds(currentUser.id);
      setUserAds(ads);
    }
  };

  const value = {
    currentUser,
    userAds,
    isAuthenticated: !!currentUser && !!token,
    loading,
    token,
    login,
    register,
    logout,
    updateUser,
    addUserAd,
    updateUserAd,
    deleteUserAd,
    refreshUserAds,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};