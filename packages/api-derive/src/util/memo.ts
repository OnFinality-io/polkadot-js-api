// Copyright 2017-2020 @polkadot/api-derive authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Observer, TeardownLogic } from 'rxjs';

import createMemo from 'memoizee';
import { Observable } from 'rxjs';

import { drr, normalizer } from '@polkadot/rpc-core/util';

type ObsFn <T> = (...params: any[]) => Observable<T>;

// Wraps a derive, doing 2 things to optimize calls -
//   1. creates a memo of the inner fn -> Observable, removing when unsubscribed
//   2. wraps the observable in a drr() (which includes an unsub delay)
/** @internal */
export function memo <T> (instanceId: string, inner: ObsFn<T>): ObsFn<T> {
  const cached = createMemo(
    (...params: any[]): Observable<T> =>
      new Observable((observer: Observer<T>): TeardownLogic => {
        const subscription = inner(...params).subscribe(observer);

        return (): void => {
          cached.delete(...params);
          subscription.unsubscribe();
        };
      }).pipe(drr()),
    {
      // Normalize via JSON.stringify, allow e.g. AccountId -> ss58
      normalizer: normalizer(instanceId)
    }
  );

  return cached;
}
