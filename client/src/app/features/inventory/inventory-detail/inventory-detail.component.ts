import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { ItemService } from '../../../core/services/item.service';
import { NoteService, Note } from '../../../core/services/note.service';
import { MaintenanceService, MaintenanceLog, MaintenanceSummary } from '../../../core/services/maintenance.service';
import { PhotoService, Photo } from '../../../core/services/photo.service';
import { ReceiptService, Receipt } from '../../../core/services/receipt.service';
import { StockHistoryService, StockHistoryEntry } from '../../../core/services/stock-history.service';
import { Item } from '../../../types/item';

@Component({
  selector: 'app-inventory-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto space-y-6">
      
      <!-- Loading state -->
      @if (isLoading()) {
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
          <div class="animate-spin w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p class="text-slate-500 dark:text-slate-400">Loading item details...</p>
        </div>
      }

      <!-- Error state -->
      @if (errorMessage()) {
        <div class="bg-red-500 bg-opacity-20 border border-red-500 border-opacity-50 text-red-200 px-4 py-3 rounded-lg">
          {{ errorMessage() }}
        </div>
      }

      <!-- Item details -->
      @if (item(); as itemData) {
        
        <!-- Page header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center space-x-4">
            <button 
              (click)="goBack()"
              class="text-slate-500 dark:text-slate-400 hover:text-slate-600 dark:text-slate-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <div>
              <div class="flex items-center space-x-3">
                <h1 class="text-3xl font-bold text-slate-900 dark:text-slate-100">{{ itemData.name }}</h1>
                @if (itemData.isLocation) {
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100">
                    📦 Storage Location
                  </span>
                }
              </div>
              @if (itemData.description) {
                <p class="mt-1 text-slate-500 dark:text-slate-400">{{ itemData.description }}</p>
              }
            </div>
          </div>

          <!-- Actions -->
          <div class="flex items-center space-x-3">
            <a [routerLink]="['/inventory', itemData.id, 'edit']"
               class="bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors duration-200">
              Edit
            </a>
            <button
              (click)="deleteItem()"
              class="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors duration-200">
              Delete
            </button>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-slate-200 dark:border-slate-700 mb-6">
          <nav class="flex space-x-8">
            <button (click)="activeTab = 'details'" 
                    [class]="activeTab === 'details' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                    class="py-4 px-1 border-b-2 font-medium text-sm transition-colors">
              Details
            </button>
            <button (click)="activeTab = 'notes'; loadNotes()" 
                    [class]="activeTab === 'notes' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                    class="py-4 px-1 border-b-2 font-medium text-sm transition-colors">
              Notes
              @if (noteCount() > 0) {
                <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {{ noteCount() }}
                </span>
              }
            </button>
            <button (click)="activeTab = 'maintenance'; loadMaintenance()" 
                    [class]="activeTab === 'maintenance' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                    class="py-4 px-1 border-b-2 font-medium text-sm transition-colors">
              Maintenance
            </button>
            <button (click)="activeTab = 'photos'; loadPhotos()" 
                    [class]="activeTab === 'photos' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                    class="py-4 px-1 border-b-2 font-medium text-sm transition-colors">
              Photos
              @if (photos().length > 0) {
                <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {{ photos().length }}
                </span>
              }
            </button>
            <button (click)="activeTab = 'receipts'; loadReceipts()" 
                    [class]="activeTab === 'receipts' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                    class="py-4 px-1 border-b-2 font-medium text-sm transition-colors">
              Receipts
              @if (receipts().length > 0) {
                <span class="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                  {{ receipts().length }}
                </span>
              }
            </button>
            <button (click)="activeTab = 'history'; loadHistory()" 
                    [class]="activeTab === 'history' ? 'border-amber-500 text-amber-500' : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'"
                    class="py-4 px-1 border-b-2 font-medium text-sm transition-colors">
              History
            </button>
          </nav>
        </div>

        <!-- Tab Content -->
        <div class="min-h-96">
          
          <!-- Details Tab -->
          @if (activeTab === 'details') {
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              <!-- Item information -->
              <div class="lg:col-span-2 space-y-6">
                
                <!-- Basic info -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Item Information</h2>
                  
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Name</label>
                      <p class="text-slate-900 dark:text-slate-100 font-medium">{{ itemData.name }}</p>
                    </div>
                    
                    <div>
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Quantity</label>
                      <p class="text-slate-900 dark:text-slate-100 font-medium">{{ itemData.quantity | number }}</p>
                    </div>
                    
                    @if (itemData.unitValue) {
                      <div>
                        <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Cost</label>
                        <p class="text-slate-900 dark:text-slate-100 font-medium">{{ formatCurrency(itemData.unitValue) }}</p>
                      </div>
                      
                      <div>
                        <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Total Value</label>
                        <p class="text-slate-900 dark:text-slate-100 font-medium">{{ formatCurrency(itemData.unitValue * itemData.quantity) }}</p>
                      </div>
                    }
                    
                    @if (itemData.location) {
                      <div>
                        <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Location</label>
                        <p class="text-slate-900 dark:text-slate-100 font-medium">{{ itemData.location }}</p>
                      </div>
                    }

                    @if (itemData.expirationDate) {
                      <div>
                        <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Expiration</label>
                        <div class="flex items-center space-x-2">
                          <span [class]="getExpirationStatusClass(itemData)">{{ getExpirationStatusIcon(itemData) }}</span>
                          <span class="text-slate-900 dark:text-slate-100 font-medium">{{ formatDate(itemData.expirationDate) }}</span>
                        </div>
                        @if (itemData.expirationNotes) {
                          <p class="mt-1 text-sm text-slate-500 dark:text-slate-400">{{ itemData.expirationNotes }}</p>
                        }
                      </div>
                    }
                  </div>
                  
                  @if (itemData.description) {
                    <div class="mt-6">
                      <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Description</label>
                      <p class="text-slate-900 dark:text-slate-100">{{ itemData.description }}</p>
                    </div>
                  }
                </div>

                <!-- Custom fields -->
                @if (hasCustomFields(itemData.customFields)) {
                  <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Additional Information</h2>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                      @for (field of getCustomFieldEntries(itemData.customFields); track field.key) {
                        <div>
                          <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{{ field.key }}</label>
                          <p class="text-slate-900 dark:text-slate-100">{{ field.value || '-' }}</p>
                        </div>
                      }
                    </div>
                  </div>
                }

                <!-- Attached accessories/children -->
                @if (children().length > 0) {
                  <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between mb-4">
                      <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Attached Accessories ({{ children().length }})
                      </h2>
                      <div class="text-sm text-slate-500 dark:text-slate-400">
                        Total Value: {{ formatCurrency(children().reduce((sum, child) => sum + (child.unitValue * child.quantity), 0)) }}
                      </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                      <table class="w-full">
                        <thead class="border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th class="text-left py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                            <th class="text-left py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                            <th class="text-right py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity</th>
                            <th class="text-right py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value</th>
                            <th class="text-right py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                          @for (child of children(); track child.id) {
                            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td class="py-3 px-3">
                                <a [routerLink]="['/inventory', child.id]" class="text-amber-400 hover:text-amber-300 font-medium">
                                  {{ child.name }}
                                </a>
                              </td>
                              <td class="py-3 px-3 text-slate-600 dark:text-slate-300">{{ child.category || '-' }}</td>
                              <td class="py-3 px-3 text-right text-slate-600 dark:text-slate-300">{{ child.quantity | number }}</td>
                              <td class="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                                {{ child.unitValue ? formatCurrency(child.unitValue * child.quantity) : '-' }}
                              </td>
                              <td class="py-3 px-3 text-right">
                                <a [routerLink]="['/inventory', child.id, 'edit']" 
                                   class="text-amber-400 hover:text-amber-300 text-sm font-medium">
                                  Edit
                                </a>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }

                <!-- Items stored here (when this item is a location) -->
                @if (itemData.isLocation && storedItems().length > 0) {
                  <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-between mb-4">
                      <h2 class="text-lg font-semibold text-slate-900 dark:text-slate-100">
                        Items Stored Here ({{ storedItems().length }})
                      </h2>
                      <div class="text-sm text-slate-500 dark:text-slate-400">
                        Total Value: {{ formatCurrency(storedItems().reduce((sum, item) => sum + (item.unitValue * item.quantity), 0)) }}
                      </div>
                    </div>
                    
                    <div class="overflow-x-auto">
                      <table class="w-full">
                        <thead class="border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th class="text-left py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Name</th>
                            <th class="text-left py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Category</th>
                            <th class="text-right py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Quantity</th>
                            <th class="text-right py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Value</th>
                            <th class="text-right py-2 px-3 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                          @for (storedItem of storedItems(); track storedItem.id) {
                            <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                              <td class="py-3 px-3">
                                <a [routerLink]="['/inventory', storedItem.id]" class="text-amber-400 hover:text-amber-300 font-medium">
                                  {{ storedItem.name }}
                                </a>
                              </td>
                              <td class="py-3 px-3 text-slate-600 dark:text-slate-300">{{ storedItem.category || '-' }}</td>
                              <td class="py-3 px-3 text-right text-slate-600 dark:text-slate-300">{{ storedItem.quantity | number }}</td>
                              <td class="py-3 px-3 text-right text-slate-600 dark:text-slate-300">
                                {{ storedItem.unitValue ? formatCurrency(storedItem.unitValue * storedItem.quantity) : '-' }}
                              </td>
                              <td class="py-3 px-3 text-right">
                                <a [routerLink]="['/inventory', storedItem.id, 'edit']" 
                                   class="text-amber-400 hover:text-amber-300 text-sm font-medium">
                                  Edit
                                </a>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                }
              </div>

              <!-- Sidebar -->
              <div class="space-y-6">
                
                <!-- Quick stats -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Quick Stats</h3>
                  
                  <div class="space-y-4">
                    <div class="flex justify-between">
                      <span class="text-slate-500 dark:text-slate-400">Created</span>
                      <span class="text-slate-900 dark:text-slate-100">{{ formatDate(itemData.createdAt) }}</span>
                    </div>
                    
                    <div class="flex justify-between">
                      <span class="text-slate-500 dark:text-slate-400">Updated</span>
                      <span class="text-slate-900 dark:text-slate-100">{{ formatDate(itemData.updatedAt) }}</span>
                    </div>
                    
                    @if (itemData.unitValue && itemData.quantity) {
                      <div class="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2">
                        <div class="flex justify-between">
                          <span class="text-slate-500 dark:text-slate-400">Unit Value</span>
                          <span class="text-slate-900 dark:text-slate-100">{{ formatCurrency(itemData.unitValue) }}</span>
                        </div>
                        <div class="flex justify-between">
                          <span class="text-slate-500 dark:text-slate-400">Item Value</span>
                          <span class="text-slate-900 dark:text-slate-100">{{ formatCurrency(itemData.unitValue * itemData.quantity) }}</span>
                        </div>
                        @if (children().length > 0) {
                          <div class="flex justify-between">
                            <span class="text-slate-500 dark:text-slate-400">Accessories Value</span>
                            <span class="text-slate-900 dark:text-slate-100">{{ formatCurrency(children().reduce((sum, child) => sum + (child.unitValue * child.quantity), 0)) }}</span>
                          </div>
                          <div class="flex justify-between font-medium border-t border-slate-200 dark:border-slate-700 pt-2">
                            <span class="text-slate-600 dark:text-slate-300">Total Value</span>
                            <span class="text-amber-400">{{ formatCurrency(getTotalValueWithChildren()) }}</span>
                          </div>
                        } @else {
                          <div class="flex justify-between font-medium border-t border-slate-200 dark:border-slate-700 pt-2">
                            <span class="text-slate-600 dark:text-slate-300">Total Value</span>
                            <span class="text-amber-400">{{ formatCurrency(itemData.unitValue * itemData.quantity) }}</span>
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>

                <!-- Actions -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
                  <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Actions</h3>
                  
                  <div class="space-y-3">
                    <a [routerLink]="['/inventory', itemData.id, 'edit']"
                       class="block w-full text-center bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold px-4 py-3 rounded-lg transition-colors duration-200">
                      Edit Item
                    </a>
                    
                    <button
                      (click)="duplicateItem()"
                      class="block w-full text-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-3 rounded-lg transition-colors duration-200">
                      Duplicate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }

          <!-- Notes Tab -->
          @if (activeTab === 'notes') {
            <div class="space-y-6">
              
              <!-- Add Note Form -->
              <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Add Note</h3>
                <div class="space-y-4">
                  <textarea
                    [(ngModel)]="newNoteContent"
                    placeholder="Enter your note..."
                    class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    rows="3">
                  </textarea>
                  <button
                    (click)="createNote()"
                    [disabled]="!newNoteContent.trim() || isSubmitting()"
                    class="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors duration-200">
                    {{ isSubmitting() ? 'Adding...' : 'Add Note' }}
                  </button>
                </div>
              </div>

              <!-- Notes List -->
              @if (notes().length > 0) {
                <div class="space-y-4">
                  @for (note of notes(); track note.id) {
                    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                      <div class="flex justify-between items-start mb-3">
                        <div>
                          <div class="text-sm text-slate-500 dark:text-slate-400">
                            {{ note.authorEmail }} • {{ formatDate(note.createdAt) }}
                          </div>
                        </div>
                        <button
                          (click)="deleteNote(note.id)"
                          class="text-red-500 hover:text-red-600 text-sm font-medium">
                          Delete
                        </button>
                      </div>
                      <p class="text-slate-900 dark:text-slate-100 whitespace-pre-wrap">{{ note.content }}</p>
                    </div>
                  }
                </div>
              } @else {
                <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                  <p class="text-slate-500 dark:text-slate-400">No notes yet. Add the first one above.</p>
                </div>
              }
            </div>
          }

          <!-- Maintenance Tab -->
          @if (activeTab === 'maintenance') {
            <div class="space-y-6">

              <!-- Maintenance Summary -->
              @if (maintenanceSummary(); as summary) {
                <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                  <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Maintenance Summary</h3>
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div class="text-center">
                      <div class="text-2xl font-bold text-amber-500">{{ summary.totalRounds | number }}</div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">Total Rounds</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-bold text-green-500">{{ formatCurrency(summary.totalCost) }}</div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">Total Cost</div>
                    </div>
                    <div class="text-center">
                      <div class="text-2xl font-bold text-blue-500">
                        {{ summary.lastServiceDate ? formatDate(summary.lastServiceDate) : 'Never' }}
                      </div>
                      <div class="text-sm text-slate-500 dark:text-slate-400">Last Service</div>
                    </div>
                  </div>
                </div>
              }

              <!-- Add Maintenance Form -->
              <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  (click)="showMaintenanceForm = !showMaintenanceForm"
                  class="w-full px-6 py-4 text-left flex justify-between items-center">
                  <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Add Maintenance Log</h3>
                  <svg class="w-5 h-5 transform transition-transform" [class.rotate-180]="showMaintenanceForm" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </button>
                
                @if (showMaintenanceForm) {
                  <div class="px-6 pb-6 border-t border-slate-200 dark:border-slate-700">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <div>
                        <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Service Type</label>
                        <select
                          [(ngModel)]="newMaintenanceLog.serviceType"
                          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                          <option value="">Select type</option>
                          <option value="Cleaning">Cleaning</option>
                          <option value="Inspection">Inspection</option>
                          <option value="Repair">Repair</option>
                          <option value="Modification">Modification</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Date</label>
                        <input
                          type="date"
                          [(ngModel)]="newMaintenanceLog.performedAt"
                          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Rounds Fired</label>
                        <input
                          type="number"
                          [(ngModel)]="newMaintenanceLog.roundsFired"
                          placeholder="0"
                          min="0"
                          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                      </div>
                      <div>
                        <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Cost</label>
                        <input
                          type="number"
                          [(ngModel)]="newMaintenanceLog.cost"
                          placeholder="0.00"
                          step="0.01"
                          min="0"
                          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                      </div>
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Service Provider</label>
                        <input
                          type="text"
                          [(ngModel)]="newMaintenanceLog.serviceProvider"
                          placeholder="Who performed the service?"
                          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                      </div>
                      <div class="md:col-span-2">
                        <label class="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Description</label>
                        <textarea
                          [(ngModel)]="newMaintenanceLog.description"
                          placeholder="Describe the maintenance performed..."
                          rows="3"
                          class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                        </textarea>
                      </div>
                    </div>
                    <div class="flex justify-end space-x-3 pt-4">
                      <button
                        (click)="showMaintenanceForm = false; resetMaintenanceForm()"
                        class="px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200">
                        Cancel
                      </button>
                      <button
                        (click)="createMaintenanceLog()"
                        [disabled]="!isMaintenanceFormValid() || isSubmitting()"
                        class="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 text-slate-900 font-semibold px-4 py-2 rounded-lg">
                        {{ isSubmitting() ? 'Adding...' : 'Add Log' }}
                      </button>
                    </div>
                  </div>
                }
              </div>

              <!-- Maintenance Logs -->
              @if (maintenanceLogs().length > 0) {
                <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead class="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                        <tr>
                          <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                          <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type</th>
                          <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</th>
                          <th class="text-right py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Rounds</th>
                          <th class="text-right py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Cost</th>
                          <th class="text-right py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                        @for (log of maintenanceLogs(); track log.id) {
                          <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td class="py-3 px-4 text-slate-900 dark:text-slate-100">
                              {{ formatDate(log.performedAt) }}
                            </td>
                            <td class="py-3 px-4">
                              <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                                {{ log.serviceType }}
                              </span>
                            </td>
                            <td class="py-3 px-4 text-slate-900 dark:text-slate-100 max-w-xs truncate">
                              {{ log.description }}
                            </td>
                            <td class="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                              {{ log.roundsFired || '-' }}
                            </td>
                            <td class="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                              {{ log.cost ? formatCurrency(log.cost) : '-' }}
                            </td>
                            <td class="py-3 px-4 text-right">
                              <button
                                (click)="deleteMaintenanceLog(log.id)"
                                class="text-red-500 hover:text-red-600 text-sm font-medium">
                                Delete
                              </button>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>
              } @else {
                <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                  <p class="text-slate-500 dark:text-slate-400">No maintenance logs yet. Add the first one above.</p>
                </div>
              }
            </div>
          }

          <!-- Photos Tab -->
          @if (activeTab === 'photos') {
            <div class="space-y-6">
              
              <!-- Upload Section -->
              <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Upload Photo</h3>
                <div class="flex items-center space-x-4">
                  <input
                    #photoInput
                    type="file"
                    accept="image/*"
                    (change)="onPhotoSelected($event)"
                    class="hidden">
                  <button
                    (click)="photoInput.click()"
                    [disabled]="isSubmitting()"
                    class="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors duration-200">
                    {{ isSubmitting() ? 'Uploading...' : 'Choose Photo' }}
                  </button>
                  @if (selectedPhoto) {
                    <span class="text-slate-600 dark:text-slate-300">{{ selectedPhoto.name }}</span>
                    <button
                      (click)="uploadPhoto()"
                      [disabled]="isSubmitting()"
                      class="bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white font-semibold px-4 py-2 rounded-lg">
                      Upload
                    </button>
                  }
                </div>
              </div>

              <!-- Photos Grid -->
              @if (photos().length > 0) {
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  @for (photo of photos(); track photo.id) {
                    <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div class="aspect-square relative">
                        <img 
                          [src]="photoService.getPhotoDownloadUrl(photo.id)"
                          [alt]="photo.originalName"
                          class="w-full h-full object-cover">
                        @if (photo.isPrimary) {
                          <div class="absolute top-2 left-2 bg-amber-500 text-slate-900 px-2 py-1 rounded-md text-xs font-semibold">
                            Primary
                          </div>
                        }
                      </div>
                      <div class="p-3">
                        <p class="text-sm text-slate-600 dark:text-slate-300 truncate mb-2">{{ photo.originalName }}</p>
                        <div class="flex justify-between items-center">
                          @if (!photo.isPrimary) {
                            <button
                              (click)="setPrimaryPhoto(photo.id)"
                              class="text-xs text-amber-500 hover:text-amber-600 font-medium">
                              Set Primary
                            </button>
                          } @else {
                            <span class="text-xs text-slate-400">Primary</span>
                          }
                          <button
                            (click)="deletePhoto(photo.id)"
                            class="text-xs text-red-500 hover:text-red-600 font-medium">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                  <p class="text-slate-500 dark:text-slate-400">No photos yet. Upload the first one above.</p>
                </div>
              }
            </div>
          }

          <!-- Receipts Tab -->
          @if (activeTab === 'receipts') {
            <div class="space-y-6">
              
              <!-- Upload Section -->
              <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
                <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Upload Receipt</h3>
                <div class="flex items-center space-x-4">
                  <input
                    #receiptInput
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.gif"
                    (change)="onReceiptSelected($event)"
                    class="hidden">
                  <button
                    (click)="receiptInput.click()"
                    [disabled]="isSubmitting()"
                    class="bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 text-slate-900 font-semibold px-4 py-2 rounded-lg transition-colors duration-200">
                    {{ isSubmitting() ? 'Uploading...' : 'Choose File' }}
                  </button>
                  @if (selectedReceipt) {
                    <span class="text-slate-600 dark:text-slate-300">{{ selectedReceipt.name }}</span>
                    <button
                      (click)="uploadReceipt()"
                      [disabled]="isSubmitting()"
                      class="bg-green-500 hover:bg-green-600 disabled:bg-slate-400 text-white font-semibold px-4 py-2 rounded-lg">
                      Upload
                    </button>
                  }
                </div>
              </div>

              <!-- Receipts List -->
              @if (receipts().length > 0) {
                <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div class="divide-y divide-slate-200 dark:divide-slate-700">
                    @for (receipt of receipts(); track receipt.id) {
                      <div class="p-4">
                        <div class="flex items-center justify-between mb-2">
                          <div class="flex-1">
                            <h4 class="text-slate-900 dark:text-slate-100 font-medium">{{ receipt.originalName }}</h4>
                            <div class="text-sm text-slate-500 dark:text-slate-400 flex items-center space-x-4">
                              <span>{{ formatFileSize(receipt.sizeBytes) }}</span>
                              <span>{{ formatDate(receipt.createdAt) }}</span>
                            </div>
                          </div>
                          <div class="flex items-center space-x-3">
                            <a
                              [href]="receiptService.getReceiptDownloadUrl(receipt.id)"
                              download
                              class="text-amber-500 hover:text-amber-600 text-sm font-medium">
                              Download
                            </a>
                            <button
                              (click)="deleteReceipt(receipt.id)"
                              class="text-red-500 hover:text-red-600 text-sm font-medium">
                              Delete
                            </button>
                          </div>
                        </div>
                        @if (receipt.mimeType?.startsWith('image/') && receiptImageUrls()[receipt.id]) {
                          <div class="mt-2">
                            <img 
                              [src]="receiptImageUrls()[receipt.id]" 
                              [alt]="receipt.originalName"
                              (click)="openLightbox(receiptImageUrls()[receipt.id], receipt.originalName)"
                              class="max-w-xs max-h-64 rounded-lg border border-slate-200 dark:border-slate-700 object-contain cursor-pointer hover:opacity-90 transition-opacity" />
                          </div>
                        }
                      </div>
                    }
                  </div>
                </div>
              } @else {
                <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                  <p class="text-slate-500 dark:text-slate-400">No receipts yet. Upload the first one above.</p>
                </div>
              }
            </div>
          }

          <!-- History Tab -->
          @if (activeTab === 'history') {
            @if (stockHistory().length > 0) {
              <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                <div class="px-6 py-4 border-b border-slate-200 dark:border-slate-700">
                  <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100">Stock History</h3>
                </div>
                <div class="overflow-x-auto">
                  <table class="w-full">
                    <thead class="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                      <tr>
                        <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date</th>
                        <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Change</th>
                        <th class="text-right py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">From</th>
                        <th class="text-right py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">To</th>
                        <th class="text-left py-3 px-4 text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Reason</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-200 dark:divide-slate-700">
                      @for (entry of stockHistory(); track entry.id) {
                        <tr class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td class="py-3 px-4 text-slate-900 dark:text-slate-100">
                            {{ formatDate(entry.timestamp) }}
                          </td>
                          <td class="py-3 px-4">
                            <span [class]="getChangeTypeClass(entry)" 
                                  class="inline-flex px-2 py-1 text-xs font-semibold rounded-full">
                              {{ entry.changeType }}
                            </span>
                          </td>
                          <td class="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                            {{ entry.previousQuantity }}
                          </td>
                          <td class="py-3 px-4 text-right text-slate-600 dark:text-slate-300">
                            {{ entry.newQuantity }}
                          </td>
                          <td class="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {{ entry.notes || '-' }}
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            } @else {
              <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-12 text-center">
                <p class="text-slate-500 dark:text-slate-400">No stock history available.</p>
              </div>
            }
          }
        </div>
      }
    </div>

    <!-- Lightbox overlay -->
    @if (lightboxUrl()) {
      <div 
        class="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
        (click)="closeLightbox()">
        <div class="relative max-w-4xl max-h-[90vh]" (click)="$event.stopPropagation()">
          <button 
            (click)="closeLightbox()"
            class="absolute -top-10 right-0 text-white hover:text-slate-300 text-2xl font-bold">
            ✕
          </button>
          <img 
            [src]="lightboxUrl()" 
            [alt]="lightboxAlt()"
            class="max-w-full max-h-[85vh] rounded-lg object-contain" />
          <p class="text-center text-white/70 text-sm mt-2">{{ lightboxAlt() }}</p>
        </div>
      </div>
    }
  `
})
export class InventoryDetailComponent implements OnInit {
  private itemService = inject(ItemService);
  private noteService = inject(NoteService);
  private maintenanceService = inject(MaintenanceService);
  public photoService = inject(PhotoService);
  public receiptService = inject(ReceiptService);
  private stockHistoryService = inject(StockHistoryService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Expose services to template (duplicate removed)

  item = signal<Item | null>(null);
  children = signal<Item[]>([]);
  storedItems = signal<Item[]>([]);
  isLoading = signal(false);
  errorMessage = signal('');
  isSubmitting = signal(false);

  // Tab state
  activeTab = 'details' as 'details' | 'notes' | 'maintenance' | 'photos' | 'receipts' | 'history';

  // Notes
  notes = signal<Note[]>([]);
  noteCount = signal(0);
  newNoteContent = '';

  // Maintenance
  maintenanceLogs = signal<MaintenanceLog[]>([]);
  maintenanceSummary = signal<MaintenanceSummary | null>(null);
  showMaintenanceForm = false;
  newMaintenanceLog = {
    serviceType: '' as MaintenanceLog['serviceType'],
    description: '',
    roundsFired: null as number | null,
    serviceProvider: '',
    cost: null as number | null,
    performedAt: new Date().toISOString().split('T')[0]
  };

  // Photos
  photos = signal<Photo[]>([]);
  selectedPhoto: File | null = null;

  // Receipts
  receipts = signal<Receipt[]>([]);
  receiptImageUrls = signal<Record<number, string>>({});
  lightboxUrl = signal<string>('');
  lightboxAlt = signal<string>('');
  selectedReceipt: File | null = null;

  // History
  stockHistory = signal<StockHistoryEntry[]>([]);

  ngOnInit(): void {
    const itemId = this.route.snapshot.paramMap.get('id');
    if (itemId) {
      this.loadItem(itemId);
    }
  }

  private loadItem(id: string): void {
    this.isLoading.set(true);
    this.itemService.getItem(Number(id)).subscribe({
      next: (item) => {
        this.item.set(item);
        this.loadChildren(item.id);
        this.loadNoteCount(item.id);
        // If this item is a location, load items stored here
        if (item.isLocation) {
          this.loadStoredItems(item.name);
        }
        this.isLoading.set(false);
      },
      error: (error) => {
        this.errorMessage.set('Failed to load item details. Please try again.');
        this.isLoading.set(false);
        console.error('Failed to load item:', error);
      }
    });
  }

  private loadChildren(itemId: number): void {
    this.itemService.getChildren(itemId).subscribe({
      next: (children) => {
        this.children.set(children);
      },
      error: (error) => {
        console.error('Failed to load child items:', error);
      }
    });
  }

  private loadNoteCount(itemId: number): void {
    this.noteService.getNoteCount(itemId).subscribe({
      next: (response) => {
        this.noteCount.set(response.count);
      },
      error: (error) => {
        console.error('Failed to load note count:', error);
      }
    });
  }

  private loadStoredItems(locationName: string): void {
    // Get all items that have this item's name as their location
    this.itemService.getItems({ location: locationName, pageSize: 1000 }).subscribe({
      next: (response) => {
        // Filter out the current item to avoid self-reference
        const filtered = response.data.filter(item => item.id !== this.item()?.id);
        this.storedItems.set(filtered);
      },
      error: (error) => {
        console.error('Failed to load stored items:', error);
        this.storedItems.set([]);
      }
    });
  }

  loadNotes(): void {
    const item = this.item();
    if (!item || this.notes().length > 0) return;

    this.noteService.getItemNotes(item.id).subscribe({
      next: (notes) => {
        this.notes.set(notes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      },
      error: (error) => {
        console.error('Failed to load notes:', error);
      }
    });
  }

  loadMaintenance(): void {
    const item = this.item();
    if (!item) return;

    if (this.maintenanceLogs().length === 0) {
      this.maintenanceService.getMaintenanceLogs(item.id).subscribe({
        next: (logs) => {
          this.maintenanceLogs.set(logs.sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()));
        },
        error: (error) => {
          console.error('Failed to load maintenance logs:', error);
        }
      });
    }

    if (!this.maintenanceSummary()) {
      this.maintenanceService.getMaintenanceSummary(item.id).subscribe({
        next: (summary) => {
          this.maintenanceSummary.set(summary);
        },
        error: (error) => {
          console.error('Failed to load maintenance summary:', error);
        }
      });
    }
  }

  loadPhotos(): void {
    const item = this.item();
    if (!item || this.photos().length > 0) return;

    this.photoService.getItemPhotos(item.id).subscribe({
      next: (photos) => {
        this.photos.set(photos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      },
      error: (error) => {
        console.error('Failed to load photos:', error);
      }
    });
  }

  loadReceipts(): void {
    const item = this.item();
    if (!item || this.receipts().length > 0) return;

    this.receiptService.getItemReceipts(item.id).subscribe({
      next: (receipts) => {
        this.receipts.set(receipts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        // Load image blob URLs for image receipts
        receipts.filter(r => r.mimeType?.startsWith('image/')).forEach(r => {
          this.receiptService.getReceiptBlob(r.id).subscribe({
            next: (blob) => {
              const url = URL.createObjectURL(blob);
              this.receiptImageUrls.set({ ...this.receiptImageUrls(), [r.id]: url });
            }
          });
        });
      },
      error: (error) => {
        console.error('Failed to load receipts:', error);
      }
    });
  }

  loadHistory(): void {
    const item = this.item();
    if (!item || this.stockHistory().length > 0) return;

    this.stockHistoryService.getItemHistory(item.id).subscribe({
      next: (history) => {
        this.stockHistory.set(history);
      },
      error: (error) => {
        console.error('Failed to load stock history:', error);
      }
    });
  }

  // Notes methods
  createNote(): void {
    const item = this.item();
    if (!item || !this.newNoteContent.trim()) return;

    this.isSubmitting.set(true);
    this.noteService.createNote(item.id, this.newNoteContent.trim()).subscribe({
      next: (note) => {
        this.notes.set([note, ...this.notes()]);
        this.noteCount.set(this.noteCount() + 1);
        this.newNoteContent = '';
        this.isSubmitting.set(false);
      },
      error: (error) => {
        console.error('Failed to create note:', error);
        this.isSubmitting.set(false);
      }
    });
  }

  deleteNote(noteId: number): void {
    if (!confirm('Are you sure you want to delete this note?')) return;

    this.noteService.deleteNote(noteId).subscribe({
      next: () => {
        this.notes.set(this.notes().filter(n => n.id !== noteId));
        this.noteCount.set(this.noteCount() - 1);
      },
      error: (error) => {
        console.error('Failed to delete note:', error);
      }
    });
  }

  // Maintenance methods
  createMaintenanceLog(): void {
    const item = this.item();
    if (!item || !this.isMaintenanceFormValid()) return;

    this.isSubmitting.set(true);
    this.maintenanceService.createMaintenanceLog(item.id, this.newMaintenanceLog).subscribe({
      next: (log) => {
        this.maintenanceLogs.set([log, ...this.maintenanceLogs()]);
        this.resetMaintenanceForm();
        this.showMaintenanceForm = false;
        this.isSubmitting.set(false);
        // Reload summary
        this.maintenanceService.getMaintenanceSummary(item.id).subscribe({
          next: (summary) => this.maintenanceSummary.set(summary),
          error: (error) => console.error('Failed to reload summary:', error)
        });
      },
      error: (error) => {
        console.error('Failed to create maintenance log:', error);
        this.isSubmitting.set(false);
      }
    });
  }

  deleteMaintenanceLog(logId: number): void {
    if (!confirm('Are you sure you want to delete this maintenance log?')) return;

    this.maintenanceService.deleteMaintenanceLog(logId).subscribe({
      next: () => {
        this.maintenanceLogs.set(this.maintenanceLogs().filter(l => l.id !== logId));
        // Reload summary
        const item = this.item();
        if (item) {
          this.maintenanceService.getMaintenanceSummary(item.id).subscribe({
            next: (summary) => this.maintenanceSummary.set(summary),
            error: (error) => console.error('Failed to reload summary:', error)
          });
        }
      },
      error: (error) => {
        console.error('Failed to delete maintenance log:', error);
      }
    });
  }

  isMaintenanceFormValid(): boolean {
    return !!(this.newMaintenanceLog.serviceType && 
              this.newMaintenanceLog.description && 
              this.newMaintenanceLog.performedAt);
  }

  resetMaintenanceForm(): void {
    this.newMaintenanceLog = {
      serviceType: '' as MaintenanceLog['serviceType'],
      description: '',
      roundsFired: null,
      serviceProvider: '',
      cost: null,
      performedAt: new Date().toISOString().split('T')[0]
    };
  }

  // Photo methods
  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedPhoto = input.files[0];
    }
  }

  uploadPhoto(): void {
    const item = this.item();
    if (!item || !this.selectedPhoto) return;

    this.isSubmitting.set(true);
    this.photoService.uploadPhoto(item.id, this.selectedPhoto).subscribe({
      next: (photo) => {
        this.photos.set([photo, ...this.photos()]);
        this.selectedPhoto = null;
        this.isSubmitting.set(false);
        // Reset file input
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (input) input.value = '';
      },
      error: (error) => {
        console.error('Failed to upload photo:', error);
        this.isSubmitting.set(false);
      }
    });
  }

  setPrimaryPhoto(photoId: number): void {
    this.photoService.setPrimaryPhoto(photoId).subscribe({
      next: (updatedPhoto) => {
        // Update all photos to reflect new primary
        this.photos.set(this.photos().map(p => ({
          ...p,
          isPrimary: p.id === photoId
        })));
      },
      error: (error) => {
        console.error('Failed to set primary photo:', error);
      }
    });
  }

  deletePhoto(photoId: number): void {
    if (!confirm('Are you sure you want to delete this photo?')) return;

    this.photoService.deletePhoto(photoId).subscribe({
      next: () => {
        this.photos.set(this.photos().filter(p => p.id !== photoId));
      },
      error: (error) => {
        console.error('Failed to delete photo:', error);
      }
    });
  }

  // Receipt methods
  onReceiptSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedReceipt = input.files[0];
    }
  }

  uploadReceipt(): void {
    const item = this.item();
    if (!item || !this.selectedReceipt) return;

    this.isSubmitting.set(true);
    this.receiptService.uploadReceipt(item.id, this.selectedReceipt).subscribe({
      next: (receipt) => {
        this.receipts.set([receipt, ...this.receipts()]);
        this.selectedReceipt = null;
        this.isSubmitting.set(false);
        // Reset file input
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        if (input) input.value = '';
      },
      error: (error) => {
        console.error('Failed to upload receipt:', error);
        this.isSubmitting.set(false);
      }
    });
  }

  deleteReceipt(receiptId: number): void {
    if (!confirm('Are you sure you want to delete this receipt?')) return;

    this.receiptService.deleteReceipt(receiptId).subscribe({
      next: () => {
        this.receipts.set(this.receipts().filter(r => r.id !== receiptId));
      },
      error: (error) => {
        console.error('Failed to delete receipt:', error);
      }
    });
  }

  // Utility methods
  deleteItem(): void {
    const itemData = this.item();
    if (!itemData) return;

    if (confirm(`Are you sure you want to delete "${itemData.name}"? This action cannot be undone.`)) {
      this.itemService.deleteItem(itemData.id).subscribe({
        next: () => {
          this.router.navigate(['/inventory']);
        },
        error: (error) => {
          this.errorMessage.set('Failed to delete item. Please try again.');
          console.error('Failed to delete item:', error);
        }
      });
    }
  }

  duplicateItem(): void {
    const itemData = this.item();
    if (!itemData) return;

    const duplicateData: any = {
      name: `${itemData.name} (Copy)`,
      description: itemData.description || '',
      quantity: itemData.quantity || 1,
      unitValue: itemData.unitValue || 0,
      category: itemData.category || '',
      location: itemData.location || '',
      inventoryTypeId: itemData.inventoryTypeId || 1,
      customFields: itemData.customFields || {},
      parentItemId: itemData.parentItemId || null,
      expirationDate: itemData.expirationDate || null,
      expirationNotes: itemData.expirationNotes || '',
    };

    this.itemService.createItem(duplicateData).subscribe({
      next: (newItem) => {
        this.router.navigate(['/inventory', newItem.id]);
      },
      error: (error) => {
        this.errorMessage.set('Failed to duplicate item. Please try again.');
        console.error('Failed to duplicate item:', error);
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/inventory']);
  }

  hasCustomFields(customFields: Record<string, any>): boolean {
    if (!customFields) return false;
    return Object.entries(customFields).some(([_, value]) => value !== null && value !== undefined && value !== '' && value !== '-');
  }

  getCustomFieldEntries(customFields: Record<string, any>): { key: string; value: any }[] {
    return Object.entries(customFields || {})
      .filter(([_, value]) => value !== null && value !== undefined && value !== '' && value !== '-')
      .map(([key, value]) => ({ key, value }));
  }

  getChangeTypeClass(entry: any): string {
    switch (entry.changeType) {
      case 'created':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
      case 'deleted':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
      case 'quantity_change':
        const quantityChange = (entry.newQuantity || 0) - (entry.previousQuantity || 0);
        if (quantityChange > 0) {
          return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200';
        } else if (quantityChange < 0) {
          return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200';
        }
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
      case 'value_change':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200';
      case 'category_change':
        return 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200';
      default:
        return 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200';
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  }

  formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getTotalValueWithChildren(): number {
    const item = this.item();
    if (!item) return 0;
    
    const itemValue = item.unitValue * item.quantity;
    const childrenValue = this.children().reduce((sum, child) => 
      sum + (child.unitValue * child.quantity), 0
    );
    
    return itemValue + childrenValue;
  }

  getExpirationStatus(item: Item): 'expired' | 'warning' | 'good' | null {
    if (!item.expirationDate) return null;
    
    const expirationDate = new Date(item.expirationDate);
    const today = new Date();
    const diffDays = Math.ceil((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return 'expired';
    } else if (diffDays <= 30) {
      return 'warning';
    } else {
      return 'good';
    }
  }

  getExpirationStatusIcon(item: Item): string {
    const status = this.getExpirationStatus(item);
    switch (status) {
      case 'expired':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'good':
        return '🟢';
      default:
        return '';
    }
  }

  getExpirationStatusClass(item: Item): string {
    const status = this.getExpirationStatus(item);
    switch (status) {
      case 'expired':
        return 'text-red-500';
      case 'warning':
        return 'text-yellow-500';
      case 'good':
        return 'text-green-500';
      default:
        return '';
    }
  }

  openLightbox(url: string, alt: string): void {
    this.lightboxUrl.set(url);
    this.lightboxAlt.set(alt);
  }

  closeLightbox(): void {
    this.lightboxUrl.set('');
    this.lightboxAlt.set('');
  }
}