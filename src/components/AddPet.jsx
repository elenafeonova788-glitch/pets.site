import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner, Collapse } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { districts } from '../utils/constants';
import { validateEmail, validatePhone, validateName, validatePassword } from '../utils/helpers';
import { preparePetFormData, petsAPI } from '../utils/apiService';

const AddPet = () => {
  const { isAuthenticated, currentUser, addUserAd, login, register } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    // Контактная информация
    userName: '',
    userPhone: '',
    userEmail: '',
    
    // Информация о животном
    type: '',
    status: 'found', // По умолчанию "Найден"
    name: '',
    description: '',
    district: '',
    date: new Date().toISOString().split('T')[0],
    photos: [],
    mark: '',
    confirm: false,
    
    // Авторизация/регистрация
    wantsToAuth: false,
    authEmail: '',
    authPassword: '',
    authPasswordConfirmation: '',
    registerNewAccount: false,
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [showAuthFields, setShowAuthFields] = useState(false);
  
  const passwordRef = useRef(null);

  // Загружаем сохраненные данные из localStorage
  useEffect(() => {
    // Загружаем данные из localStorage
    const savedEmail = localStorage.getItem('userEmail');
    const savedName = localStorage.getItem('userName');
    const savedPhone = localStorage.getItem('userPhone');
    
    // Если есть сохраненные данные, заполняем форму
    if (savedEmail || savedName || savedPhone) {
      setFormData(prev => ({
        ...prev,
        userEmail: savedEmail || prev.userEmail,
        userName: savedName || prev.userName,
        userPhone: savedPhone || prev.userPhone,
        authEmail: savedEmail || prev.authEmail // Также заполняем поле для авторизации
      }));
    }
    
    // Если пользователь авторизован, используем данные из currentUser
    if (isAuthenticated && currentUser) {
      setFormData(prev => ({
        ...prev,
        userName: currentUser.name || '',
        userPhone: currentUser.phone || '',
        userEmail: currentUser.email || '',
        authEmail: currentUser.email || ''
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
      
      // При включении авторизации показываем поля
      if (name === 'wantsToAuth' && checked) {
        setShowAuthFields(true);
        // Автозаполняем email из формы
        setFormData(prev => ({
          ...prev,
          authEmail: prev.userEmail
        }));
        
        // Фокусируемся на поле пароля после анимации
        setTimeout(() => {
          if (passwordRef.current) {
            passwordRef.current.focus();
          }
        }, 300);
      } else if (name === 'wantsToAuth' && !checked) {
        setShowAuthFields(false);
      }
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

    if (!formData.status) {
      newErrors.status = 'Поле обязательно для заполнения';
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

    // Валидация авторизации/регистрации
    if (formData.wantsToAuth) {
      if (!formData.authEmail.trim()) {
        newErrors.authEmail = 'Поле обязательно для заполнения';
      } else if (!validateEmail(formData.authEmail)) {
        newErrors.authEmail = 'Введите корректный email адрес';
      }
      
      if (!formData.authPassword) {
        newErrors.authPassword = 'Поле обязательно для заполнения';
      } else if (!validatePassword(formData.authPassword)) {
        newErrors.authPassword = 'Пароль должен содержать минимум 7 символов, включая 1 цифру, 1 строчную и 1 заглавную букву';
      }
      
      if (formData.registerNewAccount) {
        if (!formData.authPasswordConfirmation) {
          newErrors.authPasswordConfirmation = 'Поле обязательно для заполнения';
        } else if (formData.authPassword !== formData.authPasswordConfirmation) {
          newErrors.authPasswordConfirmation = 'Пароли не совпадают';
        }
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

      // Если пользователь хочет авторизоваться/зарегистрироваться
      if (formData.wantsToAuth && !isAuthenticated) {
        try {
          if (formData.registerNewAccount) {
            // Регистрация
            const registrationData = {
              name: formData.userName,
              email: formData.authEmail,
              phone: formData.userPhone.replace(/\D/g, ''),
              password: formData.authPassword,
              password_confirmation: formData.authPasswordConfirmation,
              confirm: true
            };
            
            const result = await register(registrationData);
            console.log('Registration result:', result);
          } else {
            // Вход
            await login({
              email: formData.authEmail,
              password: formData.authPassword,
              name: formData.userName,
              phone: formData.userPhone
            });
          }
          
          // Обновляем email в форме после авторизации
          setFormData(prev => ({
            ...prev,
            userEmail: formData.authEmail
          }));
          
          // Сохраняем данные в localStorage
          localStorage.setItem('userEmail', formData.authEmail);
          localStorage.setItem('userName', formData.userName);
          localStorage.setItem('userPhone', formData.userPhone);
          
        } catch (authError) {
          console.error('Auth error:', authError);
          setApiError('Ошибка авторизации/регистрации: ' + (authError.message || 'Неверные данные'));
          setLoading(false);
          return;
        }
      }

      // Подготовка данных для API - ПРАВИЛЬНЫЕ ИМЕНА ПОЛЕЙ!
      const petData = {
        name: formData.userName,
        phone: formData.userPhone,
        email: formData.userEmail,
        kind: formData.type,
        status: formData.status, // Добавляем статус
        description: formData.description,
        district: formData.district,
        date: formData.date,
        mark: formData.mark || '',
        confirm: formData.confirm ? 1 : 0,
      };

      console.log('Pet data to submit:', petData);
      console.log('Status:', formData.status);
      console.log('Photos count:', formData.photos.length);

      // Создаем FormData
      const formDataToSend = new FormData();
      
      // Добавляем текстовые поля
      Object.keys(petData).forEach(key => {
        formDataToSend.append(key, petData[key]);
      });

      // Добавляем фото с правильными именами полей
      if (formData.photos && formData.photos.length > 0) {
        formData.photos.forEach((photo, index) => {
          // Используем имена photo1, photo2, photo3 как ожидает API
          formDataToSend.append(`photo${index + 1}`, photo);
        });
      }

      // Отладка: покажем что отправляем
      console.log('FormData entries:');
      for (let pair of formDataToSend.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }

      // Отправка объявления
      let response;
      if (isAuthenticated) {
        // Для авторизованных пользователей
        response = await addUserAd(formDataToSend);
      } else {
        // Для незарегистрированных пользователей
        try {
          response = await petsAPI.addPet(formDataToSend, null);
          console.log('API response for unauthenticated user:', response);
        } catch (apiError) {
          console.error('API error:', apiError);
          setApiError('Ошибка API: ' + (apiError.message || 'Не удалось добавить объявление'));
          setLoading(false);
          return;
        }
      }

      // Сохраняем данные пользователя в localStorage для будущего входа
      if (!isAuthenticated) {
        localStorage.setItem('userEmail', formData.userEmail);
        localStorage.setItem('userName', formData.userName);
        localStorage.setItem('userPhone', formData.userPhone);
      }

      // Сброс формы
      setFormData({
        userName: isAuthenticated && currentUser ? (currentUser.name || '') : '',
        userPhone: isAuthenticated && currentUser ? (currentUser.phone || '') : '',
        userEmail: isAuthenticated && currentUser ? (currentUser.email || '') : '',
        type: '',
        status: 'found', // Сбрасываем на значение по умолчанию
        name: '',
        description: '',
        district: '',
        date: new Date().toISOString().split('T')[0],
        photos: [],
        mark: '',
        confirm: false,
        wantsToAuth: false,
        authEmail: '',
        authPassword: '',
        authPasswordConfirmation: '',
        registerNewAccount: false,
      });
      setPhotoPreviews([]);
      setErrors({});
      setShowAuthFields(false);
      
      alert('Объявление успешно добавлено!');
      
      // Перенаправление
      if (isAuthenticated) {
        navigate('/profile');
      } else {
        navigate('/');
      }
      
    } catch (error) {
      console.error('Add pet error:', error);
      setApiError(error.message || 'Ошибка при добавлении объявления. Пожалуйста, попробуйте снова.');
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
                  <h5 className="alert-heading">
                    {formData.wantsToAuth 
                      ? (formData.registerNewAccount ? 'Регистрация' : 'Вход в систему') 
                      : 'Вы не вошли в систему'}
                  </h5>
                  <p className="mb-2">
                    {formData.wantsToAuth 
                      ? (formData.registerNewAccount 
                          ? 'Зарегистрируйтесь, чтобы сохранить ваши данные для будущих объявлений.' 
                          : 'Войдите, чтобы сохранить ваши данные для будущих объявлений.')
                      : 'Вы можете добавить объявление без регистрации, но мы рекомендуем авторизоваться:'}
                  </p>
                  
                  {!formData.wantsToAuth ? (
                    <div className="d-flex gap-2 mt-3">
                      <Button 
                        variant="dark" 
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            wantsToAuth: true,
                            registerNewAccount: false
                          }));
                          setShowAuthFields(true);
                        }}
                      >
                        Войти
                      </Button>
                      <Button 
                        variant="outline-dark" 
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            wantsToAuth: true,
                            registerNewAccount: true
                          }));
                          setShowAuthFields(true);
                        }}
                      >
                        Зарегистрироваться
                      </Button>
                    </div>
                  ) : null}
                  
                  <p className="mt-3 mb-0">
                    <small>
                      {formData.wantsToAuth 
                        ? (formData.registerNewAccount 
                            ? 'После регистрации вы сможете управлять своими объявлениями в личном кабинете.'
                            : 'После входа вы сможете управлять своими объявлениями в личном кабинете.')
                        : 'Если вы авторизуетесь, ваши контактные данные будут сохранены для будущих объявлений.'}
                    </small>
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
                
                {/* Поля авторизации/регистрации */}
                {!isAuthenticated && (
                  <div className="mb-4">
                    <Form.Check
                      type="checkbox"
                      id="wantsToAuth"
                      name="wantsToAuth"
                      label="Я хочу авторизоваться или зарегистрироваться"
                      checked={formData.wantsToAuth}
                      onChange={handleChange}
                      disabled={loading}
                      className="mb-3"
                    />
                    
                    <Collapse in={showAuthFields}>
                      <div>
                        <Row className="mb-3">
                          <Col md={6}>
                            <Form.Check
                              type="radio"
                              id="loginExisting"
                              name="registerNewAccount"
                              label="Войти в существующий аккаунт"
                              checked={!formData.registerNewAccount}
                              onChange={() => setFormData(prev => ({ ...prev, registerNewAccount: false }))}
                              disabled={loading}
                            />
                          </Col>
                          <Col md={6}>
                            <Form.Check
                              type="radio"
                              id="registerNew"
                              name="registerNewAccount"
                              label="Зарегистрировать новый аккаунт"
                              checked={formData.registerNewAccount}
                              onChange={() => setFormData(prev => ({ ...prev, registerNewAccount: true }))}
                              disabled={loading}
                            />
                          </Col>
                        </Row>
                        
                        <Row>
                          <Col md={6} className="mb-3">
                            <Form.Label className="required-field">Email для {formData.registerNewAccount ? 'регистрации' : 'входа'}</Form.Label>
                            <Form.Control
                              type="email"
                              name="authEmail"
                              value={formData.authEmail}
                              onChange={handleChange}
                              isInvalid={!!errors.authEmail}
                              disabled={loading}
                              placeholder="example@mail.ru"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.authEmail}
                            </Form.Control.Feedback>
                          </Col>
                          
                          <Col md={6} className="mb-3">
                            <Form.Label className="required-field">Пароль</Form.Label>
                            <Form.Control
                              type="password"
                              name="authPassword"
                              ref={passwordRef}
                              value={formData.authPassword}
                              onChange={handleChange}
                              isInvalid={!!errors.authPassword}
                              disabled={loading}
                              placeholder="Минимум 7 символов"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.authPassword}
                            </Form.Control.Feedback>
                          </Col>
                        </Row>
                        
                        {formData.registerNewAccount && (
                          <Col md={6} className="mb-3">
                            <Form.Label className="required-field">Подтверждение пароля</Form.Label>
                            <Form.Control
                              type="password"
                              name="authPasswordConfirmation"
                              value={formData.authPasswordConfirmation}
                              onChange={handleChange}
                              isInvalid={!!errors.authPasswordConfirmation}
                              disabled={loading}
                              placeholder="Повторите пароль"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.authPasswordConfirmation}
                            </Form.Control.Feedback>
                          </Col>
                        )}
                      </div>
                    </Collapse>
                  </div>
                )}
                
                <div className="mb-4">
                  <h5 className="mb-3">Информация о животном</h5>
                  
                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label className="required-field">Статус</Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        isInvalid={!!errors.status}
                        disabled={loading}
                      >
                        <option value="">Выберите статус</option>
                        <option value="found">Найден (животное нашло приют)</option>
                        <option value="lost">Потерян (поиск хозяина)</option>
                      </Form.Select>
                      <Form.Control.Feedback type="invalid">
                        {errors.status}
                      </Form.Control.Feedback>
                    </Col>
                    
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
                        <option value="лошадь">Лошадь</option>
                        <option value="попугай">Попугай</option>
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