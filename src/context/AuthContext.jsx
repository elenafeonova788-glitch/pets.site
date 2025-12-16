// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { usersAPI, petsAPI } from '../utils/apiService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userAds, setUserAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('authToken'));

  // Получение ключей localStorage для конкретного пользователя
  const getUserDataKey = (userId) => `userData_${userId}`;
  const getUserAdsKey = (userId) => `userAds_${userId}`;

  // Сохранение данных пользователя
  const saveUserData = (userData, authToken = null) => {
    if (!userData || !userData.id) {
      console.error('Не удалось сохранить данные пользователя: нет ID');
      return null;
    }
    
    const dataToSave = {
      id: userData.id,
      name: userData.name,
      email: userData.email,
      phone: userData.phone,
      registrationDate: userData.registrationDate || new Date().toISOString().split('T')[0],
      ordersCount: userData.ordersCount || 0,
      petsCount: userData.petsCount || 0,
    };
    
    // Сохраняем данные пользователя по его ID
    localStorage.setItem(getUserDataKey(userData.id), JSON.stringify(dataToSave));
    
    // Сохраняем информацию о текущем пользователе
    localStorage.setItem('currentUserId', userData.id);
    
    if (authToken) {
      localStorage.setItem('authToken', authToken);
      setToken(authToken);
    }
    
    console.log('Сохранены данные пользователя:', dataToSave);
    return dataToSave;
  };

  // Загрузка данных пользователя по ID
  const loadUserData = (userId) => {
    if (!userId) return null;
    
    const userDataStr = localStorage.getItem(getUserDataKey(userId));
    if (userDataStr) {
      try {
        return JSON.parse(userDataStr);
      } catch (error) {
        console.error('Ошибка парсинга данных пользователя:', error);
        return null;
      }
    }
    return null;
  };

  // Загрузка объявлений пользователя по ID
  const loadUserAds = (userId) => {
    if (!userId) return [];
    
    const adsStr = localStorage.getItem(getUserAdsKey(userId));
    if (adsStr) {
      try {
        return JSON.parse(adsStr);
      } catch (error) {
        console.error('Ошибка парсинга объявлений:', error);
        return [];
      }
    }
    return [];
  };

  // Инициализация при загрузке приложения
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('authToken');
      const savedUserId = localStorage.getItem('currentUserId');
      
      if (savedToken && savedUserId) {
        try {
          // Загружаем локальные данные
          const userData = loadUserData(savedUserId);
          const adsData = loadUserAds(savedUserId);
          
          if (userData) {
            setCurrentUser(userData);
            setUserAds(adsData);
            setToken(savedToken);
          } else {
            // Если локальные данные не найдены, пробуем загрузить с сервера
            try {
              const response = await usersAPI.getCurrentUser(savedToken);
              if (response.data && response.data.user) {
                const user = response.data.user[0] || response.data.user;
                const userData = {
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  phone: user.phone || '',
                  registrationDate: user.registrationDate || user.created_at || new Date().toISOString().split('T')[0],
                  ordersCount: user.ordersCount || 0,
                  petsCount: user.petsCount || 0,
                };
                
                saveUserData(userData, savedToken);
                setCurrentUser(userData);
                
                // Загружаем объявления пользователя
                try {
                  const ordersResponse = await usersAPI.getUserOrders(user.id, savedToken);
                  if (ordersResponse.data && ordersResponse.data.orders) {
                    const formattedAds = ordersResponse.data.orders.map(ad => ({
                      id: ad.id,
                      type: ad.kind || 'животное',
                      status: 'active',
                      name: ad.name || '',
                      description: ad.description || '',
                      district: ad.district || '',
                      date: ad.date || '',
                      photos: ad.photos || [],
                      mark: ad.mark || '',
                      adStatus: ad.status || 'active',
                      userId: user.id,
                    }));
                    
                    setUserAds(formattedAds);
                    localStorage.setItem(getUserAdsKey(user.id), JSON.stringify(formattedAds));
                  }
                } catch (adsError) {
                  console.error('Ошибка загрузки объявлений:', adsError);
                }
              }
            } catch (apiError) {
              console.error('Ошибка загрузки данных с сервера:', apiError);
              // Очищаем невалидные данные
              localStorage.removeItem('authToken');
              localStorage.removeItem('currentUserId');
            }
          }
        } catch (error) {
          console.error('Ошибка инициализации:', error);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  // Вход в систему
  const login = async (credentials) => {
    try {
      setLoading(true);
      console.log('=== LOGIN ATTEMPT ===');

      // 1. Отправляем запрос на сервер для входа
      const response = await usersAPI.login(credentials);
      console.log('Login API response:', response);

      // Извлекаем токен из ответа
      let authToken = null;
      
      if (response.data && response.data.token) {
        authToken = response.data.token;
      } else if (response.token) {
        authToken = response.token;
      } else if (response.data && response.data.access_token) {
        authToken = response.data.access_token;
      }

      if (!authToken) {
        console.error('No token in response:', response);
        throw new Error('Токен не получен от сервера. Неверный email или пароль.');
      }

      // 2. Получаем данные пользователя с сервера
      try {
        const userResponse = await usersAPI.getCurrentUser(authToken);
        console.log('User data response:', userResponse);
        
        if (!userResponse.data || !userResponse.data.user) {
          throw new Error('Не удалось получить данные пользователя');
        }
        
        const user = userResponse.data.user[0] || userResponse.data.user;
        
        // Форматируем данные пользователя
        const userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone || '',
          registrationDate: user.registrationDate || user.created_at || new Date().toISOString().split('T')[0],
          ordersCount: user.ordersCount || 0,
          petsCount: user.petsCount || 0,
        };
        
        // 3. Получаем объявления пользователя
        let userAdsData = [];
        try {
          const ordersResponse = await usersAPI.getUserOrders(user.id, authToken);
          if (ordersResponse.data && ordersResponse.data.orders) {
            userAdsData = ordersResponse.data.orders.map(ad => ({
              id: ad.id,
              type: ad.kind || 'животное',
              status: 'active',
              name: ad.name || '',
              description: ad.description || '',
              district: ad.district || '',
              date: ad.date || '',
              photos: ad.photos || [],
              mark: ad.mark || '',
              adStatus: ad.status || 'active',
              userId: user.id,
            }));
          }
        } catch (adsError) {
          console.error('Ошибка загрузки объявлений:', adsError);
        }

        // 4. Сохраняем данные
        saveUserData(userData, authToken);
        setCurrentUser(userData);
        setUserAds(userAdsData);
        localStorage.setItem(getUserAdsKey(user.id), JSON.stringify(userAdsData));
        
        console.log('Успешный вход, пользователь:', userData);

        return { success: true, user: userData };

      } catch (userDataError) {
        console.error('Ошибка загрузки данных пользователя:', userDataError);
        throw new Error('Не удалось загрузить данные пользователя');
      }

    } catch (error) {
      console.error('=== LOGIN ERROR ===');
      console.error('Full error:', error);
      
      let errorMessage = error.message || 'Ошибка при входе';

      if (errorMessage.includes('Failed to fetch') || 
          errorMessage.includes('Не удалось подключиться')) {
        errorMessage = 'Не удалось подключиться к серверу. Проверьте интернет-соединение.';
      } else if (errorMessage.includes('Unauthorized') || 
                 errorMessage.includes('Invalid credentials') ||
                 errorMessage.includes('Неверный email или пароль')) {
        errorMessage = 'Неверный email или пароль';
      } else if (error.status === 401 || error.status === 422) {
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

      // 1. Регистрируем пользователя
      const response = await usersAPI.register(userData);
      console.log('Registration API response:', response);

      // Проверяем успешность регистрации
      if (response.status === 204 || response.success) {
        console.log('Registration successful');
        
        // 2. Создаем временного пользователя
        const tempUserId = Date.now();
        const userDataToSave = {
          id: tempUserId,
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          registrationDate: new Date().toISOString().split('T')[0],
          ordersCount: 0,
          petsCount: 0,
        };
        
        // 3. Сохраняем данные временного пользователя
        saveUserData(userDataToSave);
        
        // 4. Устанавливаем пользователя в состояние
        setCurrentUser(userDataToSave);
        setUserAds([]);
        
        // 5. Пытаемся автоматически войти
        try {
          console.log('Попытка автоматического входа после регистрации...');
          const loginResult = await login({
            email: userData.email,
            password: userData.password
          });
          
          return { 
            success: true, 
            message: 'Регистрация прошла успешно! Вы автоматически вошли в систему.',
            user: loginResult.user
          };
        } catch (loginError) {
          console.log('Автоматический вход не удался, но регистрация успешна');
          
          return { 
            success: true, 
            message: 'Регистрация прошла успешно! Теперь вы можете войти в систему.',
            user: userDataToSave
          };
        }
      }
      
      throw new Error('Ошибка регистрации');

    } catch (error) {
      console.error('=== REGISTRATION ERROR ===');
      console.error('Full error:', error);
      
      let errorMessage = 'Ошибка при регистрации';
      
      if (error.message) {
        if (error.message.includes('Failed to fetch') || 
            error.message.includes('Не удалось подключиться')) {
          errorMessage = 'Не удалось подключиться к серверу. Проверьте интернет-соединение.';
        } else if (error.status === 422) {
          // Ошибки валидации с сервера
          if (error.data && error.data.errors) {
            const errors = error.data.errors;
            if (errors.email) errorMessage = `Email: ${errors.email[0]}`;
            else if (errors.phone) errorMessage = `Телефон: ${errors.phone[0]}`;
            else if (errors.password) errorMessage = `Пароль: ${errors.password[0]}`;
            else if (errors.name) errorMessage = `Имя: ${errors.name[0]}`;
            else if (errors.confirm) errorMessage = `Согласие: ${errors.confirm[0]}`;
          } else {
            errorMessage = 'Ошибка валидации данных. Проверьте правильность введенных данных.';
          }
        } else if (error.status === 500) {
          errorMessage = 'Ошибка сервера. Попробуйте позже.';
        } else {
          errorMessage = error.message;
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
    
    // Удаляем только токен, но сохраняем данные пользователя
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUserId');
    setToken(null);
    setCurrentUser(null);
    setUserAds([]);
  };

  // Обновление данных пользователя
  const updateUser = async (userData) => {
    try {
      setLoading(true);
      
      if (!currentUser || !token) {
        throw new Error('Пользователь не авторизован');
      }
      
      // Обновляем локальное состояние
      const updatedUser = {
        ...currentUser,
        ...userData,
      };

      // Сохраняем в localStorage
      saveUserData(updatedUser, token);
      setCurrentUser(updatedUser);
      
      return { success: true };
      
    } catch (error) {
      console.error('Update user error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Обновление объявлений пользователя
  const refreshUserAds = async () => {
    if (currentUser && token) {
      try {
        const ordersResponse = await usersAPI.getUserOrders(currentUser.id, token);
        if (ordersResponse.data && ordersResponse.data.orders) {
          const formattedAds = ordersResponse.data.orders.map(ad => ({
            id: ad.id,
            type: ad.kind || 'животное',
            status: 'active',
            name: ad.name || '',
            description: ad.description || '',
            district: ad.district || '',
            date: ad.date || '',
            photos: ad.photos || [],
            mark: ad.mark || '',
            adStatus: ad.status || 'active',
            userId: currentUser.id,
          }));
          
          setUserAds(formattedAds);
          localStorage.setItem(getUserAdsKey(currentUser.id), JSON.stringify(formattedAds));
          return formattedAds;
        }
      } catch (error) {
        console.error('Ошибка обновления объявлений:', error);
      }
    }
    return [];
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
    refreshUserAds,
    addUserAd: async (formData) => {
      try {
        const response = await petsAPI.addPet(formData, token);
        
        // После добавления объявления обновляем список
        if (currentUser) {
          await refreshUserAds();
          
          // Обновляем счетчик объявлений
          const updatedUser = {
            ...currentUser,
            ordersCount: (currentUser.ordersCount || 0) + 1,
          };
          saveUserData(updatedUser, token);
          setCurrentUser(updatedUser);
        }
        
        return response;
      } catch (error) {
        console.error('Add user ad error:', error);
        throw error;
      }
    },
    updateUserAd: async (id, updatedData) => {
      try {
        const response = await petsAPI.updatePet(id, updatedData, token);
        
        // После обновления объявления обновляем список
        if (currentUser) {
          await refreshUserAds();
        }
        
        return response;
      } catch (error) {
        console.error('Update user ad error:', error);
        throw error;
      }
    },
    deleteUserAd: async (id) => {
      try {
        const response = await petsAPI.deletePet(id, token);
        
        // После удаления объявления обновляем список
        if (currentUser) {
          await refreshUserAds();
          
          // Обновляем счетчик объявлений
          const updatedUser = {
            ...currentUser,
            ordersCount: Math.max(0, (currentUser.ordersCount || 0) - 1),
          };
          saveUserData(updatedUser, token);
          setCurrentUser(updatedUser);
        }
        
        return response;
      } catch (error) {
        console.error('Delete user ad error:', error);
        throw error;
      }
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};