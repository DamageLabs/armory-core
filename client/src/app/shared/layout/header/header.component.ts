import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../services/theme.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-white dark:bg-slate-800 shadow-sm border-b border-slate-200 dark:border-slate-700 relative z-30">
      <div class="flex items-center justify-between h-16 px-6">
        
        <!-- Mobile menu button -->
        <button 
          class="md:hidden text-slate-500 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white focus:outline-none"
          (click)="toggleSidebar.emit()">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        <!-- Title -->
        <div class="hidden md:block">
          <h1 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Armory Core</h1>
        </div>

        <!-- Right side -->
        <div class="flex items-center space-x-4">
          
          <!-- Theme toggle -->
          <button
            (click)="toggleTheme()"
            class="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title="Toggle theme">
            <!-- Sun icon (shown in dark mode) -->
            <svg class="w-5 h-5 hidden dark:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>
            </svg>
            <!-- Moon icon (shown in light mode) -->
            <svg class="w-5 h-5 dark:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>
            </svg>
          </button>

          <!-- User info -->
          @if (currentUser$ | async; as user) {
            <div class="flex items-center space-x-3">
              <div class="hidden sm:block text-sm">
                <div class="font-medium text-slate-900 dark:text-slate-100">{{ user.email }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 capitalize">{{ user.role }}</div>
              </div>
              
              <!-- User avatar -->
              <div class="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                <span class="text-slate-900 font-medium text-sm">
                  {{ user.email.charAt(0).toUpperCase() }}
                </span>
              </div>
              
              <!-- Logout button -->
              <button
                (click)="logout()"
                class="text-slate-400 hover:text-slate-900 dark:hover:text-white focus:outline-none transition-colors duration-200"
                title="Logout">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  private authService = inject(AuthService);
  private themeService = inject(ThemeService);
  
  currentUser$ = this.authService.currentUser$;
  toggleSidebar = output<void>();

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  logout(): void {
    this.authService.logout();
  }
}
