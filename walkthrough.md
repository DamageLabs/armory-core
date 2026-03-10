# Armory Core - Firearms Inventory Management System

A comprehensive walkthrough of the Armory Core application features.

## Table of Contents

- [Getting Started](#getting-started)
- [Inventory Management](#inventory-management)
- [Item Templates](#item-templates)
- [Bill of Materials (BOM)](#bill-of-materials-bom)
- [Reports & Analytics](#reports--analytics)
- [Data Import & Export](#data-import--export)
- [Barcode & Labels](#barcode--labels)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Dark Mode](#dark-mode)
- [User Management](#user-management)

---

## Getting Started

### Welcome Page

The landing page introduces Armory Core and its key features. Users can sign up or log in to access the inventory system.

![Welcome Page](screenshots/01-welcome.png)

### Login

Secure authentication with email and password. Default credentials for demo:
- **Admin**: admin@example.com / changeme
- **User**: user@example.com / changeme

![Login Page](screenshots/02-login.png)

---

## Inventory Management

### Item List

The main inventory view with powerful features:
- **Search**: Full-text search across all item fields
- **Filters**: Filter by category and location
- **Sorting**: Click column headers to sort
- **Pagination**: Navigate through large inventories
- **Bulk Actions**: Select multiple items for batch operations

![Item List](screenshots/03-item-list.png)

### Search

Quickly find items with instant search. Results filter as you type across name, description, part numbers, and more.

![Item Search](screenshots/04-item-list-search.png)

### Bulk Selection

Select multiple items using checkboxes for batch operations:
- Delete multiple items at once
- Change category for selected items
- Export selected items

![Bulk Selection](screenshots/05-bulk-selection.png)

### New Item Form

Create new inventory items with comprehensive fields:
- **Template Selection**: Use pre-defined templates to speed up data entry
- **Image Upload**: Automatic compression for images over 100KB
- **Vendor Lookup**: Look up prices from supported vendors (Adafruit, DigiKey, Mouser, etc.)
- **Barcode**: Assign barcodes for scanning
- **Reorder Point**: Set low stock alerts

![New Item Form](screenshots/06-new-item-form.png)

### Item Detail

View complete item information including:
- **Cost History Chart**: Visual tracking of price changes over time
- **Vendor Price Comparison**: Compare prices across multiple vendors
- **Stock Status**: Reorder alerts when quantity falls below threshold

![Item Detail](screenshots/07-item-detail.png)

---

## Item Templates

Create reusable templates to speed up item entry. Templates store default values for:
- Category
- Vendor name and URL
- Location
- Reorder point
- Description

Perfect for adding multiple items from the same vendor or category.

![Item Templates](screenshots/08-item-templates.png)

---

## Bill of Materials (BOM)

### BOM List

Group items into projects or assemblies. Each BOM shows:
- Total component count
- Calculated total cost
- Build availability status

![BOM List](screenshots/09-bom-list.png)

### Create BOM

Build a bill of materials by:
1. Adding a name and description
2. Selecting items from your inventory
3. Specifying quantities needed
4. Adding notes for each component

The form automatically calculates line totals and overall cost.

![New BOM Form](screenshots/10-new-bom-form.png)

---

## Reports & Analytics

### Dashboard

Get a high-level overview of your inventory:
- Total items and value
- Category breakdown charts
- Low stock alerts
- Recent activity

![Reports Dashboard](screenshots/11-reports-dashboard.png)

### Inventory Valuation

Detailed valuation report showing:
- Value by category
- Top valuable items
- Total inventory worth

![Valuation Report](screenshots/12-valuation-report.png)

### Stock Movement

Track inventory changes over time:
- Items added/removed
- Quantity adjustments
- Historical trends

![Movement Report](screenshots/13-movement-report.png)

### Custom Reports

Build your own reports with:
- Flexible column selection
- Custom filters
- Export to CSV/JSON

![Custom Report](screenshots/14-custom-report.png)

---

## Data Import & Export

### Reorder Alerts

Monitor items that need restocking:
- Items below reorder point
- Quick reorder actions
- Configurable thresholds

![Reorder Alerts](screenshots/15-reorder-alerts.png)

### Data Import

Import inventory from CSV files:
- Field mapping interface
- Preview before import
- Validation and error handling

![Data Import](screenshots/16-data-import.png)

---

## Barcode & Labels

### Print Labels

Generate printable labels for your inventory:
- Multiple label formats
- Barcode generation
- Batch printing

![Print Labels](screenshots/17-print-labels.png)

### Barcode Scanner

Scan barcodes using your device camera:
- Quick item lookup
- Add scanned items to inventory
- Mobile-friendly interface

![Barcode Scanner](screenshots/18-barcode-scanner.png)

---

## Keyboard Shortcuts

Power users can navigate quickly with keyboard shortcuts:

| Key | Action |
|-----|--------|
| `?` | Show keyboard shortcuts |
| `n` | Create new item |
| `/` or `Ctrl+K` | Focus search |
| `i` | Go to inventory |
| `h` | Go to home |
| `r` | Go to reports |
| `b` | Go to BOMs |
| `Escape` | Close modal / blur input |

![Keyboard Shortcuts](screenshots/19-keyboard-shortcuts.png)

---

## Dark Mode

Armory Core supports dark mode for comfortable viewing in low-light environments. Toggle the theme using the sun/moon icon in the header.

### Item List - Dark Mode

![Item List Dark](screenshots/20-item-list-dark.png)

### Dashboard - Dark Mode

![Dashboard Dark](screenshots/21-dashboard-dark.png)

### Item Detail - Dark Mode

![Item Detail Dark](screenshots/22-item-detail-dark.png)

---

## User Management

Administrators can manage users:
- View all registered users
- Change user roles (user, vip, admin)
- Monitor sign-in activity

![User Management](screenshots/23-user-management.png)

---

## Technical Features

### Progressive Web App (PWA)

Armory Core is a PWA, meaning you can:
- Install it on your device
- Use it offline
- Get a native app-like experience

### Local Storage

All data is stored in your browser's localStorage:
- No server required
- Data stays on your device
- Export/import for backup

### Image Optimization

Images are automatically compressed:
- Max width: 800px
- JPEG quality: 70%
- Target size: under 100KB

---

## Getting Help

- Press `?` for keyboard shortcuts
- Check the [GitHub repository](https://github.com/DamageLabs/armory-core) for issues and updates
- Default login: admin@example.com / changeme
