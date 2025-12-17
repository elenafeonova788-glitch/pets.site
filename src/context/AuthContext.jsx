// context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userAds, setUserAds] = useState([]); // Добавим для совместимости

  useEffect(() => {
    // Проверяем сохраненную аутентификацию при загрузке
    const token = localStorage.getItem('authToken');
    const email = localStorage.getItem('userEmail');
    const name = localStorage.getItem('userName');
    const phone = localStorage.getItem('userPhone');
    const userId = localStorage.getItem('userId');
    
    // ВАЖНО: только если есть токен - это авторизованный пользователь
    if (token && email) {
      setUser({
        email,
        token,
        name: name || email.split('@')[0],
        phone: phone || '',
        id: userId
      });
    } 
    // Если есть email но НЕТ токена - удаляем эти данные, они не нужны
    else if (email) {
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userName');
      localStorage.removeItem('userPhone');
      localStorage.removeItem('userId');
      setUser(null);
    }
    
    setLoading(false);
  }, []);

  const login = (userData, token) => {
    if (!token) {
      console.error('Пустой токен при входе');
      return;
    }
    
    // Сохраняем все данные
    localStorage.setItem('authToken', token);
    localStorage.setItem('userEmail', userData.email);
    
    if (userData.name) {
      localStorage.setItem('userName', userData.name);
    } else {
      localStorage.setItem('userName', userData.email.split('@')[0]);
    }
    
    if (userData.phone) {
      localStorage.setItem('userPhone', userData.phone);
    }
    
    if (userData.id) {
      localStorage.setItem('userId', userData.id.toString());
    }
    
    setUser({
      email: userData.email,
      token,
      name: userData.name || userData.email.split('@')[0],
      phone: userData.phone || '',
      id: userData.id
    });
    
    return { success: true, user: userData };
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userPhone');
    localStorage.removeItem('userId');
    setUser(null);
    setUserAds([]);
  };

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
    if (userData.id) {
      localStorage.setItem('userId', userData.id.toString());
    }
    
    setUser(prev => ({
      ...prev,
      ...userData
    }));
  };

  // Методы для работы с объявлениями (добавляем для совместимости)
  const addUserAd = async (formData, files) => {
    try {
      if (!user || !user.token) {
        throw new Error('Пользователь не авторизован');
      }
      
      const data = new FormData();
      
      // Добавляем текстовые поля
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined && formData[key] !== null) {
          data.append(key, formData[key]);
        }
      });
      
      // Добавляем фото
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          if (file.type === 'image/png') {
            data.append(`photo${index + 1}`, file);
          }
        });
      }
      
      const response = await fetch('https://pets.сделай.site/api/pets', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user.token}`
        },
        body: data
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Ошибка при добавлении объявления');
      }
      
      // Обновляем список объявлений
      await refreshUserAds();
      
      return { success: true };
      
    } catch (error) {
      console.error('Add user ad error:', error);
      throw error;
    }
  };

  const refreshUserAds = async () => {
    if (!user?.id || !user.token) {
      return [];
    }
    
    try {
      const response = await fetch(`https://pets.сделай.site/api/users/orders/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${user.token}`,
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data?.orders) {
          const formattedAds = data.data.orders.map(ad => ({
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
          localStorage.setItem(`userAds_${user.id}`, JSON.stringify(formattedAds));
          return formattedAds;
        }
      }
    } catch (error) {
      console.error('Ошибка обновления объявлений:', error);
    }
    
    return [];
  };

  const deleteUserAd = async (id) => {
    try {
      if (!user || !user.token) {
        throw new Error('Пользователь не авторизован');
      }
      
      const response = await fetch(`https://pets.сделай.site/api/users/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${user.token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Обновляем список объявлений
        await refreshUserAds();
        return { success: true };
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Ошибка при удалении объявления');
      }
    } catch (error) {
      console.error('Delete user ad error:', error);
      throw error;
    }
  };

  // Методы регистрации и входа из старого контекста (упрощенные)
  const register = async (userData) => {
    try {
      const response = await fetch('https://pets.сделай.site/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: userData.name,
          phone: userData.phone,
          email: userData.email,
          password: userData.password,
          password_confirmation: userData.password_confirmation,
          confirm: userData.confirm || 1
        }),
      });
      
      if (response.ok) {
        // Пробуем автоматически войти после регистрации
        try {
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
          return { 
            success: true, 
            message: 'Регистрация прошла успешно! Теперь вы можете войти в систему.',
            user: {
              email: userData.email,
              name: userData.name,
              phone: userData.phone
            }
          };
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Ошибка при регистрации');
      }
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  };

  const value = {
    currentUser: user,
    userAds,
    isAuthenticated: !!user && !!user.token,
    loading,
    token: user?.token,
    login,
    register,
    logout,
    updateUser,
    refreshUserAds,
    addUserAd,
    deleteUserAd,
    updateUserAd: async (id, updatedData) => {
      // Реализация обновления объявления
      try {
        const data = new FormData();
        
        if (updatedData.description) {
          data.append('description', updatedData.description);
        }
        
        if (updatedData.mark) {
          data.append('mark', updatedData.mark);
        }
        
        // Добавляем новые фото
        if (updatedData.photos && updatedData.photos.length > 0) {
          updatedData.photos.forEach((file, index) => {
            if (file.type === 'image/png') {
              data.append(`photo${index + 1}`, file);
            }
          });
        }
        
        const response = await fetch(`https://pets.сделай.site/api/pets/${id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${user?.token}`
          },
          body: data
        });
        
        if (response.ok) {
          await refreshUserAds();
          return { success: true };
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error?.message || 'Ошибка при обновлении объявления');
        }
      } catch (error) {
        console.error('Update user ad error:', error);
        throw error;
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};