import { Injectable } from '@angular/core';
import { environment } from '@project/shared/environments';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

interface CachedEntry<T> {
  value: T;
  expiresAt: number;
  version: string;
}

@Injectable({ providedIn: 'root' })
export class CacheService {
  private readonly _storage = window.sessionStorage;
  private readonly _cacheVersion = environment.version;

  private readonly _cacheSubjects$ = new Map<string, BehaviorSubject<void>>();

  private now(): number {
    return new Date().getTime();
  }

  private isExpired(expiresAt: number): boolean {
    return this.now() > expiresAt;
  }

  private isStaleVersion(version: string): boolean {
    return version !== this._cacheVersion;
  }

  /**
   * Retrieves the item from the cache.
   *
   * @private
   * @template T
   * @param {string} key
   * @returns {(CachedEntry<T> | null)}
   */
  private getItem<T>(key: string): CachedEntry<T> | null {
    const raw = this._storage.getItem(key);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as CachedEntry<T>;
      return parsed?.expiresAt && parsed?.version && parsed?.value !== undefined
        ? parsed
        : null;
    } catch {
      return null;
    }
  }

  /**
   * Sets the item in the cache.
   *
   * @private
   * @template T
   * @param {string} key
   * @param {T} value
   * @param {number} expiresInMinutes
   */
  private setItem<T>(key: string, value: T, expiresInMinutes: number): void {
    const entry: CachedEntry<T> = {
      value,
      expiresAt: this.now() + expiresInMinutes * 60 * 1000,
      version: this._cacheVersion
    };
    this._storage.setItem(key, JSON.stringify(entry));
  }

  /**
   * Removes the item from the cache.
   *
   * @private
   * @param {string} key
   */
  private clear(key: string): void {
    this._storage.removeItem(key);
  }

  /**
   * Observable cache that notifies on change.
   * @param key The cache key.
   * @param fetchFn The fetch/callback function to execute when the cache is empty.
   * @param expiresInMinutes The ttl of the cache. Defaults to 30 minutes.
   */
  watchOrFetch<T>(
    key: string,
    fetchFn: () => Observable<T>,
    expiresInMinutes = 30
  ): Observable<T> {
    if (!this._cacheSubjects$.has(key)) {
      this._cacheSubjects$.set(key, new BehaviorSubject<void>(undefined));
    }
    const trigger$ = this._cacheSubjects$.get(key);
    if (!trigger$) {
      return of(null) as Observable<T>;
    }

    return trigger$.pipe(
      switchMap(() => {
        const cached = this.getItem<T>(key);
        if (
          cached &&
          !this.isExpired(cached.expiresAt) &&
          !this.isStaleVersion(cached.version)
        ) {
          return of(cached.value);
        }

        this.clear(key);
        return fetchFn().pipe(
          tap((value) => this.setItem(key, value, expiresInMinutes))
        );
      })
    );
  }

  /**
   * Forcefully refresh the value (e.g. after a manual update).
   * @param key The cache key.
   */
  refresh(key: string): void {
    this._cacheSubjects$.get(key)?.next();
  }

  /**
   * Invalidate and emit new empty value to the subject.
   * @param key The cache key.
   */
  invalidate(key: string): void {
    this.clear(key);
    this._cacheSubjects$.get(key)?.next();
  }

  /**
   * Invalidate all cached keys.
   */
  invalidateAll(): void {
    const cacheKeys = Array.from(this._cacheSubjects$.keys());
    cacheKeys.forEach((key) => this.invalidate(key));
  }
}
