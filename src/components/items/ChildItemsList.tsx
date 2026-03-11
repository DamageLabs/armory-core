import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CCard, CCardHeader, CCardBody, CBadge } from '@coreui/react';
import * as itemService from '../../services/itemService';
import * as inventoryTypeService from '../../services/inventoryTypeService';
import { Item } from '../../types/Item';
import { InventoryType } from '../../types/InventoryType';
import { formatCurrency } from '../../utils/formatters';

interface ChildItemsListProps {
  parentId: number;
  parentTypeName?: string;
}

export default function ChildItemsList({ parentId, parentTypeName }: ChildItemsListProps) {
  const [children, setChildren] = useState<Item[]>([]);
  const [typeMap, setTypeMap] = useState<Map<number, InventoryType>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChildren() {
      try {
        const [items, types] = await Promise.all([
          itemService.getItemChildren(parentId),
          inventoryTypeService.getAllTypes(),
        ]);
        setChildren(items);
        setTypeMap(new Map(types.map((t) => [t.id, t])));
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
    <CCard className="mt-3">
      <CCardHeader>
        <h6 className="mb-0">
          Attached Items <CBadge color="secondary">{children.length}</CBadge>
        </h6>
      </CCardHeader>
      <CCardBody className="p-0">
        <table className="table table-hover mb-0">
          <thead>
            <tr>
              <th>Name</th>
              <th className="text-center">Type</th>
              <th className="text-center">Category</th>
              <th className="text-center">Value</th>
            </tr>
          </thead>
          <tbody>
            {children.map((child) => {
              const childType = typeMap.get(child.inventoryTypeId);
              return (
                <tr key={child.id}>
                  <td>
                    <Link to={`/items/${child.id}`}>{child.name}</Link>
                  </td>
                  <td className="text-center">
                    {parentTypeName && <CBadge color="primary" className="me-1">{parentTypeName}</CBadge>}
                    {childType && <CBadge color="secondary">{childType.name}</CBadge>}
                  </td>
                  <td className="text-center">{child.category}</td>
                  <td className="text-center">{formatCurrency(child.unitValue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CCardBody>
    </CCard>
  );
}
