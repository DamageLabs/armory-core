import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xl z-50 transition-transform duration-300"
           [class."-translate-x-full"]="!isOpen()"
           [class."md:translate-x-0"]="true">
      
      <!-- Logo Section -->
      <div class="p-6 border-b border-slate-200 dark:border-slate-700">
        <a routerLink="/" class="flex items-center space-x-3">
          <div class="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
            <span class="text-slate-900 font-bold text-lg">A</span>
          </div>
          <span class="text-xl font-semibold">Armory Core</span>
        </a>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-2">
        @for (item of navItems; track item.route) {
          @if (!item.adminOnly || isAdmin()) {
            <a 
              [routerLink]="item.route" 
              routerLinkActive="bg-amber-500 bg-opacity-20 text-amber-400 border-r-2 border-amber-500"
              class="flex items-center space-x-3 px-4 py-3 rounded-l-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
              <i [class]="item.icon" class="w-5 h-5 text-center"></i>
              <span>{{ item.label }}</span>
            </a>
          }
        }
      </nav>
    </aside>

    <!-- Mobile backdrop -->
    @if (isOpen()) {
      <div class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
           (click)="toggle()"></div>
    }
  `,
  styles: [`
    .router-link-active {
      background-color: rgba(245, 158, 11, 0.15);
      color: #d97706;
    }
    :host-context(.dark) .router-link-active {
      background-color: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  
  isOpen = signal(false);

  navItems: NavItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/' },
    { label: 'Inventory', icon: '📦', route: '/inventory' },
    { label: 'BOMs', icon: '📋', route: '/boms' },
    { label: 'Portfolio Value', icon: '💰', route: '/reports/portfolio' },
    { label: 'Insurance Report', icon: '🛡️', route: '/reports/insurance' },
    { label: 'Expirations', icon: '⏰', route: '/reports/expiration' },
    { label: 'Import/Export', icon: '🔄', route: '/settings/data' },
    { label: 'Wishlist', icon: '🛒', route: '/wishlist' },
    { label: 'Users', icon: '👥', route: '/admin/users', adminOnly: true },
    { label: 'Categories', icon: '🏷️', route: '/admin/categories', adminOnly: true },
    { label: 'Types', icon: '⚙️', route: '/admin/inventory-types', adminOnly: true },
    { label: 'Audit Log', icon: '🗂️', route: '/admin/audit-log', adminOnly: true }
  ];

  toggle(): void {
    this.isOpen.update(open => !open);
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin';
  }
}