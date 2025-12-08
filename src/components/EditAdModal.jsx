import React, { useState, useEffect } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { districts } from '../utils/constants';

const EditAdModal = ({ ad, show, onHide, onSave }) => {
  const [formData, setFormData] = useState({
    type: '',
    status: '',
    name: '',
    description: '',
    district: '',
    mark: ''
  });

  useEffect(() => {
    if (ad) {
      setFormData({
        type: ad.type || '',
        status: ad.status || '',
        name: ad.name || '',
        description: ad.description || '',
        district: ad.district || '',
        mark: ad.mark || ''
      });
    }
  }, [ad]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!ad) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Редактирование объявления</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form id="editAdForm" onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label className="required-field">Тип животного</Form.Label>
            <Form.Select
              name="type"
              value={formData.type}
              onChange={handleChange}
              required
            >
              <option value="">Выберите тип</option>
              <option value="cat">Кошка</option>
              <option value="dog">Собака</option>
              <option value="bird">Птица</option>
              <option value="rodent">Грызун</option>
              <option value="other">Другое</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label className="required-field">Статус</Form.Label>
            <Form.Select
              name="status"
              value={formData.status}
              onChange={handleChange}
              required
            >
              <option value="">Выберите статус</option>
              <option value="lost">Потерян</option>
              <option value="found">Найден</option>
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Кличка животного</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label className="required-field">Описание</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label className="required-field">Район</Form.Label>
            <Form.Select
              name="district"
              value={formData.district}
              onChange={handleChange}
              required
            >
              <option value="">Выберите район</option>
              {Object.entries(districts).map(([key, value]) => (
                <option key={key} value={key}>{value}</option>
              ))}
            </Form.Select>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Клеймо (если есть)</Form.Label>
            <Form.Control
              type="text"
              name="mark"
              value={formData.mark}
              onChange={handleChange}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={handleSubmit}>
          Сохранить изменения
        </Button>
        <Button variant="secondary" onClick={onHide}>
          Отмена
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default EditAdModal;