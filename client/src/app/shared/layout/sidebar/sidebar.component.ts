import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
}

interface NavGroup {
  label: string;
  icon: string;
  items: NavItem[];
  adminOnly?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="fixed left-0 top-0 h-screen w-64 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 shadow-xl z-50 transition-transform duration-300 overflow-y-auto"
           [class."-translate-x-full"]="!isOpen()"
           [class."md:translate-x-0"]="true">
      
      <!-- Logo Section -->
      <div class="p-6 border-b border-slate-200 dark:border-slate-700">
        <a routerLink="/" class="flex items-center space-x-3">
          <img src="/logo.svg" alt="Armory Core" class="w-8 h-8" />
          <span class="text-xl font-semibold">Armory Core</span>
        </a>
      </div>

      <!-- Navigation -->
      <nav class="p-4 space-y-1">
        
        <!-- Top-level items -->
        @for (item of topItems; track item.route) {
          <a 
            [routerLink]="item.route" 
            routerLinkActive="active-link"
            [routerLinkActiveOptions]="{ exact: item.route === '/' }"
            class="flex items-center space-x-3 px-4 py-2.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 text-sm">
            <span class="w-5 text-center">{{ item.icon }}</span>
            <span>{{ item.label }}</span>
          </a>
        }

        <!-- Collapsible groups -->
        @for (group of navGroups; track group.label) {
          @if (!group.adminOnly || isAdmin()) {
            <div class="mt-3">
              <!-- Group header -->
              <button 
                (click)="toggleGroup(group.label)"
                class="flex items-center justify-between w-full px-4 py-2.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 text-xs font-semibold uppercase tracking-wider">
                <div class="flex items-center space-x-3">
                  <span class="w-5 text-center text-sm">{{ group.icon }}</span>
                  <span>{{ group.label }}</span>
                </div>
                <svg class="w-4 h-4 transition-transform duration-200" 
                     [class.rotate-180]="isGroupOpen(group.label)"
                     fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
              </button>
              
              <!-- Group items -->
              @if (isGroupOpen(group.label)) {
                <div class="ml-4 mt-1 space-y-0.5 border-l-2 border-slate-200 dark:border-slate-700 pl-3">
                  @for (item of group.items; track item.route) {
                    <a 
                      [routerLink]="item.route" 
                      routerLinkActive="active-link"
                      class="flex items-center space-x-3 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200 text-sm">
                      <span class="w-5 text-center">{{ item.icon }}</span>
                      <span>{{ item.label }}</span>
                    </a>
                  }
                </div>
              }
            </div>
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
    .active-link {
      background-color: rgba(245, 158, 11, 0.15);
      color: #d97706;
      font-weight: 600;
    }
    :host-context(.dark) .active-link {
      background-color: rgba(245, 158, 11, 0.2);
      color: #fbbf24;
    }
  `]
})
export class SidebarComponent {
  private authService = inject(AuthService);
  
  isOpen = signal(false);
  openGroups = signal<Set<string>>(new Set(['Reports']));

  topItems: NavItem[] = [
    { label: 'Home', icon: '🏠', route: '/' },
    { label: 'Dashboard', icon: '📊', route: '/dashboard' },
    { label: 'Inventory', icon: '📦', route: '/inventory' },
    { label: 'BOMs', icon: '📋', route: '/boms' },
    { label: 'Wishlist', icon: '🛒', route: '/wishlist' },
  ];

  navGroups: NavGroup[] = [
    {
      label: 'Reports',
      icon: '📈',
      items: [
        { label: 'Portfolio Value', icon: '💰', route: '/reports/portfolio' },
        { label: 'Insurance', icon: '🛡️', route: '/reports/insurance' },
        { label: 'Expirations', icon: '⏰', route: '/reports/expiration' },
        { label: 'Stock History', icon: '📜', route: '/reports/stock-history' },
      ]
    },
    {
      label: 'Settings',
      icon: '⚙️',
      items: [
        { label: 'Import/Export', icon: '🔄', route: '/settings/data' },
        { label: 'Categories', icon: '🏷️', route: '/admin/categories' },
        { label: 'Types', icon: '🔧', route: '/admin/inventory-types' },
      ],
      adminOnly: true
    },
    {
      label: 'Admin',
      icon: '🔒',
      items: [
        { label: 'Users', icon: '👥', route: '/admin/users' },
        { label: 'Audit Log', icon: '🗂️', route: '/admin/audit-log' },
      ],
      adminOnly: true
    }
  ];

  toggle(): void {
    this.isOpen.update(open => !open);
  }

  toggleGroup(label: string): void {
    this.openGroups.update(groups => {
      const next = new Set(groups);
      if (next.has(label)) {
        next.delete(label);
      } else {
        next.add(label);
      }
      return next;
    });
  }

  isGroupOpen(label: string): boolean {
    return this.openGroups().has(label);
  }

  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'admin';
  }
}
