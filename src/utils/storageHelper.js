// utils/storageHelper.js
// Функции для работы с localStorage с поддержкой нескольких пользователей

// Ключи для хранения данных
export const StorageKeys = {
    AUTH_TOKEN: 'authToken',
    CURRENT_USER: 'currentUser',
    USER_DATA: (userId) => `userData_${userId}`,
    USER_ADS: (userId) => `userAds_${userId}`,
    LAST_USER_INFO: 'lastUserInfo', // Для неавторизованных пользователей
  };
  
  // Сохранение данных пользователя
  export const saveUserData = (userId, userData) => {
    try {
      if (!userId || !userData) {
        console.error('Не указаны ID пользователя или данные');
        return false;
      }
      
      const dataToSave = {
        id: userId,
        name: userData.name || '',
        email: userData.email || '',
        phone: userData.phone || '',
        registrationDate: userData.registrationDate || new Date().toISOString().split('T')[0],
        ordersCount: userData.ordersCount || 0,
        petsCount: userData.petsCount || 0,
      };
      
      localStorage.setItem(StorageKeys.USER_DATA(userId), JSON.stringify(dataToSave));
      console.log(`Данные пользователя ${userId} сохранены`);
      return true;
    } catch (error) {
      console.error('Ошибка сохранения данных пользователя:', error);
      return false;
    }
  };
  
  // Получение данных пользователя
  export const getUserData = (userId) => {
    try {
      if (!userId) {
        console.error('Не указан ID пользователя');
        return null;
      }
      
      const dataStr = localStorage.getItem(StorageKeys.USER_DATA(userId));
      if (!dataStr) return null;
      
      return JSON.parse(dataStr);
    } catch (error) {
      console.error('Ошибка получения данных пользователя:', error);
      return null;
    }
  };
  
  // Сохранение объявлений пользователя
  export const saveUserAds = (userId, ads) => {
    try {
      if (!userId || !Array.isArray(ads)) {
        console.error('Не указаны ID пользователя или объявления');
        return false;
      }
      
      // Фильтруем объявления только этого пользователя
      const userAds = ads.filter(ad => ad.userId === userId);
      
      localStorage.setItem(StorageKeys.USER_ADS(userId), JSON.stringify(userAds));
      console.log(`Сохранено ${userAds.length} объявлений для пользователя ${userId}`);
      return true;
    } catch (error) {
      console.error('Ошибка сохранения объявлений пользователя:', error);
      return false;
    }
  };
  
  // Получение объявлений пользователя
  export const getUserAds = (userId) => {
    try {
      if (!userId) {
        console.error('Не указан ID пользователя');
        return [];
      }
      
      const adsStr = localStorage.getItem(StorageKeys.USER_ADS(userId));
      if (!adsStr) return [];
      
      const allAds = JSON.parse(adsStr);
      // Фильтруем объявления только этого пользователя (на всякий случай)
      return allAds.filter(ad => ad.userId === userId);
    } catch (error) {
      console.error('Ошибка получения объявлений пользователя:', error);
      return [];
    }
  };
  
  // Сохранение информации о текущем пользователе
  export const setCurrentUser = (userId, email) => {
    try {
      if (!userId || !email) {
        console.error('Не указаны ID пользователя или email');
        return false;
      }
      
      localStorage.setItem(StorageKeys.CURRENT_USER, JSON.stringify({
        id: userId,
        email: email
      }));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения текущего пользователя:', error);
      return false;
    }
  };
  
  // Получение информации о текущем пользователе
  export const getCurrentUser = () => {
    try {
      const userStr = localStorage.getItem(StorageKeys.CURRENT_USER);
      if (!userStr) return null;
      
      return JSON.parse(userStr);
    } catch (error) {
      console.error('Ошибка получения текущего пользователя:', error);
      return null;
    }
  };
  
  // Сохранение последней информации о неавторизованном пользователе
  export const saveLastUserInfo = (userInfo) => {
    try {
      localStorage.setItem(StorageKeys.LAST_USER_INFO, JSON.stringify(userInfo));
      return true;
    } catch (error) {
      console.error('Ошибка сохранения информации о пользователе:', error);
      return false;
    }
  };
  
  // Получение последней информации о неавторизованном пользователе
  export const getLastUserInfo = () => {
    try {
      const infoStr = localStorage.getItem(StorageKeys.LAST_USER_INFO);
      if (!infoStr) return null;
      
      return JSON.parse(infoStr);
    } catch (error) {
      console.error('Ошибка получения информации о пользователе:', error);
      return null;
    }
  };
  
  // Очистка всех данных пользователя
  export const clearUserStorage = (userId) => {
    try {
      if (!userId) return false;
      
      // Удаляем данные пользователя
      localStorage.removeItem(StorageKeys.USER_DATA(userId));
      localStorage.removeItem(StorageKeys.USER_ADS(userId));
      
      // Проверяем, не удаляем ли мы данные текущего пользователя
      const currentUser = getCurrentUser();
      if (currentUser && currentUser.id === userId) {
        localStorage.removeItem(StorageKeys.CURRENT_USER);
        localStorage.removeItem(StorageKeys.AUTH_TOKEN);
      }
      
      console.log(`Данные пользователя ${userId} очищены`);
      return true;
    } catch (error) {
      console.error('Ошибка очистки данных пользователя:', error);
      return false;
    }
  };
  
  // Получение списка всех пользователей
  export const getAllStoredUsers = () => {
    const users = [];
    
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('userData_')) {
          try {
            const userId = key.replace('userData_', '');
            const userData = getUserData(userId);
            
            if (userData) {
              users.push({
                id: userId,
                email: userData.email,
                name: userData.name,
                phone: userData.phone,
                registrationDate: userData.registrationDate,
                ordersCount: userData.ordersCount || 0,
                hasAds: localStorage.getItem(StorageKeys.USER_ADS(userId)) !== null
              });
            }
          } catch (error) {
            console.error(`Ошибка обработки пользователя для ключа ${key}:`, error);
          }
        }
      }
    } catch (error) {
      console.error('Ошибка получения списка пользователей:', error);
    }
    
    return users;
  };
  
  // Проверка, существует ли пользователь
  export const userExists = (userId) => {
    try {
      return localStorage.getItem(StorageKeys.USER_DATA(userId)) !== null;
    } catch (error) {
      console.error('Ошибка проверки существования пользователя:', error);
      return false;
    }
  };
  
  // Получение статистики хранилища
  export const getStorageStats = () => {
    try {
      const totalKeys = localStorage.length;
      let userDataCount = 0;
      let userAdsCount = 0;
      let otherKeys = 0;
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        
        if (key.startsWith('userData_')) {
          userDataCount++;
        } else if (key.startsWith('userAds_')) {
          userAdsCount++;
        } else {
          otherKeys++;
        }
      }
      
      return {
        totalKeys,
        userDataCount,
        userAdsCount,
        otherKeys,
        estimatedSize: JSON.stringify(localStorage).length
      };
    } catch (error) {
      console.error('Ошибка получения статистики хранилища:', error);
      return null;
    }
  };