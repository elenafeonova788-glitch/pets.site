import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Form, Button, Card, Container, Row, Col, Alert, Spinner, Collapse } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';
import { districts } from '../utils/constants';
import { validateEmail, validatePhone, validateName, validatePassword } from '../utils/helpers';
import { petsAPI, usersAPI } from '../utils/apiService';

const AddPet = () => {
  const { isAuthenticated, currentUser, login, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Контактная информация (автоматически для авторизованных пользователей)
    userName: '',
    userPhone: '',
    userEmail: '',

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

    // Регистрация (только для неавторизованных)
    wantsToRegister: false,
    registerPassword: '',
    registerPasswordConfirmation: '',
  });

  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [photoPreviews, setPhotoPreviews] = useState([]);
  const [showRegisterFields, setShowRegisterFields] = useState(false);

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
      }));
    }

    // Если пользователь авторизован, используем данные из currentUser
    if (isAuthenticated && currentUser) {
      setFormData(prev => ({
        ...prev,
        userName: currentUser.name || '',
        userPhone: currentUser.phone || '',
        userEmail: currentUser.email || '',
      }));
    }
  }, [isAuthenticated, currentUser]);

  const handleChange = (e) => {
    const { name, value, type, checked, files } = e.target;

    if (type === 'file') {
      // Валидация файлов
      if (files.length > 3) {
        alert('Можно загрузить не более 3 фотографий');
        e.target.value = '';
        return;
      }

      const newPhotos = Array.from(files);

      // Проверка формата - ТОЛЬКО PNG
      const invalidFiles = newPhotos.filter(file => file.type !== 'image/png');
      if (invalidFiles.length > 0) {
        alert('Разрешены только файлы формата PNG!');
        e.target.value = '';
        return;
      }

      const newPreviews = [];
      newPhotos.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push(e.target.result);
          if (newPreviews.length === newPhotos.length) {
            setPhotoPreviews(prev => [...prev, ...newPreviews].slice(0, 3));
          }
        };
        reader.readAsDataURL(file);
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

      // При включении регистрации показываем поля пароля
      if (name === 'wantsToRegister' && checked) {
        setShowRegisterFields(true);
        setTimeout(() => {
          if (passwordRef.current) {
            passwordRef.current.focus();
          }
        }, 300);
      } else if (name === 'wantsToRegister' && !checked) {
        setShowRegisterFields(false);
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

  // Валидация формы по ТЗ
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

    // Валидация фото - минимум 1 фото по ТЗ
    if (formData.photos.length === 0) {
      newErrors.photos = 'Необходимо загрузить хотя бы одну фотографию';
    } else {
      // Проверяем формат фото
      const invalidPhotos = formData.photos.filter(photo => photo.type !== 'image/png');
      if (invalidPhotos.length > 0) {
        newErrors.photos = 'Все фотографии должны быть в формате PNG';
      }
    }

    // Валидация согласия на обработку данных
    if (!formData.confirm) {
      newErrors.confirm = 'Необходимо согласие на обработку персональных данных';
    }

    // Валидация регистрации (только если не авторизован и выбрана регистрация)
    if (!isAuthenticated && formData.wantsToRegister) {
      if (!formData.registerPassword) {
        newErrors.registerPassword = 'Поле обязательно для заполнения';
      } else if (formData.registerPassword.length < 7) {
        newErrors.registerPassword = 'Пароль должен содержать минимум 7 символов';
      } else if (!validatePassword(formData.registerPassword)) {
        newErrors.registerPassword = 'Пароль должен содержать минимум 1 цифру, 1 строчную и 1 заглавную букву';
      }

      if (!formData.registerPasswordConfirmation) {
        newErrors.registerPasswordConfirmation = 'Поле обязательно для заполнения';
      } else if (formData.registerPassword !== formData.registerPasswordConfirmation) {
        newErrors.registerPasswordConfirmation = 'Пароли не совпадают';
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

      let authToken = null;
      let userId = null;

      // Шаг 1: Регистрация пользователя (если выбрана и не авторизован)
      if (!isAuthenticated && formData.wantsToRegister) {
        try {
          // Регистрируем пользователя с ВСЕМИ данными
          const registrationData = {
            name: formData.userName,
            phone: formData.userPhone.replace(/\D/g, ''),
            email: formData.userEmail,
            password: formData.registerPassword,
            password_confirmation: formData.registerPasswordConfirmation,
            confirm: formData.confirm ? 1 : 0
          };

          console.log('Регистрация пользователя:', registrationData);
          
          // Регистрируем пользователя через AuthContext
          const registerResponse = await register(registrationData);
          
          // После регистрации автоматически входим
          const loginData = {
            email: formData.userEmail,
            password: formData.registerPassword,
            name: formData.userName,
            phone: formData.userPhone.replace(/\D/g, '')
          };
          
          // Получаем токен с сервера
          const loginResponse = await usersAPI.login({
            email: formData.userEmail,
            password: formData.registerPassword
          });

          // Получаем токен из ответа
          authToken = loginResponse.data?.token || loginResponse.token;
          
          if (authToken) {
            // Используем метод login из AuthContext
        await login(loginData);
          } else {
            throw new Error('Токен не получен после регистрации');
          }

        } catch (authError) {
          console.error('Ошибка регистрации/входа:', authError);
          setApiError('Ошибка регистрации: ' + (authError.message || 'Не удалось зарегистрироваться'));
          setLoading(false);
          return;
        }
      }

      // Шаг 2: Подготовка данных для объявления
      const petData = {
        name: formData.userName.trim(),
        phone: formData.userPhone.replace(/\D/g, ''),
        email: formData.userEmail.trim(),
        kind: formData.type,
        description: formData.description.trim(),
        district: districts[formData.district] || formData.district,
        date: formData.date,
        mark: formData.mark || '',
        confirm: formData.confirm ? 1 : 0,
      };

      // Если пользователь выбрал регистрацию, добавляем пароли
      if (!isAuthenticated && formData.wantsToRegister) {
        petData.password = formData.registerPassword;
        petData.password_confirmation = formData.registerPasswordConfirmation;
      }

      console.log('Данные для объявления:', petData);

      // Создаем FormData для отправки файлов
      const formDataToSend = new FormData();

      // Добавляем текстовые поля
      Object.keys(petData).forEach(key => {
        if (petData[key] !== undefined && petData[key] !== null) {
          formDataToSend.append(key, petData[key]);
        }
      });

      // Добавляем фото с правильными именами полей по ТЗ (photo1, photo2, photo3)
      if (formData.photos && formData.photos.length > 0) {
        formData.photos.forEach((photo, index) => {
          // Используем имена photo1, photo2, photo3 как ожидает API
          formDataToSend.append(`photo${index + 1}`, photo);
        });
        
        // Добавляем пустые поля для недостающих фото
        for (let i = formData.photos.length + 1; i <= 3; i++) {
          formDataToSend.append(`photo${i}`, '');
        }
      }

      // Отладка: проверяем что отправляем
      console.log('Отправляемые данные FormData:');
      for (let [key, value] of formDataToSend.entries()) {
        console.log(`${key}:`, value);
      }

      // Отправка объявления
      try {
        // Используем токен, если пользователь зарегистрировался или уже авторизован
        const token = authToken || (isAuthenticated ? localStorage.getItem('authToken') || localStorage.getItem('token') : null);
        
        console.log('Используемый токен для отправки:', token);
        
        // Отправляем запрос через apiService
        const response = await petsAPI.addPet(formDataToSend, token);
        console.log('Объявление добавлено:', response);

        if (response.data && response.data.id) {
          alert('Объявление успешно добавлено!');
          
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
            wantsToRegister: false,
            registerPassword: '',
            registerPasswordConfirmation: '',
          });
          
          setPhotoPreviews([]);
          setErrors({});
          setShowRegisterFields(false);

          // Сохраняем данные пользователя в localStorage для будущего входа
          if (!isAuthenticated && !formData.wantsToRegister) {
            localStorage.setItem('userEmail', formData.userEmail);
            localStorage.setItem('userName', formData.userName);
            localStorage.setItem('userPhone', formData.userPhone);
          }

          // Перенаправление
          if (isAuthenticated || formData.wantsToRegister) {
            navigate('/profile');
          } else {
            navigate('/');
          }
        } else {
          setApiError('Ошибка при добавлении объявления: не получен ID объявления');
        }
      } catch (apiError) {
        console.error('Ошибка API при добавлении объявления:', apiError);
        
        let errorMessage = 'Ошибка при добавлении объявления';
        
        if (apiError.status === 422 && apiError.data && apiError.data.errors) {
          // Форматируем ошибки валидации с сервера
          const validationErrors = apiError.data.errors;
          const formattedErrors = [];
          
          for (const [field, errors] of Object.entries(validationErrors)) {
            if (Array.isArray(errors)) {
              errors.forEach(err => formattedErrors.push(`${field}: ${err}`));
            } else if (typeof errors === 'string') {
              formattedErrors.push(`${field}: ${errors}`);
            }
          }
          
          if (formattedErrors.length > 0) {
            errorMessage = formattedErrors.join('; ');
          }
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
        
        setApiError(errorMessage);
      }

    } catch (error) {
      console.error('Общая ошибка:', error);
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

              {/* Предложение зарегистрироваться для незарегистрированных пользователей */}
              {!isAuthenticated && (
                <Alert variant="info" className="mb-4">
                  <h5 className="alert-heading">
                    {formData.wantsToRegister
                      ? 'Регистрация'
                      : 'Вы не вошли в систему'}
                  </h5>
                  <p className="mb-2">
                    {formData.wantsToRegister
                      ? 'Зарегистрируйтесь, чтобы сохранить ваши данные для будущих объявлений.'
                      : 'Вы можете добавить объявление без регистрации, но мы рекомендуем зарегистрироваться:'}
                  </p>

                  {!formData.wantsToRegister ? (
                    <div className="d-flex gap-2 mt-3">
                      <Button
                        variant="dark"
                        size="sm"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            wantsToRegister: true
                          }));
                          setShowRegisterFields(true);
                        }}
                      >
                        Зарегистрироваться
                      </Button>
                    </div>
                  ) : null}

                  <p className="mt-3 mb-0">
                    <small>
                      {formData.wantsToRegister
                        ? 'После регистрации вы сможете управлять своими объявлениями в личном кабинете.'
                        : 'Если вы зарегистрируетесь, ваши контактные данные будут сохранены для будущих объявлений.'}
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
                      <Form.Label className="required-field">Имя *</Form.Label>
                      <Form.Control
                        type="text"
                        name="userName"
                        value={formData.userName}
                        onChange={handleChange}
                        isInvalid={!!errors.userName}
                        disabled={loading || (isAuthenticated && currentUser)}
                        placeholder="Иван Иванов"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.userName}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Только кириллица, пробелы и дефис
                      </Form.Text>
                    </Col>
                    <Col md={6} className="mb-3">
                      <Form.Label className="required-field">Телефон *</Form.Label>
                      <Form.Control
                        type="tel"
                        name="userPhone"
                        value={formData.userPhone}
                        onChange={handleChange}
                        isInvalid={!!errors.userPhone}
                        disabled={loading || (isAuthenticated && currentUser)}
                        placeholder="89001234567 или +79001234567"
                      />
                      <Form.Control.Feedback type="invalid">
                        {errors.userPhone}
                      </Form.Control.Feedback>
                      <Form.Text className="text-muted">
                        Только цифры и знак +
                      </Form.Text>
                    </Col>
                  </Row>

                  <Col md={6} className="mb-3">
                    <Form.Label className="required-field">Email *</Form.Label>
                    <Form.Control
                      type="email"
                      name="userEmail"
                      value={formData.userEmail}
                      onChange={handleChange}
                      isInvalid={!!errors.userEmail}
                      disabled={loading || (isAuthenticated && currentUser)}
                      placeholder="user@user.ru"
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.userEmail}
                    </Form.Control.Feedback>
                  </Col>
                </div>

                {/* Поля регистрации (только для неавторизованных) */}
                {!isAuthenticated && (
                  <div className="mb-4">
                    <Form.Check
                      type="checkbox"
                      id="wantsToRegister"
                      name="wantsToRegister"
                      label="Зарегистрироваться при добавлении объявления"
                      checked={formData.wantsToRegister}
                      onChange={handleChange}
                      disabled={loading}
                      className="mb-3"
                    />

                    <Collapse in={showRegisterFields}>
                      <div>
                        <Row>
                          <Col md={6} className="mb-3">
                            <Form.Label className="required-field">Пароль *</Form.Label>
                            <Form.Control
                              type="password"
                              name="registerPassword"
                              ref={passwordRef}
                              value={formData.registerPassword}
                              onChange={handleChange}
                              isInvalid={!!errors.registerPassword}
                              disabled={loading}
                              placeholder="Минимум 7 символов"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.registerPassword}
                            </Form.Control.Feedback>
                            <Form.Text className="text-muted">
                              Минимум 7 символов: 1 цифра, 1 строчная, 1 заглавная буква
                            </Form.Text>
                          </Col>

                          <Col md={6} className="mb-3">
                            <Form.Label className="required-field">Подтверждение пароля *</Form.Label>
                            <Form.Control
                              type="password"
                              name="registerPasswordConfirmation"
                              value={formData.registerPasswordConfirmation}
                              onChange={handleChange}
                              isInvalid={!!errors.registerPasswordConfirmation}
                              disabled={loading}
                              placeholder="Повторите пароль"
                            />
                            <Form.Control.Feedback type="invalid">
                              {errors.registerPasswordConfirmation}
                            </Form.Control.Feedback>
                          </Col>
                        </Row>
                      </div>
                    </Collapse>
                  </div>
                )}

                <div className="mb-4">
                  <h5 className="mb-3">Информация о животном</h5>

                  <Row>
                    <Col md={6} className="mb-3">
                      <Form.Label className="required-field">Тип животного *</Form.Label>
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

                    <Col md={6} className="mb-3">
                      <Form.Label>Статус</Form.Label>
                      <Form.Select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        disabled={loading}
                      >
                        <option value="found">Найден (животное нашло приют)</option>
                        <option value="lost">Потерян (поиск хозяина)</option>
                      </Form.Select>
                    </Col>
                  </Row>

                  <Row>
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
                  </Row>

                  <Col md={12} className="mb-3">
                    <Form.Label className="required-field">Описание *</Form.Label>
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
                      <Form.Label className="required-field">Район *</Form.Label>
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
                      <Form.Label className="required-field">Дата *</Form.Label>
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
                      Фотографии животного (минимум 1, максимум 3, ТОЛЬКО PNG) *
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
                    <Form.Text className="text-muted">
                      Выберите от 1 до 3 фотографий животного в формате PNG. Первая фотография обязательна.
                    </Form.Text>

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
                  label="Я согласен с условиями использования и обработкой персональных данных *"
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