import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
    status: 'found', // По спецификации - все найденные животные
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
      const newPreviews = [];
      
      newPhotos.forEach(file => {
        if (file.type.match('image.*')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            newPreviews.push(e.target.result);
            if (newPreviews.length === newPhotos.length) {
              setPhotoPreviews(newPreviews);
            }
          };
          reader.readAsDataURL(file);
        }
      });
      
      setFormData(prev => ({
        ...prev,
        photos: newPhotos
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    setApiError('');
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
        kind: formData.type, // русское название
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

      // Добавляем фото
      if (formData.photos && formData.photos.length > 0) {
        formData.photos.forEach((photo, index) => {
          formDataToSend.append(`photo${index + 1}`, photo);
        });
      }

      console.log('Submitting pet data:', petData);

      // Добавление объявления через API
      await addUserAd(formDataToSend);
      
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
                        disabled={isAuthenticated || loading}
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
                        disabled={isAuthenticated || loading}
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
                      disabled={isAuthenticated || loading}
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
                    <Form.Label className="required-field">Фотографии животного (до 3 фото)</Form.Label>
                    <Form.Control
                      type="file"
                      name="photos"
                      onChange={handleChange}
                      accept="image/*"
                      multiple
                      isInvalid={!!errors.photos}
                      disabled={loading}
                    />
                    <Form.Control.Feedback type="invalid">
                      {errors.photos}
                    </Form.Control.Feedback>
                    <div className="form-text">Выберите до 3 фотографий животного (JPG, PNG).</div>
                    
                    {photoPreviews.length > 0 && (
                      <div className="mt-2">
                        {photoPreviews.map((preview, index) => (
                          <img 
                            key={index} 
                            src={preview} 
                            alt={`Preview ${index}`} 
                            className="photo-preview me-2" 
                            style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px' }}
                          />
                        ))}
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