import { Container, Row, Col } from 'react-bootstrap';

export default function Welcome() {
  return (
    <div className="bg-light p-5 rounded">
      <Container>
        <Row className="align-items-center">
          <Col md={3} className="text-center">
            <div
              style={{
                width: '100px',
                height: '100px',
                backgroundColor: '#0d6efd',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                fontWeight: 'bold',
                margin: '0 auto',
              }}
            >
              AC
            </div>
          </Col>
          <Col md={9}>
            <h1>Armory Core</h1>
            <p className="lead">
              Armory Core is an Open Source Inventory Management System designed to track
              firearms, accessories, and ammunition. It helps you manage your collection,
              monitor stock levels, and track accessory configurations.
            </p>
            <h3>Project Status</h3>
            <p>
              This project is currently in an early alpha stage. Code quality is improving constantly.
              However, this project is not ready for production yet.
            </p>
            <p>
              <a
                href="https://github.com/DamageLabs/armory-core"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                View on GitHub
              </a>
            </p>
          </Col>
        </Row>
      </Container>
    </div>
  );
}
