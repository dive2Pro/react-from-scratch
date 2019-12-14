let isBatching = false;

let _batchedUpdateImpl = function(fn, bookkeeping) {
  return fn(bookkeeping);
};

export function batchedUpdates(fn, bookkeeping) {
  if (isBatching) {
    return fn(bookkeeping);
  }

  isBatching = true;
  try {
    return _batchedUpdateImpl(fn, bookkeeping);
  } finally {
    isBatching = false;
  }
}

export function setBatchingImplementation(batchedUpdatesImpl) {
  _batchedUpdateImpl = batchedUpdatesImpl;
}
