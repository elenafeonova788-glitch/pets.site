import React, { createContext, useState, useContext, useEffect } from 'react';
import { usersAPI, petsAPI } from '../utils/apiService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Загрузка данных пользователя при наличии токена
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedEmail = localStorage.getItem('userEmail');
      const savedName = localStorage.getItem('userName');
      const savedPhone = localStorage.getItem('userPhone');

      if (savedToken && savedEmail) {
        try {
          // Пытаемся получить данные пользователя через API
          const userResponse = await usersAPI.getUser(1, savedToken);
          console.log('User response:', userResponse);

          if (userResponse.data && userResponse.data.user) {
            const userData = userResponse.data.user;
            const user = Array.isArray(userData) ? userData[0] : userData;

            setCurrentUser({
              id: user.id || 1,
              name: user.name || savedName || 'Пользователь',
              email: user.email || savedEmail || '',
              phone: user.phone || savedPhone || '',
              regDate: user.registrationDate || new Date().toISOString().split('T')[0],
              daysOnSite: calculateDaysOnSite(user.registrationDate),
              completedAds: user.petsCount || 0,
              incompleteAds: user.ordersCount || 0,
            });
            
            setToken(savedToken);
            
            // Загружаем объявления пользователя
            const ads = await loadUserAds(user.id || 1);
            setUserAds(ads);
          }
        } catch (error) {
          console.error('Ошибка загрузки данных пользователя:', error);
          // Если токен невалидный, удаляем его
          if (error.message.includes('401') || error.message.includes('Unauthorized')) {
            localStorage.removeItem('token');
            setToken(null);
            setCurrentUser(null);
          }
        }
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

      const response = await usersAPI.login(credentials);
      console.log('Login API response:', response);

      // Проверяем наличие токена в разных местах ответа
      let authToken = null;

      if (response.data && response.data.token) {
        authToken = response.data.token;
      } else if (response.token) {
        authToken = response.token;
      } else if (response.data && response.data.access_token) {
        authToken = response.data.access_token;
      }

      if (!authToken) {
        console.error('No token in response');
        throw new Error('Токен не получен от сервера');
      }

      console.log('Setting token:', authToken);
      localStorage.setItem('token', authToken);
      setToken(authToken);

      // Сохраняем ВСЕ данные пользователя в localStorage
      localStorage.setItem('userEmail', credentials.email);
      localStorage.setItem('userName', credentials.name || credentials.email?.split('@')[0] || 'Пользователь');
      localStorage.setItem('userPhone', credentials.phone || '');

      // Создаем пользователя
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

      setCurrentUser(user);
      setUserAds([]);

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

      return { success: true, data: response };

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

  // Выход из системы
  const logout = () => {
    console.log('Logging out');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userRegDate');
    setToken(null);
    setCurrentUser(null);
    setUserAds([]);
  };

  // Обновление данных пользователя
  const updateUser = async (updatedData) => {
    try {
      setLoading(true);

      // Обновляем локально
      const updatedUser = {
        ...currentUser,
        ...updatedData,
      };

      setCurrentUser(updatedUser);

      // Сохраняем ВСЕ данные в localStorage
      if (updatedData.name) localStorage.setItem('userName', updatedData.name);
      if (updatedData.email) localStorage.setItem('userEmail', updatedData.email);
      if (updatedData.phone) localStorage.setItem('userPhone', updatedData.phone);

      return { success: true };

    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
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