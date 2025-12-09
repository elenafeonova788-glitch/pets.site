import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { districts } from '../utils/constants';
import { validateEmail, validatePhone, validateName } from '../utils/helpers';
import { preparePetFormData } from '../utils/apiService';

const AddPet = () => {
  const { isAuthenticated, currentUser, addUserAd } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // Контактная информация
    userName: isAuthenticated && currentUser ? (currentUser.name || '') : '',
    userPhone: isAuthenticated && currentUser ? (currentUser.phone || '') : '',
    userEmail: isAuthenticated && currentUser ? (currentUser.email || '') : '',
    
    // Информация о животном
    type: '',
    status: 'found',
    name: '',
    description: '',
    district: '',
    date: new Date().toISOString().split('T')[0],
    photos: [],
    mark: '',
    confirm: false,
    register: false,
    password: '',
    password_confirmation: ''
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  React.useEffect(() => {
    if (isAuthenticated && currentUser) {
      setFormData(prev => ({
        ...prev,
        userName: currentUser.name || '',
        userPhone: currentUser.phone || '',
        userEmail: currentUser.email || ''
      }));
    }
  }, [isAuthenticated, currentUser]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    
    if (type === 'file') {
      if (files.length > 3) {
        alert('Можно загрузить не более 3 фотографий');
        e.target.value = '';
        return;
      }
      
      const newPhotos = Array.from(files);
      
      // ПРОВЕРКА ФОРМАТА - ТОЛЬКО PNG
      const invalidFiles = newPhotos.filter(file => file.type !== 'image/png');
      if (invalidFiles.length > 0) {
        alert('Разрешены только файлы формата PNG!');
        e.target.value = '';
        return;
      }
      
      const newPreviews = [];
      
      newPhotos.forEach(file => {
        if (file.type.match('image.*')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newPreviews.push(e.target.result);
            if (newPreviews.length === newPhotos.length) {
              setPhotoPreviews(prev => [...prev, ...newPreviews].slice(0, 3));
            }
          };
          reader.readAsDataURL(file);
        }
      });
      
      setFormData(prev => ({
        ...prev,
        photos: [...prev.photos, ...newPhotos].slice(0, 3)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    setApiError('');
  };

  const removePhoto = (index) => {
    setFormData(prev => {
      const newPhotos = [...prev.photos];
      newPhotos.splice(index, 1);
      return { ...prev, photos: newPhotos };
    });
    
    setPhotoPreviews(prev => {
      const newPreviews = [...prev];
      newPreviews.splice(index, 1);
      return newPreviews;
    });
  };

  const validateForm = () => {
    const newErrors = {};

    // Валидация контактной информации
    if (!formData.userName.trim()) {
      newErrors.userName = 'Поле обязательно для заполнения';
    } else if (!validateName(formData.userName)) {
      newErrors.userName = 'Допустимы только кириллица, пробел и дефис';
    }

    if (!formData.userPhone.trim()) {
      newErrors.userPhone = 'Поле обязательно для заполнения';
    } else if (!validatePhone(formData.userPhone)) {
      newErrors.userPhone = 'Допустимы только цифры и знак +';
    }

    if (!formData.userEmail.trim()) {
      newErrors.userEmail = 'Поле обязательно для заполнения';
    } else if (!validateEmail(formData.userEmail)) {
      newErrors.userEmail = 'Введите корректный email адрес';
    }

    // Валидация информации о животном
    if (!formData.type) {
      newErrors.type = 'Поле обязательно для заполнения';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Поле обязательно для заполнения';
    }

    if (!formData.district) {
      newErrors.district = 'Поле обязательно для заполнения';
    }

    if (!formData.date) {
      newErrors.date = 'Поле обязательно для заполнения';
    }

    // ОБЯЗАТЕЛЬНО МИНИМУМ 1 ФОТОГРАФИЯ
    if (formData.photos.length === 0) {
      newErrors.photos = 'Необходимо загрузить хотя бы одну фотографию';
    } else if (formData.photos.length > 3) {
      newErrors.photos = 'Можно загрузить не более 3 фотографий';
    }

    if (!formData.confirm) {
      newErrors.confirm = 'Необходимо согласие на обработку персональных данных';
    }

    // Валидация пароля, если выбрана регистрация
    if (formData.register) {
      if (!formData.password) {
        newErrors.password = 'Поле обязательно для заполнения';
      } else if (formData.password.length < 7) {
        newErrors.password = 'Пароль должен содержать минимум 7 символов';
      }
      
      if (!formData.password_confirmation) {
        newErrors.password_confirmation = 'Поле обязательно для заполнения';
      } else if (formData.password !== formData.password_confirmation) {
        newErrors.password_confirmation = 'Пароли не совпадают';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setLoading(true);
      setApiError('');

      // Подготовка данных для API согласно спецификации
      const petData = {
        name: formData.userName,
        phone: formData.userPhone,
        email: formData.userEmail,
        kind: formData.type,
        description: formData.description,
        district: formData.district,
        date: formData.date,
        mark: formData.mark || '',
        confirm: formData.confirm ? 1 : 0,
      };

      // Добавляем пароль, если пользователь выбрал регистрацию
      if (formData.register) {
        petData.password = formData.password;
        petData.password_confirmation = formData.password_confirmation;
      }

      // Добавляем файлы в FormData
      const formDataToSend = new FormData();
      Object.keys(petData).forEach(key => {
        formDataToSend.append(key, petData[key]);
      });

      // Добавляем фото (ОБЯЗАТЕЛЬНО 1, максимум 3) - ТОЛЬКО PNG
      if (formData.photos && formData.photos.length > 0) {
        formData.photos.forEach((photo, index) => {
          formDataToSend.append(`photo${index + 1}`, photo);
        });
      }

      console.log('Submitting pet data:', petData);

      // Добавление объявления через API
      if (isAuthenticated) {
        await addUserAd(formDataToSend);
      } else {
        // Для незарегистрированных пользователей - прямая отправка
        const response = await fetch('https://pets.сделай.site/api/pets/new', {
          method: 'POST',
          body: formDataToSend,
        });
        
        if (!response.ok) {
          throw new Error('Ошибка при добавлении объявления');
        }
      }
      
      // Сброс формы
      setFormData({
        userName: isAuthenticated && currentUser ? (currentUser.name || '') : '',
        userPhone: isAuthenticated && currentUser ? (currentUser.phone || '') : '',
        userEmail: isAuthenticated && currentUser ? (currentUser.email || '') : '',
        type: '',
        status: 'found',
        name: '',
        description: '',
        district: '',
        date: new Date().toISOString().split('T')[0],
        photos: [],
        mark: '',
        confirm: false,
        register: false,
        password: '',
        password_confirmation: ''
      });
      setPhotoPreviews([]);
      setErrors({});
      
      alert('Объявление успешно добавлено!');
      navigate(isAuthenticated ? '/profile' : '/');
      
    } catch (error) {
      console.error('Add pet error:', error);
      setApiError(error.message || 'Ошибка при добавлении объявления. Пожалуйста, попробуйте снова.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Row className="justify-content-center">
        <Col md={10}>
          <Card className="shadow">
            <Card.Body className="p-5">
              <h2 className="card-title text-center mb-4">Добавить объявление о питомце</h2>
              
              {/* Предложение войти или зарегистрироваться для незарегистрированных пользователей */}
              {!isAuthenticated && (
                <Alert variant="info" className="mb-4">
                  <h5 className="alert-heading">Вы не вошли в систему</h5>
                  <p className="mb-2">Вы можете добавить объявление без регистрации, но мы рекомендуем:</p>
                  <div className="d-flex gap-2 mt-3">
                    <Button as={Link} to="/login" variant="dark" size="sm">
                      Войти
                    </Button>
                    <Button as={Link} to="/registration" variant="outline-dark" size="sm">
                      Зарегистрироваться
                    </Button>
                  </div>
                  <p className="mt-3 mb-0">
                    <small>Если вы зарегистрируетесь, ваши контактные данные будут сохранены для будущих объявлений.</small>
                  </p>
                </Alert>
              )}
              
              {apiError && <Alert variant="danger" className="mb-3">{apiError}</Alert>}
              
              <Form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <h5 className="mb-3">Контактная информация</h5>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label className="required-field">Имя</Form.Label>
                      <Form.Control
                        type="text"
                        name="userName"
                        value={formData.userName}
                        onChange={handleChange}
                        isInvalid={!!errors.userName}
                        disabled={loading}
                        placeholder="Ваше имя"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.userName}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label className="required-field">Телефон</Form.Label>
                      <Form.Control
                        type="tel"
                        name="userPhone"
                        value={formData.userPhone}
                        onChange={handleChange}
                        isInvalid={!!errors.userPhone}
                        disabled={loading}
                        placeholder="+7 (XXX) XXX-XX-XX"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.userPhone}
                      </Form.Control.Feedback>
                    </Col>
                  </Row>
                  
                  <Col md={6} className="mb-3">
                    <Form.Label className="required-field">Email</Form.Label>
                    <Form.Control
                      type="email"
                      name="userEmail"
                      value={formData.userEmail}
                      onChange={handleChange}
                      isInvalid={!!errors.userEmail}
                      disabled={loading}
                      placeholder="example@mail.ru"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.userEmail}
                    </Form.Control.Feedback>
                  </Col>
                </div>
                
                <div className="mb-4">
                  <h5 className="mb-3">Информация о животном</h5>
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label className="required-field">Тип животного</Form.Label>
                      <Form.Select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        isInvalid={!!errors.type}
                        disabled={loading}
                      >
                        <option value="">Выберите тип</option>
                        <option value="кошка">Кошка</option>
                        <option value="собака">Собака</option>
                        <option value="птица">Птица</option>
                        <option value="грызун">Грызун</option>
                        <option value="другое">Другое</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.type}
                      </Form.Control.Feedback>
                    </Col>
                  </Row>
                  
                  <Col md={6} className="mb-3">
                    <Form.Label>Кличка животного</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Введите кличку"
                    />
                  </Col>
                  
                  <Col md={6} className="mb-3">
                    <Form.Label>Клеймо/Метка</Form.Label>
                    <Form.Control
                      type="text"
                      name="mark"
                      value={formData.mark}
                      onChange={handleChange}
                      disabled={loading}
                      placeholder="Если есть"
                    />
                  </Col>
                  
                  <Col md={12} className="mb-3">
                    <Form.Label className="required-field">Описание</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      isInvalid={!!errors.description}
                      disabled={loading}
                      placeholder="Опишите животное: порода, окрас, особые приметы, где и когда потеряно/найдено и т.д."
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.description}
                    </Form.Control.Feedback>
                  </Col>
                  
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label className="required-field">Район</Form.Label>
                      <Form.Select
                        name="district"
                        value={formData.district}
                        onChange={handleChange}
                        isInvalid={!!errors.district}
                        disabled={loading}
                      >
                        <option value="">Выберите район</option>
                        {Object.entries(districts).map(([key, value]) => (
                          <option key={key} value={key}>{value}</option>
                        ))}
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.district}
                      </Form.Control.Feedback>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label className="required-field">Дата</Form.Label>
                      <Form.Control
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleChange}
                        isInvalid={!!errors.date}
                        disabled={loading}
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.date}
                      </Form.Control.Feedback>
                    </Col>
                  </Row>
                  
                  <div className="mb-3">
                    <Form.Label className="required-field">
                      Фотографии животного (минимум 1, максимум 3, ТОЛЬКО PNG)
                    </Form.Label>
                    <Form.Control
                      type="file"
                      name="photos"
                      onChange={handleChange}
                      accept=".png,image/png"
                      multiple
                      isInvalid={!!errors.photos}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.photos}
                    </Form.Control.Feedback>
                    <div className="form-text">
                      Выберите от 1 до 3 фотографий животного в формате PNG. Первая фотография обязательна.
                    </div>
                    
                    {photoPreviews.length > 0 && (
                      <div className="mt-3">
                        <h6>Выбранные фотографии:</h6>
                        <div className="d-flex flex-wrap gap-2">
                          {photoPreviews.map((preview, index) => (
                            <div key={index} className="position-relative" style={{ width: '100px' }}>
                              <img 
                                src={preview} 
                                alt={`Preview ${index + 1}`} 
                                className="photo-preview" 
                                style={{ 
                                  width: '100px', 
                                  height: '100px', 
                                  objectFit: 'cover', 
                                  borderRadius: '5px',
                                  border: index === 0 ? '2px solid #007bff' : '1px solid #ddd'
                                }}
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                className="position-absolute top-0 end-0"
                                style={{ transform: 'translate(50%, -50%)' }}
                                onClick={() => removePhoto(index)}
                                disabled={loading}
                              >
                                ×
                              </Button>
                              {index === 0 && (
                                <div className="position-absolute bottom-0 start-0 end-0 bg-primary text-white text-center py-1">
                                  <small>Основное</small>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="mt-2">
                          <small className="text-muted">
                            Загружено: {photoPreviews.length} из 3 фотографий
                            {photoPreviews.length < 1 && ' (требуется хотя бы 1 фотография)'}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <Form.Check
                  type="checkbox"
                  id="petConfirm"
                  name="confirm"
                  label="Я согласен с условиями использования и обработкой персональных данных"
                  checked={formData.confirm}
                  onChange={handleChange}
                  isInvalid={!!errors.confirm}
                  className="mb-3 required-field"
                  disabled={loading}
                />
                <Form.Control.Feedback type="invalid">
                  {errors.confirm}
                </Form.Control.Feedback>
                
                <Button 
                  type="submit" 
                  variant="dark" 
                  className="w-100" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Добавление...
                    </>
                  ) : 'Добавить объявление'}
                </Button>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default AddPet;