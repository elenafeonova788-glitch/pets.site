import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Navbar, Nav, Form, Button, Dropdown } from 'react-bootstrap';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated, currentUser: user, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?kind=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    if (window.confirm('Вы уверены, что хотите выйти из системы?')) {
      logout();
      navigate('/');
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <Navbar expand="lg" className="custom-navbar navbar-expand-lg navbar-light" style={{ backgroundColor: '#2f4f4f' }}>
      <Container>
        <Navbar.Brand as={Link} to="/" className="navbar-brand">
          <img 
            src="https://cdn-icons-png.flaticon.com/512/11647/11647571.png" 
            className="logo-img rounded-3" 
            alt="logo" 
            style={{ height: '40px' }}
          />
          <span className="ms-2 fw-bold align-middle text-white">GET PET BACK</span>
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="navbarNav" />
        
        <Navbar.Collapse id="navbarNav">
          <Nav className="me-auto">
            <Nav.Link 
              as={Link} 
              to="/add-pet" 
              className={isActive('/add-pet') ? 'active text-warning' : 'text-white'}
              style={{ fontWeight: isActive('/add-pet') ? 'bold' : 'normal' }}
            >
              Добавить объявление
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/search" 
              className={isActive('/search') ? 'active text-warning' : 'text-white'}
              style={{ fontWeight: isActive('/search') ? 'bold' : 'normal' }}
            >
              Поиск по объявлениям
            </Nav.Link>
          </Nav>
          
          {/* Простой поиск */}
          <Form className="d-flex me-3" onSubmit={handleSearch}>
            <Form.Control
              type="search"
              placeholder="Поиск животных..."
              className="me-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ minWidth: '200px' }}
            />
            <Button variant="outline-light" type="submit">
              Найти
            </Button>
          </Form>
          
          {/* Блок авторизации/пользователя */}
          {!isAuthenticated ? (
            <div id="authSection" className="d-flex">
              <Button 
                as={Link} 
                to="/registration" 
                variant="outline-light" 
                className="ms-2"
              >
                Регистрация
              </Button>
              <Button 
                as={Link} 
                to="/login" 
                variant="outline-light" 
                className="ms-2"
                id="loginBtn"
              >
                Вход
              </Button>
            </div>
          ) : (
            <div id="userSection">
              <Dropdown>
                <Dropdown.Toggle variant="outline-light" id="userDropdown">
                  {user?.name || user?.email?.split('@')[0] || 'Пользователь'}
                </Dropdown.Toggle>
                
                <Dropdown.Menu>
                  <Dropdown.Item as={Link} to="/profile">
                    Личный кабинет
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout}>
                    Выйти
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          )}
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Header;