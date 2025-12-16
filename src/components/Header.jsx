import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav, Form, Button, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { petsAPI, transformPetData, getFullImageUrl } from '../utils/apiService';
import { getAnimalType, getDistrictName } from '../utils/helpers';

const Header = ({ showPetDetails }) => {
  const { isAuthenticated, currentUser, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const searchTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Закрытие подсказок при клике вне
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Поиск при отправке формы
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?kind=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
      setShowSuggestions(false);
      
      // Отправляем событие для обновления поиска
      window.dispatchEvent(new CustomEvent('forceSearchUpdate', { 
        detail: { searchQuery: searchTerm.trim() } 
      }));
    } else {
      navigate('/search');
    }
  };

  // Поиск с debounce и подсказками
  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    if (value.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(async () => {
        try {
          // Быстрый поиск для подсказок
          const response = await petsAPI.quickSearch(value.trim(), 1, 5);
          console.log('Search suggestions response:', response);
          
          if (response.data) {
            // API может возвращать данные в разных форматах
            let suggestions = [];
            
            if (response.data.orders) {
              suggestions = response.data.orders;
            } else if (response.data.pets) {
              suggestions = response.data.pets;
            } else if (Array.isArray(response.data)) {
              suggestions = response.data;
            }
            
            console.log('Processed suggestions:', suggestions);
            
            if (suggestions.length > 0) {
              setSuggestions(suggestions.slice(0, 5));
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
            }
          } else {
            setSuggestions([]);
            setShowSuggestions(false);
          }
        } catch (error) {
          console.error('Ошибка загрузки подсказок:', error);
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }, 300);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Нажатие Enter в поле поиска
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearch(e);
    }
  };

  // Функция для сбора всех фотографий из объекта (как в transformPetData)
  const collectAllPhotos = (item) => {
    const photos = [];
    
    // Проверяем photos массив
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
    
    // Проверяем отдельные поля фото
    for (let i = 1; i <= 3; i++) {
      const photoKey = `photo${i}`;
      if (item[photoKey] && item[photoKey] !== '') {
        const fullUrl = getFullImageUrl(item[photoKey]);
        if (fullUrl && !fullUrl.includes('placeholder')) {
          photos.push(fullUrl);
        }
      }
    }
    
    // Если есть поле image
    if (item.image && item.image !== '' && !photos.some(p => p.includes(item.image))) {
      const fullUrl = getFullImageUrl(item.image);
      if (fullUrl && !fullUrl.includes('placeholder')) {
        photos.push(fullUrl);
      }
    }
    
    // Если нет фотографий, добавляем fallback
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
    
    return photos;
  };

  // Выбор подсказки - ОТКРЫВАЕМ ТОЧНО ТАКОЕ ЖЕ ОБЪЯВЛЕНИЕ
  const handleSuggestionClick = (item) => {
    console.log('Clicked suggestion item:', item);
    
    // Закрываем подсказки
    setShowSuggestions(false);
    setSearchTerm('');
    
    try {
      // Собираем все фотографии (как в transformPetData)
      const photos = collectAllPhotos(item);
      
      // Создаем объект питомца в ТОЧНОМ ФОРМАТЕ, как в PetCard и Home.jsx
      const pet = {
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
        registered: item.registred || false,
        mark: item.mark || '',
        isFromAPI: true,
        originalData: item,
      };
      
      console.log('Pet object for modal (from suggestion):', pet);
      
      // Вызываем функцию showPetDetails с созданным объектом
      if (showPetDetails) {
        showPetDetails(pet);
      } else {
        console.error('showPetDetails is not available');
        // Если функция недоступна, переходим на страницу поиска
        const searchTermValue = item.kind || item.type || '';
        navigate(`/search?kind=${encodeURIComponent(searchTermValue)}`);
      }
    } catch (error) {
      console.error('Error processing suggestion:', error);
      // При ошибке переходим на страницу поиска
      const searchTermValue = item.kind || item.type || '';
      navigate(`/search?kind=${encodeURIComponent(searchTermValue)}`);
    }
  };

  // Выход из системы
  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из системы?')) {
      logout();
      navigate('/');
    }
  };

  // Проверка активной страницы
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Navbar expand="lg" className="custom-navbar navbar-expand-lg navbar-light" style={{ backgroundColor: '#2f4f4f' }}>
      <Container>
        <Navbar.Brand as={Link} to="/" className="navbar-brand">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/11647/11647571.png" 
            className="logo-img rounded-3" 
            alt="logo" 
            style={{ height: '40px' }}
          />
          <span className="ms-2 fw-bold align-middle text-white">GET PET BACK</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="navbarNav" />
        
        <Navbar.Collapse id="navbarNav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/add-pet" 
              className={isActive('/add-pet') ? 'active text-warning' : 'text-white'}
              style={{ fontWeight: isActive('/add-pet') ? 'bold' : 'normal' }}
            >
              Добавить объявление
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/search" 
              className={isActive('/search') ? 'active text-warning' : 'text-white'}
              style={{ fontWeight: isActive('/search') ? 'bold' : 'normal' }}
            >
              Поиск по объявлениям
            </Nav.Link>
          </Nav>
          
          {/* Поиск с подсказками */}
          <div className="position-relative me-2" ref={searchContainerRef}>
            <Form className="d-flex" onSubmit={handleSearch}>
              <Form.Control
                type="search"
                placeholder="Поиск по животным..."
                className="me-2"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (suggestions.length > 0 && searchTerm.length >= 2) {
                    setShowSuggestions(true);
                  }
                }}
                aria-label="Поиск"
                style={{ minWidth: '250px' }}
              />
              <Button type="submit" variant="outline-light">
                Поиск
              </Button>
            </Form>
            
            {/* Подсказки поиска */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="search-suggestions" style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 1000,
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '0 0 5px 5px',
                maxHeight: '300px',
                overflowY: 'auto',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
              }}>
                {suggestions.map((item, index) => {
                  const type = item.kind || item.type || 'Животное';
                  const name = item.name || '';
                  const description = item.description || '';
                  
                  return (
                    <div
                      key={index}
                      className="search-suggestion-item p-2 border-bottom"
                      style={{
                        cursor: 'pointer',
                        transition: 'background-color 0.2s'
                      }}
                      onClick={() => handleSuggestionClick(item)}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                    >
                      <div className="fw-bold d-flex align-items-center">
                        <span className="me-2">{type}</span>
                        {name && <span>- {name}</span>}
                      </div>
                      <small className="text-muted d-block">
                        {description.length > 50 ? `${description.substring(0, 50)}...` : description}
                      </small>
                      <small className="text-primary d-block mt-1">
                        Нажмите, чтобы открыть объявление
                      </small>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Блок авторизации/пользователя */}
          {!isAuthenticated ? (
            <div id="authSection" className="d-flex">
              <Button 
                as={Link} 
                to="/registration" 
                variant="outline-light" 
                className="ms-2"
              >
                Регистрация
              </Button>
              <Button 
                as={Link} 
                to="/login" 
                variant="outline-light" 
                className="ms-2"
                id="loginBtn"
              >
                Вход
              </Button>
            </div>
          ) : (
            <div id="userSection">
              <Dropdown>
                <Dropdown.Toggle variant="outline-light" id="userDropdown">
                  {currentUser?.name || 'Пользователь'}
                </Dropdown.Toggle>
                
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">
                    Личный кабинет
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    Выйти
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;