import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Container, Row, Col, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { getAnimalType, getDistrictName } from '../utils/helpers';

const Profile = ({ editAd, deleteAdvertisement }) => {
  const { 
    isAuthenticated, 
    currentUser, 
    userAds, 
    updateUser, 
    logout, 
    refreshUserAds,
    loading: authLoading 
  } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) {
      setEditForm({
        name: currentUser.name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || ''
      });
    } else {
      // Если пользователь не авторизован, но есть сохраненные данные в localStorage
      const savedEmail = localStorage.getItem('userEmail');
      const savedName = localStorage.getItem('userName');
      const savedPhone = localStorage.getItem('userPhone');
      const savedUserId = localStorage.getItem('userId');
      
      if (savedEmail || savedName || savedPhone) {
        // Создаем временного пользователя из сохраненных данных
        const tempUser = {
          id: savedUserId || Date.now(),
          name: savedName || '',
          email: savedEmail || '',
          phone: savedPhone || '',
          regDate: new Date().toISOString().split('T')[0],
          daysOnSite: '1 день',
          completedAds: 0,
          incompleteAds: 0,
        };
        
        setEditForm({
          name: tempUser.name,
          email: tempUser.email,
          phone: tempUser.phone
        });
      }
    }
  }, [currentUser]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveProfileChanges = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await updateUser(editForm);
      setEditMode(false);
      setSuccess('Данные профиля успешно обновлены!');
      
      // Сохраняем в localStorage
      localStorage.setItem('userEmail', editForm.email);
      localStorage.setItem('userName', editForm.name);
      localStorage.setItem('userPhone', editForm.phone);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Update profile error:', error);
      setError('Ошибка при обновлении профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из системы? Ваши контактные данные будут сохранены для удобства.')) {
      logout();
      navigate('/');
    }
  };

  const handleRefreshAds = async () => {
    try {
      setLoading(true);
      await refreshUserAds();
      setSuccess('Объявления обновлены!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Refresh ads error:', error);
      setError('Ошибка при обновлении объявлений');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm('Вы уверены, что хотите удалить это объявление?')) {
      try {
        setLoading(true);
        await deleteAdvertisement(adId);
        setSuccess('Объявление успешно удалено!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Delete ad error:', error);
        setError('Ошибка при удалении объявления');
      } finally {
        setLoading(false);
      }
    }
  };

  if (authLoading) {
    return (
      <Container className="text-center py-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </Spinner>
        <p className="mt-2">Загрузка профиля...</p>
      </Container>
    );
  }

  // Проверяем наличие данных пользователя
  const hasUserData = currentUser || 
    localStorage.getItem('userEmail') || 
    localStorage.getItem('userName') || 
    localStorage.getItem('userPhone');

  if (!isAuthenticated && !hasUserData) {
    return (
      <Container>
        <div className="text-center">
          <Alert variant="warning" className="alert-custom">
            <h4>Доступ запрещен</h4>
            <p>Для доступа к личному кабинету необходимо войти в систему</p>
            <Button variant="dark" onClick={() => navigate('/login')}>
              Войти
            </Button>
            <Button variant="outline-dark" className="ms-2" onClick={() => navigate('/registration')}>
              Зарегистрироваться
            </Button>
          </Alert>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <h2 className="text-center text-white bg-dark py-2 rounded mb-4">Личный кабинет</h2>
      
      {error && <Alert variant="danger" className="mb-3">{error}</Alert>}
      {success && <Alert variant="success" className="mb-3">{success}</Alert>}
      
      <Row>
        <Col md={4} className="text-center mb-4">
          {/* БАЗОВАЯ КАРТИНКА АВАТАРА ВМЕСТО ЗАГРУЗКИ */}
          <div className="mb-3 position-relative">
            <img 
              src="https://cdn-icons-png.flaticon.com/512/3135/3135715.png" 
              className="profile-avatar rounded-circle" 
              alt="Аватар" 
              style={{ 
                width: '150px', 
                height: '150px', 
                objectFit: 'cover',
                border: '3px solid #007bff',
                padding: '3px'
              }}
            />
            <div className="position-absolute bottom-0 end-0 bg-primary rounded-circle p-1">
              <i className="bi bi-check-circle-fill text-white"></i>
            </div>
          </div>
          <h5 id="userName" className="mb-2">
            {currentUser?.name || localStorage.getItem('userName') || 'Пользователь'}
          </h5>
          <p className="text-muted mb-3">
            {isAuthenticated ? 'Авторизованный пользователь' : 'Неавторизованный пользователь'}
          </p>
          <div className="d-flex flex-column gap-2">
            <Button 
              variant="outline-dark" 
              className="btn-sm" 
              onClick={() => setEditMode(!editMode)}
              disabled={loading}
            >
              {editMode ? 'Отменить' : 'Редактировать профиль'}
            </Button>
            {isAuthenticated && (
              <Button 
                variant="outline-dark" 
                className="btn-sm" 
                onClick={handleRefreshAds}
                disabled={loading}
              >
                Обновить объявления
              </Button>
            )}
            {isAuthenticated && (
              <Button 
                variant="outline-danger" 
                className="btn-sm" 
                onClick={handleLogout}
              >
                Выйти
              </Button>
            )}
          </div>
        </Col>
        
        <Col md={8}>
          {!editMode ? (
            <div id="profileInfo">
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Email:</Col>
                <Col xs={8} id="userEmail">
                  {currentUser?.email || localStorage.getItem('userEmail') || 'Не указан'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Телефон:</Col>
                <Col xs={8} id="userPhone">
                  {currentUser?.phone || localStorage.getItem('userPhone') || 'Не указан'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Имя:</Col>
                <Col xs={8} id="userNameDisplay">
                  {currentUser?.name || localStorage.getItem('userName') || 'Не указано'}
                </Col>
              </Row>
              {currentUser && (
                <>
                  <Row className="mb-3">
                    <Col xs={4} className="fw-bold">Дата регистрации:</Col>
                    <Col xs={8} id="userRegDate">{currentUser?.regDate || 'Не указана'}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col xs={4} className="fw-bold">На сайте:</Col>
                    <Col xs={8} id="userDaysOnSite">{currentUser?.daysOnSite || '1 день'}</Col>
                  </Row>
                  <Row className="mb-3">
                    <Col xs={4} className="fw-bold">Завершенных объявлений:</Col>
                    <Col xs={8} id="userCompletedAds">
                      {currentUser?.completedAds || 0}
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col xs={4} className="fw-bold">Активных объявлений:</Col>
                    <Col xs={8} id="userIncompleteAds">
                      {currentUser?.incompleteAds || 0}
                    </Col>
                  </Row>
                </>
              )}
            </div>
          ) : (
            <div className="edit-form">
              <h5>Редактирование профиля</h5>
              <div className="mb-3">
                <label htmlFor="editUserName" className="form-label required-field">Имя</label>
                <input 
                  type="text" 
                  className="form-control" 
                  id="editUserName" 
                  name="name"
                  value={editForm.name}
                  onChange={handleEditChange}
                  required 
                  disabled={loading}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editUserEmail" className="form-label required-field">Email</label>
                <input 
                  type="email" 
                  className="form-control" 
                  id="editUserEmail" 
                  name="email"
                  value={editForm.email}
                  onChange={handleEditChange}
                  required 
                  disabled={loading}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="editUserPhone" className="form-label required-field">Телефон</label>
                <input 
                  type="tel" 
                  className="form-control" 
                  id="editUserPhone" 
                  name="phone"
                  value={editForm.phone}
                  onChange={handleEditChange}
                  required 
                  disabled={loading}
                />
              </div>
              <div className="mb-3">
                <Button 
                  variant="primary" 
                  onClick={saveProfileChanges}
                  disabled={loading}
                >
                  {loading ? 'Сохранение...' : 'Сохранить изменения'}
                </Button>
                <Button 
                  variant="outline-secondary" 
                  className="ms-2" 
                  onClick={() => setEditMode(false)}
                  disabled={loading}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
          
          {isAuthenticated && (
            <>
              <hr />
              
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Мои объявления ({userAds.length})</h6>
                <Button variant="dark" className="btn-sm" onClick={() => navigate('/add-pet')}>
                  Добавить объявление
                </Button>
              </div>
              
              <ListGroup id="userAdsList">
                {userAds.length === 0 ? (
                  <div className="text-center text-muted py-3">
                    <p>У вас пока нет объявлений</p>
                    <Button variant="dark" className="btn-sm" onClick={() => navigate('/add-pet')}>
                      Добавить объявление
                    </Button>
                  </div>
                ) : (
                  userAds.map(ad => (
                    <ListGroup.Item key={ad.id}>
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">
                          {ad.status === 'lost' ? 'Потерян' : 'Найден'}: {getAnimalType(ad.type)} {ad.name ? `- ${ad.name}` : ''}
                        </h6>
                        <small>{ad.date}</small>
                      </div>
                      <p className="mb-1">{ad.description.length > 100 ? `${ad.description.substring(0, 100)}...` : ad.description}</p>
                      <small>Район: {getDistrictName(ad.district)}</small>
                      <Badge bg={ad.adStatus === 'active' ? 'success' : 'secondary'} className="float-end">
                        {ad.adStatus === 'active' ? 'Активно' : 'Завершено'}
                      </Badge>
                      <div className="mt-2">
                        <Button variant="outline-primary" size="sm" onClick={() => editAd(ad)}>
                          Редактировать
                        </Button>
                        <Button 
                          variant="outline-danger" 
                          size="sm" 
                          className="ms-2" 
                          onClick={() => handleDeleteAd(ad.id)}
                          disabled={loading}
                        >
                          Удалить
                        </Button>
                      </div>
                    </ListGroup.Item>
                  ))
                )}
              </ListGroup>
            </>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;