import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, Table, Badge } from 'react-bootstrap';
import * as itemService from '../../services/itemService';
import { Item } from '../../types/Item';
import { formatCurrency } from '../../utils/formatters';

interface ChildItemsListProps {
  parentId: number;
}

export default function ChildItemsList({ parentId }: ChildItemsListProps) {
  const [children, setChildren] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChildren() {
      try {
        const items = await itemService.getItemChildren(parentId);
        setChildren(items);
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    }
    loadChildren();
  }, [parentId]);

  if (loading || children.length === 0) return null;

  return (
    <Card className="mt-3">
      <Card.Header>
        <h6 className="mb-0">
          Attached Items <Badge bg="secondary">{children.length}</Badge>
        </h6>
      </Card.Header>
      <Card.Body className="p-0">
        <Table hover responsive className="mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th className="text-center">Category</th>
              <th className="text-center">Value</th>
            </tr>
          </thead>
          <tbody>
            {children.map((child) => (
              <tr key={child.id}>
                <td>
                  <Link to={`/items/${child.id}`}>{child.name}</Link>
                </td>
                <td className="text-center">{child.category}</td>
                <td className="text-center">{formatCurrency(child.unitValue)}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Card.Body>
    </Card>
  );
}
