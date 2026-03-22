import { Router, Request, Response } from 'express';
import { queryAll, run } from '../db/index';

const router = Router();

interface CostEntry {
  id: number;
  itemId: number;
  unitValue: number;
  timestamp: string;
}

// GET /item/:id — cost history for a specific item
router.get('/item/:id', (req: Request, res: Response) => {
  try {
    const history = queryAll(
      'SELECT * FROM cost_history WHERE item_id = ? ORDER BY timestamp ASC',
      [req.params.id]
    );
    res.json(history);
  } catch (error) {
    console.error('Error fetching cost history:', error);
    res.status(500).json({ error: 'Failed to fetch cost history' });
  }
});

// GET /item/:id/stats — cost history stats with computed values
router.get('/item/:id/stats', (req: Request, res: Response) => {
  try {
    const { currentValue } = req.query;
    const history = queryAll<CostEntry>(
      'SELECT * FROM cost_history WHERE item_id = ? ORDER BY timestamp ASC',
      [req.params.id]
    );

    const values = history.map(h => h.unitValue);
    if (currentValue !== undefined) {
      values.push(Number(currentValue));
    }

    let min = 0;
    let max = 0;
    let avg = 0;
    let trend = 'stable';

    if (values.length > 0) {
      min = Math.min(...values);
      max = Math.max(...values);
      avg = values.reduce((sum, v) => sum + v, 0) / values.length;

      if (values.length >= 2) {
        const last = values[values.length - 1];
        const prev = values[values.length - 2];
        if (last > prev) trend = 'up';
        else if (last < prev) trend = 'down';
      }
    }

    res.json({ history, stats: { min, max, avg, trend } });
  } catch (error) {
    console.error('Error fetching cost history stats:', error);
    res.status(500).json({ error: 'Failed to fetch cost history stats' });
  }
});

// DELETE /item/:id — delete cost history for a specific item
router.delete('/item/:id', (req: Request, res: Response) => {
  try {
    const result = run('DELETE FROM cost_history WHERE item_id = ?', [req.params.id]);
    res.json({ deleted: result.changes });
  } catch (error) {
    console.error('Error deleting cost history:', error);
    res.status(500).json({ error: 'Failed to delete cost history' });
  }
});

// GET /portfolio — aggregate portfolio value over time
router.get('/portfolio', (req: Request, res: Response) => {
  try {
    const { period = 'all', groupBy = 'none' } = req.query;
    
    // Calculate period start date
    let periodStartDate = '';
    const now = new Date();
    
    switch (period) {
      case '7d':
        periodStartDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '30d':
        periodStartDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '90d':
        periodStartDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case '1y':
        periodStartDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString();
        break;
      case 'all':
      default:
        periodStartDate = '1970-01-01T00:00:00.000Z';
        break;
    }

    // Get all current items for baseline
    const currentItems = queryAll(`
      SELECT id, name, category, value, created_at 
      FROM items 
      ORDER BY created_at ASC
    `);

    // Get all value-affecting stock history events
    const stockEvents = queryAll(`
      SELECT item_id, item_name, change_type, previous_value, new_value, timestamp
      FROM stock_history 
      WHERE (change_type LIKE '%value%' OR change_type = 'created' OR change_type = 'deleted')
        AND timestamp >= ?
      ORDER BY timestamp ASC
    `, [periodStartDate]);

    // Build time series by reconstructing portfolio value at each point
    const snapshots: Array<{
      date: string;
      totalValue: number;
      byType?: Record<string, number>;
    }> = [];

    // Create a map to track current values of all items
    const itemValues: Record<number, { value: number; category: string; exists: boolean }> = {};
    
    // Initialize with current state, then work backwards through history
    currentItems.forEach((item: any) => {
      itemValues[item.id] = {
        value: item.value || 0,
        category: item.category || 'Other',
        exists: true
      };
    });

    // Process events in reverse chronological order to reconstruct historical states
    const reversedEvents = [...stockEvents].reverse();
    const processedDates = new Set<string>();

    // Add current snapshot first
    const currentDate = new Date().toISOString().split('T')[0];
    let currentTotalValue = 0;
    const currentByType: Record<string, number> = {};
    
    Object.values(itemValues).forEach((item: any) => {
      if (item.exists) {
        currentTotalValue += item.value;
        currentByType[item.category] = (currentByType[item.category] || 0) + item.value;
      }
    });

    snapshots.unshift({
      date: currentDate,
      totalValue: currentTotalValue,
      ...(groupBy === 'type' ? { byType: currentByType } : {})
    });

    // Work backwards through events
    reversedEvents.forEach((event: any) => {
      const eventDate = new Date(event.timestamp).toISOString().split('T')[0];
      
      if (processedDates.has(eventDate)) {
        return; // Skip if we already processed this date
      }
      
      // Revert this event to get the state before it
      if (event.change_type === 'created') {
        // Item was created, so it didn't exist before
        if (itemValues[event.item_id]) {
          itemValues[event.item_id].exists = false;
        }
      } else if (event.change_type === 'deleted') {
        // Item was deleted, so it existed before with some value
        if (!itemValues[event.item_id]) {
          const currentItem = currentItems.find((item: any) => item.id === event.item_id);
          itemValues[event.item_id] = {
            value: event.previous_value || 0,
            category: currentItem?.category || 'Other',
            exists: true
          };
        } else {
          itemValues[event.item_id].exists = true;
          itemValues[event.item_id].value = event.previous_value || 0;
        }
      } else if (event.change_type.includes('value')) {
        // Value was changed
        if (itemValues[event.item_id]) {
          itemValues[event.item_id].value = event.previous_value || 0;
        }
      }

      // Calculate total value for this historical point
      let totalValue = 0;
      const byType: Record<string, number> = {};
      
      Object.values(itemValues).forEach((item: any) => {
        if (item.exists) {
          totalValue += item.value;
          byType[item.category] = (byType[item.category] || 0) + item.value;
        }
      });

      snapshots.unshift({
        date: eventDate,
        totalValue,
        ...(groupBy === 'type' ? { byType } : {})
      });

      processedDates.add(eventDate);
    });

    // Sort snapshots by date and limit to reasonable number for frontend
    snapshots.sort((a, b) => a.date.localeCompare(b.date));
    
    // Limit to max 100 data points for performance
    const maxPoints = 100;
    let finalSnapshots = snapshots;
    if (snapshots.length > maxPoints) {
      const step = Math.ceil(snapshots.length / maxPoints);
      finalSnapshots = snapshots.filter((_, index) => index % step === 0);
      // Always include the last snapshot
      if (finalSnapshots[finalSnapshots.length - 1] !== snapshots[snapshots.length - 1]) {
        finalSnapshots.push(snapshots[snapshots.length - 1]);
      }
    }

    // Calculate summary stats
    const currentValue = finalSnapshots[finalSnapshots.length - 1]?.totalValue || 0;
    const periodStartValue = finalSnapshots[0]?.totalValue || 0;
    const change = currentValue - periodStartValue;
    const percentChange = periodStartValue > 0 ? (change / periodStartValue) * 100 : 0;

    res.json({
      snapshots: finalSnapshots,
      summary: {
        currentValue,
        periodStartValue,
        change,
        percentChange
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio history:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio history' });
  }
});

export default router;
