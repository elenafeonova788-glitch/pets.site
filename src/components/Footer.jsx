import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';

const Footer = () => {
  return (
    <footer className="bg-dark text-white py-3 mt-5">
      <Container>
        <Row>
          <Col md={6}>
            <p className="mb-0">GET PET BACK © Copyright, 2025</p>
          </Col>
          <Col md={6} className="text-md-end">
            <p className="mb-0">Все права защищены</p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;