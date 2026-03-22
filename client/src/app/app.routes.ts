import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Auth routes (no layout)
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'register',
    loadComponent: () => import('./features/auth/register/register.component').then(m => m.RegisterComponent)
  },
  
  // Protected routes (with layout)
  {
    path: '',
    loadComponent: () => import('./shared/layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'inventory',
        loadComponent: () => import('./features/inventory/inventory-list/inventory-list.component').then(m => m.InventoryListComponent)
      },
      {
        path: 'inventory/new',
        loadComponent: () => import('./features/inventory/inventory-form/inventory-form.component').then(m => m.InventoryFormComponent)
      },
      {
        path: 'inventory/:id',
        loadComponent: () => import('./features/inventory/inventory-detail/inventory-detail.component').then(m => m.InventoryDetailComponent)
      },
      {
        path: 'inventory/:id/edit',
        loadComponent: () => import('./features/inventory/inventory-form/inventory-form.component').then(m => m.InventoryFormComponent)
      },
      
      // Admin routes
      {
        path: 'admin/users',
        loadComponent: () => import('./features/admin/user-list/user-list.component').then(m => m.UserListComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/categories',
        loadComponent: () => import('./features/admin/category-management/category-management.component').then(m => m.CategoryManagementComponent),
        canActivate: [adminGuard]
      },
      {
        path: 'admin/inventory-types',
        loadComponent: () => import('./features/admin/inventory-type-management/inventory-type-management.component').then(m => m.InventoryTypeManagementComponent),
        canActivate: [adminGuard]
      }
    ]
  },

  // Fallback
  { path: '**', redirectTo: '' }
];
