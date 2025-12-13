import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  Container, Row, Col, Card, Form, Button, 
  Alert, Spinner, Pagination 
} from 'react-bootstrap';
import SearchPetCard from './SearchPetCard';
import { petsAPI, transformPetData } from '../utils/apiService';
import { districts } from '../utils/constants';

const Search = ({ showPetDetails }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Форма поиска - инициализируем из параметров URL
  const [searchForm, setSearchForm] = useState({
    kind: searchParams.get('kind') || '',
    district: searchParams.get('district') || '',
  });
  
  // Пагинация
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalResults, setTotalResults] = useState(0);
  const itemsPerPage = 10;
  
  // Все результаты (для клиентской пагинации)
  const [allResults, setAllResults] = useState([]);

  // Синхронизация формы с параметрами URL при их изменении
  useEffect(() => {
    const kind = searchParams.get('kind') || '';
    const district = searchParams.get('district') || '';
    
    // Обновляем форму только если параметры действительно изменились
    if (kind !== searchForm.kind || district !== searchForm.district) {
      setSearchForm({
        kind,
        district,
      });
      setCurrentPage(1); // Сбрасываем на первую страницу при новом поиске
    }
  }, [searchParams]);

  // Выполнение поиска при изменении формы
  useEffect(() => {
    // Запускаем поиск только если форма не пустая или это первая загрузка
    if (searchForm.kind !== '' || searchForm.district !== '') {
      performSearch(currentPage);
    }
  }, [searchForm, currentPage]);

  // Обработка внешних событий обновления поиска (из Header)
  useEffect(() => {
    const handleForceSearchUpdate = (event) => {
      const { searchQuery } = event.detail;
      if (searchQuery && searchQuery !== searchForm.kind) {
        // Обновляем URL и форму
        const params = new URLSearchParams();
        params.set('kind', searchQuery);
        navigate(`/search?${params.toString()}`);
      }
    };

    window.addEventListener('forceSearchUpdate', handleForceSearchUpdate);
    
    return () => {
      window.removeEventListener('forceSearchUpdate', handleForceSearchUpdate);
    };
  }, [searchForm.kind, navigate]);

  // Выполнение поиска
  const performSearch = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      
      // Если нет параметров, получаем все объявления
      if (!searchForm.kind && !searchForm.district) {
        const response = await petsAPI.quickSearch('', page, itemsPerPage);
        const data = transformPetData(response);
        
        setAllResults(data.pets);
        setTotalResults(data.pets.length);
        setTotalPages(Math.ceil(data.pets.length / itemsPerPage));
        
        // Пагинация на клиенте
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        setSearchResults(data.pets.slice(startIndex, endIndex));
        
        return;
      }

      // Расширенный поиск
      const response = await petsAPI.advancedSearch({
        kind: searchForm.kind,
        district: searchForm.district,
        page,
        limit: itemsPerPage,
      });
      
      const data = transformPetData(response);
      
      // Если API возвращает пагинированные результаты
      if (data.pets && data.pets.length > 0) {
        setSearchResults(data.pets);
        setAllResults(data.pets);
        
        // Для демо - рассчитываем totalPages на основе количества результатов
        setTotalResults(data.pets.length);
        setTotalPages(Math.ceil(data.pets.length / itemsPerPage));
      } else {
        setSearchResults([]);
        setAllResults([]);
        setTotalResults(0);
        setTotalPages(1);
      }
      
    } catch (error) {
      console.error('Ошибка поиска:', error);
      setError('Ошибка при выполнении поиска. Пожалуйста, попробуйте снова.');
      setSearchResults([]);
      setAllResults([]);
    } finally {
      setLoading(false);
    }
  }, [searchForm]);

  // Обработка изменения формы поиска
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // Обработка отправки формы поиска
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    
    // Обновляем URL с параметрами поиска
    const params = new URLSearchParams();
    if (searchForm.kind) params.set('kind', searchForm.kind);
    if (searchForm.district) params.set('district', searchForm.district);
    
    navigate(`/search?${params.toString()}`);
    setCurrentPage(1);
  };

  // Сброс формы поиска
  const handleReset = () => {
    setSearchForm({ kind: '', district: '' });
    setCurrentPage(1);
    setSearchParams({});
  };

  // Клиентская пагинация (если API не поддерживает)
  const handlePageChange = (page) => {
    setCurrentPage(page);
    
    if (allResults.length > 0) {
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      setSearchResults(allResults.slice(startIndex, endIndex));
    } else {
      performSearch(page);
    }
  };

  // Рендер пагинации
  const renderPagination = () => {
    if (totalPages <= 1) return null;
    
    const items = [];
    
    // Предыдущая страница
    items.push(
      <Pagination.Prev 
        key="prev" 
        disabled={currentPage === 1}
        onClick={() => handlePageChange(currentPage - 1)}
      />
    );
    
    // Страницы
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <Pagination.Item 
          key={i} 
          active={i === currentPage}
          onClick={() => handlePageChange(i)}
        >
          {i}
        </Pagination.Item>
      );
    }
    
    // Следующая страница
    items.push(
      <Pagination.Next 
        key="next" 
        disabled={currentPage === totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
      />
    );
    
    return (
      <div className="d-flex justify-content-center mt-4">
        <Pagination>{items}</Pagination>
      </div>
    );
  };

  return (
    <Container>
      <div className="row justify-content-center">
        <div className="col-12">
          <h2 className="text-center text-white bg-dark py-2 rounded mb-4">Расширенный поиск</h2>
          <div className="row">
            {/* Форма поиска */}
            <div className="col-md-4">
              <div className="card shadow">
                <div className="card-body p-4">
                  <h5 className="card-title mb-4">Параметры поиска</h5>
                  <Form id="searchForm" onSubmit={handleSearchSubmit}>
                    <Form.Group className="mb-3">
                      <Form.Label htmlFor="searchType">Тип животного</Form.Label>
                      <Form.Control
                        type="text"
                        id="searchType"
                        name="kind"
                        value={searchForm.kind}
                        onChange={handleInputChange}
                        placeholder="Например: кошка, собака"
                      />
                      <Form.Text className="text-muted">
                        Введите тип животного для поиска
                      </Form.Text>
                    </Form.Group>
                    
                    <Form.Group className="mb-3">
                      <Form.Label htmlFor="searchDistrict">Район</Form.Label>
                      <Form.Select
                        id="searchDistrict"
                        name="district"
                        value={searchForm.district}
                        onChange={handleInputChange}
                      >
                        <option value="">Все районы</option>
                        {Object.entries(districts).map(([key, value]) => (
                          <option key={key} value={key}>
                            {value}
                          </option>
                        ))}
                      </Form.Select>
                      <Form.Text className="text-muted">
                        Выберите район для поиска
                      </Form.Text>
                    </Form.Group>
                    
                    <div className="d-grid gap-2">
                      <Button type="submit" variant="dark" disabled={loading}>
                        {loading ? (
                          <>
                            <Spinner animation="border" size="sm" className="me-2" />
                            Поиск...
                          </>
                        ) : 'Найти'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline-secondary" 
                        onClick={handleReset}
                        disabled={loading}
                      >
                        Сбросить
                      </Button>
                    </div>
                  </Form>
                </div>
              </div>
            </div>
            
            {/* Результаты поиска */}
            <div className="col-md-8">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title mb-4">Результаты поиска</h5>
                  
                  {error && (
                    <Alert variant="danger">
                      {error}
                      <Button 
                        variant="outline-danger" 
                        size="sm" 
                        className="ms-3"
                        onClick={() => performSearch(currentPage)}
                      >
                        Повторить
                      </Button>
                    </Alert>
                  )}
                  
                  {loading ? (
                    <div className="text-center py-5">
                      <Spinner animation="border" />
                      <p className="mt-2">Поиск объявлений...</p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <>
                      <div className="page-info text-center mb-3">
                        <p className="text-muted">
                          Страница {currentPage} из {totalPages} • 
                          Найдено объявлений: {totalResults}
                          {searchForm.kind && ` • Тип: ${searchForm.kind}`}
                          {searchForm.district && ` • Район: ${districts[searchForm.district] || searchForm.district}`}
                        </p>
                      </div>
                      
                      <div className="search-results-container" id="searchResults">
                        {searchResults.map(pet => (
                          <SearchPetCard 
                            key={pet.id} 
                            pet={pet} 
                            onShowDetails={() => showPetDetails(pet)} 
                          />
                        ))}
                      </div>
                      
                      <div className="mt-4">
                        {renderPagination()}
                      </div>
                    </>
                  ) : (
                    <div className="text-center text-muted py-5 w-100">
                      <p>По вашему запросу ничего не найдено</p>
                      <p className="small">Попробуйте изменить параметры поиска</p>
                      <Button 
                        variant="outline-dark" 
                        className="mt-2"
                        onClick={handleReset}
                      >
                        Сбросить фильтры
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Container>
  );
};

export default Search;