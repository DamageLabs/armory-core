import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="bg-slate-800 shadow-sm border-b border-slate-700 relative z-30">
      <div class="flex items-center justify-between h-16 px-6">
        
        <!-- Mobile menu button -->
        <button 
          class="md:hidden text-slate-300 hover:text-white focus:outline-none"
          (click)="toggleSidebar.emit()">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>

        <!-- Title -->
        <div class="hidden md:block">
          <h1 class="text-lg font-semibold text-slate-100">Armory Core</h1>
        </div>

        <!-- User menu -->
        <div class="relative">
          <div class="flex items-center space-x-4">
            
            <!-- User info -->
            @if (currentUser$ | async; as user) {
              <div class="flex items-center space-x-3">
                <div class="hidden sm:block text-sm text-slate-300">
                  <div class="font-medium text-slate-100">{{ user.first_name }} {{ user.last_name }}</div>
                  <div class="text-xs">{{ user.email }}</div>
                </div>
                
                <!-- User avatar -->
                <div class="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <span class="text-slate-900 font-medium text-sm">
                    {{ user.first_name.charAt(0) }}{{ user.last_name.charAt(0) }}
                  </span>
                </div>
                
                <!-- Logout button -->
                <button
                  (click)="logout()"
                  class="text-slate-400 hover:text-white focus:outline-none transition-colors duration-200"
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
      </div>
    </header>
  `
})
export class HeaderComponent {
  private authService = inject(AuthService);
  
  currentUser$ = this.authService.currentUser$;
  toggleSidebar = output<void>();

  logout(): void {
    this.authService.logout();
  }
}