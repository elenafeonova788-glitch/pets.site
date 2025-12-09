import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Row, Col, Pagination, Spinner, Alert, Badge } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { districts, animalTypes } from '../utils/constants';
import { getAnimalType, getDistrictName } from '../utils/helpers';
import { petsAPI, transformPetData } from '../utils/apiService';

const Search = ({ showPetDetails }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  const pageParam = queryParams.get('page');
  
  // Состояния для поиска
  const [searchType, setSearchType] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(pageParam ? parseInt(pageParam) : 1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Константы - 10 объявлений на страницу
  const adsPerPage = 10;

  useEffect(() => {
    // При загрузке компонента или изменении query в URL
    const performInitialSearch = async () => {
      setHasSearched(true);
      await performSearch(currentPage, initialQuery);
    };
    
    if (initialQuery || location.pathname === '/search') {
      performInitialSearch();
    }
  }, [initialQuery, location.pathname, currentPage]);

  const performSearch = async (page = 1, query = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const filters = {};
      // Только если выбран конкретный тип (не "Все типы")
      if (searchType && searchType !== '') {
        filters.kind = searchType;
      }
      if (searchDistrict && searchDistrict !== '') {
        const districtName = districts[searchDistrict] || searchDistrict;
        filters.district = districtName;
      }
      
      console.log('Searching with:', { query, page, filters, adsPerPage });
      
      // Добавляем задержку для имитации загрузки (для тестирования)
      // await new Promise(resolve => setTimeout(resolve, 1000));
      
      const apiResponse = await petsAPI.searchPets(query, page, adsPerPage, filters);
      
      console.log('API search response:', apiResponse);
      console.log('API response structure:', JSON.stringify(apiResponse, null, 2));
      
      const transformedData = transformPetData(apiResponse);
      const transformedPets = transformedData.pets || [];
      const paginationInfo = transformedData.pagination || { total: 0, last_page: 1 };
      
      console.log('Transformed pets:', transformedPets);
      console.log('Pagination info:', paginationInfo);
      
      // Если нет пагинации в ответе, создаем ее на клиенте
      if (paginationInfo.last_page <= 1 && transformedPets.length > 0) {
        // Создаем фиктивную пагинацию для демонстрации
        const totalItems = paginationInfo.total || transformedPets.length;
        const calculatedPages = Math.ceil(totalItems / adsPerPage);
        
        console.log('Creating client-side pagination:', {
          totalItems,
          calculatedPages,
          adsPerPage
        });
        
        // Разделяем результаты по страницам
        const startIndex = (page - 1) * adsPerPage;
        const endIndex = startIndex + adsPerPage;
        const paginatedPets = transformedPets.slice(startIndex, endIndex);
        
        setSearchResults(paginatedPets);
        setTotalPages(calculatedPages > 0 ? calculatedPages : 1);
        setTotalResults(totalItems);
        setCurrentPage(page);
      } else {
        setSearchResults(transformedPets);
        setTotalPages(paginationInfo.last_page || 1);
        setTotalResults(paginationInfo.total || transformedPets.length);
        setCurrentPage(paginationInfo.current_page || page);
      }
      
      if (transformedPets.length === 0) {
        setError('По вашему запросу ничего не найдено');
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setError('Ошибка при поиске объявлений: ' + (error.message || error.toString()));
      
      // Заглушка для демонстрации (удалите в продакшене)
      const mockPets = getMockPets();
      setSearchResults(mockPets.slice(0, adsPerPage));
      setTotalPages(3);
      setTotalResults(mockPets.length);
      setCurrentPage(page);
      
    } finally {
      setLoading(false);
    }
  };

  // Функция для обработки пагинации
  const paginate = (pageNumber) => {
    // Обновляем URL с параметром страницы
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    if (searchType) {
      params.set('type', searchType);
    }
    if (searchDistrict) {
      params.set('district', searchDistrict);
    }
    if (pageNumber > 1) {
      params.set('page', pageNumber);
    } else {
      params.delete('page');
    }
    
    navigate(`/search?${params.toString()}`);
    
    // Устанавливаем новую страницу
    setCurrentPage(pageNumber);
    // Выполняем поиск для новой страницы
    performSearch(pageNumber, searchQuery);
  };

  // Функция для обработки сброса фильтров
  const resetFilters = () => {
    setSearchType('');
    setSearchDistrict('');
    setSearchQuery('');
    setHasSearched(false);
    setSearchResults([]);
    setError(null);
    setCurrentPage(1);
    navigate('/search');
  };

  // Функция для поиска при нажатии кнопки
  const handleSearch = (e) => {
    e?.preventDefault();
    
    // Обновляем URL с поисковым запросом
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    if (searchType) {
      params.set('type', searchType);
    }
    if (searchDistrict) {
      params.set('district', searchDistrict);
    }
    params.delete('page'); // Сбрасываем на первую страницу
    navigate(`/search?${params.toString()}`);
    
    // Устанавливаем первую страницу
    setCurrentPage(1);
    // Выполняем поиск
    performSearch(1, searchQuery);
  };

  // Генерация номеров страниц для пагинации
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxPagesToShow = 5;
    
    if (totalPages <= maxPagesToShow) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
      
      if (endPage - startPage + 1 < maxPagesToShow) {
        startPage = Math.max(1, endPage - maxPagesToShow + 1);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pageNumbers.push(i);
      }
    }
    
    return pageNumbers;
  };

  // Функция для форматирования заголовка результата
  const formatResultTitle = (pet) => {
    const animalType = getAnimalType(pet.type);
    const petName = pet.name ? ` - ${pet.name}` : '';
    return `${animalType}${petName}`;
  };

  return (
    <Container>
      <h2 className="text-center text-white bg-dark py-2 rounded mb-4">Поиск питомцев</h2>
      
      {error && !loading && (
        <Alert variant={error.includes('не найдено') ? 'info' : 'danger'} className="mb-3">
          {error}
        </Alert>
      )}
      
      <Row>
        <Col md={4}>
          <Card className="shadow mb-4 mb-md-0">
            <Card.Body className="p-4">
              <h5 className="card-title mb-4">Параметры поиска</h5>
              <Form onSubmit={handleSearch}>
                <Form.Group className="mb-3">
                  <Form.Label>Тип животного</Form.Label>
                  <Form.Select
                    value={searchType}
                    onChange={(e) => {
                      setSearchType(e.target.value);
                      // При изменении фильтра сразу выполняем поиск
                      setTimeout(() => handleSearch(), 100);
                    }}
                    disabled={loading}
                  >
                    <option value="">Все типы</option>
                    {Object.entries(animalTypes).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Район</Form.Label>
                  <Form.Select
                    value={searchDistrict}
                    onChange={(e) => {
                      setSearchDistrict(e.target.value);
                      // При изменении фильтра сразу выполняем поиск
                      setTimeout(() => handleSearch(), 100);
                    }}
                    disabled={loading}
                  >
                    <option value="">Все районы</option>
                    {Object.entries(districts).map(([key, value]) => (
                      <option key={key} value={key}>{value}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Ключевые слова</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Введите поисковый запрос..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={loading}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleSearch(e);
                      }
                    }}
                  />
                  <Form.Text className="text-muted">
                    Поиск по описанию, кличке или типу животного
                  </Form.Text>
                </Form.Group>
                
                <div className="d-grid gap-2">
                  <Button 
                    type="submit" 
                    variant="dark" 
                    disabled={loading}
                  >
                    {loading ? 'Поиск...' : 'Найти'}
                  </Button>
                  <Button 
                    variant="outline-secondary" 
                    onClick={resetFilters}
                    disabled={loading}
                  >
                    Сбросить фильтры
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={8}>
          <Card className="h-100">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h5 className="card-title mb-0">Результаты поиска</h5>
                {totalResults > 0 && (
                  <span className="text-muted">
                    Найдено: {totalResults} объявлений
                  </span>
                )}
              </div>
              
              {loading ? (
                <div className="text-center py-5">
                  <Spinner animation="border" role="status">
                    <span className="visually-hidden">Загрузка...</span>
                  </Spinner>
                  <p className="mt-2">Поиск объявлений...</p>
                </div>
              ) : !hasSearched ? (
                <div className="text-center text-muted py-5">
                  <p>Введите параметры поиска и нажмите "Найти"</p>
                  <p className="small">Или используйте фильтры для поиска животных</p>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="text-center text-muted py-5">
                  <Alert variant="info">
                    <p>Объявления не найдены.</p>
                    <p className="mb-3">Попробуйте изменить параметры поиска.</p>
                    <Button variant="dark" onClick={() => navigate('/add-pet')}>
                      Добавить объявление
                    </Button>
                  </Alert>
                </div>
              ) : (
                <>
                  <div className="search-results-container" id="searchResults">
                    {searchResults.map(pet => (
                      <Card key={pet.id} className="search-result-card card-custom mb-3">
                        <Card.Body>
                          <Row className="align-items-center">
                            <Col md={4}>
                              <img 
                                src={pet.photos && pet.photos.length > 0 ? pet.photos[0] : getFallbackImage(pet.type)} 
                                className="pet-image-preview rounded w-100" 
                                alt={getAnimalType(pet.type)} 
                                style={{ height: '150px', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = getFallbackImage(pet.type);
                                }}
                              />
                            </Col>
                            <Col md={8}>
                              <h6 className="mb-1">
                                <Badge bg={pet.status === 'lost' ? 'warning' : 'success'} className="me-2">
                                  {pet.status === 'lost' ? 'Потерян' : 'Найден'}
                                </Badge>
                                {formatResultTitle(pet)}
                              </h6>
                              <p className="mb-1 small">{pet.description.length > 100 ? `${pet.description.substring(0, 100)}...` : pet.description}</p>
                              <small className="text-muted">
                                <i className="bi bi-geo-alt me-1"></i> Район: {getDistrictName(pet.district)} | 
                                <i className="bi bi-calendar ms-2 me-1"></i> Дата: {pet.date}
                              </small>
                              <div className="mt-2">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  onClick={() => showPetDetails(pet)}
                                >
                                  Подробнее
                                </Button>
                              </div>
                            </Col>
                          </Row>
                        </Card.Body>
                      </Card>
                    ))}
                  </div>
                  
                  {/* КНОПКИ ПАГИНАЦИИ - ОТОБРАЖАЮТСЯ, ЕСЛИ totalPages > 1 */}
                  {totalPages > 1 && (
                    <div className="pagination-container mt-4">
                      <div className="d-flex justify-content-center mb-2">
                        <span className="text-muted me-3">
                          Страница {currentPage} из {totalPages}
                        </span>
                        <span className="text-muted">
                          Показано {searchResults.length} объявлений из {totalResults}
                        </span>
                      </div>
                      
                      <div className="d-flex justify-content-center gap-1 mb-3">
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => paginate(1)}
                          disabled={currentPage === 1}
                          style={{ 
                            minWidth: '40px', 
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px'
                          }}
                        >
                          <i className="bi bi-chevron-double-left"></i>
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => paginate(currentPage - 1)}
                          disabled={currentPage === 1}
                          style={{ 
                            minWidth: '40px', 
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px'
                          }}
                        >
                          <i className="bi bi-chevron-left"></i>
                        </Button>
                        
                        {/* Номера страниц */}
                        {getPageNumbers().map(pageNumber => (
                          <Button 
                            key={pageNumber}
                            variant={pageNumber === currentPage ? "primary" : "outline-primary"}
                            size="sm"
                            onClick={() => paginate(pageNumber)}
                            style={{ 
                              minWidth: '40px', 
                              padding: '0.25rem 0.5rem',
                              borderRadius: '4px',
                              margin: '0 1px'
                            }}
                          >
                            {pageNumber}
                          </Button>
                        ))}
                        
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => paginate(currentPage + 1)}
                          disabled={currentPage === totalPages}
                          style={{ 
                            minWidth: '40px', 
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px'
                          }}
                        >
                          <i className="bi bi-chevron-right"></i>
                        </Button>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => paginate(totalPages)}
                          disabled={currentPage === totalPages}
                          style={{ 
                            minWidth: '40px', 
                            padding: '0.25rem 0.5rem',
                            borderRadius: '4px'
                          }}
                        >
                          <i className="bi bi-chevron-double-right"></i>
                        </Button>
                      </div>
                      
                      <div className="text-center mt-3">
                        <p className="text-muted small">
                          Хотите посмотреть другие объявления по этому запросу? 
                          Перейдите на следующую страницу, чтобы увидеть еще {Math.min(adsPerPage, totalResults - searchResults.length)} объявлений.
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      {/* Стили для пагинации */}
      <style jsx="true">{`
        .pagination-container .btn-sm {
          min-width: 40px !important;
          height: 40px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          padding: 0.25rem 0.5rem !important;
          border-radius: 4px !important;
          margin: 0 1px !important;
        }
        
        .pagination-container .btn-outline-primary {
          border-color: #556b2f !important;
          color: #556b2f !important;
        }
        
        .pagination-container .btn-outline-primary:hover {
          background-color: #556b2f !important;
          color: white !important;
        }
        
        .pagination-container .btn-primary {
          background-color: #556b2f !important;
          border-color: #556b2f !important;
        }
        
        .pagination-container .btn:disabled {
          opacity: 0.5 !important;
          cursor: not-allowed !important;
        }
      `}</style>
    </Container>
  );
};

// Функция для получения изображения-заглушки
const getFallbackImage = (type) => {
  const fallbackImages = {
    'кошка': 'https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=300&auto=format&fit=crop',
    'собака': 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop',
    'птица': 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=300&auto=format&fit=crop',
    'грызун': 'https://images.unsplash.com/photo-1567254790685-6f6b4690f1f9?w=300&auto=format&fit=crop',
    'другое': 'https://images.unsplash.com/photo-1589652043056-ba1a2c4830a5?w=300&auto=format&fit=crop'
  };
  return fallbackImages[type] || 'https://via.placeholder.com/300x200?text=Животное';
};

// Заглушка для тестирования (удалите в продакшене)
const getMockPets = () => {
  return [
    {
      id: 1,
      type: 'кошка',
      status: 'found',
      name: 'Мурка',
      description: 'Серая пушистая кошка, пропала в районе Васильевского острова.',
      district: '2',
      date: '24-03-2024',
      photos: ['https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=300&auto=format&fit=crop']
    },
    {
      id: 2,
      type: 'птица',
      status: 'lost',
      name: 'Кеша',
      description: 'Попугай зеленого цвета, улетел из окна в Центральном районе.',
      district: '18',
      date: '20-03-2024',
      photos: ['https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=300&auto=format&fit=crop']
    },
    {
      id: 3,
      type: 'кошка',
      status: 'found',
      name: 'Барсик',
      description: 'Черно-белый кот, найден в Приморском районе.',
      district: '15',
      date: '22-03-2024',
      photos: ['https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=300&auto=format&fit=crop']
    },
    {
      id: 4,
      type: 'птица',
      status: 'found',
      name: '',
      description: 'Канарейка желтого цвета, найдена в Петроградском районе.',
      district: '13',
      date: '16-03-2024',
      photos: ['https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=300&auto=format&fit=crop']
    },
    {
      id: 5,
      type: 'кошка',
      status: 'found',
      name: 'Снежок',
      description: 'Белая персидская кошка, найдена в Адмиралтейском районе.',
      district: '1',
      date: '17-03-2024',
      photos: ['https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=300&auto=format&fit=crop']
    },
    {
      id: 6,
      type: 'собака',
      status: 'found',
      name: 'Рекс',
      description: 'Рыжая собака среднего размера, найдена в Красногвардейском районе.',
      district: '7',
      date: '15-03-2024',
      photos: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop']
    },
    {
      id: 7,
      type: 'грызун',
      status: 'found',
      name: 'Пушистик',
      description: 'Белый хомяк, найден в Московском районе.',
      district: '11',
      date: '18-03-2024',
      photos: ['https://images.unsplash.com/photo-1567254790685-6f6b4690f1f9?w=300&auto=format&fit=crop']
    },
    {
      id: 8,
      type: 'собака',
      status: 'lost',
      name: 'Шарик',
      description: 'Маленькая такса, пропала в Невском районе.',
      district: '12',
      date: '19-03-2024',
      photos: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop']
    },
    {
      id: 9,
      type: 'грызун',
      status: 'lost',
      name: 'Норка',
      description: 'Декоративная крыса серого цвета, пропала в Выборгском районе.',
      district: '3',
      date: '21-03-2024',
      photos: ['https://images.unsplash.com/photo-1567254790685-6f6b4690f1f9?w=300&auto=format&fit=crop']
    },
    {
      id: 10,
      type: 'собака',
      status: 'lost',
      name: 'Лорд',
      description: 'Лабрадор золотистого окраса, пропал в Кировском районе.',
      district: '5',
      date: '23-03-2024',
      photos: ['https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop']
    },
    // Добавляем больше данных для демонстрации пагинации
    {
      id: 11,
      type: 'кошка',
      status: 'found',
      name: 'Рыжик',
      description: 'Рыжий кот с белыми лапками, найден в Центральном районе.',
      district: '18',
      date: '25-03-2024',
      photos: ['https://images.unsplash.com/photo-1514888286974-6d03bde4ba48?w=300&auto=format&fit=crop']
    },
    {
      id: 12,
      type: 'птица',
      status: 'lost',
      name: 'Гоша',
      description: 'Волнистый попугай синего цвета, улетел из квартиры.',
      district: '13',
      date: '26-03-2024',
      photos: ['https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=300&auto=format&fit=crop']
    }
  ];
};

export default Search;