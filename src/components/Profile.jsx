import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Alert, Button, Container, Row, Col, ListGroup, Badge, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import EditPetModal from './EditPetModal'; // Нужно будет создать этот компонент
import { getAnimalType, getDistrictName, calculateDaysOnSite } from '../utils/helpers';

const Profile = () => {
  const { 
    currentUser: user,
    userAds,
    isAuthenticated, 
    logout, 
    updateUser,
    refreshUserAds,
    deleteUserAd,
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletePetId, setDeletePetId] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  const navigate = useNavigate();

  // Инициализация формы
  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || ''
      });
    }
  }, [user]);

  // Обновление данных при загрузке
  useEffect(() => {
    if (isAuthenticated) {
      refreshUserAds();
    }
  }, [isAuthenticated, refreshUserAds]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const saveProfileChanges = async () => {
    try {
      setIsUpdatingProfile(true);
      setError('');
      setSuccess('');
      
      await updateUser(editForm);
      setEditMode(false);
      setSuccess('Данные профиля успешно обновлены!');
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Ошибка при обновлении профиля: ' + error.message);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из системы?')) {
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
      setError('Ошибка при обновлении объявлений');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAd = async (adId) => {
    if (window.confirm('Вы уверены, что хотите удалить это объявление?')) {
      try {
        setIsDeleting(true);
        setDeletePetId(adId);
        await deleteUserAd(adId);
        setSuccess('Объявление успешно удалено!');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Ошибка при удалении объявления');
      } finally {
        setIsDeleting(false);
        setDeletePetId(null);
      }
    }
  };

  const handleEditPet = (pet) => {
    setSelectedPet(pet);
    setEditModalOpen(true);
  };

  const handlePetUpdated = () => {
    setSuccess('Объявление успешно обновлено!');
    refreshUserAds();
    setEditModalOpen(false);
    setSelectedPet(null);
  };

  const getStatusText = (status) => {
    const statusMap = {
      'active': 'Активно',
      'wasFound': 'Хозяин найден',
      'onModeration': 'На модерации',
      'archive': 'В архиве',
      'published': 'Опубликовано',
      'pending': 'На рассмотрении'
    };
    return statusMap[status] || status;
  };

  const getStatusClass = (status) => {
    const classMap = {
      'active': 'success',
      'wasFound': 'info',
      'onModeration': 'warning',
      'archive': 'secondary',
      'published': 'success',
      'pending': 'warning'
    };
    return classMap[status] || 'secondary';
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU');
    } catch {
      return dateString;
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

  if (!isAuthenticated) {
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
          </div>
          <h5 id="userName" className="mb-2">
            {user?.name || 'Пользователь'}
          </h5>
          <p className="text-muted mb-3">Авторизованный пользователь</p>
          <div className="d-flex flex-column gap-2">
            <Button 
              variant="outline-dark" 
              className="btn-sm" 
              onClick={() => setEditMode(!editMode)}
              disabled={loading || isUpdatingProfile}
            >
              {editMode ? 'Отменить' : 'Редактировать профиль'}
            </Button>
            <Button 
              variant="outline-dark" 
              className="btn-sm" 
              onClick={handleRefreshAds}
              disabled={loading || isUpdatingProfile}
            >
              Обновить объявления
            </Button>
            <Button 
              variant="outline-danger" 
              className="btn-sm" 
              onClick={handleLogout}
              disabled={loading || isUpdatingProfile}
            >
              Выйти
            </Button>
          </div>
        </Col>
        
        <Col md={8}>
          {!editMode ? (
            <div id="profileInfo">
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Имя:</Col>
                <Col xs={8} id="userNameDisplay">
                  {user?.name || 'Не указано'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Email:</Col>
                <Col xs={8} id="userEmail">
                  {user?.email || 'Не указан'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Телефон:</Col>
                <Col xs={8} id="userPhone">
                  {user?.phone || 'Не указан'}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">Объявлений:</Col>
                <Col xs={8} id="userOrdersCount">
                  {userAds.length}
                </Col>
              </Row>
              <Row className="mb-3">
                <Col xs={4} className="fw-bold">На сайте:</Col>
                <Col xs={8} id="userDaysOnSite">
                  {calculateDaysOnSite(user?.registrationDate)}
                </Col>
              </Row>
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
                  disabled={isUpdatingProfile}
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
                  disabled={isUpdatingProfile}
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
                  disabled={isUpdatingProfile}
                />
              </div>
              <div className="mb-3">
                <Button 
                  variant="primary" 
                  onClick={saveProfileChanges}
                  disabled={isUpdatingProfile}
                >
                  {isUpdatingProfile ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Сохранение...
                    </>
                  ) : 'Сохранить изменения'}
                </Button>
                <Button 
                  variant="outline-secondary" 
                  className="ms-2" 
                  onClick={() => setEditMode(false)}
                  disabled={isUpdatingProfile}
                >
                  Отмена
                </Button>
              </div>
            </div>
          )}
          
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
                      {getAnimalType(ad.type)} {ad.name ? `- ${ad.name}` : ''}
                    </h6>
                    <small>{formatDate(ad.date)}</small>
                  </div>
                  <p className="mb-1">
                    {ad.description && ad.description.length > 100 ? 
                      `${ad.description.substring(0, 100)}...` : 
                      (ad.description || 'Нет описания')}
                  </p>
                  <small>Район: {getDistrictName(ad.district)}</small>
                  <Badge bg={getStatusClass(ad.adStatus)} className="float-end">
                    {getStatusText(ad.adStatus)}
                  </Badge>
                  <div className="mt-2">
                    <Button variant="outline-primary" size="sm" onClick={() => navigate(`/pet/${ad.id}`)}>
                      Просмотр
                    </Button>
                    <Button 
                      variant="outline-warning" 
                      size="sm" 
                      className="ms-2" 
                      onClick={() => handleEditPet(ad)}
                      disabled={loading}
                    >
                      Редактировать
                    </Button>
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      className="ms-2" 
                      onClick={() => handleDeleteAd(ad.id)}
                      disabled={isDeleting && deletePetId === ad.id}
                    >
                      {isDeleting && deletePetId === ad.id ? (
                        <Spinner animation="border" size="sm" />
                      ) : 'Удалить'}
                    </Button>
                  </div>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </Col>
      </Row>
      
      {editModalOpen && selectedPet && (
        <EditPetModal
          pet={selectedPet}
          token={user?.token}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedPet(null);
          }}
          onSuccess={handlePetUpdated}
        />
      )}
    </Container>
  );
};

export default Profile;