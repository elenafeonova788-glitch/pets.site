// utils/syncService.js
import { usersAPI } from './apiService';

// Получение данных с сервера для конкретного пользователя
export const syncUserData = async (token) => {
  try {
    if (!token) {
      console.log('Нет токена для синхронизации');
      throw new Error('Отсутствует токен авторизации');
    }
    
    console.log('Синхронизация данных пользователя с сервером...');
    
    // 1. Получаем данные пользователя
    const userResponse = await usersAPI.getCurrentUser(token);
    console.log('Данные пользователя с API:', userResponse);
    
    if (!userResponse.data) {
      console.log('Нет данных пользователя в ответе API');
      throw new Error('Не удалось получить данные пользователя');
    }
    
    const userData = userResponse.data;
    const userId = userData.id;
    
    if (!userId) {
      throw new Error('Не удалось получить ID пользователя');
    }
    
    // 2. Получаем объявления пользователя
    let userAds = [];
    
    try {
      const adsResponse = await usersAPI.getUserOrders(userId, token);
      console.log('Объявления пользователя с API:', adsResponse);
      
      if (adsResponse.data) {
        if (Array.isArray(adsResponse.data.orders)) {
          userAds = adsResponse.data.orders;
        } else if (Array.isArray(adsResponse.data)) {
          userAds = adsResponse.data;
        } else if (adsResponse.data.orders && Array.isArray(adsResponse.data.orders)) {
          userAds = adsResponse.data.orders;
        }
      }
    } catch (adsError) {
      console.log('Ошибка получения объявлений:', adsError);
      // Пробуем старый endpoint для совместимости
      try {
        const oldAdsResponse = await usersAPI.getUserOrdersOld(userId, token);
        console.log('Объявления со старого endpoint:', oldAdsResponse);
        
        if (oldAdsResponse.data && Array.isArray(oldAdsResponse.data)) {
          userAds = oldAdsResponse.data;
        }
      } catch (oldAdsError) {
        console.log('Ошибка получения объявлений со старого endpoint:', oldAdsError);
      }
    }
    
    console.log(`Получено ${userAds.length} объявлений пользователя ${userId}`);
    
    return {
      user: userData,
      ads: userAds,
    };
    
  } catch (error) {
    console.error('Ошибка синхронизации:', error);
    throw error;
  }
};

// Сохранение синхронизированных данных для конкретного пользователя
export const saveSyncedData = (userData, adsData) => {
  try {
    if (!userData || !userData.id) {
      console.error('Не удалось сохранить данные: нет ID пользователя');
      return false;
    }
    
    const userId = userData.id;
    
    // Форматируем данные пользователя
    const formattedUserData = {
      id: userId,
      name: userData.name || 'Пользователь',
      email: userData.email || '',
      phone: userData.phone || '',
      registrationDate: userData.created_at || userData.registrationDate || new Date().toISOString().split('T')[0],
      ordersCount: adsData?.length || userData.orders_count || userData.ordersCount || 0,
      petsCount: userData.pets_count || userData.petsCount || 0,
    };
    
    // Сохраняем данные пользователя с ключом по ID
    localStorage.setItem(`userData_${userId}`, JSON.stringify(formattedUserData));
    console.log('Сохранены данные пользователя:', formattedUserData);
    
    // Сохраняем объявления пользователя с ключом по ID
    if (adsData && Array.isArray(adsData)) {
      const formattedAds = adsData.map(ad => ({
        id: ad.id,
        type: ad.kind || ad.type,
        status: ad.status || 'active',
        name: ad.name || '',
        description: ad.description || '',
        district: ad.district,
        date: ad.date || ad.created_at,
        photos: ad.photos || [],
        mark: ad.mark || '',
        adStatus: ad.status || 'active',
        userId: ad.user_id || ad.userId || userId,
      }));
      
      localStorage.setItem(`userAds_${userId}`, JSON.stringify(formattedAds));
      console.log(`Сохранено ${formattedAds.length} объявлений для пользователя ${userId}`);
    }
    
    // Сохраняем информацию о текущем пользователе
    localStorage.setItem('currentUser', JSON.stringify({
      id: userId,
      email: userData.email
    }));
    
    return true;
    
  } catch (error) {
    console.error('Ошибка сохранения данных:', error);
    return false;
  }
};

// Получение данных пользователя по ID из localStorage
export const getUserData = (userId) => {
  try {
    if (!userId) {
      console.error('Не указан ID пользователя');
      return { user: null, ads: [] };
    }
    
    const userDataStr = localStorage.getItem(`userData_${userId}`);
    const adsDataStr = localStorage.getItem(`userAds_${userId}`);
    
    const userData = userDataStr ? JSON.parse(userDataStr) : null;
    const adsData = adsDataStr ? JSON.parse(adsDataStr) : [];
    
    // Фильтруем объявления только этого пользователя (на всякий случай)
    const filteredAds = adsData.filter(ad => ad.userId === userId);
    
    return { user: userData, ads: filteredAds };
  } catch (error) {
    console.error('Ошибка получения данных пользователя:', error);
    return { user: null, ads: [] };
  }
};

// Получение информации о текущем пользователе из localStorage
export const getCurrentUserInfo = () => {
  try {
    const currentUserStr = localStorage.getItem('currentUser');
    if (!currentUserStr) return null;
    
    return JSON.parse(currentUserStr);
  } catch (error) {
    console.error('Ошибка получения информации о текущем пользователе:', error);
    return null;
  }
};

// Очистка данных пользователя по ID
export const clearUserData = (userId) => {
  try {
    if (!userId) return false;
    
    localStorage.removeItem(`userData_${userId}`);
    localStorage.removeItem(`userAds_${userId}`);
    
    // Проверяем, не удаляем ли мы данные текущего пользователя
    const currentUserInfo = getCurrentUserInfo();
    if (currentUserInfo && currentUserInfo.id === userId) {
      localStorage.removeItem('currentUser');
    }
    
    console.log(`Данные пользователя ${userId} очищены`);
    return true;
  } catch (error) {
    console.error('Ошибка очистки данных пользователя:', error);
    return false;
  }
};

// Получение списка всех пользователей в localStorage
export const getAllUsers = () => {
  const users = [];
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      
      if (key.startsWith('userData_')) {
        try {
          const userId = key.replace('userData_', '');
          const userDataStr = localStorage.getItem(key);
          const userData = JSON.parse(userDataStr);
          
          users.push({
            id: userId,
            email: userData.email,
            name: userData.name,
            phone: userData.phone,
            registrationDate: userData.registrationDate,
            ordersCount: userData.ordersCount || 0
          });
        } catch (parseError) {
          console.error(`Ошибка парсинга данных пользователя для ключа ${key}:`, parseError);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка получения списка пользователей:', error);
  }
  
  return users;
};

// Переключение на другого пользователя
export const switchToUser = (userId) => {
  try {
    const userData = getUserData(userId);
    
    if (userData.user) {
      // Сохраняем информацию о текущем пользователе
      localStorage.setItem('currentUser', JSON.stringify({
        id: userId,
        email: userData.user.email
      }));
      
      console.log(`Переключение на пользователя ${userId}: ${userData.user.email}`);
      return userData.user;
    }
    
    return null;
  } catch (error) {
    console.error('Ошибка переключения пользователя:', error);
    return null;
  }
};