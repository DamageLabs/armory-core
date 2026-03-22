import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="max-w-4xl mx-auto py-12 px-4">
      
      <!-- Logo -->
      <div class="mb-8">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 48" width="350" height="60">
          <defs>
            <linearGradient id="iconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color: #2563EB" />
              <stop offset="100%" style="stop-color: #1D4ED8" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width="44" height="44" rx="8" fill="url(#iconGrad)" />
          <circle cx="22" cy="22" r="11" fill="none" stroke="white" stroke-width="1.5" opacity="0.9" />
          <circle cx="22" cy="22" r="3" fill="white" />
          <line x1="22" y1="8" x2="22" y2="14" stroke="white" stroke-width="1.5" stroke-linecap="round" />
          <line x1="22" y1="30" x2="22" y2="36" stroke="white" stroke-width="1.5" stroke-linecap="round" />
          <line x1="8" y1="22" x2="14" y2="22" stroke="white" stroke-width="1.5" stroke-linecap="round" />
          <line x1="30" y1="22" x2="36" y2="22" stroke="white" stroke-width="1.5" stroke-linecap="round" />
          <text x="56" y="30" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="600" class="fill-slate-900 dark:fill-white" letter-spacing="-0.3">Armory</text>
          <text x="136" y="30" font-family="Inter, -apple-system, BlinkMacSystemFont, sans-serif" font-size="22" font-weight="600" fill="#2563EB" letter-spacing="-0.3">Core</text>
        </svg>
      </div>

      <!-- Hero card -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
        <p class="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
          Armory Core is a complete firearm management system built for the demands of modern
          law enforcement, government agencies, private organizations that arm their personnel
          — and individual owners who take their collection seriously.
        </p>
        <p class="text-lg text-slate-700 dark:text-slate-300 leading-relaxed mb-6">
          By combining barcode technology, lean workflows, and intelligent automation, Armory
          Core eliminates the friction between departments — creating a seamless, end-to-end
          process for managing, tracking, and controlling firearms across your entire agency
          or personal collection.
        </p>
        <p class="text-lg text-slate-700 dark:text-slate-300 leading-relaxed">
          More than just software, Armory Core is an accountability engine. From issue to
          return, every transaction is logged, traceable, and audit-ready — helping your
          agency reduce liability and maintain ironclad control at every step. For private
          owners, that same precision means knowing exactly what you have, where it is, and
          what condition it's in — whether you own five firearms or five hundred.
        </p>
      </div>

      <!-- Feature highlights -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div class="text-3xl mb-3">🔒</div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Privacy First</h3>
          <p class="text-slate-600 dark:text-slate-400 text-sm">Self-hosted. No cloud dependency. No telemetry. Your data stays on your hardware.</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div class="text-3xl mb-3">📊</div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Full Visibility</h3>
          <p class="text-slate-600 dark:text-slate-400 text-sm">Track inventory, maintenance, valuations, insurance documentation, and compliance — all in one place.</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6">
          <div class="text-3xl mb-3">⚡</div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Open Source</h3>
          <p class="text-slate-600 dark:text-slate-400 text-sm">Inspect it, contribute to it, or fork it. Your tools shouldn't be a black box.</p>
        </div>
      </div>

      <!-- CTA -->
      <div class="flex flex-wrap gap-4">
        <a routerLink="/inventory"
           class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors">
          View Inventory
        </a>
        <a href="https://github.com/DamageLabs/armory-core"
           target="_blank" rel="noopener noreferrer"
           class="bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-900 dark:text-slate-100 font-semibold px-6 py-3 rounded-lg transition-colors">
          View on GitHub
        </a>
      </div>
    </div>
  `
})
export class WelcomeComponent {}
