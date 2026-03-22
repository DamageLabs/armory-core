import { Router, Request, Response } from 'express';
import { queryAll, queryOne } from '../db/index';

const router = Router();

interface ReportItem {
  id: number;
  name: string;
  category: string;
  serialNumber: string | null;
  caliber: string | null;
  manufacturer: string | null;
  condition: string | null;
  unitValue: number;
  value: number;
  location: string;
  createdAt: string;
  photoId: number | null;
}

interface InsuranceReportResponse {
  generatedAt: string;
  totalItems: number;
  totalValue: number;
  items: ReportItem[];
}

// GET /api/reports/insurance — consolidated report data
router.get('/insurance', (req: Request, res: Response) => {
  try {
    const typeId = req.query.typeId ? parseInt(req.query.typeId as string, 10) : null;

    // Build the query with optional type filter
    let query = `
      SELECT 
        i.id,
        i.name,
        i.category,
        i.unit_value as unitValue,
        i.value,
        i.location,
        i.custom_fields as customFields,
        i.created_at as createdAt,
        (
          SELECT ip.id 
          FROM item_photos ip 
          WHERE ip.item_id = i.id 
          ORDER BY ip.sort_order ASC, ip.created_at ASC 
          LIMIT 1
        ) as photoId
      FROM items i
    `;
    
    const params: any[] = [];
    
    if (typeId) {
      query += ' WHERE i.inventory_type_id = ?';
      params.push(typeId);
    }
    
    query += ' ORDER BY i.category ASC, i.name ASC';

    const rawItems = queryAll(query, params);
    
    // Process items to flatten custom fields and calculate totals
    const items: ReportItem[] = rawItems.map(item => {
      const customFields = typeof item.customFields === 'string' 
        ? JSON.parse(item.customFields) 
        : (item.customFields || {});
      
      return {
        id: item.id,
        name: item.name,
        category: item.category || '',
        serialNumber: customFields.serialNumber || null,
        caliber: customFields.caliber || null,
        manufacturer: customFields.manufacturer || null,
        condition: customFields.condition || null,
        unitValue: item.unitValue || 0,
        value: item.value || 0,
        location: item.location || '',
        createdAt: item.createdAt,
        photoId: item.photoId || null
      };
    });

    const totalItems = items.length;
    const totalValue = items.reduce((sum, item) => sum + (item.unitValue || 0), 0);

    const response: InsuranceReportResponse = {
      generatedAt: new Date().toISOString(),
      totalItems,
      totalValue,
      items
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating insurance report:', error);
    res.status(500).json({ error: 'Failed to generate insurance report' });
  }
});

export default router;