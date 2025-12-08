import React, { useState, useEffect } from 'react';
import { Form, Button, Card, Container, Row, Col, Pagination, Spinner, Alert } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router-dom';
import { districts, animalTypes } from '../utils/constants';
import { getAnimalType, getDistrictName } from '../utils/helpers';
import { petsAPI, transformPetData } from '../utils/apiService';

// ... остальной код остается таким же ...

const Search = ({ showPetDetails }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  
  // Состояния для поиска
  const [searchType, setSearchType] = useState('');
  const [searchDistrict, setSearchDistrict] = useState('');
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Константы - 10 объявлений на страницу
  const adsPerPage = 10;

  useEffect(() => {
    if (initialQuery) {
      setSearchQuery(initialQuery);
      performSearch(1, initialQuery);
      setHasSearched(true);
    }
  }, [initialQuery]);

  const performSearch = async (page = 1, query = searchQuery) => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);
      
      const filters = {};
      if (searchType) filters.kind = searchType;
      if (searchDistrict) {
        // Получаем название района по коду
        const districtName = districts[searchDistrict] || searchDistrict;
        filters.district = districtName;
      }
      
      console.log('Searching with:', { query, page, filters });
      
      let apiResponse;
      if (query && query.trim()) {
        apiResponse = await petsAPI.searchPets(query, page, adsPerPage, filters);
      } else if (searchDistrict || searchType) {
        apiResponse = await petsAPI.searchPets('', page, adsPerPage, filters);
      } else {
        apiResponse = await petsAPI.getAllPets(page, adsPerPage);
      }
      
      console.log('API search response:', apiResponse);
      
      const transformedPets = transformPetData(apiResponse) || [];
      console.log('Transformed pets:', transformedPets);
      
      setSearchResults(transformedPets);
      
      // Пагинация
      if (apiResponse && apiResponse.data) {
        if (apiResponse.data.meta) {
          // Laravel pagination
          setTotalPages(apiResponse.data.meta.last_page || 1);
          setTotalResults(apiResponse.data.meta.total || transformedPets.length);
        } else if (apiResponse.data.orders) {
          // Simple response with orders
          setTotalPages(1);
          setTotalResults(apiResponse.data.orders.length || transformedPets.length);
        } else {
          setTotalPages(1);
          setTotalResults(transformedPets.length);
        }
      } else {
        setTotalPages(1);
        setTotalResults(transformedPets.length);
      }
      
      setCurrentPage(page);
      
      if (transformedPets.length === 0) {
        setError('По вашему запросу ничего не найдено');
      }
      
    } catch (error) {
      console.error('Search error:', error);
      setError('Ошибка при поиске объявлений: ' + (error.message || error.toString()));
      setSearchResults([]);
      setTotalPages(1);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  // Функция для обработки пагинации
  const paginate = (pageNumber) => {
    performSearch(pageNumber);
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
              <Form onSubmit={(e) => { e.preventDefault(); performSearch(1); }}>
                <Form.Group className="mb-3">
                  <Form.Label>Тип животного</Form.Label>
                  <Form.Select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
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
                    onChange={(e) => setSearchDistrict(e.target.value)}
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
                        performSearch(1);
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
                    {searchResults.map(ad => (
                      <Card key={ad.id} className="search-result-card card-custom mb-3">
                        <Card.Body>
                          <Row className="align-items-center">
                            <Col md={4}>
                              <img 
                                src={ad.photos && ad.photos.length > 0 ? ad.photos[0] : getFallbackImage(ad.type)} 
                                className="pet-image-preview rounded w-100" 
                                alt={getAnimalType(ad.type)} 
                                style={{ height: '150px', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = getFallbackImage(ad.type);
                                }}
                              />
                            </Col>
                            <Col md={8}>
                              <h6 className="mb-1">
                                <span className="badge bg-success me-2">
                                  Найден
                                </span>
                                {getAnimalType(ad.type)} {ad.name ? `- ${ad.name}` : ''}
                              </h6>
                              <p className="mb-1 small">{ad.description.length > 100 ? `${ad.description.substring(0, 100)}...` : ad.description}</p>
                              <small className="text-muted">
                                <i className="bi bi-geo-alt me-1"></i> Район: {getDistrictName(ad.district)} | 
                                <i className="bi bi-calendar ms-2 me-1"></i> Дата: {ad.date}
                              </small>
                              <div className="mt-2">
                                <Button 
                                  variant="outline-primary" 
                                  size="sm" 
                                  onClick={() => showPetDetails(ad)}
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
                  
                  {totalPages > 1 && (
                    <div className="pagination-container mt-4">
                      <Pagination>
                        <Pagination.Prev 
                          onClick={() => paginate(currentPage - 1)} 
                          disabled={currentPage === 1}
                        />
                        
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          let pageNumber;
                          if (totalPages <= 5) {
                            pageNumber = i + 1;
                          } else if (currentPage <= 3) {
                            pageNumber = i + 1;
                          } else if (currentPage >= totalPages - 2) {
                            pageNumber = totalPages - 4 + i;
                          } else {
                            pageNumber = currentPage - 2 + i;
                          }
                          
                          return (
                            <Pagination.Item 
                              key={pageNumber}
                              active={pageNumber === currentPage}
                              onClick={() => paginate(pageNumber)}
                            >
                              {pageNumber}
                            </Pagination.Item>
                          );
                        })}
                        
                        <Pagination.Next 
                          onClick={() => paginate(currentPage + 1)} 
                          disabled={currentPage === totalPages}
                        />
                      </Pagination>
                      
                      <div className="page-info text-center mt-2">
                        Страница {currentPage} из {totalPages} (показано {searchResults.length} из {totalResults} объявлений)
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
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

export default Search;