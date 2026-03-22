import { Component, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../header/header.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderComponent, SidebarComponent],
  template: `
    <div class="min-h-screen bg-slate-100 dark:bg-slate-900">
      
      <!-- Sidebar -->
      <app-sidebar #sidebar></app-sidebar>
      
      <!-- Main content area -->
      <div class="md:ml-64 min-h-screen">
        
        <!-- Header -->
        <app-header (toggleSidebar)="sidebar.toggle()"></app-header>
        
        <!-- Page content -->
        <main class="p-6">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class MainLayoutComponent {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
}