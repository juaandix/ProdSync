// DiceBear solo se publica como ESM; en Jest basta con un avatar vacío y estable.
module.exports = {
  createAvatar: () => ({ toDataUri: () => 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>' }),
};
